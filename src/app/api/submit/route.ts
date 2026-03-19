import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { getSupabaseServerClient } from "../../../lib/supabase-server";
import { getCurrentUserEmail } from "../../../lib/clerk-auth";

const payloadSchema = z.object({
  structured: z.record(z.string(), z.unknown()),
  summary: z.object({
    phase1Scope: z.string(),
    keyComplexityDrivers: z.array(z.string()),
    riskAreas: z.array(z.string()),
    recommendedArchitectureDirection: z.string()
  }),
  loe: z.object({
    classification: z.enum(["Small", "Medium", "Large"]),
    range: z.string(),
    rationale: z.array(z.string())
  })
});

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const payload = payloadSchema.parse(body);
  const supabase = getSupabaseServerClient();
  const userEmail = await getCurrentUserEmail();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server." },
      { status: 503 }
    );
  }

  const baseInsert = {
    structured: payload.structured,
    summary: payload.summary,
    loe: payload.loe
  };

  const insertWithUserColumns = async () =>
    supabase
      .from("form_submissions")
      .insert({
        ...baseInsert,
        user_id: userId,
        user_email: userEmail
      })
      .select("id, created_at")
      .single();

  const insertWithoutUserColumns = async () =>
    supabase
      .from("form_submissions")
      .insert(baseInsert)
      .select("id, created_at")
      .single();

  let { data, error } = await insertWithUserColumns();

  const detail = error?.message ?? "";
  const isMissingUserColumnError =
    detail.includes("Could not find the 'user_email' column") || detail.includes("Could not find the 'user_id' column");

  if (error && isMissingUserColumnError) {
    // Backward compatibility for older local schemas that do not yet have user columns.
    const fallbackResult = await insertWithoutUserColumns();
    data = fallbackResult.data;
    error = fallbackResult.error;
  }

  if (error) {
    return NextResponse.json(
      {
        error: "Failed to save submission to Supabase.",
        detail: error.message,
        hint: "Ensure form_submissions has user_id and user_email columns."
      },
      { status: 502 }
    );
  }

  if (!data) {
    return NextResponse.json(
      {
        error: "Failed to save submission to Supabase.",
        detail: "Insert did not return a row."
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    status: "accepted",
    receivedAt: data.created_at,
    id: data.id
  });
}
