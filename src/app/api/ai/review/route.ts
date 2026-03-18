import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { aiReviewRequestSchema, aiReviewResponseSchema } from "../../../../domain/discovery";

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const ZAI_ENDPOINT = "https://api.z.ai/api/coding/paas/v4/chat/completions";
const KIMI_ENDPOINT = "https://api.moonshot.ai/v1/chat/completions";

const openAiKey = process.env.OPENAI_API_KEY ?? process.env.OpenAI_Key;
const zaiKey = process.env.ZAI_API_KEY ?? process.env.XAI_API_KEY;
const kimiKey = process.env.KIMI_API_KEY;

type AiProvider = "auto" | "openai" | "zai" | "kimi";

type ProviderConfig = {
  provider: Exclude<AiProvider, "auto">;
  endpoint: string;
  key: string;
  model: string;
};

const getProviderConfig = (provider: AiProvider): ProviderConfig | null => {
  const openAiModel = process.env.OPENAI_MODEL ?? process.env.AI_REVIEW_MODEL ?? "gpt-4.1-mini";
  const zaiModel = process.env.ZAI_MODEL ?? process.env.XAI_MODEL ?? "glm-4.7";
  const kimiModel = process.env.KIMI_MODEL ?? "kimi-k2-0711-preview";

  if (provider === "openai") {
    return openAiKey
      ? {
          provider: "openai",
          endpoint: process.env.OPENAI_ENDPOINT ?? process.env.AI_REVIEW_ENDPOINT ?? OPENAI_ENDPOINT,
          key: openAiKey,
          model: openAiModel
        }
      : null;
  }

  if (provider === "zai") {
    return zaiKey
      ? {
          provider: "zai",
          endpoint: process.env.ZAI_ENDPOINT ?? ZAI_ENDPOINT,
          key: zaiKey,
          model: zaiModel
        }
      : null;
  }

  if (provider === "kimi") {
    return kimiKey
      ? {
          provider: "kimi",
          endpoint: process.env.KIMI_ENDPOINT ?? KIMI_ENDPOINT,
          key: kimiKey,
          model: kimiModel
        }
      : null;
  }

  return getProviderConfig("openai") ?? getProviderConfig("zai") ?? getProviderConfig("kimi");
};

const isModelAccessError = (errorBody: string) => {
  const text = errorBody.toLowerCase();
  return text.includes("resource_not_found_error") || text.includes("not found the model") || text.includes("permission denied");
};

const buildLocalFallbackReview = (payload: ReturnType<typeof aiReviewRequestSchema.parse>) => {
  const followUpQuestions = payload.checklist.slice(0, 5).map((item) => `Clarify this requirement with concrete actor/action/outcome detail: ${item}`);
  return {
    status: "needs_clarification" as const,
    confidence: 0.45,
    summary: "AI providers are temporarily unavailable. Continue with a local guidance fallback and refine this section using the checklist items below.",
    missingDetails: [],
    vaguePoints: [],
    followUpQuestions,
    suggestedNextChecks: ["Retry AI review in a minute if you need model-generated guidance."]
  };
};

const buildRequestBody = (payload: ReturnType<typeof aiReviewRequestSchema.parse>, requestModel: string) =>
  JSON.stringify({
    model: requestModel,
    messages: [
      {
        role: "system",
        content: buildSystemPrompt()
      },
      {
        role: "user",
        content: JSON.stringify(
          {
            section: {
              id: payload.sectionId,
              title: payload.sectionTitle,
              objective: payload.objective,
              checklist: payload.checklist
            },
            sectionData: payload.sectionData,
            fullSnapshot: payload.fullSnapshot
          },
          null,
          2
        )
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "discovery_review",
        schema: reviewSchema,
        strict: true
      }
    }
  });

const postReview = (endpoint: string, key: string, body: string) =>
  fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body
  });

const reviewSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    status: {
      type: "string",
      enum: ["pass", "needs_clarification"]
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1
    },
    summary: {
      type: "string"
    },
    missingDetails: {
      type: "array",
      items: { type: "string" },
      maxItems: 5
    },
    vaguePoints: {
      type: "array",
      items: { type: "string" },
      maxItems: 5
    },
    followUpQuestions: {
      type: "array",
      items: { type: "string" },
      maxItems: 5
    },
    suggestedNextChecks: {
      type: "array",
      items: { type: "string" },
      maxItems: 5
    }
  },
  required: ["status", "confidence", "summary", "missingDetails", "vaguePoints", "followUpQuestions", "suggestedNextChecks"]
} as const;

const buildSystemPrompt = () =>
  [
    "You are a helpful enterprise discovery reviewer.",
    "Determine whether the answer is specific enough for implementation planning, but avoid unnecessary blocking.",
    "If details are missing, set status to needs_clarification and provide focused follow-up questions.",
    "Keep feedback practical and concise so users can fix answers quickly.",
    "Prefer operational specificity: actors, actions, systems, data movement, timing, scale, and business outcomes.",
    "Use plain business language and avoid heavy jargon, acronyms, or consultant-style wording unless necessary."
  ].join(" ");

const normalizeJsonBlock = (text: string): string => {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
};

const extractSection = (text: string, labels: string[], stopLabels: string[]) => {
  const labelPattern = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const stopPattern = stopLabels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const regex = new RegExp(
    `(?:^|\\n)\\s*(?:${labelPattern})\\s*:\\s*([\\s\\S]*?)(?=(?:\\n\\s*(?:${stopPattern})\\s*:)|$)`,
    "i"
  );
  const match = text.match(regex);
  return match?.[1]?.trim() ?? "";
};

const parseNumberedList = (text: string): string[] => {
  const inlineMatches = [...text.matchAll(/(?:^|\s)\d+[.)]\s*([\s\S]*?)(?=(?:\s\d+[.)]\s)|$)/g)]
    .map((match) => match[1]?.trim())
    .filter((item): item is string => !!item);

  if (inlineMatches.length > 0) {
    return inlineMatches;
  }

  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^(?:[-*]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
};

const parseStructuredTextFallback = (text: string) => {
  const stopLabels = ["status", "summary", "diagnosis", "questions", "missing details", "vague points", "suggested next checks"];
  const normalized = text.replace(/\r\n/g, "\n").replace(/\*\*/g, "").trim();
  const statusMatch = normalized.match(/(?:^|\n)\s*status\s*:\s*(pass|needs_clarification)\b/i);
  const summary = extractSection(normalized, ["summary", "diagnosis"], stopLabels);
  const questionsBlock = extractSection(normalized, ["questions", "follow-up questions"], stopLabels);
  const missingBlock = extractSection(normalized, ["missing details"], stopLabels);
  const vagueBlock = extractSection(normalized, ["vague points"], stopLabels);
  const nextChecksBlock = extractSection(normalized, ["suggested next checks", "next checks"], stopLabels);

  if (!statusMatch && !summary && !questionsBlock) {
    return null;
  }

  return {
    status: statusMatch ? statusMatch[1].toLowerCase() : "needs_clarification",
    confidence: 0.5,
    summary: summary || "Review completed with text output.",
    missingDetails: parseNumberedList(missingBlock).slice(0, 5),
    vaguePoints: parseNumberedList(vagueBlock).slice(0, 5),
    followUpQuestions: parseNumberedList(questionsBlock).slice(0, 5),
    suggestedNextChecks: parseNumberedList(nextChecksBlock).slice(0, 5)
  };
};

const extractText = (payload: unknown): string | null => {
  if (typeof payload === "string") {
    return payload;
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const text = extractText(item);
      if (text) {
        return text;
      }
    }
    return null;
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    if (typeof record.text === "string") {
      return record.text;
    }

    if (typeof record.output_text === "string") {
      return record.output_text;
    }

    for (const value of Object.values(record)) {
      const text = extractText(value);
      if (text) {
        return text;
      }
    }
  }

  return null;
};

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const payload = aiReviewRequestSchema.parse(body);
    const selectedProvider = payload.aiProvider ?? "auto";
    const primaryConfig = getProviderConfig(selectedProvider);

    if (!primaryConfig) {
      return NextResponse.json(
        { error: "No AI key configured for selected provider. Check OPENAI_API_KEY, ZAI_API_KEY, or KIMI_API_KEY." },
        { status: 503 }
      );
    }

    const requestBody = buildRequestBody(payload, primaryConfig.model);

    let response: Response | null = null;
    let transportError: string | null = null;
    try {
      response = await postReview(primaryConfig.endpoint, primaryConfig.key, requestBody);
    } catch (error) {
      transportError = error instanceof Error ? error.message : "fetch failed";
    }

    if (!response) {
      const canAutoFallback = (selectedProvider === "auto" || selectedProvider === "openai") && primaryConfig.provider === "openai";
      const fallbackConfig = canAutoFallback ? getProviderConfig("zai") ?? getProviderConfig("kimi") : null;

      if (!fallbackConfig) {
        return NextResponse.json(buildLocalFallbackReview(payload));
      }

      try {
        const fallbackBody = buildRequestBody(payload, fallbackConfig.model);
        response = await postReview(fallbackConfig.endpoint, fallbackConfig.key, fallbackBody);
      } catch (error) {
        return NextResponse.json(buildLocalFallbackReview(payload));
      }
    }

    if (!response.ok) {
      let errorBody = await response.text();
      const shouldRetryKimiWithFallbackModel = primaryConfig.provider === "kimi" && isModelAccessError(errorBody);

      if (shouldRetryKimiWithFallbackModel) {
        const kimiFallbackModel = process.env.KIMI_FALLBACK_MODEL ?? "moonshot-v1-auto";
        const kimiFallbackBody = buildRequestBody(payload, kimiFallbackModel);
        response = await postReview(primaryConfig.endpoint, primaryConfig.key, kimiFallbackBody);
        if (!response.ok) {
          errorBody = await response.text();
        }
      }

      const canAutoFallback = selectedProvider === "auto" || selectedProvider === "openai";
      const shouldFallback =
        canAutoFallback &&
        primaryConfig.provider === "openai" &&
        errorBody.toLowerCase().includes("insufficient_quota") &&
        (!!zaiKey || !!kimiKey);

      if (shouldFallback) {
        const fallbackConfig = getProviderConfig("zai") ?? getProviderConfig("kimi");

        if (!fallbackConfig) {
          return NextResponse.json({ error: "AI review request failed.", detail: errorBody }, { status: 502 });
        }

        const fallbackBody = buildRequestBody(payload, fallbackConfig.model);
        response = await postReview(fallbackConfig.endpoint, fallbackConfig.key, fallbackBody);
        if (!response.ok) {
          errorBody = await response.text();
          return NextResponse.json(
            { error: `AI review request failed after ${primaryConfig.provider.toUpperCase()} quota fallback.`, detail: errorBody },
            { status: 502 }
          );
        }
      } else {
        return NextResponse.json({ error: "AI review request failed.", detail: errorBody }, { status: 502 });
      }
    }

    const result = (await response.json()) as Record<string, unknown>;
    const firstChoice = Array.isArray(result.choices) ? result.choices[0] : null;
    const message =
      firstChoice && typeof firstChoice === "object"
        ? ((firstChoice as Record<string, unknown>).message as Record<string, unknown> | undefined)
        : undefined;

    // Prefer assistant content for chat-completions style payloads.
    const preferredText =
      message && typeof message.content === "string" && message.content.trim().length > 0 ? message.content : null;

    const text = preferredText ?? extractText(result);

    if (!text) {
      return NextResponse.json({ error: "AI review response did not include parseable text." }, { status: 502 });
    }

    const normalizedText = normalizeJsonBlock(text);

    try {
      const parsedRaw = JSON.parse(normalizedText) as Record<string, unknown>;
      const hydrated = {
        status: parsedRaw.status,
        confidence: parsedRaw.confidence ?? 0.5,
        summary: parsedRaw.summary ?? "Review completed with partial structured output.",
        missingDetails: toStringArray(parsedRaw.missingDetails),
        vaguePoints: toStringArray(parsedRaw.vaguePoints),
        followUpQuestions: toStringArray(parsedRaw.followUpQuestions),
        suggestedNextChecks: toStringArray(parsedRaw.suggestedNextChecks)
      };

      const parsed = aiReviewResponseSchema.parse(hydrated);
      return NextResponse.json(parsed);
    } catch {
      const fallback = parseStructuredTextFallback(normalizedText);
      if (fallback) {
        const parsed = aiReviewResponseSchema.parse(fallback);
        return NextResponse.json(parsed);
      }

      return NextResponse.json(
        {
          error: "AI review response could not be parsed as structured JSON.",
          detail: normalizedText
        },
        { status: 502 }
      );
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown internal error";
    return NextResponse.json({ error: "AI review request failed unexpectedly.", detail }, { status: 502 });
  }
}
