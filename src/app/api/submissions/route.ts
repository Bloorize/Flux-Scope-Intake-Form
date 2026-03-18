import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseServerClient } from "../../../lib/supabase-server";
import { isSuperAdminUser } from "../../../lib/clerk-auth";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  const isSuperAdmin = await isSuperAdminUser(userId);

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server." },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const parsedLimit = Number(searchParams.get("limit") ?? "25");
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 200) : 25;

  let query = supabase.from("form_submissions").select("id, created_at, summary, loe, structured");

  if (!isSuperAdmin) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query.order("created_at", { ascending: false }).limit(limit);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch submissions from Supabase.", detail: error.message }, { status: 502 });
  }

  return NextResponse.json({ submissions: data ?? [], isSuperAdmin });
}
