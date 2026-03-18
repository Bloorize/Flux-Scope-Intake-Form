import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { aiReviewRequestSchema } from "../../../../domain/discovery";

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

const stripFence = (text: string) => {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:\w+)?\s*([\s\S]*?)\s*```$/i);
  return (fenced ? fenced[1] : trimmed).trim();
};

const buildRequestBody = (payload: ReturnType<typeof aiReviewRequestSchema.parse>, model: string) =>
  JSON.stringify({
    model,
    messages: [
      {
        role: "system",
        content:
          "You are a practical discovery assistant. Rewrite the user's section answer so it is concrete, implementation-ready, and easier to pass a scoping review. Preserve user intent. Use clear, plain language and avoid jargon. Return plain text only, no markdown, no JSON."
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
            currentSectionData: payload.sectionData,
            fullSnapshot: payload.fullSnapshot
          },
          null,
          2
        )
      }
    ]
  });

const postDraftRequest = (endpoint: string, key: string, body: string) =>
  fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body
  });

export async function POST(request: Request) {
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

  const primaryBody = buildRequestBody(payload, primaryConfig.model);

  let response = await postDraftRequest(primaryConfig.endpoint, primaryConfig.key, primaryBody);

  if (!response.ok) {
    let errorBody = await response.text();
    const shouldRetryKimiWithFallbackModel = primaryConfig.provider === "kimi" && isModelAccessError(errorBody);

    if (shouldRetryKimiWithFallbackModel) {
      const kimiFallbackModel = process.env.KIMI_FALLBACK_MODEL ?? "moonshot-v1-auto";
      const kimiFallbackBody = buildRequestBody(payload, kimiFallbackModel);
      response = await postDraftRequest(primaryConfig.endpoint, primaryConfig.key, kimiFallbackBody);
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
        return NextResponse.json({ error: "Draft generation failed.", detail: errorBody }, { status: 502 });
      }

      const fallbackBody = buildRequestBody(payload, fallbackConfig.model);
      response = await postDraftRequest(fallbackConfig.endpoint, fallbackConfig.key, fallbackBody);
      if (!response.ok) {
        errorBody = await response.text();
        return NextResponse.json(
          { error: `Draft generation failed after ${primaryConfig.provider.toUpperCase()} quota fallback.`, detail: errorBody },
          { status: 502 }
        );
      }
    } else {
      return NextResponse.json({ error: "Draft generation failed.", detail: errorBody }, { status: 502 });
    }
  }

  const result = (await response.json()) as Record<string, unknown>;
  const firstChoice = Array.isArray(result.choices) ? result.choices[0] : null;
  const message =
    firstChoice && typeof firstChoice === "object"
      ? ((firstChoice as Record<string, unknown>).message as Record<string, unknown> | undefined)
      : undefined;
  const preferredText =
    message && typeof message.content === "string" && message.content.trim().length > 0 ? message.content : null;
  const draft = stripFence(preferredText ?? extractText(result) ?? "");

  if (!draft) {
    return NextResponse.json({ error: "AI draft response was empty." }, { status: 502 });
  }

  return NextResponse.json({ draft });
}
