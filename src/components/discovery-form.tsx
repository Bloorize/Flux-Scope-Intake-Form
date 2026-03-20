"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Bot, Check, ChevronLeft, ChevronRight, CircleAlert, FileJson2, LoaderCircle, Sparkles } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useForm, useWatch, type Control, type FieldErrors, type Path, type Resolver, type UseFormRegister, type UseFormSetValue } from "react-hook-form";
import {
  aiReviewResponseSchema,
  buildReadableSummary,
  buildStructuredOutput,
  classifyLoe,
  defaultDiscoveryValues,
  discoveryFormSchema,
  discoverySections,
  isSuggestionValidationMessage,
  type AiReviewResponse,
  type DiscoveryValidatedValues,
  integrationDepthOptions,
  integrationSystemOptions,
  adpSyncModeOptions,
  mirrorApproachOptions,
  mobileReasonOptions,
  offlineSupportOptions,
  hierarchyRequirementOptions,
  inspectionScoringMethodOptions,
  phase2AreaOptions,
  phase2ModuleOptions,
  phase2TimelineOptions,
  powerBiModeOptions,
  phase3CapabilityOptions,
  phase3DataReadinessOptions,
  phase3DataSourceOptions,
  phase3TimelineExpectationOptions,
  phase1FeatureOptions,
  priorityTradeoffOptions,
  spaceTypeGovernanceOptions
} from "../domain/discovery";
import ruxtonLogo from "../images/ruxton_logo2.png";
import verdeLogo from "../images/verde_logo.png";
import { cn } from "../lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Progress } from "./ui/progress";
import { Textarea } from "./ui/textarea";

type StructuredSubmission = ReturnType<typeof buildStructuredOutput> & { question_notes?: Record<string, string> };

type SubmissionState = {
  structured: StructuredSubmission;
  summary: ReturnType<typeof buildReadableSummary>;
  loe: ReturnType<typeof classifyLoe>;
  response: { status: string; receivedAt: string; id: string };
};

type QuestionAiState = {
  review?: AiReviewResponse;
  error?: string;
  draft?: string;
  isReviewing?: boolean;
  isGenerating?: boolean;
  updatedAt?: string;
};

type AiProviderOption = "auto" | "gemini" | "openai" | "zai" | "kimi";

type ValidationIssue = {
  sectionIndex: number;
  sectionTitle: string;
  sectionShortTitle: string;
  fieldPath: string;
  message: string;
  isSuggestion: boolean;
};

type QuestionNotesState = Record<string, string>;

const DISCOVERY_DRAFT_STORAGE_KEY = "discovery-form-draft-v1";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const mergeWithDefaults = <T,>(defaults: T, candidate: unknown): T => {
  if (Array.isArray(defaults)) {
    return (Array.isArray(candidate) ? candidate : defaults) as T;
  }

  if (!isPlainObject(defaults)) {
    return (candidate === undefined ? defaults : candidate) as T;
  }

  if (!isPlainObject(candidate)) {
    return defaults;
  }

  const merged: Record<string, unknown> = {};
  for (const [key, defaultValue] of Object.entries(defaults)) {
    merged[key] = mergeWithDefaults(defaultValue, candidate[key]);
  }
  return merged as T;
};

const normalizeDraftText = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const toDraftLines = (value: string) =>
  value
    .split(/\n+/)
    .map((line) => line.replace(/^[\-\*\d\.\)\s]+/, "").trim())
    .filter(Boolean);

const splitDraftItems = (value: string) => {
  const byLine = toDraftLines(value);
  if (byLine.length > 1) {
    return byLine;
  }
  return value
    .split(/[;,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const matchSingleOption = (draft: string, options: ReadonlyArray<{ value: string; label: string }>) => {
  const normalizedDraft = normalizeDraftText(draft);
  if (!normalizedDraft) {
    return undefined;
  }

  const directMatch = options.find((option) => {
    const normalizedLabel = normalizeDraftText(option.label);
    const normalizedValue = normalizeDraftText(option.value);
    return (
      normalizedDraft === normalizedLabel ||
      normalizedDraft === normalizedValue ||
      normalizedDraft.includes(normalizedLabel) ||
      normalizedDraft.includes(normalizedValue)
    );
  });

  if (directMatch) {
    return directMatch.value;
  }

  const firstLine = toDraftLines(draft)[0];
  if (!firstLine) {
    return undefined;
  }
  const normalizedFirstLine = normalizeDraftText(firstLine);
  const firstLineMatch = options.find((option) => {
    const normalizedLabel = normalizeDraftText(option.label);
    const normalizedValue = normalizeDraftText(option.value);
    return normalizedFirstLine.includes(normalizedLabel) || normalizedFirstLine.includes(normalizedValue);
  });
  return firstLineMatch?.value;
};

const matchMultiOptions = (draft: string, options: ReadonlyArray<{ value: string; label: string }>) => {
  const entries = splitDraftItems(draft);
  if (entries.length === 0) {
    return [];
  }

  const matchedValues = new Set<string>();
  for (const entry of entries) {
    const normalizedEntry = normalizeDraftText(entry);
    if (!normalizedEntry) {
      continue;
    }
    for (const option of options) {
      const normalizedLabel = normalizeDraftText(option.label);
      const normalizedValue = normalizeDraftText(option.value);
      if (
        normalizedEntry === normalizedLabel ||
        normalizedEntry === normalizedValue ||
        normalizedEntry.includes(normalizedLabel) ||
        normalizedEntry.includes(normalizedValue)
      ) {
        matchedValues.add(option.value);
      }
    }
  }

  return Array.from(matchedValues);
};

const parseWorkflowDraft = (draft: string) => {
  const lines = toDraftLines(draft).slice(0, 5);
  return lines
    .map((line) => {
      const [left, right] = line.split(/->|=>|:/).map((part) => part.trim());
      if (right) {
        return {
          actor: left || "Operations team",
          action: right,
          outcome: "Improve day-to-day execution."
        };
      }

      const words = line.split(" ");
      if (words.length < 4) {
        return null;
      }
      return {
        actor: words.slice(0, 2).join(" "),
        action: words.slice(2).join(" "),
        outcome: "Keep the process moving."
      };
    })
    .filter((workflow): workflow is { actor: string; action: string; outcome: string } => workflow !== null);
};

const getErrorMessage = (
  errors: FieldErrors<DiscoveryValidatedValues>,
  path: string,
  options?: { includeSuggestions?: boolean }
) => {
  const value = path.split(".").reduce<unknown>((accumulator, part) => {
    if (accumulator && typeof accumulator === "object") {
      return (accumulator as Record<string, unknown>)[part];
    }
    return undefined;
  }, errors);

  const findNestedMessage = (candidate: unknown): string | undefined => {
    if (!candidate || typeof candidate !== "object") {
      return undefined;
    }

    if ("message" in candidate && typeof candidate.message === "string") {
      return candidate.message;
    }

    if (Array.isArray(candidate)) {
      for (const item of candidate) {
        const message = findNestedMessage(item);
        if (message) {
          return message;
        }
      }
      return undefined;
    }

    for (const nestedValue of Object.values(candidate as Record<string, unknown>)) {
      const message = findNestedMessage(nestedValue);
      if (message) {
        return message;
      }
    }
    return undefined;
  };

  const message = findNestedMessage(value);
  if (!message) {
    return undefined;
  }

  if (!options?.includeSuggestions && isSuggestionValidationMessage(message)) {
    return undefined;
  }

  return message;
};

const collectValidationIssues = (
  errors: FieldErrors<DiscoveryValidatedValues>,
  targetSections?: number[]
): ValidationIssue[] => {
  const sectionIndexes = targetSections ?? discoverySections.map((_, index) => index);
  const dedupe = new Set<string>();
  const issues: ValidationIssue[] = [];

  for (const sectionIndex of sectionIndexes) {
    const section = discoverySections[sectionIndex];
    if (!section) {
      continue;
    }

    for (const fieldPath of section.fieldPaths) {
      const message = getErrorMessage(errors, fieldPath, { includeSuggestions: true });
      if (!message) {
        continue;
      }

      const key = `${section.id}:${fieldPath}:${message}`;
      if (dedupe.has(key)) {
        continue;
      }
      dedupe.add(key);

      issues.push({
        sectionIndex,
        sectionTitle: section.title,
        sectionShortTitle: section.shortTitle,
        fieldPath,
        message,
        isSuggestion: isSuggestionValidationMessage(message)
      });
    }
  }

  return issues;
};

const buildQaDummyValues = (): DiscoveryValidatedValues => ({
  phase1Scope: {
    selectedFeatures: ["inspections", "workItems", "dashboards"],
    otherFeature: "",
    featureDetails: {
      inspections:
        "Site supervisors create inspection templates, assign daily routes, and require inspectors to capture pass fail results with timestamped photos before the shift closes.",
      workItems:
        "Dispatch leads create work items from failed inspections, assign technicians by region, and track completion status updates to ensure repairs are closed within SLA.",
      cases:
        "",
      dashboards:
        "Operations managers review live dashboards, compare open risk counts by location, and escalate blocked tasks when completion trends fall below daily targets.",
      teamData: "",
      safety: "",
      training: "",
      other: ""
    },
    inspectionScoringMethod: "hybrid",
    failEvidenceStandard:
      "Every failed inspection point requires at least one photo and one written comment describing the defect, plus a reason code before a room score can be finalized.",
    jointInspectionExpectation:
      "Joint inspections are required monthly at each active site, with customer point of contact attendance tracked and missed sessions escalated to regional leadership."
  },
  criticality: {
    consequences: [
      "Supervisors cannot assign inspections to field teams, causing delayed safety checks and missed compliance deadlines at active sites.",
      "Technicians cannot submit findings or attach photos, so repair queues are incomplete and managers lose visibility into unresolved hazards.",
      "Regional leaders cannot review dashboard alerts, which delays escalation decisions and increases the chance of repeat incidents across locations."
    ]
  },
  currentBaseline: {
    systemsToday: ["ADP for employee records and scheduling context", "SharePoint lists for incident intake and follow-up notes"],
    mustReplace: [
      "Manual inspection spreadsheet handoffs between supervisors and inspectors",
      "Email-based incident routing with no audit trail for ownership changes"
    ],
    canDefer: ["Historical archive migration beyond the most recent 12 months of data"],
    mirrorApproach: "modernize",
    hierarchyRequirement: "required",
    spaceTypeGovernance: "hybrid"
  },
  mobileRequirements: {
    selectedReasons: ["offline", "camera"],
    otherExplanation: "",
    offlineDetail:
      "Inspectors must work offline for up to 8 hours, create new inspections, capture annotated photos, and sync completed records when connectivity returns at the depot.",
    appStoreInternalDistributionOk: undefined,
    performanceDetail: ""
  },
  offlineRequirements: {
    supportLevel: "limited",
    detail:
      "Technicians complete inspections and work items offline for 4 hours, then sync every 15 minutes when online, with conflict flags routed to supervisors for review."
  },
  integrations: {
    selectedSystems: ["adp", "internal"],
    otherSystem: "",
    details: {
      adp: {
        depth: "sync",
        detail: "Sync employee roster updates nightly from ADP and return assignment status so supervisor workload planning stays accurate."
      },
      powerBi: { depth: undefined, detail: "" },
      internal: {
        depth: "readOnly",
        detail:
          "Read internal location metadata every morning to preload site details and reduce manual lookup during inspection assignment."
      },
      customer: { depth: undefined, detail: "" },
      other: { depth: undefined, detail: "" }
    },
    adpSyncMode: "nightly_batch",
    adpLatencyTolerance: "Employee roster changes must be reflected within 24 hours, and urgent role updates can tolerate up to a 2-hour manual correction window.",
    powerBiMode: "both"
  },
  analyticsAi: {
    analyticsPhase1: ["Daily dashboard of open incidents by site and owner"],
    analyticsPhase2: ["Executive trend reporting across regions with quarterly comparisons"],
    aiPhase1: ["No advanced AI in Phase 1 beyond simple narrative summarization drafts"],
    aiPhase2: ["Suggest likely incident categories and next best action for supervisors"],
    locationHealthScoringModel:
      "Location health score starts at 100 and subtracts weighted penalties for aging work items, missed inspection coverage, and unresolved incident cases, with monthly threshold alerts for managers.",
    managementRollupExpectations:
      "Managers need site-by-site KPI rollups weekly, regional directors need monthly trend summaries by portfolio, and executives need enterprise comparisons with exception flags."
  },
  workflows: {
    topDailyWorkflows: [
      {
        actor: "Site supervisor",
        action: "Create inspection schedule, assign inspectors, and review completion exceptions before end of shift.",
        outcome: "Daily compliance targets stay on track and overdue locations are escalated immediately."
      },
      {
        actor: "Field inspector",
        action: "Complete inspection checklist, capture photo evidence, and submit findings to assigned manager queue.",
        outcome: "Safety issues are documented quickly and follow-up work items can be created without delay."
      },
      {
        actor: "Regional manager",
        action: "Review dashboard alerts, approve escalations, and route unresolved incidents to specialist teams.",
        outcome: "High-risk issues receive timely action and cross-site performance remains within policy thresholds."
      }
    ],
    workItemUrgencyRules:
      "Any room score below 3.0 creates a required work item, due dates under 24 hours are marked high urgency, and overdue work items must be escalated in daily manager review.",
    assigneeNotificationEscalation:
      "Assignees get immediate mobile notifications, supervisors get reminders 4 hours before due time, and overdue items trigger manager and regional escalation at 24 hours.",
    caseTypesInScope: ["Safety incident", "Near miss", "Property damage", "Customer complaint", "Service request", "HR resignation"],
    caseRoutingModel:
      "Safety and HR cases route to departments for centralized handling, while customer complaints, compliments, and service requests route to location ownership with manager oversight.",
    publicSafetyPortalScope:
      "No-login safety portal must provide SDS access, insurance and incident resources, and direct incident intake submission from QR codes posted on site.",
    incidentComplianceFlow:
      "Supervisor submits incident intake immediately, nurse line triage occurs before closeout, and EHS reviews reportability status until the case is formally resolved."
  },
  scale: {
    usersAtLaunch: 85,
    usersIn12Months: 220,
    numberOfSites: 18,
    inspectionsPerDay: 140
  },
  delivery: {
    rapidDeploymentWeeks: 12,
    productionReadyDefinition:
      "Production ready means all launch sites are configured, role-based permissions are validated, audit logs are enabled, and incident workflows are monitored with runbooks for support.",
    supportLevel:
      "Business admins require weekday support within four hours, while Sev 1 incidents require engineering response within thirty minutes during launch stabilization.",
    priorityTradeoff: "quality"
  },
  phase1Confirmation: {
    phase1OnlyConfirmed: "yes",
    advancedAiInPhase1: "no",
    advancedAiExplanation: ""
  },
  phase2Roadmap: {
    selectedAreas: ["workItemEnhancements", "trainingManagement", "communicationTools"],
    noScopeDefined: false,
    otherArea: "",
    details: {
      workItemEnhancements: {
        successDefinition:
          "Supervisors and dispatch coordinators create advanced task workflows, route SLA breaches automatically, and trigger escalation paths so overdue work is reassigned before customer commitments are missed.",
        requiredForPhase1: "no",
        phase1EscalationConfirmed: false
      },
      customerInteractionTracking: { successDefinition: "", requiredForPhase1: undefined, phase1EscalationConfirmed: false },
      trainingManagement: {
        successDefinition:
          "Training managers assign courses by role, employees complete modules with quizzes, and compliance leads review certification status so field readiness is visible before shift assignments are approved.",
        requiredForPhase1: "no",
        phase1EscalationConfirmed: false
      },
      assetEquipment: { successDefinition: "", requiredForPhase1: undefined, phase1EscalationConfirmed: false },
      internalTicketing: { successDefinition: "", requiredForPhase1: undefined, phase1EscalationConfirmed: false },
      communicationTools: {
        successDefinition:
          "Operations leads publish announcements, team members acknowledge critical updates, and shift supervisors use huddle guides to confirm actions so location-level communication is consistent across regions.",
        requiredForPhase1: "no",
        phase1EscalationConfirmed: false
      },
      other: { successDefinition: "", requiredForPhase1: undefined, phase1EscalationConfirmed: false }
    },
    priorityRanking: ["Work item enhancements", "Training management", "Communication tools"],
    expectedTimeline: "3_6_months",
    deferredModules: ["scheduling", "equipment_pm"]
  },
  phase3Roadmap: {
    selectedCapabilities: ["predictiveRiskDetection", "automatedRecommendations"],
    otherCapability: "",
    capabilityDetails: {
      predictiveRiskDetection:
        "Input data combines inspections, incident frequency, and unresolved work item age. Output is a weekly location risk score with contributing factors. User action requires regional managers to assign corrective plans and due dates.",
      performanceDegradationAlerts: "",
      locationHealthScoring: "",
      managerPerformanceScorecards: "",
      automatedRecommendations:
        "Input data includes historical closures, staff workload, and repeat failure patterns. Output suggests next best action steps with confidence values. User action is for supervisors to accept, edit, and schedule recommended tasks.",
      regionalTrendAnalysis: "",
      forecasting: "",
      anomalyDetection: "",
      aiGeneratedInsights: "",
      other: ""
    },
    dataSources: ["inspections", "workItems", "employeeData"],
    otherDataSource: "",
    dataReadiness: "somewhat_clean",
    timelineExpectation: "phase3",
    earlyTimelineConfirmed: false,
    successMetrics: ["Reduce high-risk repeat incidents by 25% within 2 quarters after rollout"],
    aiEnablementPrerequisites:
      "At least two quarters of stable inspection, work item, and case data quality must be met, with governance sign-off on metric definitions before predictive deployment.",
    aiGovernanceOwner: "Director of Operational Excellence"
  }
});

function FieldShell({
  questionNumber,
  label,
  explanation,
  example,
  error,
  children,
  ai
}: {
  questionNumber?: number;
  label: string;
  explanation: string;
  example?: string;
  error?: string;
  children: React.ReactNode;
  ai?: {
    reviewState?: QuestionAiState;
    onReview: () => void;
    onGenerateDraft: () => void;
    onDraftChange: (value: string) => void;
    onApplyDraft: () => void;
  };
}) {
  const review = ai?.reviewState?.review;
  const hasAiAssist = Boolean(ai);

  return (
    <div className="space-y-4" data-question-shell="true">
      <div className="space-y-2">
        {questionNumber ? (
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Question {String(questionNumber).padStart(2, "0")}</div>
        ) : null}
        <label className="block text-xl font-semibold leading-tight text-[var(--foreground)] md:text-2xl" data-question-label="true">
          {label}
        </label>
        <p className="text-sm leading-6 text-[var(--muted-foreground)]">{explanation}</p>
        {example ? (
          <details className="rounded-md border border-dashed border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--muted-foreground)]">
            <summary className="cursor-pointer font-medium text-[var(--foreground)]">Example of a strong answer</summary>
            <p className="mt-2 leading-6">{example}</p>
          </details>
        ) : null}
      </div>
      {children}
      {error ? (
        <p className="flex items-start gap-2 text-sm text-[var(--danger)]">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
      <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-white/90 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">AI assist for this question</p>
              <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                {hasAiAssist
                  ? "Review this answer in context or generate a cleaner draft without leaving the question."
                  : "AI guidance appears here for this question type. Continue to the next step if review is unavailable."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button disabled={!hasAiAssist || ai?.reviewState?.isReviewing} onClick={() => ai?.onReview()} type="button" variant="secondary">
                {ai?.reviewState?.isReviewing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                Review answer
              </Button>
              <Button disabled={!hasAiAssist || ai?.reviewState?.isGenerating} onClick={() => ai?.onGenerateDraft()} type="button" variant="ghost">
                {ai?.reviewState?.isGenerating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Improve answer
              </Button>
            </div>
          </div>

          {ai?.reviewState?.error ? (
            <div className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-3 text-sm text-[var(--danger)]">
              {ai.reviewState.error}
            </div>
          ) : null}

          {review ? (
            <div className="space-y-3 rounded-xl bg-[var(--muted)] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{review.status === "pass" ? "Ready" : "Needs detail"}</Badge>
                <span className="text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                  confidence {Math.round(review.confidence * 100)}%
                </span>
              </div>
              <p className="text-sm leading-6 text-[var(--foreground)]">{review.summary}</p>
              {review.followUpQuestions.length > 0 ? (
                <ul className="space-y-2 text-sm leading-6 text-[var(--foreground)]">
                  {review.followUpQuestions.map((item) => (
                    <li className="rounded-xl bg-white px-3 py-2" key={item}>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {ai?.reviewState?.draft ? (
            <div className="space-y-3">
              <Textarea rows={8} value={ai.reviewState.draft} onChange={(event) => ai.onDraftChange(event.target.value)} />
              <div className="flex justify-end">
                <Button disabled={!ai.reviewState.draft.trim()} onClick={ai.onApplyDraft} type="button">
                  Apply to this answer
                </Button>
              </div>
            </div>
          ) : null}
      </div>
    </div>
  );
}

function ChoiceCard({
  checked,
  label,
  description,
  onClick
}: {
  checked: boolean;
  label: string;
  description?: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "rounded-xl border p-4 text-left transition-colors",
        checked ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-white hover:bg-[var(--muted)]"
      )}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="font-medium text-[var(--foreground)]">{label}</div>
          {description ? <div className="text-sm leading-6 text-[var(--muted-foreground)]">{description}</div> : null}
        </div>
        <div
          className={cn(
            "mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border",
            checked ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--border)] text-transparent"
          )}
        >
          <Check className="h-3.5 w-3.5" />
        </div>
      </div>
    </button>
  );
}

function StringListField({
  questionNumber,
  label,
  explanation,
  example,
  values,
  onChange,
  minItems = 1,
  error,
  ai
}: {
  questionNumber?: number;
  label: string;
  explanation: string;
  example?: string;
  values: string[];
  onChange: (values: string[]) => void;
  minItems?: number;
  error?: string;
  ai?: {
    reviewState?: QuestionAiState;
    onReview: () => void;
    onGenerateDraft: () => void;
    onDraftChange: (value: string) => void;
    onApplyDraft: () => void;
  };
}) {
  const visibleValues = values.length === 0 ? [""] : values;

  return (
    <FieldShell ai={ai} error={error} example={example} explanation={explanation} label={label} questionNumber={questionNumber}>
      <div className="space-y-3">
        {visibleValues.map((value, index) => (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center" key={`${label}-${index}`}>
            <Input
              className="min-w-0 flex-1"
              value={value}
              onChange={(event) => {
                const nextValues = [...visibleValues];
                nextValues[index] = event.target.value;
                onChange(nextValues);
              }}
              placeholder={`Entry ${index + 1}`}
            />
            <Button
              variant="ghost"
              type="button"
              onClick={() => onChange(visibleValues.filter((_, itemIndex) => itemIndex !== index))}
              disabled={visibleValues.length <= 1}
              className="w-full sm:w-auto"
            >
              Remove
            </Button>
          </div>
        ))}
        <Button variant="secondary" type="button" onClick={() => onChange([...visibleValues, ""])} disabled={visibleValues.length >= Math.max(minItems, 8)}>
          Add entry
        </Button>
      </div>
    </FieldShell>
  );
}

function RadioStack({
  name,
  options,
  selected,
  onSelect
}: {
  name: string;
  options: readonly { value: string; label: string }[];
  selected?: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="grid gap-3">
      {options.map((option) => (
        <label
          className={cn(
            "flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-colors",
            selected === option.value ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)] bg-white hover:bg-[var(--muted)]"
          )}
          key={option.value}
        >
          <div className="font-medium text-[var(--foreground)]">{option.label}</div>
          <input checked={selected === option.value} className="h-4 w-4 accent-[var(--accent)]" name={name} onChange={() => onSelect(option.value)} type="radio" />
        </label>
      ))}
    </div>
  );
}

function ChoiceContextNote({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  return (
    <div className="space-y-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)]/40 p-3">
      <label className="block text-sm font-medium text-[var(--foreground)]">Additional context (optional)</label>
      <Textarea
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Add rationale, caveats, or implementation context for this selection."
      />
    </div>
  );
}

function WorkflowEditor({
  questionNumber,
  control,
  register,
  errors,
  setValue,
  ai
}: {
  questionNumber?: number;
  control: Control<DiscoveryValidatedValues>;
  register: UseFormRegister<DiscoveryValidatedValues>;
  errors: FieldErrors<DiscoveryValidatedValues>;
  setValue: UseFormSetValue<DiscoveryValidatedValues>;
  ai?: {
    reviewState?: QuestionAiState;
    onReview: () => void;
    onGenerateDraft: () => void;
    onDraftChange: (value: string) => void;
    onApplyDraft: () => void;
  };
}) {
  const watchedWorkflows = useWatch({ control, name: "workflows.topDailyWorkflows" }) as
    | DiscoveryValidatedValues["workflows"]["topDailyWorkflows"]
    | undefined;
  const workflows = watchedWorkflows ?? defaultDiscoveryValues.workflows.topDailyWorkflows ?? [];

  return (
    <FieldShell
      ai={ai}
      label="Top 3 workflows used each day"
      explanation="Each workflow must specify the actor, the exact action, and the business outcome."
      example="Site supervisor assigns an inspection route by building and floor, inspector captures room-level findings with photos, and regional manager reviews same-day exception alerts to trigger corrective work items."
      error={getErrorMessage(errors, "workflows.topDailyWorkflows")}
      questionNumber={questionNumber}
    >
      <div className="space-y-4">
        {(workflows ?? []).map((workflow, index) => (
          <div className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--muted)] p-4" key={`workflow-${index}`}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--foreground)]">Workflow {index + 1}</p>
              <Button
                disabled={workflows.length <= 1}
                onClick={() =>
                  setValue("workflows.topDailyWorkflows", workflows.filter((_, itemIndex) => itemIndex !== index), {
                    shouldDirty: true,
                    shouldValidate: true
                  })
                }
                type="button"
                variant="ghost"
              >
                Remove
              </Button>
            </div>
            <Input {...register(`workflows.topDailyWorkflows.${index}.actor`)} placeholder="Actor" />
            <Input {...register(`workflows.topDailyWorkflows.${index}.action`)} placeholder="Action" />
            <Input {...register(`workflows.topDailyWorkflows.${index}.outcome`)} placeholder="Outcome" />
            <div className="space-y-1">
              {(["actor", "action", "outcome"] as const).map((field) => {
                const message = getErrorMessage(errors, `workflows.topDailyWorkflows.${index}.${field}`);
                return message ? (
                  <p className="text-sm text-[var(--danger)]" key={field}>
                    {message}
                  </p>
                ) : null;
              })}
            </div>
          </div>
        ))}
        <Button
          onClick={() =>
            setValue(
              "workflows.topDailyWorkflows",
              [...workflows, { actor: "", action: "", outcome: "" }],
              { shouldDirty: true }
            )
          }
          type="button"
          variant="secondary"
        >
          Add workflow
        </Button>
      </div>
    </FieldShell>
  );
}

function SummaryPanel({ submission }: { submission: SubmissionState }) {
  const includedScope = submission.structured.phase1_scope ?? [];
  const phase2Features = submission.structured.phase_breakdown?.phase_2?.features ?? [];
  const phase3Capabilities = submission.structured.phase_breakdown?.phase_3?.capabilities ?? [];
  const deferredScope = submission.structured.baseline?.can_defer ?? [];
  const definitionOfDone = submission.structured.phase1_definition_of_done ?? [];
  const planningAgenda = submission.structured.scope_planning_agenda ?? [];
  const riskAnalysis = submission.structured.risk_analysis;
  const phasedLoe = submission.structured.loe_assessment;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Badge>Final output</Badge>
          <CardTitle>Phase 1 requirements document</CardTitle>
          <CardDescription>Use this as the source document for scoping, planning, and delivery alignment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-[var(--muted)] p-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">Timeline</h3>
              <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                {submission.structured.delivery_expectations?.phase1_timeline_weeks ?? submission.loe.range} weeks target
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--muted)] p-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">Priority tradeoff</h3>
              <p className="mt-2 text-sm font-semibold capitalize text-[var(--foreground)]">
                {submission.structured.delivery_expectations?.priority_tradeoff ?? "Not set"}
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--muted)] p-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">Current app strategy</h3>
              <p className="mt-2 text-sm font-semibold capitalize text-[var(--foreground)]">
                {submission.structured.current_app_strategy ?? "Not set"}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">Included in Phase 1</h3>
            <div className="space-y-2">
              {includedScope.map((item) => (
                <div className="rounded-xl border border-[var(--border)] bg-white px-4 py-3" key={`${item.feature}-${item.dayOneRequirement}`}>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{item.feature}</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--foreground)]">{item.dayOneRequirement}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">Definition of done</h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--foreground)]">
                {definitionOfDone.map((item) => (
                  <li className="rounded-xl border border-[var(--border)] bg-white px-4 py-3" key={item}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">Deferred beyond Phase 1</h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--foreground)]">
                {deferredScope.length > 0 ? (
                  deferredScope.map((item) => (
                    <li className="rounded-xl border border-[var(--border)] bg-white px-4 py-3" key={item}>
                      {item}
                    </li>
                  ))
                ) : (
                  <li className="rounded-xl border border-[var(--border)] bg-white px-4 py-3">No deferred scope was specified.</li>
                )}
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">Scope planning session agenda</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--foreground)]">
              {planningAgenda.map((item) => (
                <li className="rounded-xl border border-[var(--border)] bg-white px-4 py-3" key={item}>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">Phase 2 expansion scope</h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--foreground)]">
                {phase2Features.length > 0 ? (
                  phase2Features.map((item) => (
                    <li className="rounded-xl border border-[var(--border)] bg-white px-4 py-3" key={`${item.feature}-${item.success_definition}`}>
                      <p className="font-semibold">{item.feature}</p>
                      <p className="mt-1">{item.success_definition}</p>
                    </li>
                  ))
                ) : (
                  <li className="rounded-xl border border-[var(--border)] bg-white px-4 py-3">No explicit Phase 2 scope defined.</li>
                )}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">Phase 3 AI / predictive scope</h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--foreground)]">
                {phase3Capabilities.length > 0 ? (
                  phase3Capabilities.map((item) => (
                    <li className="rounded-xl border border-[var(--border)] bg-white px-4 py-3" key={`${item.capability}-${item.detail}`}>
                      <p className="font-semibold">{item.capability}</p>
                      <p className="mt-1">{item.detail}</p>
                    </li>
                  ))
                ) : (
                  <li className="rounded-xl border border-[var(--border)] bg-white px-4 py-3">No explicit Phase 3 scope defined.</li>
                )}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl bg-[var(--muted)] p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">Architecture direction</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">{submission.summary.recommendedArchitectureDirection}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">Key complexity drivers</h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--foreground)]">
                {submission.summary.keyComplexityDrivers.map((driver) => (
                  <li className="rounded-xl border border-[var(--border)] bg-white px-4 py-3" key={driver}>
                    {driver}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">Risk areas</h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--foreground)]">
                {submission.summary.riskAreas.map((risk) => (
                  <li className="rounded-xl border border-[var(--border)] bg-white px-4 py-3" key={risk}>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">Cross-phase risk analysis</h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--foreground)]">
                <li className="rounded-xl border border-[var(--border)] bg-white px-4 py-3">Scope bleed: {riskAnalysis?.scope_bleed ? "Yes" : "No"}</li>
                <li className="rounded-xl border border-[var(--border)] bg-white px-4 py-3">AI risk: {riskAnalysis?.ai_risk ?? "not set"}</li>
                <li className="rounded-xl border border-[var(--border)] bg-white px-4 py-3">Integration risk: {riskAnalysis?.integration_risk ?? "not set"}</li>
                <li className="rounded-xl border border-[var(--border)] bg-white px-4 py-3">Offline risk: {riskAnalysis?.offline_risk ?? "not set"}</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">Phase-by-phase LOE</h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--foreground)]">
                <li className="rounded-xl border border-[var(--border)] bg-white px-4 py-3">Phase 1: {phasedLoe?.phase_1 ?? "not set"}</li>
                <li className="rounded-xl border border-[var(--border)] bg-white px-4 py-3">Phase 2: {phasedLoe?.phase_2 ?? "not set"}</li>
                <li className="rounded-xl border border-[var(--border)] bg-white px-4 py-3">Phase 3: {phasedLoe?.phase_3 ?? "not set"}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>LOE classification</CardTitle>
          <CardDescription>Classification is derived from launch scope breadth, offline complexity, integrations, scale, and timeline pressure.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <div className="rounded-2xl bg-[var(--ink)] p-5 text-white">
            <div className="text-sm uppercase tracking-[0.16em] text-white/70">Estimate</div>
            <div className="mt-3 text-4xl font-semibold">{submission.loe.classification}</div>
            <div className="mt-2 text-sm text-white/80">{submission.loe.range}</div>
          </div>
          <div className="space-y-2">
            {submission.loe.rationale.map((reason) => (
              <div className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm leading-6 text-[var(--foreground)]" key={reason}>
                {reason}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileJson2 className="h-5 w-5 text-[var(--accent)]" />
            <CardTitle>Technical appendix (JSON)</CardTitle>
          </div>
          <CardDescription>Submission ID: {submission.response.id}</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-2xl bg-[var(--ink)] p-5 text-xs leading-6 text-white">
            {JSON.stringify(submission.structured, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

export function DiscoveryForm() {
  const [entryStage, setEntryStage] = useState<"welcome" | "scope-summary" | "blind-spots" | "questions">("welcome");
  const [currentStep, setCurrentStep] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [questionTitles, setQuestionTitles] = useState<string[]>([]);
  const [submission, setSubmission] = useState<SubmissionState | null>(null);
  const [submissionWarnings, setSubmissionWarnings] = useState<ValidationIssue[]>([]);
  const [showSubmitWarningDialog, setShowSubmitWarningDialog] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [questionAiState, setQuestionAiState] = useState<Record<string, QuestionAiState>>({});
  const [questionNotes, setQuestionNotes] = useState<QuestionNotesState>({});
  const isHeaderCondensed = false;
  const [isPending, startTransition] = useTransition();
  const questionSectionRef = useRef<HTMLElement | null>(null);
  const hasHydratedDraftRef = useRef(false);
  const aiProvider: AiProviderOption = "auto";

  const form = useForm<DiscoveryValidatedValues>({
    resolver: zodResolver(discoveryFormSchema) as Resolver<DiscoveryValidatedValues>,
    defaultValues: defaultDiscoveryValues,
    mode: "onChange"
  });

  const watchedValues = useWatch({ control: form.control }) as DiscoveryValidatedValues | undefined;
  const values: DiscoveryValidatedValues = {
    phase1Scope: {
      selectedFeatures: watchedValues?.phase1Scope?.selectedFeatures ?? defaultDiscoveryValues.phase1Scope.selectedFeatures,
      otherFeature: watchedValues?.phase1Scope?.otherFeature ?? defaultDiscoveryValues.phase1Scope.otherFeature,
      featureDetails: {
        ...defaultDiscoveryValues.phase1Scope.featureDetails,
        ...watchedValues?.phase1Scope?.featureDetails
      },
      inspectionScoringMethod:
        watchedValues?.phase1Scope?.inspectionScoringMethod ?? defaultDiscoveryValues.phase1Scope.inspectionScoringMethod,
      failEvidenceStandard: watchedValues?.phase1Scope?.failEvidenceStandard ?? defaultDiscoveryValues.phase1Scope.failEvidenceStandard,
      jointInspectionExpectation:
        watchedValues?.phase1Scope?.jointInspectionExpectation ?? defaultDiscoveryValues.phase1Scope.jointInspectionExpectation
    },
    criticality: {
      consequences: watchedValues?.criticality?.consequences ?? defaultDiscoveryValues.criticality.consequences
    },
    currentBaseline: {
      systemsToday: watchedValues?.currentBaseline?.systemsToday ?? defaultDiscoveryValues.currentBaseline.systemsToday,
      mustReplace: watchedValues?.currentBaseline?.mustReplace ?? defaultDiscoveryValues.currentBaseline.mustReplace,
      canDefer: watchedValues?.currentBaseline?.canDefer ?? defaultDiscoveryValues.currentBaseline.canDefer,
      mirrorApproach: watchedValues?.currentBaseline?.mirrorApproach ?? defaultDiscoveryValues.currentBaseline.mirrorApproach,
      hierarchyRequirement:
        watchedValues?.currentBaseline?.hierarchyRequirement ?? defaultDiscoveryValues.currentBaseline.hierarchyRequirement,
      spaceTypeGovernance:
        watchedValues?.currentBaseline?.spaceTypeGovernance ?? defaultDiscoveryValues.currentBaseline.spaceTypeGovernance
    },
    mobileRequirements: {
      selectedReasons: watchedValues?.mobileRequirements?.selectedReasons ?? defaultDiscoveryValues.mobileRequirements.selectedReasons,
      otherExplanation: watchedValues?.mobileRequirements?.otherExplanation ?? defaultDiscoveryValues.mobileRequirements.otherExplanation,
      offlineDetail: watchedValues?.mobileRequirements?.offlineDetail ?? defaultDiscoveryValues.mobileRequirements.offlineDetail,
      appStoreInternalDistributionOk:
        watchedValues?.mobileRequirements?.appStoreInternalDistributionOk ??
        defaultDiscoveryValues.mobileRequirements.appStoreInternalDistributionOk,
      performanceDetail: watchedValues?.mobileRequirements?.performanceDetail ?? defaultDiscoveryValues.mobileRequirements.performanceDetail
    },
    offlineRequirements: {
      supportLevel: watchedValues?.offlineRequirements?.supportLevel ?? defaultDiscoveryValues.offlineRequirements.supportLevel,
      detail: watchedValues?.offlineRequirements?.detail ?? defaultDiscoveryValues.offlineRequirements.detail
    },
    integrations: {
      selectedSystems: watchedValues?.integrations?.selectedSystems ?? defaultDiscoveryValues.integrations.selectedSystems,
      otherSystem: watchedValues?.integrations?.otherSystem ?? defaultDiscoveryValues.integrations.otherSystem,
      details: {
        adp: {
          ...defaultDiscoveryValues.integrations.details.adp,
          ...watchedValues?.integrations?.details?.adp
        },
        powerBi: {
          ...defaultDiscoveryValues.integrations.details.powerBi,
          ...watchedValues?.integrations?.details?.powerBi
        },
        internal: {
          ...defaultDiscoveryValues.integrations.details.internal,
          ...watchedValues?.integrations?.details?.internal
        },
        customer: {
          ...defaultDiscoveryValues.integrations.details.customer,
          ...watchedValues?.integrations?.details?.customer
        },
        other: {
          ...defaultDiscoveryValues.integrations.details.other,
          ...watchedValues?.integrations?.details?.other
        }
      },
      adpSyncMode: watchedValues?.integrations?.adpSyncMode ?? defaultDiscoveryValues.integrations.adpSyncMode,
      adpLatencyTolerance: watchedValues?.integrations?.adpLatencyTolerance ?? defaultDiscoveryValues.integrations.adpLatencyTolerance,
      powerBiMode: watchedValues?.integrations?.powerBiMode ?? defaultDiscoveryValues.integrations.powerBiMode
    },
    analyticsAi: {
      analyticsPhase1: watchedValues?.analyticsAi?.analyticsPhase1 ?? defaultDiscoveryValues.analyticsAi.analyticsPhase1,
      analyticsPhase2: watchedValues?.analyticsAi?.analyticsPhase2 ?? defaultDiscoveryValues.analyticsAi.analyticsPhase2,
      aiPhase1: watchedValues?.analyticsAi?.aiPhase1 ?? defaultDiscoveryValues.analyticsAi.aiPhase1,
      aiPhase2: watchedValues?.analyticsAi?.aiPhase2 ?? defaultDiscoveryValues.analyticsAi.aiPhase2,
      locationHealthScoringModel:
        watchedValues?.analyticsAi?.locationHealthScoringModel ?? defaultDiscoveryValues.analyticsAi.locationHealthScoringModel,
      managementRollupExpectations:
        watchedValues?.analyticsAi?.managementRollupExpectations ?? defaultDiscoveryValues.analyticsAi.managementRollupExpectations
    },
    workflows: {
      topDailyWorkflows: watchedValues?.workflows?.topDailyWorkflows ?? defaultDiscoveryValues.workflows.topDailyWorkflows,
      workItemUrgencyRules: watchedValues?.workflows?.workItemUrgencyRules ?? defaultDiscoveryValues.workflows.workItemUrgencyRules,
      assigneeNotificationEscalation:
        watchedValues?.workflows?.assigneeNotificationEscalation ?? defaultDiscoveryValues.workflows.assigneeNotificationEscalation,
      caseTypesInScope: watchedValues?.workflows?.caseTypesInScope ?? defaultDiscoveryValues.workflows.caseTypesInScope,
      caseRoutingModel: watchedValues?.workflows?.caseRoutingModel ?? defaultDiscoveryValues.workflows.caseRoutingModel,
      publicSafetyPortalScope:
        watchedValues?.workflows?.publicSafetyPortalScope ?? defaultDiscoveryValues.workflows.publicSafetyPortalScope,
      incidentComplianceFlow:
        watchedValues?.workflows?.incidentComplianceFlow ?? defaultDiscoveryValues.workflows.incidentComplianceFlow
    },
    scale: {
      usersAtLaunch: watchedValues?.scale?.usersAtLaunch ?? defaultDiscoveryValues.scale.usersAtLaunch,
      usersIn12Months: watchedValues?.scale?.usersIn12Months ?? defaultDiscoveryValues.scale.usersIn12Months,
      numberOfSites: watchedValues?.scale?.numberOfSites ?? defaultDiscoveryValues.scale.numberOfSites,
      inspectionsPerDay: watchedValues?.scale?.inspectionsPerDay ?? defaultDiscoveryValues.scale.inspectionsPerDay
    },
    delivery: {
      rapidDeploymentWeeks: watchedValues?.delivery?.rapidDeploymentWeeks ?? defaultDiscoveryValues.delivery.rapidDeploymentWeeks,
      productionReadyDefinition:
        watchedValues?.delivery?.productionReadyDefinition ?? defaultDiscoveryValues.delivery.productionReadyDefinition,
      supportLevel: watchedValues?.delivery?.supportLevel ?? defaultDiscoveryValues.delivery.supportLevel,
      priorityTradeoff: watchedValues?.delivery?.priorityTradeoff ?? defaultDiscoveryValues.delivery.priorityTradeoff
    },
    phase1Confirmation: {
      phase1OnlyConfirmed: watchedValues?.phase1Confirmation?.phase1OnlyConfirmed ?? defaultDiscoveryValues.phase1Confirmation.phase1OnlyConfirmed,
      advancedAiInPhase1: watchedValues?.phase1Confirmation?.advancedAiInPhase1 ?? defaultDiscoveryValues.phase1Confirmation.advancedAiInPhase1,
      advancedAiExplanation:
        watchedValues?.phase1Confirmation?.advancedAiExplanation ?? defaultDiscoveryValues.phase1Confirmation.advancedAiExplanation
    },
    phase2Roadmap: {
      selectedAreas: watchedValues?.phase2Roadmap?.selectedAreas ?? defaultDiscoveryValues.phase2Roadmap.selectedAreas,
      noScopeDefined: watchedValues?.phase2Roadmap?.noScopeDefined ?? defaultDiscoveryValues.phase2Roadmap.noScopeDefined,
      otherArea: watchedValues?.phase2Roadmap?.otherArea ?? defaultDiscoveryValues.phase2Roadmap.otherArea,
      details: {
        workItemEnhancements: {
          ...defaultDiscoveryValues.phase2Roadmap.details.workItemEnhancements,
          ...watchedValues?.phase2Roadmap?.details?.workItemEnhancements
        },
        customerInteractionTracking: {
          ...defaultDiscoveryValues.phase2Roadmap.details.customerInteractionTracking,
          ...watchedValues?.phase2Roadmap?.details?.customerInteractionTracking
        },
        trainingManagement: {
          ...defaultDiscoveryValues.phase2Roadmap.details.trainingManagement,
          ...watchedValues?.phase2Roadmap?.details?.trainingManagement
        },
        assetEquipment: {
          ...defaultDiscoveryValues.phase2Roadmap.details.assetEquipment,
          ...watchedValues?.phase2Roadmap?.details?.assetEquipment
        },
        internalTicketing: {
          ...defaultDiscoveryValues.phase2Roadmap.details.internalTicketing,
          ...watchedValues?.phase2Roadmap?.details?.internalTicketing
        },
        communicationTools: {
          ...defaultDiscoveryValues.phase2Roadmap.details.communicationTools,
          ...watchedValues?.phase2Roadmap?.details?.communicationTools
        },
        other: {
          ...defaultDiscoveryValues.phase2Roadmap.details.other,
          ...watchedValues?.phase2Roadmap?.details?.other
        }
      },
      priorityRanking: watchedValues?.phase2Roadmap?.priorityRanking ?? defaultDiscoveryValues.phase2Roadmap.priorityRanking,
      expectedTimeline: watchedValues?.phase2Roadmap?.expectedTimeline ?? defaultDiscoveryValues.phase2Roadmap.expectedTimeline,
      deferredModules: watchedValues?.phase2Roadmap?.deferredModules ?? defaultDiscoveryValues.phase2Roadmap.deferredModules
    },
    phase3Roadmap: {
      selectedCapabilities: watchedValues?.phase3Roadmap?.selectedCapabilities ?? defaultDiscoveryValues.phase3Roadmap.selectedCapabilities,
      otherCapability: watchedValues?.phase3Roadmap?.otherCapability ?? defaultDiscoveryValues.phase3Roadmap.otherCapability,
      capabilityDetails: {
        ...defaultDiscoveryValues.phase3Roadmap.capabilityDetails,
        ...watchedValues?.phase3Roadmap?.capabilityDetails
      },
      dataSources: watchedValues?.phase3Roadmap?.dataSources ?? defaultDiscoveryValues.phase3Roadmap.dataSources,
      otherDataSource: watchedValues?.phase3Roadmap?.otherDataSource ?? defaultDiscoveryValues.phase3Roadmap.otherDataSource,
      dataReadiness: watchedValues?.phase3Roadmap?.dataReadiness ?? defaultDiscoveryValues.phase3Roadmap.dataReadiness,
      timelineExpectation: watchedValues?.phase3Roadmap?.timelineExpectation ?? defaultDiscoveryValues.phase3Roadmap.timelineExpectation,
      earlyTimelineConfirmed:
        watchedValues?.phase3Roadmap?.earlyTimelineConfirmed ?? defaultDiscoveryValues.phase3Roadmap.earlyTimelineConfirmed,
      successMetrics: watchedValues?.phase3Roadmap?.successMetrics ?? defaultDiscoveryValues.phase3Roadmap.successMetrics,
      aiEnablementPrerequisites:
        watchedValues?.phase3Roadmap?.aiEnablementPrerequisites ?? defaultDiscoveryValues.phase3Roadmap.aiEnablementPrerequisites,
      aiGovernanceOwner: watchedValues?.phase3Roadmap?.aiGovernanceOwner ?? defaultDiscoveryValues.phase3Roadmap.aiGovernanceOwner
    }
  };
  const progress = useMemo(() => ((currentStep + 1) / discoverySections.length) * 100, [currentStep]);
  const hasNextQuestionInSection = currentQuestionIndex < Math.max(questionCount - 1, 0);
  const activeSection = discoverySections[currentStep];
  const isFinalStep = currentStep === discoverySections.length - 1;
  const canRetreat = currentStep > 0 || currentQuestionIndex > 0;
  const entryStageOrder: Array<"welcome" | "scope-summary" | "blind-spots" | "questions"> = [
    "welcome",
    "scope-summary",
    "blind-spots",
    "questions"
  ];
  const entryStageIndex = entryStageOrder.indexOf(entryStage);
  const entryProgress = ((entryStageIndex + 1) / entryStageOrder.length) * 100;

  const activeSectionData =
    activeSection.id === "phase1"
      ? values.phase1Scope
      : activeSection.id === "criticality"
        ? values.criticality
        : activeSection.id === "baseline"
          ? values.currentBaseline
          : activeSection.id === "mobile"
            ? values.mobileRequirements
            : activeSection.id === "offline"
              ? values.offlineRequirements
              : activeSection.id === "integrations"
                ? values.integrations
                : activeSection.id === "analytics-ai"
                  ? values.analyticsAi
                  : activeSection.id === "workflows"
                    ? values.workflows
                    : activeSection.id === "scale"
                      ? values.scale
                      : activeSection.id === "delivery"
                        ? values.delivery
                        : activeSection.id === "phase1-confirmation"
                          ? values.phase1Confirmation
                          : activeSection.id === "phase2-roadmap"
                            ? values.phase2Roadmap
                            : values.phase3Roadmap;
  const warningSections = useMemo(() => {
    const grouped = new Map<string, { sectionIndex: number; sectionShortTitle: string; messages: string[] }>();
    for (const warning of submissionWarnings) {
      const existing = grouped.get(warning.sectionShortTitle);
      if (existing) {
        if (!existing.messages.includes(warning.message)) {
          existing.messages.push(warning.message);
        }
      } else {
        grouped.set(warning.sectionShortTitle, {
          sectionIndex: warning.sectionIndex,
          sectionShortTitle: warning.sectionShortTitle,
          messages: [warning.message]
        });
      }
    }
    return Array.from(grouped.values()).sort((a, b) => a.sectionIndex - b.sectionIndex);
  }, [submissionWarnings]);

  useEffect(() => {
    if (typeof window === "undefined" || hasHydratedDraftRef.current) {
      return;
    }

    hasHydratedDraftRef.current = true;

    const raw = window.localStorage.getItem(DISCOVERY_DRAFT_STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as {
        values?: unknown;
        questionNotes?: unknown;
        entryStage?: unknown;
        currentStep?: unknown;
        currentQuestionIndex?: unknown;
      };

      if (parsed.values !== undefined) {
        const restoredValues = mergeWithDefaults(defaultDiscoveryValues, parsed.values);
        form.reset(restoredValues);
      }

      if (parsed.questionNotes && typeof parsed.questionNotes === "object" && !Array.isArray(parsed.questionNotes)) {
        const restoredNotes = Object.entries(parsed.questionNotes as Record<string, unknown>).reduce<QuestionNotesState>((accumulator, [key, value]) => {
          if (typeof value === "string") {
            accumulator[key] = value;
          }
          return accumulator;
        }, {});
        setQuestionNotes(restoredNotes);
      }

      if (
        parsed.entryStage === "welcome" ||
        parsed.entryStage === "scope-summary" ||
        parsed.entryStage === "blind-spots" ||
        parsed.entryStage === "questions"
      ) {
        setEntryStage(parsed.entryStage);
      }

      if (typeof parsed.currentStep === "number" && Number.isFinite(parsed.currentStep)) {
        const boundedStep = Math.min(Math.max(Math.trunc(parsed.currentStep), 0), discoverySections.length - 1);
        setCurrentStep(boundedStep);
      }

      if (typeof parsed.currentQuestionIndex === "number" && Number.isFinite(parsed.currentQuestionIndex)) {
        setCurrentQuestionIndex(Math.max(Math.trunc(parsed.currentQuestionIndex), 0));
      }
    } catch {
      window.localStorage.removeItem(DISCOVERY_DRAFT_STORAGE_KEY);
    }
  }, [form]);

  useEffect(() => {
    if (typeof window === "undefined" || !hasHydratedDraftRef.current) {
      return;
    }

    if (submission) {
      window.localStorage.removeItem(DISCOVERY_DRAFT_STORAGE_KEY);
      return;
    }

    const draft = {
      values,
      questionNotes,
      entryStage,
      currentStep,
      currentQuestionIndex
    };

    try {
      window.localStorage.setItem(DISCOVERY_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Ignore quota/storage errors and keep the form usable.
    }
  }, [values, questionNotes, entryStage, currentStep, currentQuestionIndex, submission]);

  useEffect(() => {
    const section = questionSectionRef.current;
    if (!section) {
      return;
    }

    const questions = Array.from(section.querySelectorAll<HTMLElement>("[data-question-shell='true']"));
    const nextTitles = questions.map((question, index) => {
      const heading = question.querySelector<HTMLElement>("[data-question-label='true']");
      const text = heading?.textContent?.trim();
      return text && text.length > 0 ? text : `Question ${index + 1}`;
    });

    setQuestionCount((previous) => (previous === questions.length ? previous : questions.length));
    setQuestionTitles((previous) => {
      if (previous.length === nextTitles.length && previous.every((item, index) => item === nextTitles[index])) {
        return previous;
      }
      return nextTitles;
    });

    const nextIndex = questions.length === 0 ? 0 : Math.min(currentQuestionIndex, questions.length - 1);
    if (nextIndex !== currentQuestionIndex) {
      setCurrentQuestionIndex(nextIndex);
      return;
    }

    questions.forEach((question, index) => {
      question.hidden = index !== nextIndex;
    });
  }, [activeSectionData, currentQuestionIndex, currentStep]);

  const setQuestionState = (fieldPath: string, updater: (current: QuestionAiState) => QuestionAiState) => {
    setQuestionAiState((current) => ({
      ...current,
      [fieldPath]: updater(current[fieldPath] ?? {})
    }));
  };

  const runQuestionReview = async (fieldPath: string, questionLabel: string, answer: unknown) => {
    setQuestionState(fieldPath, (current) => ({
      ...current,
      error: undefined,
      isReviewing: true
    }));

    try {
      const response = await fetch("/api/ai/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId: activeSection.id,
          sectionTitle: activeSection.title,
          objective: activeSection.aiObjective,
          checklist: activeSection.aiChecklist,
          questionLabel,
          fieldPath,
          sectionData: { answer },
          fullSnapshot: values,
          aiProvider
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string; detail?: string } | null;
        const message = payload?.error ?? "AI review failed.";
        setQuestionState(fieldPath, (current) => ({
          ...current,
          error: payload?.detail ? `${message} ${payload.detail}` : message,
          isReviewing: false,
          updatedAt: new Date().toISOString()
        }));
        return null;
      }

      const payload = aiReviewResponseSchema.parse(await response.json());
      setQuestionState(fieldPath, (current) => ({
        ...current,
        review: payload,
        error: undefined,
        isReviewing: false,
        updatedAt: new Date().toISOString()
      }));
      return payload;
    } catch {
      setQuestionState(fieldPath, (current) => ({
        ...current,
        error: "AI review is temporarily unavailable for this question.",
        isReviewing: false,
        updatedAt: new Date().toISOString()
      }));
      return null;
    }
  };

  const generateQuestionDraft = async (fieldPath: string, questionLabel: string, answer: unknown) => {
    setQuestionState(fieldPath, (current) => ({
      ...current,
      error: undefined,
      isGenerating: true
    }));

    try {
      const response = await fetch("/api/ai/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId: activeSection.id,
          sectionTitle: activeSection.title,
          objective: activeSection.aiObjective,
          checklist: activeSection.aiChecklist,
          questionLabel,
          fieldPath,
          sectionData: { answer },
          fullSnapshot: values,
          aiProvider
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string; detail?: string } | null;
        setQuestionState(fieldPath, (current) => ({
          ...current,
          error: payload?.error ?? "Could not generate a draft right now.",
          isGenerating: false
        }));
        return;
      }

      const payload = (await response.json()) as { draft?: string };
      const nextDraft = payload.draft?.trim() ?? "";
      if (!nextDraft) {
        setQuestionState(fieldPath, (current) => ({
          ...current,
          error: "AI did not return a usable draft.",
          isGenerating: false
        }));
        return;
      }

      setQuestionState(fieldPath, (current) => ({
        ...current,
        draft: nextDraft,
        error: undefined,
        isGenerating: false
      }));
    } catch {
      setQuestionState(fieldPath, (current) => ({
        ...current,
        error: "Could not generate a draft right now.",
        isGenerating: false
      }));
    }
  };

  const applyDraftToField = (fieldPath: string, draft: string, answer: unknown) => {
    const setFieldValue = (nextValue: unknown) => {
      form.setValue(fieldPath as Path<DiscoveryValidatedValues>, nextValue as never, {
        shouldDirty: true,
        shouldValidate: true
      });
      return true;
    };

    const singleSelectOptionsByPath: Record<string, ReadonlyArray<{ value: string; label: string }>> = {
      "phase1Scope.inspectionScoringMethod": inspectionScoringMethodOptions,
      "currentBaseline.mirrorApproach": mirrorApproachOptions,
      "currentBaseline.hierarchyRequirement": hierarchyRequirementOptions,
      "currentBaseline.spaceTypeGovernance": spaceTypeGovernanceOptions,
      "offlineRequirements.supportLevel": offlineSupportOptions,
      "integrations.adpSyncMode": adpSyncModeOptions,
      "integrations.powerBiMode": powerBiModeOptions
    };

    const multiSelectOptionsByPath: Record<string, ReadonlyArray<{ value: string; label: string }>> = {
      "phase1Scope.selectedFeatures": phase1FeatureOptions,
      "mobileRequirements.selectedReasons": mobileReasonOptions,
      "integrations.selectedSystems": integrationSystemOptions
    };

    const singleOptions = singleSelectOptionsByPath[fieldPath];
    if (singleOptions) {
      const matchedValue = matchSingleOption(draft, singleOptions);
      if (matchedValue) {
        return setFieldValue(matchedValue);
      }
    }

    const multiOptions = multiSelectOptionsByPath[fieldPath];
    if (multiOptions) {
      const matchedValues = matchMultiOptions(draft, multiOptions);
      if (matchedValues.length > 0) {
        return setFieldValue(matchedValues);
      }
    }

    if (fieldPath === "workflows.topDailyWorkflows") {
      const workflows = parseWorkflowDraft(draft);
      if (workflows.length > 0) {
        return setFieldValue(workflows);
      }
    }

    if (typeof answer === "string") {
      return setFieldValue(draft);
    }
    if (Array.isArray(answer)) {
      return setFieldValue(splitDraftItems(draft));
    }
    return false;
  };

  const getQuestionAiProps = (
    fieldPath: string,
    questionLabel: string,
    answer: unknown,
    applyDraft?: (draft: string) => void
  ) => ({
    reviewState: questionAiState[fieldPath],
    onReview: () => {
      void runQuestionReview(fieldPath, questionLabel, answer);
    },
    onGenerateDraft: () => {
      void generateQuestionDraft(fieldPath, questionLabel, answer);
    },
    onDraftChange: (draft: string) => {
      setQuestionState(fieldPath, (current) => ({ ...current, draft }));
    },
    onApplyDraft: () => {
      const draft = questionAiState[fieldPath]?.draft?.trim();
      if (!draft) {
        return;
      }

      const applied = applyDraft ? (applyDraft(draft), true) : applyDraftToField(fieldPath, draft, answer);
      if (!applied) {
        setQuestionState(fieldPath, (current) => ({
          ...current,
          error: "This draft could not be applied automatically. You can still copy and paste it.",
          updatedAt: new Date().toISOString()
        }));
        return;
      }

      setQuestionState(fieldPath, (current) => ({
        ...current,
        draft: undefined,
        error: undefined,
        updatedAt: new Date().toISOString()
      }));
      void runQuestionReview(fieldPath, questionLabel, draft);
    }
  });

  const getQuestionNote = (fieldPath: string) => questionNotes[fieldPath] ?? "";
  const setQuestionNote = (fieldPath: string, nextValue: string) => {
    setQuestionNotes((current) => {
      const trimmed = nextValue.trim();
      if (!trimmed) {
        if (!(fieldPath in current)) {
          return current;
        }
        const next = { ...current };
        delete next[fieldPath];
        return next;
      }
      if (current[fieldPath] === nextValue) {
        return current;
      }
      return {
        ...current,
        [fieldPath]: nextValue
      };
    });
  };

  const performSubmission = (rawValues: DiscoveryValidatedValues, options?: { bypassValidation?: boolean }) => {
    setApiError(null);
    startTransition(async () => {
      const validatedValues = options?.bypassValidation
        ? rawValues
        : (discoveryFormSchema.parse(rawValues) as DiscoveryValidatedValues);
      const baseStructured = buildStructuredOutput(validatedValues);
      const cleanedNotes = Object.entries(questionNotes).reduce<Record<string, string>>((accumulator, [fieldPath, note]) => {
        const trimmed = note.trim();
        if (trimmed) {
          accumulator[fieldPath] = trimmed;
        }
        return accumulator;
      }, {});
      const structured: StructuredSubmission =
        Object.keys(cleanedNotes).length > 0 ? { ...baseStructured, question_notes: cleanedNotes } : baseStructured;
      const summary = buildReadableSummary(validatedValues);
      const loe = classifyLoe(validatedValues);

      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ structured, summary, loe })
      });

      if (!response.ok) {
        let errorMessage = `Submission failed (${response.status}).`;
        try {
          const errorPayload = (await response.json()) as { error?: string; detail?: string; hint?: string };
          const parts = [errorPayload.error, errorPayload.detail, errorPayload.hint].filter(
            (part): part is string => typeof part === "string" && part.trim().length > 0
          );
          if (parts.length > 0) {
            errorMessage = parts.join(" ");
          }
        } catch {
          // Fall back to generic status text when response is not JSON.
          if (response.statusText) {
            errorMessage = `Submission failed (${response.status} ${response.statusText}).`;
          }
        }
        setApiError(errorMessage);
        return;
      }

      const payload = (await response.json()) as SubmissionState["response"];
      setSubmission({ structured, summary, loe, response: payload });
    });
  };

  const nextStep = async () => {
    setCurrentQuestionIndex(0);
    setCurrentStep((step) => Math.min(step + 1, discoverySections.length - 1));
  };

  const retreatFlow = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (currentStep > 0) {
      const previousStep = currentStep - 1;
      setCurrentStep(previousStep);
      setCurrentQuestionIndex(Number.MAX_SAFE_INTEGER);
    }
  };

  const advanceFlow = async () => {
    if (hasNextQuestionInSection) {
      setCurrentQuestionIndex((index) => Math.min(index + 1, Math.max(questionCount - 1, 0)));
      return;
    }

    if (!isFinalStep) {
      await nextStep();
      return;
    }

    await submit();
  };

  const toggleArrayValue = <T extends string>(path: Path<DiscoveryValidatedValues>, currentValues: T[], value: T) => {
    const nextValues = currentValues.includes(value) ? currentValues.filter((item) => item !== value) : [...currentValues, value];
    form.setValue(path, nextValues as never, { shouldDirty: true, shouldValidate: true });
  };

  const submit = async () => {
    setApiError(null);

    await form.trigger(undefined, { shouldFocus: false });
    const issues = collectValidationIssues(form.formState.errors);
    const warningIssues = issues;

    if (warningIssues.length > 0) {
      setSubmissionWarnings(warningIssues);
      setShowSubmitWarningDialog(true);
      return;
    }

    performSubmission(values);
  };

  const quickQaSubmit = () => {
    const dummyValues = buildQaDummyValues();
    setApiError(null);
    setShowSubmitWarningDialog(false);
    setSubmissionWarnings([]);
    setQuestionNotes({});
    form.reset(dummyValues);
    setCurrentStep(discoverySections.length - 1);
    performSubmission(dummyValues);
  };

  if (submission) {
    return (
      <main className="app-themed-root px-4 py-10 md:px-8">
        <div className="app-hero-pattern" />
        <div className="app-content-layer mx-auto max-w-3xl space-y-6">
          <Card className="app-surface-card">
            <CardHeader>
              <Badge>Submitted</Badge>
              <CardTitle className="mt-1 text-3xl">Thanks for submitting.</CardTitle>
              <CardDescription className="text-sm leading-7">
                We received your response on {new Date(submission.response.receivedAt).toLocaleString()}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                If you need to change anything, you can reopen your response and update your answers.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => {
                    setSubmission(null);
                    setEntryStage("questions");
                    setSubmissionWarnings([]);
                    setShowSubmitWarningDialog(false);
                    setCurrentQuestionIndex(0);
                    setCurrentStep(0);
                  }}
                  type="button"
                  variant="secondary"
                >
                  Edit my answers
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="app-themed-root px-4 py-10 md:px-8">
      <div className="app-hero-pattern" />
      <div className="app-content-layer mx-auto max-w-6xl space-y-6">
        <Card className="app-surface-card">
          <CardHeader
            className={cn(
              "sticky top-2 z-40 rounded-xl border border-[var(--border)] bg-white/88 shadow-[0_1px_2px_rgba(16,24,40,0.05),0_14px_40px_rgba(16,24,40,0.12)] backdrop-blur transition-all duration-200",
              isHeaderCondensed ? "py-3" : "py-6"
            )}
          >
            <div className={cn("transition-all duration-200", isHeaderCondensed ? "space-y-2" : "space-y-3")}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className={cn("flex flex-wrap items-center transition-all duration-200", isHeaderCondensed ? "gap-2" : "gap-3")}>
                  <div className="rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5">
                  <Image
                    src={ruxtonLogo}
                    alt="Ruxton Labs logo"
                    width={300}
                    height={64}
                    className={cn("w-auto object-contain transition-all duration-200", isHeaderCondensed ? "h-8" : "h-11")}
                    priority
                  />
                  </div>
                  <div className="rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5">
                  <Image
                    src={verdeLogo}
                    alt="Verde Clean logo"
                    width={300}
                    height={64}
                    className={cn("w-auto object-contain transition-all duration-200", isHeaderCondensed ? "h-8" : "h-11")}
                    priority
                  />
                  </div>
                  <div
                    className={cn(
                      "rounded-full border border-[var(--border)] bg-white text-[var(--muted-foreground)] transition-all duration-200",
                      isHeaderCondensed ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
                    )}
                  >
                    HeySage Intelligent Operations Platform
                  </div>
                </div>
                <h1
                  className={cn(
                    "font-semibold tracking-tight text-[var(--foreground)] transition-all duration-200",
                    isHeaderCondensed ? "text-2xl md:text-3xl" : "text-4xl md:text-5xl"
                  )}
                >
                  Scope Clarification Questionnaire
                </h1>
              </div>
              <div className={cn("space-y-2 border-t border-[var(--border)] transition-all duration-200", isHeaderCondensed ? "pt-1.5" : "pt-2")}>
                <div
                  className={cn(
                    "flex items-center justify-between text-[var(--muted-foreground)] transition-all duration-200",
                    isHeaderCondensed ? "text-[11px] uppercase tracking-[0.12em]" : "text-xs uppercase tracking-[0.16em]"
                  )}
                >
                  {entryStage === "questions" ? (
                    <>
                      <span>Overall progress</span>
                      <span>
                        Section {currentStep + 1} / {discoverySections.length}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>Getting started</span>
                      <span>
                        Step {entryStageIndex + 1} / {entryStageOrder.length}
                      </span>
                    </>
                  )}
                </div>
                <Progress value={entryStage === "questions" ? progress : entryProgress} />
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-6 md:p-8">
            {entryStage !== "questions" ? (
              <div className="space-y-5">
                {entryStage === "welcome" ? (
                  <>
                    <h2 className="text-2xl font-semibold text-[var(--foreground)]">Welcome to the Ruxton Labs Guided Scope Intake Wizard</h2>
                    <p className="text-sm leading-7 text-[var(--muted-foreground)]">
                      This walkthrough helps us confirm what must be delivered first, what can wait, and what decisions still need input.
                    </p>
                    <ul className="space-y-2 text-sm leading-6 text-[var(--foreground)]">
                      <li>- Most people finish in about 12 to 18 minutes.</li>
                      <li>- You will answer one question at a time with optional AI writing help.</li>
                      <li>- Your answers are turned into a clear scope record for planning and delivery.</li>
                    </ul>
                  </>
                ) : null}

                {entryStage === "scope-summary" ? (
                  <>
                    <h2 className="text-2xl font-semibold text-[var(--foreground)]">Current Understanding of Scope</h2>
                    <div className="space-y-3 text-sm leading-6 text-[var(--foreground)]">
                      <p>
                        Ruxton Labs currently understands this as a business-critical modernization effort for the HeySage Intelligent Operations Platform.
                        Phase 1 should protect daily operations by delivering dependable inspections, clear corrective work routing, and reporting visibility for frontline teams and leadership.
                      </p>
                      <p>
                        We also see a few high-risk areas that need clear decisions now: mobile expectations, offline use, location hierarchy rules,
                        and launch integrations (especially ADP, Power BI, and internal systems).
                      </p>
                      <p>
                        The roadmap direction looks right: stabilize core operations in phase 1, expand in phase 2, and layer in advanced AI in phase 3.
                        This questionnaire turns that direction into practical delivery decisions.
                      </p>
                    </div>
                  </>
                ) : null}

                {entryStage === "blind-spots" ? (
                  <>
                    <h2 className="text-2xl font-semibold text-[var(--foreground)]">Blind spot review</h2>
                    <div className="space-y-3 text-sm leading-6 text-[var(--foreground)]">
                      <p>
                        1) Day-one boundaries often expand late. We will pressure-test each launch feature so later-phase work does not quietly slip into phase 1.
                      </p>
                      <p>
                        2) Mobile and offline expectations are often underspecified. We need clear answers on offline duration, sync timing, and who handles conflicts.
                      </p>
                      <p>
                        3) Integration complexity is usually hidden in details. For each launch system, we need clear data flow, timing expectations, and fallback behavior.
                      </p>
                    </div>
                  </>
                ) : null}

                <div className="pt-3">
                  <Button
                    onClick={() => {
                      const next = Math.min(entryStageIndex + 1, entryStageOrder.length - 1);
                      setEntryStage(entryStageOrder[next]);
                    }}
                    type="button"
                  >
                    {entryStage === "blind-spots" ? "Start Q&A" : "Next"}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (

              <section className="space-y-6" ref={questionSectionRef}>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">{activeSection.shortTitle}</h2>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Question {Math.min(currentQuestionIndex + 1, Math.max(questionCount, 1))} of {Math.max(questionCount, 1)} in this section.
                  </p>
                </div>

                <div className="space-y-8">
                  {currentStep === 0 ? (
                    <>
                      <FieldShell
                        ai={getQuestionAiProps(
                          "phase1Scope.selectedFeatures",
                          "What exact features must exist on Day 1 for operations to function?",
                          values.phase1Scope.selectedFeatures
                        )}
                        label="What features are absolutely needed on day one?"
                        explanation="Select only the capabilities that must be live on launch day. Each selected feature requires a detailed Day 1 behavior statement."
                        example="Day 1 must include inspections, work items, cases, and dashboards so supervisors can run shift checks, managers can assign corrective actions, and leaders can view location health before close of business."
                        error={getErrorMessage(form.formState.errors, "phase1Scope.selectedFeatures")}
                      >
                        <div className="grid gap-3 md:grid-cols-2">
                          {phase1FeatureOptions.map((option) => (
                            <ChoiceCard
                              checked={values.phase1Scope.selectedFeatures.includes(option.value)}
                              key={option.value}
                              label={option.label}
                              onClick={() => toggleArrayValue("phase1Scope.selectedFeatures", values.phase1Scope.selectedFeatures, option.value)}
                            />
                          ))}
                        </div>
                        {values.phase1Scope.selectedFeatures.length > 0 ? (
                          <div className="space-y-4 pt-2">
                            {values.phase1Scope.selectedFeatures.map((feature) => (
                              <div className="space-y-2" key={`inline-feature-detail-${feature}`}>
                                <label className="block text-sm font-medium text-[var(--foreground)]">
                                  Day 1 detail: {phase1FeatureOptions.find((option) => option.value === feature)?.label ?? feature}
                                </label>
                                <Textarea
                                  {...form.register(`phase1Scope.featureDetails.${feature}`)}
                                  placeholder="Describe concrete user actions, required evidence, and expected outcome at launch."
                                />
                                {getErrorMessage(form.formState.errors, `phase1Scope.featureDetails.${feature}`) ? (
                                  <p className="text-sm text-[var(--danger)]">
                                    {getErrorMessage(form.formState.errors, `phase1Scope.featureDetails.${feature}`)}
                                  </p>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : null}
                        <ChoiceContextNote
                          value={getQuestionNote("phase1Scope.selectedFeatures")}
                          onChange={(nextValue) => setQuestionNote("phase1Scope.selectedFeatures", nextValue)}
                        />
                      </FieldShell>

                      {values.phase1Scope.selectedFeatures.includes("other") ? (
                        <FieldShell
                          ai={getQuestionAiProps(
                            "phase1Scope.otherFeature",
                            "Describe the additional Day 1 capability",
                            values.phase1Scope.otherFeature,
                            (draft) => form.setValue("phase1Scope.otherFeature", draft, { shouldDirty: true, shouldValidate: true })
                          )}
                          label="Describe the other day-one feature"
                          explanation="Explain what the custom Day 1 feature is. Avoid category words alone."
                          example="Permit approval workflow where site leads submit permit requests, regional safety managers approve or reject with comments, and approved permits notify the assigned field team within 15 minutes."
                          error={getErrorMessage(form.formState.errors, "phase1Scope.otherFeature")}
                        >
                          <Input {...form.register("phase1Scope.otherFeature")} placeholder="Example: Permit approvals with escalation routing" />
                        </FieldShell>
                      ) : null}

                      <FieldShell
                        ai={getQuestionAiProps(
                          "phase1Scope.inspectionScoringMethod",
                          "How should inspection scoring work at launch?",
                          values.phase1Scope.inspectionScoringMethod
                        )}
                        label="How should inspection scoring work at launch?"
                        explanation="Choose whether room scores are manager-entered, auto-calculated, or hybrid."
                        example="Hybrid. The system calculates suggested score ranges from pass/fail evidence, and supervisors can override with rubric justification when customer nuance requires it."
                        error={getErrorMessage(form.formState.errors, "phase1Scope.inspectionScoringMethod")}
                      >
                        <RadioStack
                          name="phase1Scope.inspectionScoringMethod"
                          onSelect={(value) =>
                            form.setValue("phase1Scope.inspectionScoringMethod", value as "manual" | "hybrid" | "auto", {
                              shouldDirty: true,
                              shouldValidate: true
                            })
                          }
                          options={inspectionScoringMethodOptions}
                          selected={values.phase1Scope.inspectionScoringMethod}
                        />
                        <ChoiceContextNote
                          value={getQuestionNote("phase1Scope.inspectionScoringMethod")}
                          onChange={(nextValue) => setQuestionNote("phase1Scope.inspectionScoringMethod", nextValue)}
                        />
                      </FieldShell>

                      <FieldShell
                        ai={getQuestionAiProps(
                          "phase1Scope.failEvidenceStandard",
                          "What evidence is mandatory for failed inspection points?",
                          values.phase1Scope.failEvidenceStandard,
                          (draft) => form.setValue("phase1Scope.failEvidenceStandard", draft, { shouldDirty: true, shouldValidate: true })
                        )}
                        label="What proof is required when an inspection fails?"
                        explanation="Define whether photos, comments, and reason codes are required before scoring and submission."
                        example="Each failed point requires at least one photo, a written comment, and a standardized reason code before the room can be submitted or routed for corrective work."
                        error={getErrorMessage(form.formState.errors, "phase1Scope.failEvidenceStandard")}
                      >
                        <Textarea {...form.register("phase1Scope.failEvidenceStandard")} />
                      </FieldShell>

                      <FieldShell
                        ai={getQuestionAiProps(
                          "phase1Scope.jointInspectionExpectation",
                          "What joint inspection expectation exists by account?",
                          values.phase1Scope.jointInspectionExpectation,
                          (draft) => form.setValue("phase1Scope.jointInspectionExpectation", draft, { shouldDirty: true, shouldValidate: true })
                        )}
                        label="How often should joint inspections happen with each customer account?"
                        explanation="State expected cadence, who attends, and what happens when cadence is missed."
                        example="Joint inspections are required monthly per site with customer POC attendance; any missed month creates a manager follow-up case and appears in dashboard exceptions."
                        error={getErrorMessage(form.formState.errors, "phase1Scope.jointInspectionExpectation")}
                      >
                        <Textarea {...form.register("phase1Scope.jointInspectionExpectation")} />
                      </FieldShell>
                    </>
                  ) : null}

                  {currentStep === 1 ? (
                    <StringListField
                      ai={getQuestionAiProps(
                        "criticality.consequences",
                        "If the system is down for 24 hours, what breaks?",
                        values.criticality.consequences,
                        (draft) =>
                          form.setValue(
                            "criticality.consequences",
                            draft
                              .split(/\n+/)
                              .map((item) => item.replace(/^(?:[-*]|\d+[.)])\s*/, "").trim())
                              .filter(Boolean),
                            { shouldDirty: true, shouldValidate: true }
                          )
                      )}
                      label="If the system is down for 24 hours, what stops working?"
                      explanation="List specific workflows, who is affected, and what cannot be done. At least three consequences are required."
                      example="Supervisors cannot launch inspections by building and floor, field teams cannot submit failed room photos or reason codes, and regional leaders lose same-day visibility into high-risk sites and overdue corrective actions."
                      minItems={3}
                      onChange={(nextValues) => form.setValue("criticality.consequences", nextValues, { shouldDirty: true, shouldValidate: true })}
                      values={values.criticality.consequences}
                      error={getErrorMessage(form.formState.errors, "criticality.consequences")}
                    />
                  ) : null}

                  {currentStep === 2 ? (
                    <>
                      <StringListField
                        ai={getQuestionAiProps(
                          "currentBaseline.systemsToday",
                          "What system(s) are you using today?",
                          values.currentBaseline.systemsToday,
                          (draft) =>
                            form.setValue(
                              "currentBaseline.systemsToday",
                              draft
                                .split(/\n+/)
                                .map((item) => item.replace(/^(?:[-*]|\d+[.)])\s*/, "").trim())
                                .filter(Boolean),
                              { shouldDirty: true, shouldValidate: true }
                            )
                        )}
                        label="What systems do you use today?"
                        explanation="List named systems, spreadsheets, portals, or manual processes currently used."
                        example="Supervisors use ADP for team roster and site assignment data, managers track inspections in SharePoint lists, and regional reporting is compiled weekly in Power BI plus exported Excel files."
                        minItems={1}
                        onChange={(nextValues) => form.setValue("currentBaseline.systemsToday", nextValues, { shouldDirty: true, shouldValidate: true })}
                        values={values.currentBaseline.systemsToday}
                        error={getErrorMessage(form.formState.errors, "currentBaseline.systemsToday")}
                      />
                      <StringListField
                        ai={getQuestionAiProps(
                          "currentBaseline.mustReplace",
                          "What exactly must be replaced?",
                          values.currentBaseline.mustReplace,
                          (draft) =>
                            form.setValue(
                              "currentBaseline.mustReplace",
                              draft
                                .split(/\n+/)
                                .map((item) => item.replace(/^(?:[-*]|\d+[.)])\s*/, "").trim())
                                .filter(Boolean),
                              { shouldDirty: true, shouldValidate: true }
                            )
                        )}
                        label="What must be replaced right away?"
                        explanation="List specific workflows, modules, or data processes that cannot remain in the legacy environment."
                        example="Replace paper inspection checklists with room-level mobile scoring, replace email-based issue assignment with tracked work items, and replace manual complaint logs with case lifecycle tracking."
                        minItems={2}
                        onChange={(nextValues) => form.setValue("currentBaseline.mustReplace", nextValues, { shouldDirty: true, shouldValidate: true })}
                        values={values.currentBaseline.mustReplace}
                        error={getErrorMessage(form.formState.errors, "currentBaseline.mustReplace")}
                      />
                      <StringListField
                        ai={getQuestionAiProps(
                          "currentBaseline.canDefer",
                          "What can be deferred?",
                          values.currentBaseline.canDefer,
                          (draft) =>
                            form.setValue(
                              "currentBaseline.canDefer",
                              draft
                                .split(/\n+/)
                                .map((item) => item.replace(/^(?:[-*]|\d+[.)])\s*/, "").trim())
                                .filter(Boolean),
                              { shouldDirty: true, shouldValidate: true }
                            )
                        )}
                        label="What can wait until later?"
                        explanation="List items that are useful but not required for Phase 1 operations."
                        example="Historical migration older than 12 months, advanced executive benchmarking packs, and non-critical custom report exports can be deferred to Phase 2 without impacting launch operations."
                        minItems={1}
                        onChange={(nextValues) => form.setValue("currentBaseline.canDefer", nextValues, { shouldDirty: true, shouldValidate: true })}
                        values={values.currentBaseline.canDefer}
                        error={getErrorMessage(form.formState.errors, "currentBaseline.canDefer")}
                      />
                      <FieldShell
                        ai={getQuestionAiProps(
                          "currentBaseline.mirrorApproach",
                          "Current app strategy",
                          values.currentBaseline.mirrorApproach
                        )}
                        label="How should we handle the current app?"
                        explanation="Choose whether Phase 1 should mirror the current app or intentionally diverge."
                        example="Modernize: keep the same frontline inspection flow and score logic for adoption, but redesign manager dashboards and case routing so accountability is clearer and faster."
                        error={getErrorMessage(form.formState.errors, "currentBaseline.mirrorApproach")}
                      >
                        <RadioStack
                          name="currentBaseline.mirrorApproach"
                          onSelect={(value) =>
                            form.setValue("currentBaseline.mirrorApproach", value as "mirror" | "modernize" | "redesign", {
                              shouldDirty: true,
                              shouldValidate: true
                            })
                          }
                          options={mirrorApproachOptions}
                          selected={values.currentBaseline.mirrorApproach}
                        />
                        <ChoiceContextNote
                          value={getQuestionNote("currentBaseline.mirrorApproach")}
                          onChange={(nextValue) => setQuestionNote("currentBaseline.mirrorApproach", nextValue)}
                        />
                      </FieldShell>

                      <FieldShell
                        ai={getQuestionAiProps(
                          "currentBaseline.hierarchyRequirement",
                          "Is the Org -> Region -> Site -> Building -> Floor -> Space hierarchy mandatory at launch?",
                          values.currentBaseline.hierarchyRequirement
                        )}
                        label="Do you need the full location hierarchy at launch (org, region, site, building, floor, space)?"
                        explanation="Choose whether this hierarchy must be fully enforced in Phase 1."
                        example="Required at launch because inspections, work items, and dashboard rollups all depend on accurate site-to-space context."
                        error={getErrorMessage(form.formState.errors, "currentBaseline.hierarchyRequirement")}
                      >
                        <RadioStack
                          name="currentBaseline.hierarchyRequirement"
                          onSelect={(value) =>
                            form.setValue("currentBaseline.hierarchyRequirement", value as "required" | "flexible", {
                              shouldDirty: true,
                              shouldValidate: true
                            })
                          }
                          options={hierarchyRequirementOptions}
                          selected={values.currentBaseline.hierarchyRequirement}
                        />
                        <ChoiceContextNote
                          value={getQuestionNote("currentBaseline.hierarchyRequirement")}
                          onChange={(nextValue) => setQuestionNote("currentBaseline.hierarchyRequirement", nextValue)}
                        />
                      </FieldShell>

                      <FieldShell
                        ai={getQuestionAiProps(
                          "currentBaseline.spaceTypeGovernance",
                          "How should space types and inspection points be governed?",
                          values.currentBaseline.spaceTypeGovernance
                        )}
                        label="Who should control space types and inspection points?"
                        explanation="Select whether definitions are global, site-managed, or a hybrid with controlled overrides."
                        example="Hybrid governance with global standards for core space types and site-level overrides for customer-specific rooms like labs, courts, or clinical spaces."
                        error={getErrorMessage(form.formState.errors, "currentBaseline.spaceTypeGovernance")}
                      >
                        <RadioStack
                          name="currentBaseline.spaceTypeGovernance"
                          onSelect={(value) =>
                            form.setValue("currentBaseline.spaceTypeGovernance", value as "global" | "hybrid" | "site", {
                              shouldDirty: true,
                              shouldValidate: true
                            })
                          }
                          options={spaceTypeGovernanceOptions}
                          selected={values.currentBaseline.spaceTypeGovernance}
                        />
                        <ChoiceContextNote
                          value={getQuestionNote("currentBaseline.spaceTypeGovernance")}
                          onChange={(nextValue) => setQuestionNote("currentBaseline.spaceTypeGovernance", nextValue)}
                        />
                      </FieldShell>
                    </>
                  ) : null}

                  {currentStep === 3 ? (
                    <>
                      <FieldShell
                        ai={getQuestionAiProps(
                          "mobileRequirements.selectedReasons",
                          "Why do you believe native mobile apps are required?",
                          values.mobileRequirements.selectedReasons
                        )}
                        label="Why do you need mobile apps instead of only a web app?"
                        explanation="Select the operational reasons that justify native app complexity."
                        example="Inspectors work in low-connectivity mechanical rooms, must capture photos and scores quickly with minimal typing, and need near-instant task switching between inspections and corrective work items during active shifts."
                        error={getErrorMessage(form.formState.errors, "mobileRequirements.selectedReasons")}
                      >
                        <div className="grid gap-3 md:grid-cols-2">
                          {mobileReasonOptions.map((option) => (
                            <ChoiceCard
                              checked={values.mobileRequirements.selectedReasons.includes(option.value)}
                              key={option.value}
                              label={option.label}
                              onClick={() =>
                                toggleArrayValue("mobileRequirements.selectedReasons", values.mobileRequirements.selectedReasons, option.value)
                              }
                            />
                          ))}
                        </div>
                        <ChoiceContextNote
                          value={getQuestionNote("mobileRequirements.selectedReasons")}
                          onChange={(nextValue) => setQuestionNote("mobileRequirements.selectedReasons", nextValue)}
                        />
                      </FieldShell>

                      {values.mobileRequirements.selectedReasons.includes("other") ? (
                        <FieldShell
                          ai={getQuestionAiProps(
                            "mobileRequirements.otherExplanation",
                            "Explain the other native mobile reason",
                            values.mobileRequirements.otherExplanation,
                            (draft) => form.setValue("mobileRequirements.otherExplanation", draft, { shouldDirty: true, shouldValidate: true })
                          )}
                          label="Explain the other mobile app reason"
                          explanation="State the operating constraint that makes a web experience insufficient."
                          example="Devices are managed under strict MDM kiosk mode, so the team needs controlled camera access, background upload retries, and push alert handling that browser tabs cannot reliably provide."
                          error={getErrorMessage(form.formState.errors, "mobileRequirements.otherExplanation")}
                        >
                          <Textarea {...form.register("mobileRequirements.otherExplanation")} />
                        </FieldShell>
                      ) : null}

                      {values.mobileRequirements.selectedReasons.includes("offline") ? (
                        <FieldShell
                          ai={getQuestionAiProps(
                            "mobileRequirements.offlineDetail",
                            "Describe exact offline requirements",
                            values.mobileRequirements.offlineDetail,
                            (draft) => form.setValue("mobileRequirements.offlineDetail", draft, { shouldDirty: true, shouldValidate: true })
                          )}
                          label="Describe your offline needs"
                          explanation="Must state what actions happen offline and how long users are expected to remain offline."
                          example="Inspectors must create and complete inspections offline, record fail reasons, capture photos, and close urgent work items for up to 8 hours offline before queued sync runs when they reconnect."
                          error={getErrorMessage(form.formState.errors, "mobileRequirements.offlineDetail")}
                        >
                          <Textarea {...form.register("mobileRequirements.offlineDetail")} />
                        </FieldShell>
                      ) : null}

                      {values.mobileRequirements.selectedReasons.includes("appStore") ? (
                        <FieldShell
                          ai={getQuestionAiProps(
                            "mobileRequirements.appStoreInternalDistributionOk",
                            "Is TestFlight or internal distribution acceptable?",
                            values.mobileRequirements.appStoreInternalDistributionOk
                          )}
                          label="Is internal app distribution acceptable (like TestFlight)?"
                          explanation="Choose yes only if App Store review is not a hard requirement."
                          example="No. Public App Store distribution is required because customer-side stakeholders download the app directly and cannot use internal enterprise distribution channels."
                          error={getErrorMessage(form.formState.errors, "mobileRequirements.appStoreInternalDistributionOk")}
                        >
                          <RadioStack
                            name="mobileRequirements.appStoreInternalDistributionOk"
                            onSelect={(value) =>
                              form.setValue("mobileRequirements.appStoreInternalDistributionOk", value as "yes" | "no", {
                                shouldDirty: true,
                                shouldValidate: true
                              })
                            }
                            options={[
                              { value: "yes", label: "Yes, internal distribution is acceptable" },
                              { value: "no", label: "No, public App Store distribution is required" }
                            ]}
                            selected={values.mobileRequirements.appStoreInternalDistributionOk}
                          />
                          <ChoiceContextNote
                            value={getQuestionNote("mobileRequirements.appStoreInternalDistributionOk")}
                            onChange={(nextValue) => setQuestionNote("mobileRequirements.appStoreInternalDistributionOk", nextValue)}
                          />
                        </FieldShell>
                      ) : null}

                      {values.mobileRequirements.selectedReasons.includes("performance") ? (
                        <FieldShell
                          ai={getQuestionAiProps(
                            "mobileRequirements.performanceDetail",
                            "Describe specific performance issues expected",
                            values.mobileRequirements.performanceDetail,
                            (draft) => form.setValue("mobileRequirements.performanceDetail", draft, { shouldDirty: true, shouldValidate: true })
                          )}
                          label="Describe any performance issues you expect"
                          explanation="Name the slow workflows or device demands expected from the product."
                          example="The app must load 200-checkpoint inspection templates in under 2 seconds, open camera capture in under 1 second, and save findings without UI lag on managed Android and iOS devices."
                          error={getErrorMessage(form.formState.errors, "mobileRequirements.performanceDetail")}
                        >
                          <Textarea {...form.register("mobileRequirements.performanceDetail")} />
                        </FieldShell>
                      ) : null}
                    </>
                  ) : null}

                  {currentStep === 4 ? (
                    <>
                      <FieldShell
                        ai={getQuestionAiProps(
                          "offlineRequirements.supportLevel",
                          "Does the platform need to function without internet?",
                          values.offlineRequirements.supportLevel
                        )}
                        label="Does the platform need to work without internet?"
                        explanation="Choose the minimum level of offline support required for operations."
                        example="Limited functionality: field teams must continue inspections and photo capture during short outages, then sync queued updates when connectivity is restored at the site."
                        error={getErrorMessage(form.formState.errors, "offlineRequirements.supportLevel")}
                      >
                        <RadioStack
                          name="offlineRequirements.supportLevel"
                          onSelect={(value) =>
                            form.setValue("offlineRequirements.supportLevel", value as "none" | "limited" | "full", {
                              shouldDirty: true,
                              shouldValidate: true
                            })
                          }
                          options={offlineSupportOptions}
                          selected={values.offlineRequirements.supportLevel}
                        />
                        <ChoiceContextNote
                          value={getQuestionNote("offlineRequirements.supportLevel")}
                          onChange={(nextValue) => setQuestionNote("offlineRequirements.supportLevel", nextValue)}
                        />
                      </FieldShell>
                      {values.offlineRequirements.supportLevel !== "none" ? (
                        <FieldShell
                          ai={getQuestionAiProps(
                            "offlineRequirements.detail",
                            "Describe the offline workflows, sync behavior, and expected frequency",
                            values.offlineRequirements.detail,
                            (draft) => form.setValue("offlineRequirements.detail", draft, { shouldDirty: true, shouldValidate: true })
                          )}
                          label="Describe offline work, when data syncs, and how often"
                          explanation="State what users do offline, how sync occurs, and how often the app must reconcile data."
                          example="Supervisors and inspectors complete inspections and work items for up to 4 hours offline, then sync every 15 minutes when online, with conflict review routed to managers before final status updates publish."
                          error={getErrorMessage(form.formState.errors, "offlineRequirements.detail")}
                        >
                          <Textarea {...form.register("offlineRequirements.detail")} />
                        </FieldShell>
                      ) : null}
                    </>
                  ) : null}

                  {currentStep === 5 ? (
                    <>
                      <FieldShell
                        ai={getQuestionAiProps(
                          "integrations.selectedSystems",
                          "What systems must integrate at launch?",
                          values.integrations.selectedSystems
                        )}
                        label="Which systems must connect at launch?"
                        explanation="Select only the integrations required for launch."
                        example="ADP for employee and role sync is required at launch, and internal location master data is required so every inspection maps correctly to site, building, floor, and space."
                        error={getErrorMessage(form.formState.errors, "integrations.selectedSystems")}
                      >
                        <div className="grid gap-3 md:grid-cols-2">
                          {integrationSystemOptions.map((option) => (
                            <ChoiceCard
                              checked={values.integrations.selectedSystems.includes(option.value)}
                              key={option.value}
                              label={option.label}
                              onClick={() => toggleArrayValue("integrations.selectedSystems", values.integrations.selectedSystems, option.value)}
                            />
                          ))}
                        </div>
                        <ChoiceContextNote
                          value={getQuestionNote("integrations.selectedSystems")}
                          onChange={(nextValue) => setQuestionNote("integrations.selectedSystems", nextValue)}
                        />
                      </FieldShell>

                      {values.integrations.selectedSystems.includes("other") ? (
                        <FieldShell
                          ai={getQuestionAiProps(
                            "integrations.otherSystem",
                            "Name the other launch integration",
                            values.integrations.otherSystem,
                            (draft) => form.setValue("integrations.otherSystem", draft, { shouldDirty: true, shouldValidate: true })
                          )}
                          label="Name the other system to connect at launch"
                          explanation="Use the system name, not a generic category."
                          example="Salesforce Service Cloud case feed"
                          error={getErrorMessage(form.formState.errors, "integrations.otherSystem")}
                        >
                          <Input {...form.register("integrations.otherSystem")} />
                        </FieldShell>
                      ) : null}

                      {values.integrations.selectedSystems.map((system) => (
                        <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--muted)] p-5" key={system}>
                          <div>
                            <h3 className="font-semibold text-[var(--foreground)]">
                              Describe the integration depth for{" "}
                              {system === "other"
                                ? values.integrations.otherSystem || "Other"
                                : integrationSystemOptions.find((option) => option.value === system)?.label}
                            </h3>
                            <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
                              Pick the required depth and explain what data moves, in which direction, and on what cadence.
                            </p>
                          </div>

                          <RadioStack
                            name={`integrations.details.${system}.depth`}
                            onSelect={(value) =>
                              form.setValue(`integrations.details.${system}.depth`, value as never, {
                                shouldDirty: true,
                                shouldValidate: true
                              })
                            }
                            options={integrationDepthOptions}
                            selected={values.integrations.details[system].depth}
                          />
                          <Textarea {...form.register(`integrations.details.${system}.detail`)} />
                          <div className="space-y-1">
                            {(["depth", "detail"] as const).map((field) => {
                              const message = getErrorMessage(form.formState.errors, `integrations.details.${system}.${field}`);
                              return message ? (
                                <p className="text-sm text-[var(--danger)]" key={field}>
                                  {message}
                                </p>
                              ) : null;
                            })}
                          </div>
                        </div>
                      ))}

                      <FieldShell
                        ai={getQuestionAiProps(
                          "integrations.adpSyncMode",
                          "How should ADP employee data sync into this platform?",
                          values.integrations.adpSyncMode
                        )}
                        label="How should ADP employee data sync with this platform?"
                        explanation="Select sync mode and then define acceptable latency for role/site updates."
                        example="Nightly batch sync is acceptable for roster updates, but role changes must be corrected within two hours for shift assignment accuracy."
                        error={getErrorMessage(form.formState.errors, "integrations.adpSyncMode")}
                      >
                        <RadioStack
                          name="integrations.adpSyncMode"
                          onSelect={(value) =>
                            form.setValue("integrations.adpSyncMode", value as "nightly_batch" | "near_real_time" | "manual_upload", {
                              shouldDirty: true,
                              shouldValidate: true
                            })
                          }
                          options={adpSyncModeOptions}
                          selected={values.integrations.adpSyncMode}
                        />
                        <ChoiceContextNote
                          value={getQuestionNote("integrations.adpSyncMode")}
                          onChange={(nextValue) => setQuestionNote("integrations.adpSyncMode", nextValue)}
                        />
                      </FieldShell>

                      <FieldShell
                        ai={getQuestionAiProps(
                          "integrations.adpLatencyTolerance",
                          "What ADP sync latency is acceptable operationally?",
                          values.integrations.adpLatencyTolerance,
                          (draft) => form.setValue("integrations.adpLatencyTolerance", draft, { shouldDirty: true, shouldValidate: true })
                        )}
                        label="How quickly does ADP data need to appear in this system?"
                        explanation="Describe tolerance for stale employee data and when manual correction is required."
                        example="Roster data can lag up to 24 hours, but site transfers and terminations must be reflected the same day to prevent assignment and access errors."
                        error={getErrorMessage(form.formState.errors, "integrations.adpLatencyTolerance")}
                      >
                        <Textarea {...form.register("integrations.adpLatencyTolerance")} />
                      </FieldShell>

                      <FieldShell
                        ai={getQuestionAiProps(
                          "integrations.powerBiMode",
                          "How will Power BI be used in Phase 1?",
                          values.integrations.powerBiMode
                        )}
                        label="How will Power BI be used in phase 1?"
                        explanation="Choose whether Power BI is view-only, data-sync integrated, or both."
                        example="Both: leadership uses read-only Power BI dashboards while a governed data sync publishes curated inspection and work-item metrics nightly."
                        error={getErrorMessage(form.formState.errors, "integrations.powerBiMode")}
                      >
                        <RadioStack
                          name="integrations.powerBiMode"
                          onSelect={(value) =>
                            form.setValue("integrations.powerBiMode", value as "read_only" | "data_sync" | "both", {
                              shouldDirty: true,
                              shouldValidate: true
                            })
                          }
                          options={powerBiModeOptions}
                          selected={values.integrations.powerBiMode}
                        />
                        <ChoiceContextNote
                          value={getQuestionNote("integrations.powerBiMode")}
                          onChange={(nextValue) => setQuestionNote("integrations.powerBiMode", nextValue)}
                        />
                      </FieldShell>
                    </>
                  ) : null}

                  {currentStep === 6 ? (
                    <>
                      <StringListField
                        ai={getQuestionAiProps(
                          "analyticsAi.analyticsPhase1",
                          "What analytics must exist at launch?",
                          values.analyticsAi.analyticsPhase1,
                          (draft) =>
                            form.setValue(
                              "analyticsAi.analyticsPhase1",
                              draft.split(/\n+/).map((item) => item.replace(/^(?:[-*]|\d+[.)])\s*/, "").trim()).filter(Boolean),
                              { shouldDirty: true, shouldValidate: true }
                            )
                        )}
                        label="What reporting must be available at launch?"
                        explanation="List concrete dashboards, metrics, or exports needed in Phase 1."
                        example="Managers need a daily dashboard showing inspection score by site, unresolved work item aging over 48 hours, case volume by type, and coverage rate by shift."
                        minItems={1}
                        onChange={(nextValues) => form.setValue("analyticsAi.analyticsPhase1", nextValues, { shouldDirty: true, shouldValidate: true })}
                        values={values.analyticsAi.analyticsPhase1}
                        error={getErrorMessage(form.formState.errors, "analyticsAi.analyticsPhase1")}
                      />
                      <StringListField
                        ai={getQuestionAiProps(
                          "analyticsAi.analyticsPhase2",
                          "What analytics can wait until Phase 2+?",
                          values.analyticsAi.analyticsPhase2,
                          (draft) =>
                            form.setValue(
                              "analyticsAi.analyticsPhase2",
                              draft.split(/\n+/).map((item) => item.replace(/^(?:[-*]|\d+[.)])\s*/, "").trim()).filter(Boolean),
                              { shouldDirty: true, shouldValidate: true }
                            )
                        )}
                        label="What reporting can wait until later phases?"
                        explanation="Separate later-stage reporting from launch necessities."
                        example="Executive trend forecasting, manager scorecards across regions, and quarter-over-quarter benchmarking by customer segment can wait until Phase 2."
                        minItems={1}
                        onChange={(nextValues) => form.setValue("analyticsAi.analyticsPhase2", nextValues, { shouldDirty: true, shouldValidate: true })}
                        values={values.analyticsAi.analyticsPhase2}
                        error={getErrorMessage(form.formState.errors, "analyticsAi.analyticsPhase2")}
                      />
                      <StringListField
                        ai={getQuestionAiProps(
                          "analyticsAi.aiPhase1",
                          "What AI capabilities are expected in Phase 1?",
                          values.analyticsAi.aiPhase1,
                          (draft) =>
                            form.setValue(
                              "analyticsAi.aiPhase1",
                              draft.split(/\n+/).map((item) => item.replace(/^(?:[-*]|\d+[.)])\s*/, "").trim()).filter(Boolean),
                              { shouldDirty: true, shouldValidate: true }
                            )
                        )}
                        label="What AI features are expected in phase 1?"
                        explanation="Describe concrete outputs only. If none are required in Phase 1, say so explicitly with a scoped reason."
                        example="Phase 1 includes no predictive AI; only optional draft summarization of long incident comments is allowed to reduce typing while approval remains fully human."
                        minItems={1}
                        onChange={(nextValues) => form.setValue("analyticsAi.aiPhase1", nextValues, { shouldDirty: true, shouldValidate: true })}
                        values={values.analyticsAi.aiPhase1}
                        error={getErrorMessage(form.formState.errors, "analyticsAi.aiPhase1")}
                      />
                      <StringListField
                        ai={getQuestionAiProps(
                          "analyticsAi.aiPhase2",
                          "What AI capabilities belong in Phase 2+?",
                          values.analyticsAi.aiPhase2,
                          (draft) =>
                            form.setValue(
                              "analyticsAi.aiPhase2",
                              draft.split(/\n+/).map((item) => item.replace(/^(?:[-*]|\d+[.)])\s*/, "").trim()).filter(Boolean),
                              { shouldDirty: true, shouldValidate: true }
                            )
                        )}
                        label="What AI features belong in later phases?"
                        explanation="List the specific decision support or automation outcomes expected later."
                        example="Phase 2+ should suggest likely root cause categories, recommend next-best actions from historical outcomes, and flag locations likely to miss inspection quality thresholds."
                        minItems={1}
                        onChange={(nextValues) => form.setValue("analyticsAi.aiPhase2", nextValues, { shouldDirty: true, shouldValidate: true })}
                        values={values.analyticsAi.aiPhase2}
                        error={getErrorMessage(form.formState.errors, "analyticsAi.aiPhase2")}
                      />

                      <FieldShell
                        ai={getQuestionAiProps(
                          "analyticsAi.locationHealthScoringModel",
                          "How is location health score calculated?",
                          values.analyticsAi.locationHealthScoringModel,
                          (draft) => form.setValue("analyticsAi.locationHealthScoringModel", draft, { shouldDirty: true, shouldValidate: true })
                        )}
                        label="How should location health be scored?"
                        explanation="Define score components, weighting logic, and what conditions reduce the score."
                        example="Location health starts at 100 and subtracts weighted penalties for overdue work items, missed joint inspections, and unresolved incidents; score changes are published daily with reason tags."
                        error={getErrorMessage(form.formState.errors, "analyticsAi.locationHealthScoringModel")}
                      >
                        <Textarea {...form.register("analyticsAi.locationHealthScoringModel")} />
                      </FieldShell>

                      <FieldShell
                        ai={getQuestionAiProps(
                          "analyticsAi.managementRollupExpectations",
                          "What rollups do managers, regional leaders, and executives need?",
                          values.analyticsAi.managementRollupExpectations,
                          (draft) => form.setValue("analyticsAi.managementRollupExpectations", draft, { shouldDirty: true, shouldValidate: true })
                        )}
                        label="What summary views do managers and leaders need?"
                        explanation="Describe who sees which KPI rollups and how often they act on them."
                        example="Site managers need daily exception views, regional leaders need weekly trend rollups by portfolio, and executives need monthly enterprise comparisons with top risk sites highlighted."
                        error={getErrorMessage(form.formState.errors, "analyticsAi.managementRollupExpectations")}
                      >
                        <Textarea {...form.register("analyticsAi.managementRollupExpectations")} />
                      </FieldShell>
                    </>
                  ) : null}

                  {currentStep === 7 ? (
                    <>
                      <WorkflowEditor
                        ai={getQuestionAiProps("workflows.topDailyWorkflows", "Top 3 workflows used daily", values.workflows.topDailyWorkflows)}
                        control={form.control}
                        errors={form.formState.errors}
                        register={form.register}
                        setValue={form.setValue}
                      />
                      <FieldShell
                        ai={getQuestionAiProps(
                          "workflows.workItemUrgencyRules",
                          "What work item urgency and aging rules apply at launch?",
                          values.workflows.workItemUrgencyRules,
                          (draft) => form.setValue("workflows.workItemUrgencyRules", draft, { shouldDirty: true, shouldValidate: true })
                        )}
                        label="What urgency and aging rules should work items follow at launch?"
                        explanation="Define when work items are required, urgency levels, and overdue thresholds."
                        example="Any room score below 3.0 requires a work item, critical issues are due same day, and items older than 24 hours overdue trigger daily manager escalation."
                        error={getErrorMessage(form.formState.errors, "workflows.workItemUrgencyRules")}
                      >
                        <Textarea {...form.register("workflows.workItemUrgencyRules")} />
                      </FieldShell>
                      <FieldShell
                        ai={getQuestionAiProps(
                          "workflows.assigneeNotificationEscalation",
                          "How should assignee notifications and overdue escalation behave?",
                          values.workflows.assigneeNotificationEscalation,
                          (draft) => form.setValue("workflows.assigneeNotificationEscalation", draft, { shouldDirty: true, shouldValidate: true })
                        )}
                        label="How should reminders and overdue escalations work?"
                        explanation="Describe who gets notified and when escalation expands beyond the assignee."
                        example="Assignees receive immediate mobile alerts, supervisors get reminders before due time, and unresolved overdue items escalate to regional leaders after 24 hours."
                        error={getErrorMessage(form.formState.errors, "workflows.assigneeNotificationEscalation")}
                      >
                        <Textarea {...form.register("workflows.assigneeNotificationEscalation")} />
                      </FieldShell>
                      <StringListField
                        ai={getQuestionAiProps(
                          "workflows.caseTypesInScope",
                          "Which case types must exist at launch?",
                          values.workflows.caseTypesInScope,
                          (draft) =>
                            form.setValue(
                              "workflows.caseTypesInScope",
                              draft.split(/\n+/).map((item) => item.replace(/^(?:[-*]|\d+[.)])\s*/, "").trim()).filter(Boolean),
                              { shouldDirty: true, shouldValidate: true }
                            )
                        )}
                        label="Which case types must exist at launch?"
                        explanation="List all mandatory case categories for operations and departments."
                        example="Incident, near miss, property damage, complaint, compliment, service request, resignation, and help desk."
                        minItems={3}
                        onChange={(nextValues) => form.setValue("workflows.caseTypesInScope", nextValues, { shouldDirty: true, shouldValidate: true })}
                        values={values.workflows.caseTypesInScope}
                        error={getErrorMessage(form.formState.errors, "workflows.caseTypesInScope")}
                      />
                      <FieldShell
                        ai={getQuestionAiProps(
                          "workflows.caseRoutingModel",
                          "How should cases route between location and department ownership?",
                          values.workflows.caseRoutingModel,
                          (draft) => form.setValue("workflows.caseRoutingModel", draft, { shouldDirty: true, shouldValidate: true })
                        )}
                        label="How should cases move between location and department owners?"
                        explanation="Define routing rules for location-owned cases versus centralized department cases."
                        example="Customer-facing complaints route to location owners, while safety and HR cases route to departments with centralized closeout controls and audit trail visibility."
                        error={getErrorMessage(form.formState.errors, "workflows.caseRoutingModel")}
                      >
                        <Textarea {...form.register("workflows.caseRoutingModel")} />
                      </FieldShell>
                      <FieldShell
                        ai={getQuestionAiProps(
                          "workflows.publicSafetyPortalScope",
                          "What must the no-login public safety portal include?",
                          values.workflows.publicSafetyPortalScope,
                          (draft) => form.setValue("workflows.publicSafetyPortalScope", draft, { shouldDirty: true, shouldValidate: true })
                        )}
                        label="What should the public safety portal include (no login)?"
                        explanation="Specify required resources and forms available without authentication."
                        example="No-login portal includes SDS sheets in multiple languages, insurance resources, incident response guidance, and QR-driven incident intake submission."
                        error={getErrorMessage(form.formState.errors, "workflows.publicSafetyPortalScope")}
                      >
                        <Textarea {...form.register("workflows.publicSafetyPortalScope")} />
                      </FieldShell>
                      <FieldShell
                        ai={getQuestionAiProps(
                          "workflows.incidentComplianceFlow",
                          "What incident compliance flow is required?",
                          values.workflows.incidentComplianceFlow,
                          (draft) => form.setValue("workflows.incidentComplianceFlow", draft, { shouldDirty: true, shouldValidate: true })
                        )}
                        label="What incident and compliance flow is required?"
                        explanation="Capture required intake steps from incident report through EHS closure."
                        example="Supervisor files intake immediately, nurse line triage is documented, reportability is reviewed by EHS, and case status remains open until all follow-up actions are complete."
                        error={getErrorMessage(form.formState.errors, "workflows.incidentComplianceFlow")}
                      >
                        <Textarea {...form.register("workflows.incidentComplianceFlow")} />
                      </FieldShell>
                    </>
                  ) : null}

                  {currentStep === 8 ? (
                    <div className="grid gap-6 md:grid-cols-2">
                      <FieldShell
                        ai={getQuestionAiProps(
                          "scale.usersAtLaunch",
                          "Number of users at launch",
                          values.scale.usersAtLaunch
                        )}
                        label="Number of users at launch"
                        explanation="Use a number only."
                        example="120"
                        error={getErrorMessage(form.formState.errors, "scale.usersAtLaunch")}
                      >
                        <Input {...form.register("scale.usersAtLaunch", { valueAsNumber: true })} type="number" />
                      </FieldShell>
                      <FieldShell
                        ai={getQuestionAiProps(
                          "scale.usersIn12Months",
                          "Number of users in 12 months",
                          values.scale.usersIn12Months
                        )}
                        label="Number of users in 12 months"
                        explanation="Use a number only."
                        example="320"
                        error={getErrorMessage(form.formState.errors, "scale.usersIn12Months")}
                      >
                        <Input {...form.register("scale.usersIn12Months", { valueAsNumber: true })} type="number" />
                      </FieldShell>
                      <FieldShell
                        ai={getQuestionAiProps(
                          "scale.numberOfSites",
                          "Number of sites",
                          values.scale.numberOfSites
                        )}
                        label="Number of sites"
                        explanation="Use a number only."
                        example="42"
                        error={getErrorMessage(form.formState.errors, "scale.numberOfSites")}
                      >
                        <Input {...form.register("scale.numberOfSites", { valueAsNumber: true })} type="number" />
                      </FieldShell>
                      <FieldShell
                        ai={getQuestionAiProps(
                          "scale.inspectionsPerDay",
                          "Inspections per day",
                          values.scale.inspectionsPerDay
                        )}
                        label="Inspections per day"
                        explanation="Use a number only."
                        example="650"
                        error={getErrorMessage(form.formState.errors, "scale.inspectionsPerDay")}
                      >
                        <Input {...form.register("scale.inspectionsPerDay", { valueAsNumber: true })} type="number" />
                      </FieldShell>
                    </div>
                  ) : null}

                  {currentStep === 9 ? (
                    <>
                      <FieldShell
                        ai={getQuestionAiProps(
                          "delivery.rapidDeploymentWeeks",
                          "What does rapid deployment mean in weeks?",
                          values.delivery.rapidDeploymentWeeks
                        )}
                        label="How many weeks should phase 1 take?"
                        explanation="Translate 'rapid' into an explicit number."
                        example="12"
                        error={getErrorMessage(form.formState.errors, "delivery.rapidDeploymentWeeks")}
                      >
                        <Input {...form.register("delivery.rapidDeploymentWeeks", { valueAsNumber: true })} type="number" />
                      </FieldShell>
                      <FieldShell
                        ai={getQuestionAiProps(
                          "delivery.productionReadyDefinition",
                          "What defines production-ready?",
                          values.delivery.productionReadyDefinition,
                          (draft) => form.setValue("delivery.productionReadyDefinition", draft, { shouldDirty: true, shouldValidate: true })
                        )}
                        label="How do you define 'production-ready'?"
                        explanation="State measurable criteria such as uptime expectations, roles, auditability, training, or support coverage."
                        example="Production-ready means all launch sites have validated role access, inspection and work-item flows pass UAT, audit logs are active, core dashboards are live, and Sev-1 support coverage is staffed for go-live."
                        error={getErrorMessage(form.formState.errors, "delivery.productionReadyDefinition")}
                      >
                        <Textarea {...form.register("delivery.productionReadyDefinition")} />
                      </FieldShell>
                      <FieldShell
                        ai={getQuestionAiProps(
                          "delivery.supportLevel",
                          "What support level is expected?",
                          values.delivery.supportLevel,
                          (draft) => form.setValue("delivery.supportLevel", draft, { shouldDirty: true, shouldValidate: true })
                        )}
                        label="What support level do you expect after launch?"
                        explanation="Specify response times, support channels, and ownership model."
                        example="Field users need in-app and phone support 6am-8pm local time, Sev-1 incidents require engineering response within 30 minutes, and Sev-2 issues require resolution plans within one business day."
                        error={getErrorMessage(form.formState.errors, "delivery.supportLevel")}
                      >
                        <Textarea {...form.register("delivery.supportLevel")} />
                      </FieldShell>
                      <FieldShell
                        ai={getQuestionAiProps(
                          "delivery.priorityTradeoff",
                          "Priority tradeoff for Phase 1",
                          values.delivery.priorityTradeoff
                        )}
                        label="What is the top priority for phase 1?"
                        explanation="Choose the primary decision lens if tradeoffs are required."
                        example="Quality first: preserve inspection accuracy, auditability, and reliability even if lower-priority enhancements move to Phase 2."
                        error={getErrorMessage(form.formState.errors, "delivery.priorityTradeoff")}
                      >
                        <RadioStack
                          name="delivery.priorityTradeoff"
                          onSelect={(value) =>
                            form.setValue("delivery.priorityTradeoff", value as "quality" | "speed" | "cost", {
                              shouldDirty: true,
                              shouldValidate: true
                            })
                          }
                          options={priorityTradeoffOptions}
                          selected={values.delivery.priorityTradeoff}
                        />
                        <ChoiceContextNote
                          value={getQuestionNote("delivery.priorityTradeoff")}
                          onChange={(nextValue) => setQuestionNote("delivery.priorityTradeoff", nextValue)}
                        />
                      </FieldShell>
                    </>
                  ) : null}

                  {currentStep === 10 ? (
                    <>
                      <FieldShell
                        ai={getQuestionAiProps(
                          "phase1Confirmation.phase1OnlyConfirmed",
                          "Confirm that Phase 1 includes ONLY the features already defined",
                          values.phase1Confirmation.phase1OnlyConfirmed
                        )}
                        label="Confirm that phase 1 includes only the features already listed"
                        explanation="If you select No, go back and adjust Phase 1 scope before continuing."
                        example="Yes, confirmed. Phase 1 includes inspections, work items, cases, and dashboards only; training automation, equipment management, and predictive analytics remain out of scope."
                        error={getErrorMessage(form.formState.errors, "phase1Confirmation.phase1OnlyConfirmed")}
                      >
                        <RadioStack
                          name="phase1Confirmation.phase1OnlyConfirmed"
                          onSelect={(value) =>
                            form.setValue("phase1Confirmation.phase1OnlyConfirmed", value as "yes" | "no", {
                              shouldDirty: true,
                              shouldValidate: true
                            })
                          }
                          options={[
                            { value: "yes", label: "Yes, confirmed" },
                            { value: "no", label: "No, I need to modify" }
                          ]}
                          selected={values.phase1Confirmation.phase1OnlyConfirmed}
                        />
                        <ChoiceContextNote
                          value={getQuestionNote("phase1Confirmation.phase1OnlyConfirmed")}
                          onChange={(nextValue) => setQuestionNote("phase1Confirmation.phase1OnlyConfirmed", nextValue)}
                        />
                      </FieldShell>

                      <FieldShell
                        ai={getQuestionAiProps(
                          "phase1Confirmation.advancedAiInPhase1",
                          "Are you expecting ANY advanced analytics or AI in Phase 1?",
                          values.phase1Confirmation.advancedAiInPhase1
                        )}
                        label="Are you expecting advanced reporting or AI in phase 1?"
                        explanation="Selecting yes marks this as high risk and requires a concrete explanation."
                        example="No. Phase 1 will use standard operational dashboards only, and predictive scoring will be planned for a later phase after data quality is proven."
                        error={getErrorMessage(form.formState.errors, "phase1Confirmation.advancedAiInPhase1")}
                      >
                        <RadioStack
                          name="phase1Confirmation.advancedAiInPhase1"
                          onSelect={(value) =>
                            form.setValue("phase1Confirmation.advancedAiInPhase1", value as "yes" | "no", {
                              shouldDirty: true,
                              shouldValidate: true
                            })
                          }
                          options={[
                            { value: "no", label: "No" },
                            { value: "yes", label: "Yes (must explain)" }
                          ]}
                          selected={values.phase1Confirmation.advancedAiInPhase1}
                        />
                        <ChoiceContextNote
                          value={getQuestionNote("phase1Confirmation.advancedAiInPhase1")}
                          onChange={(nextValue) => setQuestionNote("phase1Confirmation.advancedAiInPhase1", nextValue)}
                        />
                      </FieldShell>

                      {values.phase1Confirmation.advancedAiInPhase1 === "yes" ? (
                        <FieldShell
                          ai={getQuestionAiProps(
                            "phase1Confirmation.advancedAiExplanation",
                            "Explain the advanced analytics/AI expectation in Phase 1",
                            values.phase1Confirmation.advancedAiExplanation,
                            (draft) => form.setValue("phase1Confirmation.advancedAiExplanation", draft, { shouldDirty: true, shouldValidate: true })
                          )}
                          label="Explain what advanced reporting or AI is needed in phase 1"
                          explanation="Be explicit about what model output is required, who uses it, and how it changes workflows."
                          example="Input is inspection failures and unresolved work-item age, output is a daily risk-priority queue, and user action is manager reassignment of top-risk sites before the next shift."
                          error={getErrorMessage(form.formState.errors, "phase1Confirmation.advancedAiExplanation")}
                        >
                          <Textarea {...form.register("phase1Confirmation.advancedAiExplanation")} />
                        </FieldShell>
                      ) : null}
                    </>
                  ) : null}

                  {currentStep === 11 ? (
                    <>
                      <FieldShell
                        ai={getQuestionAiProps(
                          "phase2Roadmap.selectedAreas",
                          "Which capabilities should be included in Phase 2?",
                          values.phase2Roadmap.selectedAreas
                        )}
                        label="Which capabilities should be included in phase 2?"
                        explanation='Select one or more areas, or explicitly mark "No Phase 2 scope defined."'
                        example="Select work item enhancements, training management, and communication tools for Phase 2 while keeping these out of launch scope to protect Phase 1 delivery."
                        error={getErrorMessage(form.formState.errors, "phase2Roadmap.selectedAreas")}
                      >
                        <div className="grid gap-3 md:grid-cols-2">
                          {phase2AreaOptions.map((option) => (
                            <ChoiceCard
                              checked={values.phase2Roadmap.selectedAreas.includes(option.value)}
                              key={option.value}
                              label={option.label}
                              onClick={() => toggleArrayValue("phase2Roadmap.selectedAreas", values.phase2Roadmap.selectedAreas, option.value)}
                            />
                          ))}
                        </div>
                        <label className="mt-3 flex items-center gap-2 text-sm text-[var(--foreground)]">
                          <input
                            checked={values.phase2Roadmap.noScopeDefined}
                            className="h-4 w-4 accent-[var(--accent)]"
                            onChange={(event) =>
                              form.setValue("phase2Roadmap.noScopeDefined", event.target.checked, {
                                shouldDirty: true,
                                shouldValidate: true
                              })
                            }
                            type="checkbox"
                          />
                          No Phase 2 scope defined
                        </label>
                        <ChoiceContextNote
                          value={getQuestionNote("phase2Roadmap.selectedAreas")}
                          onChange={(nextValue) => setQuestionNote("phase2Roadmap.selectedAreas", nextValue)}
                        />
                      </FieldShell>

                      {values.phase2Roadmap.selectedAreas.includes("other") ? (
                        <FieldShell
                          ai={getQuestionAiProps(
                            "phase2Roadmap.otherArea",
                            "Describe the other Phase 2 area",
                            values.phase2Roadmap.otherArea,
                            (draft) => form.setValue("phase2Roadmap.otherArea", draft, { shouldDirty: true, shouldValidate: true })
                          )}
                          label="Describe the other phase 2 area"
                          explanation="Name the area explicitly."
                          example="Customer-facing SLA exception portal with acknowledgment tracking"
                          error={getErrorMessage(form.formState.errors, "phase2Roadmap.otherArea")}
                        >
                          <Input {...form.register("phase2Roadmap.otherArea")} />
                        </FieldShell>
                      ) : null}

                      {values.phase2Roadmap.selectedAreas.map((area) => (
                        <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--muted)] p-5" key={area}>
                          <h3 className="font-semibold text-[var(--foreground)]">
                            {area === "other" ? values.phase2Roadmap.otherArea || "Other" : phase2AreaOptions.find((option) => option.value === area)?.label}
                          </h3>
                          <FieldShell
                            ai={getQuestionAiProps(
                              `phase2Roadmap.details.${area}.successDefinition`,
                              "Describe what success looks like for this feature",
                              values.phase2Roadmap.details[area].successDefinition,
                              (draft) =>
                                form.setValue(`phase2Roadmap.details.${area}.successDefinition` as Path<DiscoveryValidatedValues>, draft as never, {
                                  shouldDirty: true,
                                  shouldValidate: true
                                })
                            )}
                            label="Describe what success looks like for this feature"
                            explanation="Minimum 20 words. Include who uses it, the action, and expected outcome."
                            example="Operations managers and team leads use this feature to assign, monitor, and close work with clear SLA targets so overdue tasks drop by 30 percent and customer escalations decline quarter over quarter."
                            error={getErrorMessage(form.formState.errors, `phase2Roadmap.details.${area}.successDefinition`)}
                          >
                            <Textarea {...form.register(`phase2Roadmap.details.${area}.successDefinition` as Path<DiscoveryValidatedValues>)} />
                          </FieldShell>
                          <FieldShell
                            ai={getQuestionAiProps(
                              `phase2Roadmap.details.${area}.requiredForPhase1`,
                              "Is this REQUIRED for Phase 1?",
                              values.phase2Roadmap.details[area].requiredForPhase1
                            )}
                            label="Is this required in phase 1?"
                            explanation="Selecting Yes indicates scope bleed and requires explicit confirmation."
                            example="No for most items. Select Yes only when launch operations fail without this capability and the business accepts longer timeline and higher delivery risk."
                            error={getErrorMessage(form.formState.errors, `phase2Roadmap.details.${area}.requiredForPhase1`)}
                          >
                            <RadioStack
                              name={`phase2Roadmap.details.${area}.requiredForPhase1`}
                              onSelect={(value) =>
                                form.setValue(`phase2Roadmap.details.${area}.requiredForPhase1` as never, value as never, {
                                  shouldDirty: true,
                                  shouldValidate: true
                                })
                              }
                              options={[
                                { value: "no", label: "No (correct)" },
                                { value: "yes", label: "Yes (forces reclassification)" }
                              ]}
                              selected={values.phase2Roadmap.details[area].requiredForPhase1}
                            />
                            <ChoiceContextNote
                              value={getQuestionNote(`phase2Roadmap.details.${area}.requiredForPhase1`)}
                              onChange={(nextValue) => setQuestionNote(`phase2Roadmap.details.${area}.requiredForPhase1`, nextValue)}
                            />
                          </FieldShell>
                          {values.phase2Roadmap.details[area].requiredForPhase1 === "yes" ? (
                            <label className="flex items-start gap-2 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-3 py-3 text-sm text-[var(--danger)]">
                              <input
                                checked={values.phase2Roadmap.details[area].phase1EscalationConfirmed}
                                className="mt-1 h-4 w-4 accent-[var(--danger)]"
                                onChange={(event) =>
                                  form.setValue(`phase2Roadmap.details.${area}.phase1EscalationConfirmed` as never, event.target.checked as never, {
                                    shouldDirty: true,
                                    shouldValidate: true
                                  })
                                }
                                type="checkbox"
                              />
                              <span>
                                This significantly increases Phase 1 complexity and timeline. Confirm reclassification to Phase 1.
                              </span>
                            </label>
                          ) : null}
                        </div>
                      ))}

                      <StringListField
                        ai={getQuestionAiProps(
                          "phase2Roadmap.priorityRanking",
                          "Rank your top Phase 2 priorities",
                          values.phase2Roadmap.priorityRanking,
                          (draft) =>
                            form.setValue(
                              "phase2Roadmap.priorityRanking",
                              draft.split(/\n+/).map((item) => item.replace(/^(?:[-*]|\d+[.)])\s*/, "").trim()).filter(Boolean),
                              { shouldDirty: true, shouldValidate: true }
                            )
                        )}
                        label="Rank your top phase 2 priorities"
                        explanation="Provide at least top 3 in order (entry 1 = highest priority)."
                        example="1) Work item SLA automation, 2) Training assignments and certification tracking, 3) Team announcements with acknowledgment history."
                        minItems={3}
                        onChange={(nextValues) => form.setValue("phase2Roadmap.priorityRanking", nextValues, { shouldDirty: true, shouldValidate: true })}
                        values={values.phase2Roadmap.priorityRanking}
                        error={getErrorMessage(form.formState.errors, "phase2Roadmap.priorityRanking")}
                      />

                      <FieldShell
                        ai={getQuestionAiProps(
                          "phase2Roadmap.expectedTimeline",
                          "Expected timeline for Phase 2",
                          values.phase2Roadmap.expectedTimeline
                        )}
                        label="Expected timeline for phase 2"
                        explanation="Set clear expectation for when expansion work begins."
                        example="3-6 months after Phase 1 stabilization and baseline adoption metrics are met."
                        error={getErrorMessage(form.formState.errors, "phase2Roadmap.expectedTimeline")}
                      >
                        <RadioStack
                          name="phase2Roadmap.expectedTimeline"
                          onSelect={(value) =>
                            form.setValue("phase2Roadmap.expectedTimeline", value as never, {
                              shouldDirty: true,
                              shouldValidate: true
                            })
                          }
                          options={phase2TimelineOptions}
                          selected={values.phase2Roadmap.expectedTimeline}
                        />
                        <ChoiceContextNote
                          value={getQuestionNote("phase2Roadmap.expectedTimeline")}
                          onChange={(nextValue) => setQuestionNote("phase2Roadmap.expectedTimeline", nextValue)}
                        />
                      </FieldShell>

                      <FieldShell
                        ai={getQuestionAiProps(
                          "phase2Roadmap.deferredModules",
                          "Which not-yet-launched modules are intentionally deferred to Phase 2?",
                          values.phase2Roadmap.deferredModules
                        )}
                        label="Which modules are intentionally deferred to phase 2?"
                        explanation="Select modules intentionally postponed beyond Phase 1 launch scope."
                        example="Scheduling/routes and equipment preventive maintenance are deferred to Phase 2 to protect launch focus on inspections, work items, and cases."
                        error={getErrorMessage(form.formState.errors, "phase2Roadmap.deferredModules")}
                      >
                        <div className="grid gap-3 md:grid-cols-2">
                          {phase2ModuleOptions.map((option) => (
                            <ChoiceCard
                              checked={values.phase2Roadmap.deferredModules.includes(option.value)}
                              key={option.value}
                              label={option.label}
                              onClick={() =>
                                toggleArrayValue("phase2Roadmap.deferredModules", values.phase2Roadmap.deferredModules, option.value)
                              }
                            />
                          ))}
                        </div>
                        <ChoiceContextNote
                          value={getQuestionNote("phase2Roadmap.deferredModules")}
                          onChange={(nextValue) => setQuestionNote("phase2Roadmap.deferredModules", nextValue)}
                        />
                      </FieldShell>
                    </>
                  ) : null}

                  {currentStep === 12 ? (
                    <>
                      <FieldShell
                        ai={getQuestionAiProps(
                          "phase3Roadmap.selectedCapabilities",
                          "Which AI / predictive capabilities are important in the long-term vision?",
                          values.phase3Roadmap.selectedCapabilities
                        )}
                        label="Which AI or predictive capabilities matter most long term?"
                        explanation="Phase 3 capabilities should assume strong data maturity and are not expected in initial delivery."
                        example="Prioritize predictive risk detection, location health scoring, anomaly detection, and automated next-best action recommendations after core inspection and work-item data is stable."
                        error={getErrorMessage(form.formState.errors, "phase3Roadmap.selectedCapabilities")}
                      >
                        <div className="grid gap-3 md:grid-cols-2">
                          {phase3CapabilityOptions.map((option) => (
                            <ChoiceCard
                              checked={values.phase3Roadmap.selectedCapabilities.includes(option.value)}
                              key={option.value}
                              label={option.label}
                              onClick={() =>
                                toggleArrayValue("phase3Roadmap.selectedCapabilities", values.phase3Roadmap.selectedCapabilities, option.value)
                              }
                            />
                          ))}
                        </div>
                        <ChoiceContextNote
                          value={getQuestionNote("phase3Roadmap.selectedCapabilities")}
                          onChange={(nextValue) => setQuestionNote("phase3Roadmap.selectedCapabilities", nextValue)}
                        />
                      </FieldShell>

                      {values.phase3Roadmap.selectedCapabilities.includes("other") ? (
                        <FieldShell
                          ai={getQuestionAiProps(
                            "phase3Roadmap.otherCapability",
                            "Describe the other Phase 3 capability",
                            values.phase3Roadmap.otherCapability,
                            (draft) => form.setValue("phase3Roadmap.otherCapability", draft, { shouldDirty: true, shouldValidate: true })
                          )}
                          label="Describe the other phase 3 capability"
                          explanation="Name the capability explicitly."
                          example="Customer churn early-warning model by site portfolio"
                          error={getErrorMessage(form.formState.errors, "phase3Roadmap.otherCapability")}
                        >
                          <Input {...form.register("phase3Roadmap.otherCapability")} />
                        </FieldShell>
                      ) : null}

                      {values.phase3Roadmap.selectedCapabilities.map((capability) => (
                        <FieldShell
                          ai={getQuestionAiProps(
                            `phase3Roadmap.capabilityDetails.${capability}`,
                            `Describe exactly what the system should do for ${
                              capability === "other"
                                ? values.phase3Roadmap.otherCapability || "Other"
                                : phase3CapabilityOptions.find((option) => option.value === capability)?.label ?? capability
                            }`,
                            values.phase3Roadmap.capabilityDetails[capability],
                            (draft) =>
                              form.setValue(`phase3Roadmap.capabilityDetails.${capability}` as Path<DiscoveryValidatedValues>, draft as never, {
                                shouldDirty: true,
                                shouldValidate: true
                              })
                          )}
                          key={capability}
                          label={`Describe exactly what the system should do for ${
                            capability === "other"
                              ? values.phase3Roadmap.otherCapability || "Other"
                              : phase3CapabilityOptions.find((option) => option.value === capability)?.label
                          }`}
                          explanation="Minimum 25 words and must include input data, expected output, and user action from that output."
                          example="Input data includes inspection scores, work-item aging, and case volume trends by site. Output is a ranked risk list with confidence and reason codes. User action is manager reassignment, escalation, and follow-up scheduling."
                          error={getErrorMessage(form.formState.errors, `phase3Roadmap.capabilityDetails.${capability}`)}
                        >
                          <Textarea {...form.register(`phase3Roadmap.capabilityDetails.${capability}` as Path<DiscoveryValidatedValues>)} />
                        </FieldShell>
                      ))}

                      <FieldShell
                        ai={getQuestionAiProps(
                          "phase3Roadmap.dataSources",
                          "What data sources will power these capabilities?",
                          values.phase3Roadmap.dataSources
                        )}
                        label="What data sources will power these capabilities?"
                        explanation="Select all that apply."
                        example="Use inspections, work items, cases, employee activity, and training completion data so predictions reflect execution quality, responsiveness, and workforce readiness."
                        error={getErrorMessage(form.formState.errors, "phase3Roadmap.dataSources")}
                      >
                        <div className="grid gap-3 md:grid-cols-2">
                          {phase3DataSourceOptions.map((option) => (
                            <ChoiceCard
                              checked={values.phase3Roadmap.dataSources.includes(option.value)}
                              key={option.value}
                              label={option.label}
                              onClick={() => toggleArrayValue("phase3Roadmap.dataSources", values.phase3Roadmap.dataSources, option.value)}
                            />
                          ))}
                        </div>
                        <ChoiceContextNote
                          value={getQuestionNote("phase3Roadmap.dataSources")}
                          onChange={(nextValue) => setQuestionNote("phase3Roadmap.dataSources", nextValue)}
                        />
                      </FieldShell>

                      {values.phase3Roadmap.dataSources.includes("other") ? (
                        <FieldShell
                          ai={getQuestionAiProps(
                            "phase3Roadmap.otherDataSource",
                            "Describe the other data source",
                            values.phase3Roadmap.otherDataSource,
                            (draft) => form.setValue("phase3Roadmap.otherDataSource", draft, { shouldDirty: true, shouldValidate: true })
                          )}
                          label="Describe the other data source"
                          explanation="Name the source explicitly."
                          example="Customer contract SLA and penalty history dataset"
                          error={getErrorMessage(form.formState.errors, "phase3Roadmap.otherDataSource")}
                        >
                          <Input {...form.register("phase3Roadmap.otherDataSource")} />
                        </FieldShell>
                      ) : null}

                      <FieldShell
                        ai={getQuestionAiProps(
                          "phase3Roadmap.dataReadiness",
                          "How clean and reliable is this data today?",
                          values.phase3Roadmap.dataReadiness
                        )}
                        label="How clean and reliable is this data today?"
                        explanation="Choose the best current-state assessment."
                        example="Somewhat clean: inspection and work-item data are consistent, but case tags and legacy location mapping need normalization before model training."
                        error={getErrorMessage(form.formState.errors, "phase3Roadmap.dataReadiness")}
                      >
                        <RadioStack
                          name="phase3Roadmap.dataReadiness"
                          onSelect={(value) =>
                            form.setValue("phase3Roadmap.dataReadiness", value as never, {
                              shouldDirty: true,
                              shouldValidate: true
                            })
                          }
                          options={phase3DataReadinessOptions}
                          selected={values.phase3Roadmap.dataReadiness}
                        />
                        <ChoiceContextNote
                          value={getQuestionNote("phase3Roadmap.dataReadiness")}
                          onChange={(nextValue) => setQuestionNote("phase3Roadmap.dataReadiness", nextValue)}
                        />
                      </FieldShell>

                      <FieldShell
                        ai={getQuestionAiProps(
                          "phase3Roadmap.timelineExpectation",
                          "When do you expect AI capabilities to be available?",
                          values.phase3Roadmap.timelineExpectation
                        )}
                        label="When do you expect these AI capabilities to be available?"
                        explanation="Earlier expectations increase complexity and risk."
                        example="Phase 3 (recommended) after at least two quarters of stable structured data and baseline process adoption."
                        error={getErrorMessage(form.formState.errors, "phase3Roadmap.timelineExpectation")}
                      >
                        <RadioStack
                          name="phase3Roadmap.timelineExpectation"
                          onSelect={(value) =>
                            form.setValue("phase3Roadmap.timelineExpectation", value as never, {
                              shouldDirty: true,
                              shouldValidate: true
                            })
                          }
                          options={phase3TimelineExpectationOptions}
                          selected={values.phase3Roadmap.timelineExpectation}
                        />
                        <ChoiceContextNote
                          value={getQuestionNote("phase3Roadmap.timelineExpectation")}
                          onChange={(nextValue) => setQuestionNote("phase3Roadmap.timelineExpectation", nextValue)}
                        />
                      </FieldShell>

                      {values.phase3Roadmap.timelineExpectation !== "phase3" ? (
                        <label className="flex items-start gap-2 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-3 py-3 text-sm text-[var(--danger)]">
                          <input
                            checked={values.phase3Roadmap.earlyTimelineConfirmed}
                            className="mt-1 h-4 w-4 accent-[var(--danger)]"
                            onChange={(event) =>
                              form.setValue("phase3Roadmap.earlyTimelineConfirmed", event.target.checked, {
                                shouldDirty: true,
                                shouldValidate: true
                              })
                            }
                            type="checkbox"
                          />
                          <span>
                            This significantly increases complexity, cost, and timeline. Confirm that you understand and still want early AI delivery.
                          </span>
                        </label>
                      ) : null}

                      <StringListField
                        ai={getQuestionAiProps(
                          "phase3Roadmap.successMetrics",
                          "How will you measure success of AI capabilities?",
                          values.phase3Roadmap.successMetrics,
                          (draft) =>
                            form.setValue(
                              "phase3Roadmap.successMetrics",
                              draft.split(/\n+/).map((item) => item.replace(/^(?:[-*]|\d+[.)])\s*/, "").trim()).filter(Boolean),
                              { shouldDirty: true, shouldValidate: true }
                            )
                        )}
                        label="How will you measure success for these AI capabilities?"
                        explanation="Use specific measurable outcomes (for example percentages, thresholds, or SLA improvements)."
                        example="Reduce repeat high-risk findings by 25%, cut overdue work items older than 7 days by 35%, and improve location health score variance by 15% within 6 months."
                        minItems={1}
                        onChange={(nextValues) => form.setValue("phase3Roadmap.successMetrics", nextValues, { shouldDirty: true, shouldValidate: true })}
                        values={values.phase3Roadmap.successMetrics}
                        error={getErrorMessage(form.formState.errors, "phase3Roadmap.successMetrics")}
                      />

                      <FieldShell
                        ai={getQuestionAiProps(
                          "phase3Roadmap.aiEnablementPrerequisites",
                          "What prerequisites must be met before enabling AI capabilities?",
                          values.phase3Roadmap.aiEnablementPrerequisites,
                          (draft) => form.setValue("phase3Roadmap.aiEnablementPrerequisites", draft, { shouldDirty: true, shouldValidate: true })
                        )}
                        label="What must be in place before AI can be turned on?"
                        explanation="Describe data quality, stability period, and readiness controls required before rollout."
                        example="Require two quarters of stable inspection and work-item data quality, consistent taxonomy usage, and approved model governance checklist before production AI enablement."
                        error={getErrorMessage(form.formState.errors, "phase3Roadmap.aiEnablementPrerequisites")}
                      >
                        <Textarea {...form.register("phase3Roadmap.aiEnablementPrerequisites")} />
                      </FieldShell>

                      <FieldShell
                        ai={getQuestionAiProps(
                          "phase3Roadmap.aiGovernanceOwner",
                          "Who owns AI governance and production decision rights?",
                          values.phase3Roadmap.aiGovernanceOwner,
                          (draft) => form.setValue("phase3Roadmap.aiGovernanceOwner", draft, { shouldDirty: true, shouldValidate: true })
                        )}
                        label="Who owns AI governance and final production decisions?"
                        explanation="Name the accountable owner role or function."
                        example="Director of Operational Excellence with joint approval from EHS and Data Governance for model changes and release readiness."
                        error={getErrorMessage(form.formState.errors, "phase3Roadmap.aiGovernanceOwner")}
                      >
                        <Input {...form.register("phase3Roadmap.aiGovernanceOwner")} />
                      </FieldShell>
                    </>
                  ) : null}
                </div>

                {apiError ? (
                  <div className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-3 text-sm text-[var(--danger)]">
                    {apiError}
                  </div>
                ) : null}

                <div className="border-t border-[var(--border)] pt-6">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button disabled={!canRetreat || isPending} onClick={retreatFlow} type="button" variant="ghost">
                      <ChevronLeft className="h-4 w-4" />
                      Previous question
                    </Button>
                    <Button onClick={() => void advanceFlow()} type="button" disabled={isPending} className="w-full">
                      {isFinalStep && !hasNextQuestionInSection ? (
                        <>
                          {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                          Submit questionnaire
                        </>
                      ) : (
                        <>
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </section>
            )}
          </CardContent>
        </Card>
      </div>

      {showSubmitWarningDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-white p-6 shadow-xl">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-[var(--foreground)]">Suggestions before submission</h3>
              <p className="text-sm leading-6 text-[var(--muted-foreground)]">
                AI found {submissionWarnings.length} suggestion{submissionWarnings.length === 1 ? "" : "s"} that may improve output quality.
                You can still submit now.
              </p>
            </div>
            <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
              {warningSections.map((group) => (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 p-3" key={`warning-section-${group.sectionShortTitle}`}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      Section {group.sectionIndex + 1}: {group.sectionShortTitle}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setShowSubmitWarningDialog(false);
                        setEntryStage("questions");
                        setCurrentStep(group.sectionIndex);
                        setCurrentQuestionIndex(0);
                      }}
                    >
                      Review section
                    </Button>
                  </div>
                  <ul className="space-y-1 text-sm text-[var(--muted-foreground)]">
                    {group.messages.slice(0, 3).map((message) => (
                      <li key={`${group.sectionShortTitle}-${message}`}>- {message}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowSubmitWarningDialog(false);
                }}
              >
                Improve answers
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowSubmitWarningDialog(false);
                  performSubmission(values, { bypassValidation: true });
                }}
              >
                Proceed anyway
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-8 flex justify-center">
        <button
          aria-label="Quick QA autofill and submit"
          className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]/25 transition hover:text-[var(--muted-foreground)]/70"
          disabled={isPending}
          onClick={quickQaSubmit}
          type="button"
        >
          QA quick submit
        </button>
      </div>
    </main>
  );
}
