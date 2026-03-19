"use client";

import { SignIn, useAuth } from "@clerk/nextjs";
import { Check, Copy, LoaderCircle } from "lucide-react";
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

type ResponseScope = "all" | "mine";

type QaPair = {
  section: string;
  question: string;
  answer: string;
  path: string;
};

const sectionLabelOverrides: Record<string, string> = {
  phase1_scope: "Phase 1 Scope",
  inspection_operating_model: "Inspection Operating Model",
  phase1_definition_of_done: "Phase 1 Definition of Done",
  mobile_requirements: "Mobile Requirements",
  offline_requirements: "Offline Requirements",
  baseline: "Current Baseline",
  priority_tradeoff: "Priority Tradeoff",
  current_app_strategy: "Current App Strategy",
  delivery_expectations: "Delivery Expectations",
  scope_planning_agenda: "Scope Planning Agenda",
  phase_breakdown: "Phase Breakdown",
  risk_analysis: "Risk Analysis",
  recommendation: "Recommendation",
  loe_assessment: "LOE Assessment",
  integrations: "Integrations",
  integration_operating_model: "Integration Operating Model",
  analytics_operating_model: "Analytics Operating Model",
  operations_controls: "Operations Controls",
  workflows: "Top Workflows",
  scale: "Scale",
  risks: "Risk Areas"
};

const questionLabelOverrides: Record<string, string> = {
  "phase1_scope.dayOneRequirement": "Day 1 requirement detail",
  "phase1_scope.feature": "Feature",
  "inspection_operating_model.scoring_method": "Inspection scoring method",
  "inspection_operating_model.fail_evidence_standard": "Failure evidence standard",
  "inspection_operating_model.joint_inspection_expectation": "Joint inspection expectation",
  "offline_requirements.support_level": "Offline support level",
  "offline_requirements.detail": "Offline workflow and sync detail",
  "delivery_expectations.phase1_timeline_weeks": "Rapid deployment target (weeks)",
  "delivery_expectations.production_ready_definition": "Definition of production-ready",
  "delivery_expectations.support_model": "Support model",
  "delivery_expectations.priority_tradeoff": "Delivery tradeoff priority",
  "integration_operating_model.adp_sync_mode": "ADP sync mode",
  "integration_operating_model.adp_latency_tolerance": "ADP latency tolerance",
  "integration_operating_model.power_bi_mode": "Power BI operating mode",
  "analytics_operating_model.location_health_scoring_model": "Location health scoring model",
  "analytics_operating_model.management_rollup_expectations": "Management rollup expectations",
  "operations_controls.work_item_urgency_rules": "Work item urgency rules",
  "operations_controls.assignee_notification_escalation": "Assignee escalation rules",
  "operations_controls.case_types_in_scope": "Case types in scope",
  "operations_controls.case_routing_model": "Case routing model",
  "operations_controls.public_safety_portal_scope": "Public safety portal scope",
  "operations_controls.incident_compliance_flow": "Incident and compliance flow"
};

const toTitleCase = (value: string) =>
  value
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const extractPathSegments = (path: string) => {
  const segments: string[] = [];
  const matcher = /([^[.\]]+)|\[(\d+)\]/g;
  for (const match of path.matchAll(matcher)) {
    if (match[1]) {
      segments.push(match[1]);
    } else if (match[2]) {
      segments.push(`#${Number(match[2]) + 1}`);
    }
  }
  return segments;
};

const stringifyAnswer = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "Not provided";
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : "Not provided";
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "None";
    }
    const primitiveItems = value.filter(
      (item) => typeof item === "string" || typeof item === "number" || typeof item === "boolean"
    ) as Array<string | number | boolean>;
    if (primitiveItems.length === value.length) {
      return primitiveItems.map(String).join(", ");
    }
  }
  return JSON.stringify(value, null, 2);
};

const buildQuestionLabel = (path: string) => {
  const segments = extractPathSegments(path);
  if (segments.length === 0) {
    return "Answer";
  }

  const normalized = segments.filter((segment) => !segment.startsWith("#"));
  const overrideKey =
    normalized.length >= 2 ? `${normalized[0]}.${normalized[normalized.length - 1]}` : normalized.join(".");
  const override = questionLabelOverrides[overrideKey];
  if (override) {
    return override;
  }

  if (segments.length === 1) {
    return toTitleCase(segments[0]);
  }

  const withoutSection = segments.slice(1).map((segment) => (segment.startsWith("#") ? `Item ${segment.slice(1)}` : toTitleCase(segment)));
  return withoutSection.join(" > ");
};

const flattenStructuredToQa = (structured: Record<string, unknown>): QaPair[] => {
  const rows: QaPair[] = [];

  const walk = (value: unknown, path: string) => {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        rows.push({
          section: sectionLabelOverrides[path] ?? toTitleCase(path),
          question: buildQuestionLabel(path),
          answer: "None",
          path
        });
        return;
      }

      const allPrimitive = value.every((item) => typeof item === "string" || typeof item === "number" || typeof item === "boolean");
      if (allPrimitive) {
        rows.push({
          section: sectionLabelOverrides[path.split(".")[0] ?? ""] ?? toTitleCase(path.split(".")[0] ?? "Response"),
          question: buildQuestionLabel(path),
          answer: stringifyAnswer(value),
          path
        });
        return;
      }

      value.forEach((item, index) => {
        walk(item, `${path}[${index}]`);
      });
      return;
    }

    if (value && typeof value === "object") {
      const entries = Object.entries(value);
      if (entries.length === 0) {
        rows.push({
          section: sectionLabelOverrides[path.split(".")[0] ?? ""] ?? toTitleCase(path.split(".")[0] ?? "Response"),
          question: buildQuestionLabel(path),
          answer: "Not provided",
          path
        });
        return;
      }
      for (const [key, childValue] of entries) {
        walk(childValue, path ? `${path}.${key}` : key);
      }
      return;
    }

    const rootSectionKey = path.split(".")[0] ?? "response";
    rows.push({
      section: sectionLabelOverrides[rootSectionKey] ?? toTitleCase(rootSectionKey),
      question: buildQuestionLabel(path),
      answer: stringifyAnswer(value),
      path
    });
  };

  for (const [key, value] of Object.entries(structured)) {
    walk(value, key);
  }

  return rows;
};

const buildMarkdownExport = (submission: SavedSubmissionRow | null, qaPairs: QaPair[]) => {
  if (!submission) {
    return "";
  }

  const lines: string[] = [
    "# Scope Clarification Questionnaire - Response Export",
    "",
    `- Submission ID: ${submission.id}`,
    `- Submitted: ${new Date(submission.created_at).toLocaleString()}`,
    `- LOE: ${submission.loe?.classification ?? "Unknown"} (${submission.loe?.range ?? "Unknown"})`,
    "",
    "## Question and Answer",
    ""
  ];

  qaPairs.forEach((pair, index) => {
    lines.push(`### ${index + 1}. ${pair.question}`);
    lines.push(pair.answer);
    lines.push("");
  });

  lines.push("## Structured JSON");
  lines.push("```json");
  lines.push(JSON.stringify(submission.structured ?? {}, null, 2));
  lines.push("```");

  return lines.join("\n");
};

export default function ResponsesPage() {
  const { isSignedIn } = useAuth();
  const [savedSubmissions, setSavedSubmissions] = useState<SavedSubmissionRow[]>([]);
  const [selectedSavedSubmissionId, setSelectedSavedSubmissionId] = useState<string | null>(null);
  const [isLoadingSavedSubmissions, setIsLoadingSavedSubmissions] = useState(false);
  const [savedSubmissionsError, setSavedSubmissionsError] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [responseScope, setResponseScope] = useState<ResponseScope>("all");
  const [copied, setCopied] = useState(false);

  const loadSavedSubmissions = async (requestedScope: ResponseScope = responseScope) => {
    setSavedSubmissionsError(null);
    setIsLoadingSavedSubmissions(true);

    try {
      const response = await fetch(`/api/submissions?limit=100&scope=${requestedScope}`);
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string; detail?: string } | null;
        const message = payload?.error ?? "Failed to load saved submissions.";
        setSavedSubmissionsError(payload?.detail ? `${message} ${payload.detail}` : message);
        return;
      }

      const payload = (await response.json()) as { submissions?: SavedSubmissionRow[]; isSuperAdmin?: boolean; scope?: ResponseScope };
      const nextSubmissions = payload.submissions ?? [];
      setSavedSubmissions(nextSubmissions);
      setIsSuperAdmin(Boolean(payload.isSuperAdmin));
      setResponseScope(payload.scope ?? "mine");
      setSelectedSavedSubmissionId((current) => {
        if (!current) {
          return nextSubmissions[0]?.id ?? null;
        }
        return nextSubmissions.some((item) => item.id === current) ? current : (nextSubmissions[0]?.id ?? null);
      });
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
  const qaPairs = useMemo(
    () => (selectedSavedSubmission ? flattenStructuredToQa(selectedSavedSubmission.structured ?? {}) : []),
    [selectedSavedSubmission]
  );
  const markdownExport = useMemo(() => buildMarkdownExport(selectedSavedSubmission, qaPairs), [selectedSavedSubmission, qaPairs]);
  const qaGroups = useMemo(() => {
    const grouped = new Map<string, QaPair[]>();
    for (const pair of qaPairs) {
      const existing = grouped.get(pair.section) ?? [];
      existing.push(pair);
      grouped.set(pair.section, existing);
    }
    return Array.from(grouped.entries());
  }, [qaPairs]);

  const copyMarkdown = async () => {
    if (!markdownExport) {
      return;
    }
    try {
      await navigator.clipboard.writeText(markdownExport);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

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
                <Badge>
                  {isSuperAdmin ? (responseScope === "all" ? "All responses (super admin)" : "My responses (super admin)") : "My responses"}
                </Badge>
                {isSuperAdmin ? (
                  <div className="mt-3 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                    <span>View:</span>
                    <select
                      className="h-9 rounded-md border border-[var(--border)] bg-white px-2 text-sm text-[var(--foreground)]"
                      onChange={(event) => {
                        const nextScope = event.target.value as ResponseScope;
                        setResponseScope(nextScope);
                        void loadSavedSubmissions(nextScope);
                      }}
                      value={responseScope}
                    >
                      <option value="all">All responses</option>
                      <option value="mine">My responses</option>
                    </select>
                  </div>
                ) : null}
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--foreground)]">Responses output panel</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
                  {isSuperAdmin && responseScope === "all"
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
                      <h3 className="text-sm font-semibold text-[var(--foreground)]">Use case 1: Clean web UI</h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                        Full question and answer view generated from the saved submission record.
                      </p>
                      <div className="mt-4 space-y-4">
                        {qaGroups.map(([section, items]) => (
                          <div className="rounded-xl border border-[var(--border)] p-4" key={section}>
                            <h4 className="text-sm font-semibold text-[var(--foreground)]">{section}</h4>
                            <div className="mt-3 space-y-3">
                              {items.map((item) => (
                                <div className="rounded-lg bg-[var(--muted)]/60 p-3" key={item.path}>
                                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
                                    {item.question}
                                  </div>
                                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--foreground)]">{item.answer}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-[var(--border)] bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-[var(--foreground)]">Use case 2: Raw markdown extraction</h3>
                        <Button onClick={() => void copyMarkdown()} size="sm" type="button" variant="secondary">
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          {copied ? "Copied" : "Copy markdown"}
                        </Button>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                        Copy this markdown directly into AI tools, tickets, or docs.
                      </p>
                      <pre className="mt-3 max-h-[560px] overflow-auto rounded-2xl bg-[var(--ink)] p-4 text-xs leading-6 text-white">
                        {markdownExport}
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
