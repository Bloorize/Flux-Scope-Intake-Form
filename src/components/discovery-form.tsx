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

type SubmissionState = {
  structured: ReturnType<typeof buildStructuredOutput>;
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
      label="Top 3 workflows used daily"
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
  const [isPending, startTransition] = useTransition();
  const questionSectionRef = useRef<HTMLElement | null>(null);
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
    const section = questionSectionRef.current;
    if (!section) {
      return;
    }

    const questions = Array.from(section.querySelectorAll<HTMLElement>("[data-question-shell='true']"));
    setQuestionCount(questions.length);
    setQuestionTitles(
      questions.map((question, index) => {
        const heading = question.querySelector<HTMLElement>("[data-question-label='true']");
        const text = heading?.textContent?.trim();
        return text && text.length > 0 ? text : `Question ${index + 1}`;
      })
    );

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
      if (!draft || !applyDraft) {
        return;
      }

      applyDraft(draft);
      void runQuestionReview(fieldPath, questionLabel, draft);
    }
  });

  const performSubmission = (rawValues: DiscoveryValidatedValues, options?: { bypassValidation?: boolean }) => {
    setApiError(null);
    startTransition(async () => {
      const validatedValues = options?.bypassValidation
        ? rawValues
        : (discoveryFormSchema.parse(rawValues) as DiscoveryValidatedValues);
      const structured = buildStructuredOutput(validatedValues);
      const summary = buildReadableSummary(validatedValues);
      const loe = classifyLoe(validatedValues);

      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ structured, summary, loe })
      });

      if (!response.ok) {
        setApiError("Submission failed. The mock endpoint did not accept the payload.");
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
    form.reset(dummyValues);
    setCurrentStep(discoverySections.length - 1);
    performSubmission(dummyValues);
  };

  if (submission) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(13,76,129,0.16),_transparent_30%),linear-gradient(180deg,#f7f8fb_0%,#edf2f7_100%)] px-4 py-10 md:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <Card>
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(13,76,129,0.16),_transparent_30%),linear-gradient(180deg,#f7f8fb_0%,#edf2f7_100%)] px-4 py-10 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-[var(--border)] bg-white/80 backdrop-blur">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="rounded-xl border border-[var(--border)] bg-white px-3 py-2">
                  <Image
                    src={ruxtonLogo}
                    alt="Ruxton Labs logo"
                    width={300}
                    height={64}
                    className="h-16 w-auto object-contain"
                    priority
                  />
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-white px-3 py-2">
                  <Image
                    src={verdeLogo}
                    alt="Verde Clean logo"
                    width={300}
                    height={64}
                    className="h-16 w-auto object-contain"
                    priority
                  />
                </div>
                <div className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-sm text-[var(--muted-foreground)]">
                  HeySage Intelligent Operations Platform
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)] md:text-4xl">Scope Clarification Questionnaire</h1>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
                  Answer each prompt in plain language. AI suggestions help improve quality, but you can always proceed.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
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
                      This experience helps you clarify launch scope, risks, and phased roadmap decisions for the HeySage Intelligent Operations
                      Platform.
                    </p>
                    <ul className="space-y-2 text-sm leading-6 text-[var(--foreground)]">
                      <li>- Expect roughly 12 to 18 minutes to complete.</li>
                      <li>- You will answer one question at a time with optional AI coaching.</li>
                      <li>- Your answers become a structured scope output for planning and delivery.</li>
                    </ul>
                  </>
                ) : null}

                {entryStage === "scope-summary" ? (
                  <>
                    <h2 className="text-2xl font-semibold text-[var(--foreground)]">AI-generated scope summary</h2>
                    <div className="space-y-2 text-sm leading-6 text-[var(--foreground)]">
                      <p>- Current direction favors a phased rollout: launch-critical operations first, then roadmap expansion.</p>
                      <p>- Most value is expected from inspection workflows, corrective action tracking, integrations, and mobile execution clarity.</p>
                      <p>- AI capabilities should be sequenced behind stable operational data and governance ownership.</p>
                    </div>
                  </>
                ) : null}

                {entryStage === "blind-spots" ? (
                  <>
                    <h2 className="text-2xl font-semibold text-[var(--foreground)]">Blind spot analysis</h2>
                    <div className="space-y-2 text-sm leading-6 text-[var(--foreground)]">
                      <p>- Day 1 boundaries are often too broad and create delivery risk.</p>
                      <p>- Offline and mobile assumptions may be underspecified for field users.</p>
                      <p>- Integration depth and latency expectations are frequently unclear at kickoff.</p>
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
                        label="What exact features must exist on Day 1 for operations to function?"
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
                      </FieldShell>

                      {values.phase1Scope.selectedFeatures.includes("other") ? (
                        <FieldShell
                          ai={getQuestionAiProps(
                            "phase1Scope.otherFeature",
                            "Describe the additional Day 1 capability",
                            values.phase1Scope.otherFeature,
                            (draft) => form.setValue("phase1Scope.otherFeature", draft, { shouldDirty: true, shouldValidate: true })
                          )}
                          label="Describe the additional Day 1 capability"
                          explanation="Explain what the custom Day 1 feature is. Avoid category words alone."
                          example="Permit approval workflow where site leads submit permit requests, regional safety managers approve or reject with comments, and approved permits notify the assigned field team within 15 minutes."
                          error={getErrorMessage(form.formState.errors, "phase1Scope.otherFeature")}
                        >
                          <Input {...form.register("phase1Scope.otherFeature")} placeholder="Example: Permit approvals with escalation routing" />
                        </FieldShell>
                      ) : null}

                      <FieldShell
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
                      </FieldShell>

                      <FieldShell
                        ai={getQuestionAiProps(
                          "phase1Scope.failEvidenceStandard",
                          "What evidence is mandatory for failed inspection points?",
                          values.phase1Scope.failEvidenceStandard,
                          (draft) => form.setValue("phase1Scope.failEvidenceStandard", draft, { shouldDirty: true, shouldValidate: true })
                        )}
                        label="What evidence is mandatory for failed inspection points?"
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
                        label="What joint inspection expectation exists by account?"
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
                      label="If the system is down for 24 hours, what breaks?"
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
                        label="What system(s) are you using today?"
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
                        label="What EXACTLY must be replaced?"
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
                        label="What can be deferred?"
                        explanation="List items that are useful but not required for Phase 1 operations."
                        example="Historical migration older than 12 months, advanced executive benchmarking packs, and non-critical custom report exports can be deferred to Phase 2 without impacting launch operations."
                        minItems={1}
                        onChange={(nextValues) => form.setValue("currentBaseline.canDefer", nextValues, { shouldDirty: true, shouldValidate: true })}
                        values={values.currentBaseline.canDefer}
                        error={getErrorMessage(form.formState.errors, "currentBaseline.canDefer")}
                      />
                      <FieldShell
                        label="Current app strategy"
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
                      </FieldShell>

                      <FieldShell
                        label="Is the Org -> Region -> Site -> Building -> Floor -> Space hierarchy mandatory at launch?"
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
                      </FieldShell>

                      <FieldShell
                        label="How should space types and inspection points be governed?"
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
                      </FieldShell>
                    </>
                  ) : null}

                  {currentStep === 3 ? (
                    <>
                      <FieldShell
                        label="Why do you believe native mobile apps are required?"
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
                      </FieldShell>

                      {values.mobileRequirements.selectedReasons.includes("other") ? (
                        <FieldShell
                          ai={getQuestionAiProps(
                            "mobileRequirements.otherExplanation",
                            "Explain the other native mobile reason",
                            values.mobileRequirements.otherExplanation,
                            (draft) => form.setValue("mobileRequirements.otherExplanation", draft, { shouldDirty: true, shouldValidate: true })
                          )}
                          label="Explain the other native mobile reason"
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
                          label="Describe EXACT offline requirements"
                          explanation="Must state what actions happen offline and how long users are expected to remain offline."
                          example="Inspectors must create and complete inspections offline, record fail reasons, capture photos, and close urgent work items for up to 8 hours offline before queued sync runs when they reconnect."
                          error={getErrorMessage(form.formState.errors, "mobileRequirements.offlineDetail")}
                        >
                          <Textarea {...form.register("mobileRequirements.offlineDetail")} />
                        </FieldShell>
                      ) : null}

                      {values.mobileRequirements.selectedReasons.includes("appStore") ? (
                        <FieldShell
                          label="Is TestFlight or internal distribution acceptable?"
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
                          label="Describe specific performance issues expected"
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
                        label="Does the platform need to function without internet?"
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
                      </FieldShell>
                      {values.offlineRequirements.supportLevel !== "none" ? (
                        <FieldShell
                          ai={getQuestionAiProps(
                            "offlineRequirements.detail",
                            "Describe the offline workflows, sync behavior, and expected frequency",
                            values.offlineRequirements.detail,
                            (draft) => form.setValue("offlineRequirements.detail", draft, { shouldDirty: true, shouldValidate: true })
                          )}
                          label="Describe the offline workflows, sync behavior, and expected frequency"
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
                        label="What systems must integrate at launch?"
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
                      </FieldShell>

                      {values.integrations.selectedSystems.includes("other") ? (
                        <FieldShell
                          label="Name the other launch integration"
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
                        label="How should ADP employee data sync into this platform?"
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
                      </FieldShell>

                      <FieldShell
                        label="What ADP sync latency is acceptable operationally?"
                        explanation="Describe tolerance for stale employee data and when manual correction is required."
                        example="Roster data can lag up to 24 hours, but site transfers and terminations must be reflected the same day to prevent assignment and access errors."
                        error={getErrorMessage(form.formState.errors, "integrations.adpLatencyTolerance")}
                      >
                        <Textarea {...form.register("integrations.adpLatencyTolerance")} />
                      </FieldShell>

                      <FieldShell
                        label="How will Power BI be used in Phase 1?"
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
                        label="What analytics must exist at launch?"
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
                        label="What analytics can wait until Phase 2+?"
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
                        label="What AI capabilities are expected in Phase 1?"
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
                        label="What AI capabilities belong in Phase 2+?"
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
                        label="How is location health score calculated?"
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
                        label="What rollups do managers, regional leaders, and executives need?"
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
                        label="What work item urgency and aging rules apply at launch?"
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
                        label="How should assignee notifications and overdue escalation behave?"
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
                        label="How should cases route between location and department ownership?"
                        explanation="Define routing rules for location-owned cases versus centralized department cases."
                        example="Customer-facing complaints route to location owners, while safety and HR cases route to departments with centralized closeout controls and audit trail visibility."
                        error={getErrorMessage(form.formState.errors, "workflows.caseRoutingModel")}
                      >
                        <Textarea {...form.register("workflows.caseRoutingModel")} />
                      </FieldShell>
                      <FieldShell
                        label="What must the no-login public safety portal include?"
                        explanation="Specify required resources and forms available without authentication."
                        example="No-login portal includes SDS sheets in multiple languages, insurance resources, incident response guidance, and QR-driven incident intake submission."
                        error={getErrorMessage(form.formState.errors, "workflows.publicSafetyPortalScope")}
                      >
                        <Textarea {...form.register("workflows.publicSafetyPortalScope")} />
                      </FieldShell>
                      <FieldShell
                        label="What incident compliance flow is required?"
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
                        label="Number of users at launch"
                        explanation="Use a number only."
                        example="120"
                        error={getErrorMessage(form.formState.errors, "scale.usersAtLaunch")}
                      >
                        <Input {...form.register("scale.usersAtLaunch", { valueAsNumber: true })} type="number" />
                      </FieldShell>
                      <FieldShell
                        label="Number of users in 12 months"
                        explanation="Use a number only."
                        example="320"
                        error={getErrorMessage(form.formState.errors, "scale.usersIn12Months")}
                      >
                        <Input {...form.register("scale.usersIn12Months", { valueAsNumber: true })} type="number" />
                      </FieldShell>
                      <FieldShell
                        label="Number of sites"
                        explanation="Use a number only."
                        example="42"
                        error={getErrorMessage(form.formState.errors, "scale.numberOfSites")}
                      >
                        <Input {...form.register("scale.numberOfSites", { valueAsNumber: true })} type="number" />
                      </FieldShell>
                      <FieldShell
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
                        label="What does rapid deployment mean in weeks?"
                        explanation="Translate 'rapid' into an explicit number."
                        example="12"
                        error={getErrorMessage(form.formState.errors, "delivery.rapidDeploymentWeeks")}
                      >
                        <Input {...form.register("delivery.rapidDeploymentWeeks", { valueAsNumber: true })} type="number" />
                      </FieldShell>
                      <FieldShell
                        label="What defines production-ready?"
                        explanation="State measurable criteria such as uptime expectations, roles, auditability, training, or support coverage."
                        example="Production-ready means all launch sites have validated role access, inspection and work-item flows pass UAT, audit logs are active, core dashboards are live, and Sev-1 support coverage is staffed for go-live."
                        error={getErrorMessage(form.formState.errors, "delivery.productionReadyDefinition")}
                      >
                        <Textarea {...form.register("delivery.productionReadyDefinition")} />
                      </FieldShell>
                      <FieldShell
                        label="What support level is expected?"
                        explanation="Specify response times, support channels, and ownership model."
                        example="Field users need in-app and phone support 6am-8pm local time, Sev-1 incidents require engineering response within 30 minutes, and Sev-2 issues require resolution plans within one business day."
                        error={getErrorMessage(form.formState.errors, "delivery.supportLevel")}
                      >
                        <Textarea {...form.register("delivery.supportLevel")} />
                      </FieldShell>
                      <FieldShell
                        label="Priority tradeoff for Phase 1"
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
                      </FieldShell>
                    </>
                  ) : null}

                  {currentStep === 10 ? (
                    <>
                      <FieldShell
                        label="Confirm that Phase 1 includes ONLY the features already defined"
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
                      </FieldShell>

                      <FieldShell
                        label="Are you expecting ANY advanced analytics or AI in Phase 1?"
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
                      </FieldShell>

                      {values.phase1Confirmation.advancedAiInPhase1 === "yes" ? (
                        <FieldShell
                          label="Explain the advanced analytics/AI expectation in Phase 1"
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
                        label="Which capabilities should be included in Phase 2?"
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
                      </FieldShell>

                      {values.phase2Roadmap.selectedAreas.includes("other") ? (
                        <FieldShell
                          label="Describe the other Phase 2 area"
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
                            label="Describe what success looks like for this feature"
                            explanation="Minimum 20 words. Include who uses it, the action, and expected outcome."
                            example="Operations managers and team leads use this feature to assign, monitor, and close work with clear SLA targets so overdue tasks drop by 30 percent and customer escalations decline quarter over quarter."
                            error={getErrorMessage(form.formState.errors, `phase2Roadmap.details.${area}.successDefinition`)}
                          >
                            <Textarea {...form.register(`phase2Roadmap.details.${area}.successDefinition` as Path<DiscoveryValidatedValues>)} />
                          </FieldShell>
                          <FieldShell
                            label="Is this REQUIRED for Phase 1?"
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
                        label="Rank your top Phase 2 priorities"
                        explanation="Provide at least top 3 in order (entry 1 = highest priority)."
                        example="1) Work item SLA automation, 2) Training assignments and certification tracking, 3) Team announcements with acknowledgment history."
                        minItems={3}
                        onChange={(nextValues) => form.setValue("phase2Roadmap.priorityRanking", nextValues, { shouldDirty: true, shouldValidate: true })}
                        values={values.phase2Roadmap.priorityRanking}
                        error={getErrorMessage(form.formState.errors, "phase2Roadmap.priorityRanking")}
                      />

                      <FieldShell
                        label="Expected timeline for Phase 2"
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
                      </FieldShell>

                      <FieldShell
                        label="Which not-yet-launched modules are intentionally deferred to Phase 2?"
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
                      </FieldShell>
                    </>
                  ) : null}

                  {currentStep === 12 ? (
                    <>
                      <FieldShell
                        label="Which AI / predictive capabilities are important in the long-term vision?"
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
                      </FieldShell>

                      {values.phase3Roadmap.selectedCapabilities.includes("other") ? (
                        <FieldShell
                          ai={getQuestionAiProps(
                            "phase3Roadmap.otherCapability",
                            "Describe the other Phase 3 capability",
                            values.phase3Roadmap.otherCapability,
                            (draft) => form.setValue("phase3Roadmap.otherCapability", draft, { shouldDirty: true, shouldValidate: true })
                          )}
                          label="Describe the other Phase 3 capability"
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
                      </FieldShell>

                      <FieldShell
                        label="When do you expect AI capabilities to be available?"
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
                        label="How will you measure success of AI capabilities?"
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
                        label="What prerequisites must be met before enabling AI capabilities?"
                        explanation="Describe data quality, stability period, and readiness controls required before rollout."
                        example="Require two quarters of stable inspection and work-item data quality, consistent taxonomy usage, and approved model governance checklist before production AI enablement."
                        error={getErrorMessage(form.formState.errors, "phase3Roadmap.aiEnablementPrerequisites")}
                      >
                        <Textarea {...form.register("phase3Roadmap.aiEnablementPrerequisites")} />
                      </FieldShell>

                      <FieldShell
                        label="Who owns AI governance and production decision rights?"
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
