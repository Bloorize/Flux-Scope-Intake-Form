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

  const { data, error } = await supabase
    .from("form_submissions")
    .insert({
      user_id: userId,
      user_email: userEmail,
      structured: payload.structured,
      summary: payload.summary,
      loe: payload.loe
    })
    .select("id, created_at")
    .single();

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

  return NextResponse.json({
    status: "accepted",
    receivedAt: data.created_at,
    id: data.id
  });
}
