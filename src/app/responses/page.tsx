"use client";

import { SignIn, useAuth } from "@clerk/nextjs";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";

type SavedSubmissionRow = {
  id: string;
  created_at: string;
  structured: Record<string, unknown>;
  summary: {
    phase1Scope?: string;
  };
  loe: {
    classification?: string;
    range?: string;
  };
};

export default function ResponsesPage() {
  const { isSignedIn } = useAuth();
  const [savedSubmissions, setSavedSubmissions] = useState<SavedSubmissionRow[]>([]);
  const [selectedSavedSubmissionId, setSelectedSavedSubmissionId] = useState<string | null>(null);
  const [isLoadingSavedSubmissions, setIsLoadingSavedSubmissions] = useState(false);
  const [savedSubmissionsError, setSavedSubmissionsError] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const loadSavedSubmissions = async () => {
    setSavedSubmissionsError(null);
    setIsLoadingSavedSubmissions(true);

    try {
      const response = await fetch("/api/submissions?limit=100");
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string; detail?: string } | null;
        const message = payload?.error ?? "Failed to load saved submissions.";
        setSavedSubmissionsError(payload?.detail ? `${message} ${payload.detail}` : message);
        return;
      }

      const payload = (await response.json()) as { submissions?: SavedSubmissionRow[]; isSuperAdmin?: boolean };
      const nextSubmissions = payload.submissions ?? [];
      setSavedSubmissions(nextSubmissions);
      setIsSuperAdmin(Boolean(payload.isSuperAdmin));
      if (nextSubmissions.length > 0) {
        setSelectedSavedSubmissionId((current) => current ?? nextSubmissions[0].id);
      }
    } catch {
      setSavedSubmissionsError("Failed to load saved submissions.");
    } finally {
      setIsLoadingSavedSubmissions(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      void loadSavedSubmissions();
    }
  }, [isSignedIn]);

  const selectedSavedSubmission = useMemo(
    () => savedSubmissions.find((item) => item.id === selectedSavedSubmissionId) ?? savedSubmissions[0] ?? null,
    [savedSubmissions, selectedSavedSubmissionId]
  );

  return (
    <>
      {!isSignedIn ? (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(13,76,129,0.16),_transparent_30%),linear-gradient(180deg,#f7f8fb_0%,#edf2f7_100%)] px-4 py-10 md:px-8">
          <div className="mx-auto flex max-w-7xl justify-center">
            <SignIn fallbackRedirectUrl="/" path="/sign-in" routing="path" signUpUrl="/sign-up" />
          </div>
        </main>
      ) : (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(13,76,129,0.16),_transparent_30%),linear-gradient(180deg,#f7f8fb_0%,#edf2f7_100%)] px-4 py-10 md:px-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <Badge>{isSuperAdmin ? "All responses (super admin)" : "My responses"}</Badge>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--foreground)]">Responses output panel</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
                  {isSuperAdmin
                    ? "Review all submissions saved to Supabase and inspect full structured output."
                    : "Review your submissions saved to Supabase and inspect full structured output."}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button disabled={isLoadingSavedSubmissions} onClick={() => void loadSavedSubmissions()} type="button" variant="secondary">
                  {isLoadingSavedSubmissions ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  Refresh
                </Button>
                <Link className="inline-flex h-10 items-center justify-center rounded-md border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]" href="/">
                  Back to form
                </Link>
              </div>
            </div>

            <Card>
          <CardHeader>
            <CardTitle>Submission browser</CardTitle>
            <CardDescription>Select a submission to inspect full details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {savedSubmissionsError ? (
              <div className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-3 text-sm text-[var(--danger)]">
                {savedSubmissionsError}
              </div>
            ) : null}

            {savedSubmissions.length > 0 ? (
              <>
                <select
                  className="h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm text-[var(--foreground)]"
                  onChange={(event) => setSelectedSavedSubmissionId(event.target.value)}
                  value={selectedSavedSubmission?.id ?? ""}
                >
                  {savedSubmissions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {new Date(item.created_at).toLocaleString()} - {item.id.slice(0, 8)}
                    </option>
                  ))}
                </select>

                {selectedSavedSubmission ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-xl bg-[var(--muted)] p-4">
                        <div className="text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">Submitted</div>
                        <div className="mt-2 text-sm font-medium text-[var(--foreground)]">
                          {new Date(selectedSavedSubmission.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="rounded-xl bg-[var(--muted)] p-4">
                        <div className="text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">LOE</div>
                        <div className="mt-2 text-sm font-medium text-[var(--foreground)]">{selectedSavedSubmission.loe?.classification ?? "-"}</div>
                      </div>
                      <div className="rounded-xl bg-[var(--muted)] p-4">
                        <div className="text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">Range</div>
                        <div className="mt-2 text-sm font-medium text-[var(--foreground)]">{selectedSavedSubmission.loe?.range ?? "-"}</div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[var(--border)] bg-white p-4">
                      <h3 className="text-sm font-semibold text-[var(--foreground)]">Phase 1 scope summary</h3>
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[var(--foreground)]">
                        {selectedSavedSubmission.summary?.phase1Scope ?? "-"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[var(--border)] bg-white p-4">
                      <h3 className="text-sm font-semibold text-[var(--foreground)]">Structured output JSON</h3>
                      <pre className="mt-3 overflow-x-auto rounded-2xl bg-[var(--ink)] p-4 text-xs leading-6 text-white">
                        {JSON.stringify(selectedSavedSubmission.structured ?? {}, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                No saved submissions yet. Submit the form once, then come back here.
              </p>
            )}
          </CardContent>
            </Card>
          </div>
        </main>
      )}
    </>
  );
}
