import { z } from "zod";

export const phase1FeatureOptions = [
  { value: "inspections", label: "Inspections" },
  { value: "workItems", label: "Work Items" },
  { value: "cases", label: "Cases" },
  { value: "dashboards", label: "Dashboards" },
  { value: "teamData", label: "Team / Employee data" },
  { value: "safety", label: "Safety / Incident tracking" },
  { value: "training", label: "Training" },
  { value: "other", label: "Other" }
] as const;

export const mobileReasonOptions = [
  { value: "appStore", label: "App Store distribution required" },
  { value: "offline", label: "Offline usage required" },
  { value: "mdm", label: "Device restrictions (MDM)" },
  { value: "camera", label: "Camera / hardware usage" },
  { value: "push", label: "Push notifications" },
  { value: "performance", label: "Performance concerns" },
  { value: "other", label: "Other" }
] as const;

export const offlineSupportOptions = [
  { value: "none", label: "No" },
  { value: "limited", label: "Limited functionality" },
  { value: "full", label: "Full offline support" }
] as const;

export const integrationSystemOptions = [
  { value: "adp", label: "ADP" },
  { value: "powerBi", label: "Power BI" },
  { value: "internal", label: "Internal systems" },
  { value: "customer", label: "Customer systems" },
  { value: "other", label: "Other" }
] as const;

export const integrationDepthOptions = [
  { value: "readOnly", label: "Read-only" },
  { value: "sync", label: "Sync" },
  { value: "bidirectional", label: "Real-time bidirectional" }
] as const;

export const phase2AreaOptions = [
  { value: "workItemEnhancements", label: "Work item enhancements" },
  { value: "customerInteractionTracking", label: "Customer interaction tracking" },
  { value: "trainingManagement", label: "Training management" },
  { value: "assetEquipment", label: "Asset & equipment" },
  { value: "internalTicketing", label: "Internal ticketing" },
  { value: "communicationTools", label: "Communication tools" },
  { value: "other", label: "Other" }
] as const;

export const phase2TimelineOptions = [
  { value: "immediately_after_launch", label: "Immediately after launch" },
  { value: "3_6_months", label: "3–6 months" },
  { value: "6_12_months", label: "6–12 months" },
  { value: "12_plus_months", label: "12+ months" }
] as const;

export const phase3CapabilityOptions = [
  { value: "predictiveRiskDetection", label: "Predictive risk detection" },
  { value: "performanceDegradationAlerts", label: "Performance degradation alerts" },
  { value: "locationHealthScoring", label: "Location health scoring" },
  { value: "managerPerformanceScorecards", label: "Manager performance scorecards" },
  { value: "automatedRecommendations", label: "Automated recommendations (next best action)" },
  { value: "regionalTrendAnalysis", label: "Trend analysis across regions" },
  { value: "forecasting", label: "Forecasting" },
  { value: "anomalyDetection", label: "Anomaly detection" },
  { value: "aiGeneratedInsights", label: "AI-generated insights" },
  { value: "other", label: "Other" }
] as const;

export const phase3DataSourceOptions = [
  { value: "inspections", label: "Inspections" },
  { value: "workItems", label: "Work items" },
  { value: "employeeData", label: "Employee data" },
  { value: "trainingData", label: "Training data" },
  { value: "safetyData", label: "Safety data" },
  { value: "customerFeedback", label: "Customer feedback" },
  { value: "financialData", label: "Financial data" },
  { value: "other", label: "Other" }
] as const;

export const phase3DataReadinessOptions = [
  { value: "very_clean", label: "Very clean" },
  { value: "somewhat_clean", label: "Somewhat clean" },
  { value: "inconsistent", label: "Inconsistent" },
  { value: "unknown", label: "Unknown" }
] as const;

export const phase3TimelineExpectationOptions = [
  { value: "phase1", label: "Phase 1 (high risk)" },
  { value: "phase2", label: "Phase 2 (medium risk)" },
  { value: "phase3", label: "Phase 3 (recommended)" }
] as const;

export const priorityTradeoffOptions = [
  { value: "quality", label: "Quality first (accept slower delivery)" },
  { value: "speed", label: "Speed first (accept tighter scope/quality risk)" },
  { value: "cost", label: "Cost first (accept slower delivery or reduced scope)" }
] as const;

export const mirrorApproachOptions = [
  { value: "mirror", label: "Mirror current app behavior closely" },
  { value: "modernize", label: "Modernize while keeping core workflows recognizable" },
  { value: "redesign", label: "Intentionally redesign workflows from scratch" }
] as const;

export const hierarchyRequirementOptions = [
  { value: "required", label: "Required at launch" },
  { value: "flexible", label: "Flexible for launch, enforce later" }
] as const;

export const spaceTypeGovernanceOptions = [
  { value: "global", label: "Global standards only" },
  { value: "hybrid", label: "Global standards with site overrides" },
  { value: "site", label: "Site-managed definitions only" }
] as const;

export const inspectionScoringMethodOptions = [
  { value: "manual", label: "Manual rubric scoring" },
  { value: "hybrid", label: "Hybrid (auto assist + manager override)" },
  { value: "auto", label: "Fully auto-calculated scoring" }
] as const;

export const adpSyncModeOptions = [
  { value: "nightly_batch", label: "Nightly batch sync" },
  { value: "near_real_time", label: "Near real-time sync" },
  { value: "manual_upload", label: "Manual upload process" }
] as const;

export const powerBiModeOptions = [
  { value: "read_only", label: "Read-only visualization" },
  { value: "data_sync", label: "Data synchronization pipeline" },
  { value: "both", label: "Both visualization and data sync" }
] as const;

export const phase2ModuleOptions = [
  { value: "scheduling", label: "Scheduling and routes" },
  { value: "equipment_pm", label: "Equipment tracking and preventive maintenance" },
  { value: "inventory", label: "Supplies and inventory controls" }
] as const;

const bannedPhrases = [
  "everything",
  "not sure",
  "we need all of it",
  "all of it",
  "things slow down",
  "operations are impacted",
  "smart insights",
  "ai recommendations",
  "etc",
  "and so on",
  "normal stuff",
  "whatever"
] as const;

const actionVerbs = [
  "create",
  "edit",
  "view",
  "assign",
  "approve",
  "complete",
  "schedule",
  "capture",
  "review",
  "sync",
  "track",
  "submit",
  "close",
  "route",
  "escalate",
  "update",
  "generate",
  "export"
] as const;

const phase1FeatureEnum = z.enum(phase1FeatureOptions.map((option) => option.value));
const mobileReasonEnum = z.enum(mobileReasonOptions.map((option) => option.value));
const offlineSupportEnum = z.enum(offlineSupportOptions.map((option) => option.value));
const integrationSystemEnum = z.enum(integrationSystemOptions.map((option) => option.value));
const integrationDepthEnum = z.enum(integrationDepthOptions.map((option) => option.value));
const priorityTradeoffEnum = z.enum(priorityTradeoffOptions.map((option) => option.value));
const mirrorApproachEnum = z.enum(mirrorApproachOptions.map((option) => option.value));
const hierarchyRequirementEnum = z.enum(hierarchyRequirementOptions.map((option) => option.value));
const spaceTypeGovernanceEnum = z.enum(spaceTypeGovernanceOptions.map((option) => option.value));
const inspectionScoringMethodEnum = z.enum(inspectionScoringMethodOptions.map((option) => option.value));
const adpSyncModeEnum = z.enum(adpSyncModeOptions.map((option) => option.value));
const powerBiModeEnum = z.enum(powerBiModeOptions.map((option) => option.value));
const phase2AreaEnum = z.enum(phase2AreaOptions.map((option) => option.value));
const phase2TimelineEnum = z.enum(phase2TimelineOptions.map((option) => option.value));
const phase2ModuleEnum = z.enum(phase2ModuleOptions.map((option) => option.value));
const phase3CapabilityEnum = z.enum(phase3CapabilityOptions.map((option) => option.value));
const phase3DataSourceEnum = z.enum(phase3DataSourceOptions.map((option) => option.value));
const phase3DataReadinessEnum = z.enum(phase3DataReadinessOptions.map((option) => option.value));
const phase3TimelineExpectationEnum = z.enum(phase3TimelineExpectationOptions.map((option) => option.value));

const normalizeText = (value: string) => value.trim().replace(/\s+/g, " ");

const wordCount = (value: string) =>
  normalizeText(value)
    .split(/\s+/)
    .filter(Boolean).length;

const hasBannedPhrase = (value: string) => {
  const normalized = normalizeText(value).toLowerCase();
  return bannedPhrases.find((phrase) => {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|\\b)${escaped}(\\b|$)`, "i").test(normalized);
  });
};

const hasActionVerb = (value: string) => {
  const normalized = normalizeText(value).toLowerCase();
  return actionVerbs.some((verb) => normalized.includes(verb));
};

const suggestionMessageMatchers = [
  " is required.",
  "needs a bit more detail",
  "is too vague because it includes",
  "should describe an action",
  "must explicitly mention",
  "must state how long users are expected to operate offline",
  "must include expected sync frequency or offline duration"
] as const;

export const isSuggestionValidationMessage = (message: string) =>
  suggestionMessageMatchers.some((matcher) => message.includes(matcher));

const addSpecificityIssue = (
  ctx: z.RefinementCtx,
  path: (string | number)[],
  label: string,
  value: string,
  options?: {
    minWords?: number;
    requireActionVerb?: boolean;
    requiredSubstrings?: string[];
  }
) => {
  const text = normalizeText(value);
  const minWords = options?.minWords ?? 8;

  if (!text) {
    ctx.addIssue({
      code: "custom",
      path,
      message: `${label} is required.`
    });
    return;
  }

  if (wordCount(text) < minWords) {
    ctx.addIssue({
      code: "custom",
      path,
      message: `${label} needs a bit more detail. Add who is involved, what they do, and the outcome.`
    });
  }

  const bannedPhrase = hasBannedPhrase(text);
  if (bannedPhrase) {
    ctx.addIssue({
      code: "custom",
      path,
      message: `${label} is too vague because it includes "${bannedPhrase}". Replace it with concrete workflows, actors, or constraints.`
    });
  }

  if (options?.requireActionVerb && !hasActionVerb(text)) {
    ctx.addIssue({
      code: "custom",
      path,
      message: `${label} should describe an action, such as create, assign, review, or complete.`
    });
  }

  for (const requiredSubstring of options?.requiredSubstrings ?? []) {
    if (!text.toLowerCase().includes(requiredSubstring.toLowerCase())) {
      ctx.addIssue({
        code: "custom",
        path,
        message: `${label} must explicitly mention ${requiredSubstring}.`
      });
    }
  }
};

const stringListSchema = z.array(z.string().trim()).default([]);

const workflowSchema = z.object({
  actor: z.string().trim().min(3, "Actor is required."),
  action: z.string().trim().min(8, "Action is required."),
  outcome: z.string().trim().min(8, "Outcome is required.")
});

const featureDetailsSchema = z.object({
  inspections: z.string().trim().default(""),
  workItems: z.string().trim().default(""),
  cases: z.string().trim().default(""),
  dashboards: z.string().trim().default(""),
  teamData: z.string().trim().default(""),
  safety: z.string().trim().default(""),
  training: z.string().trim().default(""),
  other: z.string().trim().default("")
});

const integrationDetailSchema = z.object({
  depth: integrationDepthEnum.optional(),
  detail: z.string().trim().default("")
});

const phase1ScopeSchema = z.object({
  selectedFeatures: z.array(phase1FeatureEnum).min(1, "Select at least one Day 1 feature."),
  otherFeature: z.string().trim().default(""),
  featureDetails: featureDetailsSchema,
  inspectionScoringMethod: inspectionScoringMethodEnum,
  failEvidenceStandard: z.string().trim().default(""),
  jointInspectionExpectation: z.string().trim().default("")
});

const criticalitySchema = z.object({
  consequences: stringListSchema
});

const currentBaselineSchema = z.object({
  systemsToday: stringListSchema,
  mustReplace: stringListSchema,
  canDefer: stringListSchema,
  mirrorApproach: mirrorApproachEnum,
  hierarchyRequirement: hierarchyRequirementEnum,
  spaceTypeGovernance: spaceTypeGovernanceEnum
});

const mobileRequirementsSchema = z.object({
  selectedReasons: z.array(mobileReasonEnum).min(1, "Select at least one reason."),
  otherExplanation: z.string().trim().default(""),
  offlineDetail: z.string().trim().default(""),
  appStoreInternalDistributionOk: z.enum(["yes", "no"]).optional(),
  performanceDetail: z.string().trim().default("")
});

const offlineRequirementsSchema = z.object({
  supportLevel: offlineSupportEnum,
  detail: z.string().trim().default("")
});

const integrationsSchema = z.object({
  selectedSystems: z.array(integrationSystemEnum).min(1, "Select at least one launch integration."),
  otherSystem: z.string().trim().default(""),
  details: z.object({
    adp: integrationDetailSchema,
    powerBi: integrationDetailSchema,
    internal: integrationDetailSchema,
    customer: integrationDetailSchema,
    other: integrationDetailSchema
  }),
  adpSyncMode: adpSyncModeEnum,
  adpLatencyTolerance: z.string().trim().default(""),
  powerBiMode: powerBiModeEnum
});

const analyticsAiSchema = z.object({
  analyticsPhase1: stringListSchema,
  analyticsPhase2: stringListSchema,
  aiPhase1: stringListSchema,
  aiPhase2: stringListSchema,
  locationHealthScoringModel: z.string().trim().default(""),
  managementRollupExpectations: z.string().trim().default("")
});

const workflowsSchema = z.object({
  topDailyWorkflows: z.array(workflowSchema).default([
    { actor: "", action: "", outcome: "" },
    { actor: "", action: "", outcome: "" },
    { actor: "", action: "", outcome: "" }
  ]),
  workItemUrgencyRules: z.string().trim().default(""),
  assigneeNotificationEscalation: z.string().trim().default(""),
  caseTypesInScope: stringListSchema,
  caseRoutingModel: z.string().trim().default(""),
  publicSafetyPortalScope: z.string().trim().default(""),
  incidentComplianceFlow: z.string().trim().default("")
});

const scaleSchema = z.object({
  usersAtLaunch: z.coerce.number().int().min(1, "Enter a numeric user count."),
  usersIn12Months: z.coerce.number().int().min(1, "Enter a numeric user count."),
  numberOfSites: z.coerce.number().int().min(1, "Enter a numeric site count."),
  inspectionsPerDay: z.coerce.number().int().min(0, "Enter a numeric daily inspection count.")
});

const deliverySchema = z.object({
  rapidDeploymentWeeks: z.coerce.number().int().min(1, "Enter weeks as a number."),
  productionReadyDefinition: z.string().trim().min(20, "Define production-ready in concrete terms."),
  supportLevel: z.string().trim().min(15, "Describe the expected support model."),
  priorityTradeoff: priorityTradeoffEnum
});

const phase1ConfirmationSchema = z.object({
  phase1OnlyConfirmed: z.enum(["yes", "no"]),
  advancedAiInPhase1: z.enum(["no", "yes"]),
  advancedAiExplanation: z.string().trim().default("")
});

const phase2DetailSchema = z.object({
  successDefinition: z.string().trim().default(""),
  requiredForPhase1: z.enum(["no", "yes"]).optional(),
  phase1EscalationConfirmed: z.boolean().default(false)
});

const phase2RoadmapSchema = z.object({
  selectedAreas: z.array(phase2AreaEnum).default([]),
  noScopeDefined: z.boolean().default(false),
  otherArea: z.string().trim().default(""),
  details: z.object({
    workItemEnhancements: phase2DetailSchema,
    customerInteractionTracking: phase2DetailSchema,
    trainingManagement: phase2DetailSchema,
    assetEquipment: phase2DetailSchema,
    internalTicketing: phase2DetailSchema,
    communicationTools: phase2DetailSchema,
    other: phase2DetailSchema
  }),
  priorityRanking: z.array(z.string().trim()).default(["", "", ""]),
  expectedTimeline: phase2TimelineEnum.optional(),
  deferredModules: z.array(phase2ModuleEnum).default([])
});

const phase3RoadmapSchema = z.object({
  selectedCapabilities: z.array(phase3CapabilityEnum).default([]),
  otherCapability: z.string().trim().default(""),
  capabilityDetails: z.object({
    predictiveRiskDetection: z.string().trim().default(""),
    performanceDegradationAlerts: z.string().trim().default(""),
    locationHealthScoring: z.string().trim().default(""),
    managerPerformanceScorecards: z.string().trim().default(""),
    automatedRecommendations: z.string().trim().default(""),
    regionalTrendAnalysis: z.string().trim().default(""),
    forecasting: z.string().trim().default(""),
    anomalyDetection: z.string().trim().default(""),
    aiGeneratedInsights: z.string().trim().default(""),
    other: z.string().trim().default("")
  }),
  dataSources: z.array(phase3DataSourceEnum).default([]),
  otherDataSource: z.string().trim().default(""),
  dataReadiness: phase3DataReadinessEnum,
  timelineExpectation: phase3TimelineExpectationEnum,
  earlyTimelineConfirmed: z.boolean().default(false),
  successMetrics: z.array(z.string().trim()).default([""]),
  aiEnablementPrerequisites: z.string().trim().default(""),
  aiGovernanceOwner: z.string().trim().default("")
});

export const discoveryFormSchema = z
  .object({
    phase1Scope: phase1ScopeSchema,
    criticality: criticalitySchema,
    currentBaseline: currentBaselineSchema,
    mobileRequirements: mobileRequirementsSchema,
    offlineRequirements: offlineRequirementsSchema,
    integrations: integrationsSchema,
    analyticsAi: analyticsAiSchema,
    workflows: workflowsSchema,
    scale: scaleSchema,
    delivery: deliverySchema,
    phase1Confirmation: phase1ConfirmationSchema,
    phase2Roadmap: phase2RoadmapSchema,
    phase3Roadmap: phase3RoadmapSchema
  })
  .superRefine((values, ctx) => {
    values.phase1Scope.selectedFeatures.forEach((feature) => {
      addSpecificityIssue(
        ctx,
        ["phase1Scope", "featureDetails", feature],
        `Day 1 detail for ${feature}`,
        values.phase1Scope.featureDetails[feature],
        { minWords: 15, requireActionVerb: true }
      );
    });

    if (values.phase1Scope.selectedFeatures.includes("other")) {
      addSpecificityIssue(
        ctx,
        ["phase1Scope", "otherFeature"],
        "Other Day 1 feature",
        values.phase1Scope.otherFeature,
        { minWords: 3 }
      );
    }

    addSpecificityIssue(
      ctx,
      ["phase1Scope", "failEvidenceStandard"],
      "Failure evidence rule",
      values.phase1Scope.failEvidenceStandard,
      { minWords: 12, requiredSubstrings: ["photo", "comment"] }
    );

    addSpecificityIssue(
      ctx,
      ["phase1Scope", "jointInspectionExpectation"],
      "Joint inspection expectation",
      values.phase1Scope.jointInspectionExpectation,
      { minWords: 10 }
    );

    if (values.criticality.consequences.length < 3) {
      ctx.addIssue({
        code: "custom",
        path: ["criticality", "consequences"],
        message: "List at least 3 consequences for a 24-hour outage."
      });
    }

    values.criticality.consequences.forEach((item, index) => {
      addSpecificityIssue(ctx, ["criticality", "consequences", index], "Outage consequence", item, { minWords: 10 });
    });

    const systemsToday = values.currentBaseline.systemsToday.filter(Boolean);
    const mustReplace = values.currentBaseline.mustReplace.filter(Boolean);
    const canDefer = values.currentBaseline.canDefer.filter(Boolean);

    if (systemsToday.length < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["currentBaseline", "systemsToday"],
        message: "List at least one current system."
      });
    }

    if (mustReplace.length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["currentBaseline", "mustReplace"],
        message: "List at least two items that must be replaced."
      });
    }

    if (canDefer.length < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["currentBaseline", "canDefer"],
        message: "List at least one item that can be deferred."
      });
    }

    systemsToday.forEach((item, index) => {
      addSpecificityIssue(ctx, ["currentBaseline", "systemsToday", index], "Current system entry", item, { minWords: 2 });
    });

    mustReplace.forEach((item, index) => {
      addSpecificityIssue(ctx, ["currentBaseline", "mustReplace", index], "Must-replace item", item, { minWords: 2 });
    });

    canDefer.forEach((item, index) => {
      addSpecificityIssue(ctx, ["currentBaseline", "canDefer", index], "Deferred item", item, { minWords: 2 });
    });

    if (!values.currentBaseline.hierarchyRequirement) {
      ctx.addIssue({
        code: "custom",
        path: ["currentBaseline", "hierarchyRequirement"],
        message: "State whether the org->region->site->building->floor->space hierarchy is required at launch."
      });
    }

    if (!values.currentBaseline.spaceTypeGovernance) {
      ctx.addIssue({
        code: "custom",
        path: ["currentBaseline", "spaceTypeGovernance"],
        message: "Select the governance model for space types and inspection points."
      });
    }

    if (values.mobileRequirements.selectedReasons.includes("other")) {
      addSpecificityIssue(
        ctx,
        ["mobileRequirements", "otherExplanation"],
        "Other native mobile reason",
        values.mobileRequirements.otherExplanation,
        { minWords: 8 }
      );
    }

    if (values.mobileRequirements.selectedReasons.includes("offline")) {
      addSpecificityIssue(
        ctx,
        ["mobileRequirements", "offlineDetail"],
        "Offline mobile requirement",
        values.mobileRequirements.offlineDetail,
        { minWords: 14, requiredSubstrings: ["offline"] }
      );

      if (!/\b(hour|hours|day|days|minute|minutes)\b/i.test(values.mobileRequirements.offlineDetail)) {
        ctx.addIssue({
          code: "custom",
          path: ["mobileRequirements", "offlineDetail"],
          message: "Offline mobile requirement must state how long users are expected to operate offline."
        });
      }
    }

    if (values.mobileRequirements.selectedReasons.includes("appStore") && !values.mobileRequirements.appStoreInternalDistributionOk) {
      ctx.addIssue({
        code: "custom",
        path: ["mobileRequirements", "appStoreInternalDistributionOk"],
        message: "State whether TestFlight or internal distribution is acceptable."
      });
    }

    if (values.mobileRequirements.selectedReasons.includes("performance")) {
      addSpecificityIssue(
        ctx,
        ["mobileRequirements", "performanceDetail"],
        "Expected performance issue",
        values.mobileRequirements.performanceDetail,
        { minWords: 10 }
      );
    }

    if (values.offlineRequirements.supportLevel !== "none") {
      addSpecificityIssue(
        ctx,
        ["offlineRequirements", "detail"],
        "Offline support detail",
        values.offlineRequirements.detail,
        { minWords: 14, requiredSubstrings: ["sync"] }
      );

      if (!/\b(hour|hours|day|days|minute|minutes|daily|weekly)\b/i.test(values.offlineRequirements.detail)) {
        ctx.addIssue({
          code: "custom",
          path: ["offlineRequirements", "detail"],
          message: "Offline support detail must include expected sync frequency or offline duration."
        });
      }
    }

    values.integrations.selectedSystems.forEach((system) => {
      const detail = values.integrations.details[system];
      if (!detail.depth) {
        ctx.addIssue({
          code: "custom",
          path: ["integrations", "details", system, "depth"],
          message: "Select the integration depth."
        });
      }

      addSpecificityIssue(
        ctx,
        ["integrations", "details", system, "detail"],
        `${system} integration detail`,
        detail.detail,
        { minWords: 8 }
      );
    });

    if (values.integrations.selectedSystems.includes("other")) {
      addSpecificityIssue(ctx, ["integrations", "otherSystem"], "Other launch integration", values.integrations.otherSystem, {
        minWords: 2
      });
    }

    addSpecificityIssue(
      ctx,
      ["integrations", "adpLatencyTolerance"],
      "ADP sync latency tolerance",
      values.integrations.adpLatencyTolerance,
      { minWords: 8 }
    );

    if (values.analyticsAi.analyticsPhase1.filter(Boolean).length < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["analyticsAi", "analyticsPhase1"],
        message: "List at least one Phase 1 analytics requirement."
      });
    }

    if (values.analyticsAi.analyticsPhase2.filter(Boolean).length < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["analyticsAi", "analyticsPhase2"],
        message: "List at least one Phase 2+ analytics item."
      });
    }

    if (values.analyticsAi.aiPhase1.filter(Boolean).length < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["analyticsAi", "aiPhase1"],
        message: "List at least one Phase 1 AI expectation, even if that expectation is 'none in Phase 1'."
      });
    }

    if (values.analyticsAi.aiPhase2.filter(Boolean).length < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["analyticsAi", "aiPhase2"],
        message: "List at least one Phase 2+ AI expectation."
      });
    }

    ["analyticsPhase1", "analyticsPhase2", "aiPhase1", "aiPhase2"].forEach((field) => {
      const items = values.analyticsAi[field as keyof typeof values.analyticsAi] as string[];
      items.forEach((item, index) => {
        addSpecificityIssue(ctx, ["analyticsAi", field, index], "Analytics / AI item", item, { minWords: 4 });
      });
    });

    addSpecificityIssue(
      ctx,
      ["analyticsAi", "locationHealthScoringModel"],
      "Location health scoring model",
      values.analyticsAi.locationHealthScoringModel,
      { minWords: 12, requiredSubstrings: ["score"] }
    );

    addSpecificityIssue(
      ctx,
      ["analyticsAi", "managementRollupExpectations"],
      "Manager and regional rollup expectations",
      values.analyticsAi.managementRollupExpectations,
      { minWords: 10 }
    );

    if (values.workflows.topDailyWorkflows.length < 3) {
      ctx.addIssue({
        code: "custom",
        path: ["workflows", "topDailyWorkflows"],
        message: "Capture at least 3 daily workflows."
      });
    }

    values.workflows.topDailyWorkflows.forEach((workflow, index) => {
      addSpecificityIssue(ctx, ["workflows", "topDailyWorkflows", index, "actor"], "Workflow actor", workflow.actor, {
        minWords: 2
      });
      addSpecificityIssue(ctx, ["workflows", "topDailyWorkflows", index, "action"], "Workflow action", workflow.action, {
        minWords: 4,
        requireActionVerb: true
      });
      addSpecificityIssue(ctx, ["workflows", "topDailyWorkflows", index, "outcome"], "Workflow outcome", workflow.outcome, {
        minWords: 4
      });
    });

    addSpecificityIssue(
      ctx,
      ["workflows", "workItemUrgencyRules"],
      "Work item urgency and aging rules",
      values.workflows.workItemUrgencyRules,
      { minWords: 12, requiredSubstrings: ["work item"] }
    );

    addSpecificityIssue(
      ctx,
      ["workflows", "assigneeNotificationEscalation"],
      "Assignee notification and escalation behavior",
      values.workflows.assigneeNotificationEscalation,
      { minWords: 10 }
    );

    if (values.workflows.caseTypesInScope.filter(Boolean).length < 3) {
      ctx.addIssue({
        code: "custom",
        path: ["workflows", "caseTypesInScope"],
        message: "List at least 3 case types that must exist at launch."
      });
    }

    values.workflows.caseTypesInScope.forEach((caseType, index) => {
      addSpecificityIssue(ctx, ["workflows", "caseTypesInScope", index], "Case type", caseType, { minWords: 2 });
    });

    addSpecificityIssue(ctx, ["workflows", "caseRoutingModel"], "Case routing model", values.workflows.caseRoutingModel, {
      minWords: 12,
      requiredSubstrings: ["location", "department"]
    });

    addSpecificityIssue(
      ctx,
      ["workflows", "publicSafetyPortalScope"],
      "Public safety portal scope",
      values.workflows.publicSafetyPortalScope,
      { minWords: 10, requiredSubstrings: ["no-login"] }
    );

    addSpecificityIssue(
      ctx,
      ["workflows", "incidentComplianceFlow"],
      "Incident compliance flow",
      values.workflows.incidentComplianceFlow,
      { minWords: 12, requiredSubstrings: ["nurse"] }
    );

    addSpecificityIssue(
      ctx,
      ["delivery", "productionReadyDefinition"],
      "Production-ready definition",
      values.delivery.productionReadyDefinition,
      { minWords: 12 }
    );

    addSpecificityIssue(ctx, ["delivery", "supportLevel"], "Support expectation", values.delivery.supportLevel, {
      minWords: 10
    });

    if (values.phase1Confirmation.phase1OnlyConfirmed === "no") {
      ctx.addIssue({
        code: "custom",
        path: ["phase1Confirmation", "phase1OnlyConfirmed"],
        message: "Update Phase 1 selections before continuing."
      });
    }

    if (values.phase1Confirmation.advancedAiInPhase1 === "yes") {
      addSpecificityIssue(
        ctx,
        ["phase1Confirmation", "advancedAiExplanation"],
        "Advanced analytics / AI in Phase 1 explanation",
        values.phase1Confirmation.advancedAiExplanation,
        { minWords: 12 }
      );
    }

    if (values.phase2Roadmap.selectedAreas.length === 0 && !values.phase2Roadmap.noScopeDefined) {
      ctx.addIssue({
        code: "custom",
        path: ["phase2Roadmap", "selectedAreas"],
        message: "Select at least one Phase 2 area or explicitly mark no Phase 2 scope."
      });
    }

    if (values.phase2Roadmap.selectedAreas.length > 0 && values.phase2Roadmap.noScopeDefined) {
      ctx.addIssue({
        code: "custom",
        path: ["phase2Roadmap", "noScopeDefined"],
        message: "No Phase 2 scope cannot be enabled when Phase 2 areas are selected."
      });
    }

    if (values.phase2Roadmap.selectedAreas.includes("other")) {
      addSpecificityIssue(ctx, ["phase2Roadmap", "otherArea"], "Other Phase 2 area", values.phase2Roadmap.otherArea, { minWords: 2 });
    }

    values.phase2Roadmap.selectedAreas.forEach((area) => {
      const detail = values.phase2Roadmap.details[area];
      addSpecificityIssue(
        ctx,
        ["phase2Roadmap", "details", area, "successDefinition"],
        `Phase 2 success definition for ${area}`,
        detail.successDefinition,
        { minWords: 20, requireActionVerb: true }
      );

      if (!detail.requiredForPhase1) {
        ctx.addIssue({
          code: "custom",
          path: ["phase2Roadmap", "details", area, "requiredForPhase1"],
          message: "State whether this item is required for Phase 1."
        });
      }

      if (detail.requiredForPhase1 === "yes" && !detail.phase1EscalationConfirmed) {
        ctx.addIssue({
          code: "custom",
          path: ["phase2Roadmap", "details", area, "phase1EscalationConfirmed"],
          message: "Confirm complexity increase to classify this as Phase 1."
        });
      }
    });

    if (values.phase2Roadmap.selectedAreas.length > 0) {
      const ranked = values.phase2Roadmap.priorityRanking.filter(Boolean);
      if (ranked.length < 3) {
        ctx.addIssue({
          code: "custom",
          path: ["phase2Roadmap", "priorityRanking"],
          message: "Rank at least top 3 Phase 2 priorities."
        });
      }

      if (!values.phase2Roadmap.expectedTimeline) {
        ctx.addIssue({
          code: "custom",
          path: ["phase2Roadmap", "expectedTimeline"],
          message: "Set an expected timeline for Phase 2."
        });
      }
    }

    if (values.phase2Roadmap.deferredModules.length < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["phase2Roadmap", "deferredModules"],
        message: "Select at least one intentional Phase 2 deferred module."
      });
    }

    if (values.phase3Roadmap.selectedCapabilities.length < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["phase3Roadmap", "selectedCapabilities"],
        message: "Select at least one long-term AI / predictive capability."
      });
    }

    if (values.phase3Roadmap.selectedCapabilities.includes("other")) {
      addSpecificityIssue(
        ctx,
        ["phase3Roadmap", "otherCapability"],
        "Other Phase 3 capability",
        values.phase3Roadmap.otherCapability,
        { minWords: 2 }
      );
    }

    values.phase3Roadmap.selectedCapabilities.forEach((capability) => {
      addSpecificityIssue(
        ctx,
        ["phase3Roadmap", "capabilityDetails", capability],
        `Phase 3 detail for ${capability}`,
        values.phase3Roadmap.capabilityDetails[capability],
        { minWords: 25, requiredSubstrings: ["input", "output", "user"] }
      );
    });

    if (values.phase3Roadmap.dataSources.length < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["phase3Roadmap", "dataSources"],
        message: "Select at least one data source for Phase 3 capabilities."
      });
    }

    if (values.phase3Roadmap.dataSources.includes("other")) {
      addSpecificityIssue(
        ctx,
        ["phase3Roadmap", "otherDataSource"],
        "Other data source",
        values.phase3Roadmap.otherDataSource,
        { minWords: 2 }
      );
    }

    if ((values.phase3Roadmap.timelineExpectation === "phase1" || values.phase3Roadmap.timelineExpectation === "phase2") && !values.phase3Roadmap.earlyTimelineConfirmed) {
      ctx.addIssue({
        code: "custom",
        path: ["phase3Roadmap", "earlyTimelineConfirmed"],
        message: "Confirm the timeline risk acknowledgment for early AI expectations."
      });
    }

    if (values.phase3Roadmap.successMetrics.filter(Boolean).length < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["phase3Roadmap", "successMetrics"],
        message: "Provide at least one measurable success metric for Phase 3."
      });
    }

    values.phase3Roadmap.successMetrics.forEach((metric, index) => {
      addSpecificityIssue(ctx, ["phase3Roadmap", "successMetrics", index], "Phase 3 success metric", metric, { minWords: 6 });
      if (!/\d|%/i.test(metric)) {
        ctx.addIssue({
          code: "custom",
          path: ["phase3Roadmap", "successMetrics", index],
          message: "Success metric must include a measurable number or percentage."
        });
      }
    });

    addSpecificityIssue(
      ctx,
      ["phase3Roadmap", "aiEnablementPrerequisites"],
      "AI enablement prerequisites",
      values.phase3Roadmap.aiEnablementPrerequisites,
      { minWords: 12, requiredSubstrings: ["data"] }
    );

    addSpecificityIssue(ctx, ["phase3Roadmap", "aiGovernanceOwner"], "AI governance owner", values.phase3Roadmap.aiGovernanceOwner, {
      minWords: 2
    });
  });

export type DiscoveryFormValues = z.input<typeof discoveryFormSchema>;
export type DiscoveryValidatedValues = z.output<typeof discoveryFormSchema>;

export const defaultDiscoveryValues: DiscoveryValidatedValues = {
  phase1Scope: {
    selectedFeatures: [],
    otherFeature: "",
    featureDetails: {
      inspections: "",
      workItems: "",
      cases: "",
      dashboards: "",
      teamData: "",
      safety: "",
      training: "",
      other: ""
    },
    inspectionScoringMethod: "hybrid",
    failEvidenceStandard: "",
    jointInspectionExpectation: ""
  },
  criticality: {
    consequences: ["", "", ""]
  },
  currentBaseline: {
    systemsToday: [""],
    mustReplace: ["", ""],
    canDefer: [""],
    mirrorApproach: "modernize",
    hierarchyRequirement: "required",
    spaceTypeGovernance: "hybrid"
  },
  mobileRequirements: {
    selectedReasons: [],
    otherExplanation: "",
    offlineDetail: "",
    appStoreInternalDistributionOk: undefined,
    performanceDetail: ""
  },
  offlineRequirements: {
    supportLevel: "none",
    detail: ""
  },
  integrations: {
    selectedSystems: [],
    otherSystem: "",
    details: {
      adp: { depth: undefined, detail: "" },
      powerBi: { depth: undefined, detail: "" },
      internal: { depth: undefined, detail: "" },
      customer: { depth: undefined, detail: "" },
      other: { depth: undefined, detail: "" }
    },
    adpSyncMode: "nightly_batch",
    adpLatencyTolerance: "",
    powerBiMode: "read_only"
  },
  analyticsAi: {
    analyticsPhase1: [""],
    analyticsPhase2: [""],
    aiPhase1: [""],
    aiPhase2: [""],
    locationHealthScoringModel: "",
    managementRollupExpectations: ""
  },
  workflows: {
    topDailyWorkflows: [
      { actor: "", action: "", outcome: "" },
      { actor: "", action: "", outcome: "" },
      { actor: "", action: "", outcome: "" }
    ],
    workItemUrgencyRules: "",
    assigneeNotificationEscalation: "",
    caseTypesInScope: ["", "", ""],
    caseRoutingModel: "",
    publicSafetyPortalScope: "",
    incidentComplianceFlow: ""
  },
  scale: {
    usersAtLaunch: 50,
    usersIn12Months: 150,
    numberOfSites: 5,
    inspectionsPerDay: 25
  },
  delivery: {
    rapidDeploymentWeeks: 12,
    productionReadyDefinition: "",
    supportLevel: "",
    priorityTradeoff: "quality"
  },
  phase1Confirmation: {
    phase1OnlyConfirmed: "yes",
    advancedAiInPhase1: "no",
    advancedAiExplanation: ""
  },
  phase2Roadmap: {
    selectedAreas: [],
    noScopeDefined: false,
    otherArea: "",
    details: {
      workItemEnhancements: { successDefinition: "", requiredForPhase1: undefined, phase1EscalationConfirmed: false },
      customerInteractionTracking: { successDefinition: "", requiredForPhase1: undefined, phase1EscalationConfirmed: false },
      trainingManagement: { successDefinition: "", requiredForPhase1: undefined, phase1EscalationConfirmed: false },
      assetEquipment: { successDefinition: "", requiredForPhase1: undefined, phase1EscalationConfirmed: false },
      internalTicketing: { successDefinition: "", requiredForPhase1: undefined, phase1EscalationConfirmed: false },
      communicationTools: { successDefinition: "", requiredForPhase1: undefined, phase1EscalationConfirmed: false },
      other: { successDefinition: "", requiredForPhase1: undefined, phase1EscalationConfirmed: false }
    },
    priorityRanking: ["", "", ""],
    expectedTimeline: undefined,
    deferredModules: []
  },
  phase3Roadmap: {
    selectedCapabilities: [],
    otherCapability: "",
    capabilityDetails: {
      predictiveRiskDetection: "",
      performanceDegradationAlerts: "",
      locationHealthScoring: "",
      managerPerformanceScorecards: "",
      automatedRecommendations: "",
      regionalTrendAnalysis: "",
      forecasting: "",
      anomalyDetection: "",
      aiGeneratedInsights: "",
      other: ""
    },
    dataSources: [],
    otherDataSource: "",
    dataReadiness: "unknown",
    timelineExpectation: "phase3",
    earlyTimelineConfirmed: false,
    successMetrics: [""],
    aiEnablementPrerequisites: "",
    aiGovernanceOwner: ""
  }
};

export type DiscoverySection = {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  prompt: string;
  fieldPaths: string[];
  aiObjective: string;
  aiChecklist: string[];
};

export const discoverySections: DiscoverySection[] = [
  {
    id: "phase1",
    title: "Phase 1 scope definition",
    shortTitle: "Scope",
    description: "Identify what must exist at launch and force concrete Day 1 behavior.",
    prompt: "Capture only launch-critical capabilities, inspection evidence rules, and joint inspection expectations for Day 1.",
    fieldPaths: [
      "phase1Scope.selectedFeatures",
      "phase1Scope.otherFeature",
      "phase1Scope.featureDetails",
      "phase1Scope.inspectionScoringMethod",
      "phase1Scope.failEvidenceStandard",
      "phase1Scope.jointInspectionExpectation"
    ],
    aiObjective: "Confirm the Day 1 scope is concrete enough to support scoping and does not hide broad unknowns.",
    aiChecklist: [
      "Every selected feature includes exact launch-day behavior.",
      "Descriptions identify actors, actions, and operational outcomes.",
      "No feature detail uses generic language such as everything or standard."
    ]
  },
  {
    id: "criticality",
    title: "Criticality and failure impact",
    shortTitle: "Criticality",
    description: "Force a concrete articulation of what breaks during a 24-hour outage.",
    prompt: "List at least three consequences with affected actors and blocked work.",
    fieldPaths: ["criticality.consequences"],
    aiObjective: "Verify the outage impact explains exactly what fails, who is affected, and what work stops.",
    aiChecklist: [
      "At least three consequences are provided.",
      "Each consequence names the affected role or team.",
      "Each consequence explains the blocked workflow or missed business outcome."
    ]
  },
  {
    id: "baseline",
    title: "Current system baseline",
    shortTitle: "Baseline",
    description: "Separate current state, must-replace items, and deferrable scope.",
    prompt: "Document the current systems, hierarchy constraints, and replacement boundary.",
    fieldPaths: [
      "currentBaseline.systemsToday",
      "currentBaseline.mustReplace",
      "currentBaseline.canDefer",
      "currentBaseline.mirrorApproach",
      "currentBaseline.hierarchyRequirement",
      "currentBaseline.spaceTypeGovernance"
    ],
    aiObjective: "Ensure the current-state baseline distinguishes mandatory replacement from later scope.",
    aiChecklist: [
      "Current systems are named specifically.",
      "Must-replace items are concrete workflows or tools.",
      "Deferred items are useful but clearly not Phase 1 blockers.",
      "The team has explicitly chosen mirror, modernize, or redesign for the existing app."
    ]
  },
  {
    id: "mobile",
    title: "Mobile and native requirements",
    shortTitle: "Mobile",
    description: "Justify native mobile needs with concrete platform constraints.",
    prompt: "A native app must earn its complexity through explicit requirements.",
    fieldPaths: [
      "mobileRequirements.selectedReasons",
      "mobileRequirements.otherExplanation",
      "mobileRequirements.offlineDetail",
      "mobileRequirements.appStoreInternalDistributionOk",
      "mobileRequirements.performanceDetail"
    ],
    aiObjective: "Challenge whether native mobile is actually justified and identify missing rationale.",
    aiChecklist: [
      "Selected native reasons are operationally specific.",
      "Offline, app-store, and performance follow-ups are fully answered when selected.",
      "The answer makes clear why responsive web alone is insufficient."
    ]
  },
  {
    id: "offline",
    title: "Offline requirements",
    shortTitle: "Offline",
    description: "Define whether offline support is needed and how synchronization should work.",
    prompt: "State the exact workflows, sync model, and offline duration expectations.",
    fieldPaths: ["offlineRequirements.supportLevel", "offlineRequirements.detail"],
    aiObjective: "Determine whether offline support is truly required and whether the sync model is clear enough.",
    aiChecklist: [
      "The answer names the workflows that run offline.",
      "The answer explains how and when data syncs.",
      "The answer states how long users are expected to remain offline."
    ]
  },
  {
    id: "integrations",
    title: "Launch integrations",
    shortTitle: "Integrations",
    description: "Specify every launch integration and the required integration depth.",
    prompt: "Identify only launch-critical systems and define sync operating model expectations.",
    fieldPaths: [
      "integrations.selectedSystems",
      "integrations.otherSystem",
      "integrations.details",
      "integrations.adpSyncMode",
      "integrations.adpLatencyTolerance",
      "integrations.powerBiMode"
    ],
    aiObjective: "Confirm each launch integration has enough detail to estimate delivery risk and dependency work.",
    aiChecklist: [
      "Each integration identifies system name and depth.",
      "Each detail explains data exchanged and the direction of flow.",
      "Launch integrations are separated from later-phase nice-to-haves."
    ]
  },
  {
    id: "analytics-ai",
    title: "Analytics and AI expectations",
    shortTitle: "Analytics",
    description: "Separate Phase 1 deliverables from later analytics and AI ambitions.",
    prompt: "Define concrete outputs, location health scoring logic, and manager/regional rollup expectations.",
    fieldPaths: [
      "analyticsAi.analyticsPhase1",
      "analyticsAi.analyticsPhase2",
      "analyticsAi.aiPhase1",
      "analyticsAi.aiPhase2",
      "analyticsAi.locationHealthScoringModel",
      "analyticsAi.managementRollupExpectations"
    ],
    aiObjective: "Validate that analytics and AI expectations are concrete, phased, and operationally useful.",
    aiChecklist: [
      "Phase 1 and Phase 2 expectations are separated.",
      "Analytics answers describe exact dashboards, metrics, or exports.",
      "AI answers describe outputs rather than generic intelligence."
    ]
  },
  {
    id: "workflows",
    title: "Core workflows",
    shortTitle: "Workflows",
    description: "Capture the top three workflows used daily with actor, action, and outcome.",
    prompt: "Use operational workflows and define launch work item, case routing, and safety execution rules.",
    fieldPaths: [
      "workflows.topDailyWorkflows",
      "workflows.workItemUrgencyRules",
      "workflows.assigneeNotificationEscalation",
      "workflows.caseTypesInScope",
      "workflows.caseRoutingModel",
      "workflows.publicSafetyPortalScope",
      "workflows.incidentComplianceFlow"
    ],
    aiObjective: "Verify the workflows represent real daily operations and can drive solution design.",
    aiChecklist: [
      "At least three workflows are supplied.",
      "Each workflow includes actor, action, and business outcome.",
      "Workflows are operational sequences, not module names."
    ]
  },
  {
    id: "scale",
    title: "Users and scale",
    shortTitle: "Scale",
    description: "Collect numeric operating assumptions needed for architecture and LOE.",
    prompt: "Use exact numbers. Ranges and qualitative answers are rejected.",
    fieldPaths: [
      "scale.usersAtLaunch",
      "scale.usersIn12Months",
      "scale.numberOfSites",
      "scale.inspectionsPerDay"
    ],
    aiObjective: "Check that scale assumptions are plausible, concrete, and useful for architecture sizing.",
    aiChecklist: [
      "All scale answers are numeric.",
      "Numbers reflect launch and 12-month growth assumptions.",
      "The inspection volume and site count can support performance planning."
    ]
  },
  {
    id: "delivery",
    title: "Delivery expectations",
    shortTitle: "Delivery",
    description: "Translate vague delivery language into concrete schedule and readiness criteria.",
    prompt: "Define rapid deployment, production-ready, and support expectations in specific terms.",
    fieldPaths: [
      "delivery.rapidDeploymentWeeks",
      "delivery.productionReadyDefinition",
      "delivery.supportLevel",
      "delivery.priorityTradeoff"
    ],
    aiObjective: "Make delivery language precise enough to align planning and acceptance criteria.",
    aiChecklist: [
      "Rapid deployment is expressed as a numeric timeline.",
      "Production-ready describes concrete operational criteria.",
      "Support expectations include ownership or response expectations.",
      "A clear tradeoff priority is set between quality, speed, and cost."
    ]
  },
  {
    id: "phase1-confirmation",
    title: "Phased roadmap definition: Phase 1 confirmation",
    shortTitle: "Phase 1 confirm",
    description: "Confirm strict Phase 1 boundary and disclose any advanced analytics or AI expectations in Phase 1.",
    prompt: "Verify that Phase 1 includes only the defined replacement scope.",
    fieldPaths: [
      "phase1Confirmation.phase1OnlyConfirmed",
      "phase1Confirmation.advancedAiInPhase1",
      "phase1Confirmation.advancedAiExplanation"
    ],
    aiObjective: "Ensure Phase 1 is tightly bounded and advanced AI expectations are explicitly called out as risk.",
    aiChecklist: [
      "Phase 1-only scope is explicitly confirmed.",
      "Any Phase 1 AI expectation includes concrete detail.",
      "The response avoids vague AI language."
    ]
  },
  {
    id: "phase2-roadmap",
    title: "Phase 2 operational expansion",
    shortTitle: "Phase 2",
    description: "Capture expansion capabilities that are intentionally outside immediate replacement scope.",
    prompt: "Define what expands in Phase 2 and keep it distinct from Phase 1.",
    fieldPaths: [
      "phase2Roadmap.selectedAreas",
      "phase2Roadmap.noScopeDefined",
      "phase2Roadmap.otherArea",
      "phase2Roadmap.details",
      "phase2Roadmap.priorityRanking",
      "phase2Roadmap.expectedTimeline",
      "phase2Roadmap.deferredModules"
    ],
    aiObjective: "Validate that Phase 2 scope is concrete, prioritized, and not bleeding into Phase 1 unintentionally.",
    aiChecklist: [
      "Each selected Phase 2 area has specific success criteria.",
      "Phase 2 items marked as Phase 1 required are acknowledged as complexity risks.",
      "Timeline and top priorities are explicit."
    ]
  },
  {
    id: "phase3-roadmap",
    title: "Phase 3 AI and predictive analytics",
    shortTitle: "Phase 3 AI",
    description: "Define long-term AI capabilities with data readiness and expectation control.",
    prompt: "Set realistic AI expectations with explicit data inputs, outputs, and measurable outcomes.",
    fieldPaths: [
      "phase3Roadmap.selectedCapabilities",
      "phase3Roadmap.otherCapability",
      "phase3Roadmap.capabilityDetails",
      "phase3Roadmap.dataSources",
      "phase3Roadmap.otherDataSource",
      "phase3Roadmap.dataReadiness",
      "phase3Roadmap.timelineExpectation",
      "phase3Roadmap.earlyTimelineConfirmed",
      "phase3Roadmap.successMetrics",
      "phase3Roadmap.aiEnablementPrerequisites",
      "phase3Roadmap.aiGovernanceOwner"
    ],
    aiObjective: "Confirm AI expectations are phased realistically and backed by measurable, data-driven definitions.",
    aiChecklist: [
      "Each capability includes explicit input, output, and user action detail.",
      "Data readiness and timeline expectations are realistic.",
      "Success metrics are measurable, not generic."
    ]
  }
];

const labelMap = {
  inspections: "Inspections",
  workItems: "Work Items",
  cases: "Cases",
  dashboards: "Dashboards",
  teamData: "Team / Employee data",
  safety: "Safety / Incident tracking",
  training: "Training",
  other: "Other"
} as const;

const systemLabelMap = {
  adp: "ADP",
  powerBi: "Power BI",
  internal: "Internal systems",
  customer: "Customer systems",
  other: "Other"
} as const;

const phase2LabelMap = {
  workItemEnhancements: "Work item enhancements",
  customerInteractionTracking: "Customer interaction tracking",
  trainingManagement: "Training management",
  assetEquipment: "Asset & equipment",
  internalTicketing: "Internal ticketing",
  communicationTools: "Communication tools",
  other: "Other"
} as const;

const phase3LabelMap = {
  predictiveRiskDetection: "Predictive risk detection",
  performanceDegradationAlerts: "Performance degradation alerts",
  locationHealthScoring: "Location health scoring",
  managerPerformanceScorecards: "Manager performance scorecards",
  automatedRecommendations: "Automated recommendations (next best action)",
  regionalTrendAnalysis: "Trend analysis across regions",
  forecasting: "Forecasting",
  anomalyDetection: "Anomaly detection",
  aiGeneratedInsights: "AI-generated insights",
  other: "Other"
} as const;

const getIntegrationRiskLevel = (values: DiscoveryValidatedValues): "low" | "medium" | "high" => {
  const bidirectionalCount = values.integrations.selectedSystems.filter(
    (system) => values.integrations.details[system].depth === "bidirectional"
  ).length;
  if (bidirectionalCount >= 2 || values.integrations.selectedSystems.length >= 4) {
    return "high";
  }
  if (bidirectionalCount === 1 || values.integrations.selectedSystems.length >= 2) {
    return "medium";
  }
  return "low";
};

const getOfflineRiskLevel = (values: DiscoveryValidatedValues): "low" | "medium" | "high" => {
  if (values.offlineRequirements.supportLevel === "full") {
    return "high";
  }
  if (values.offlineRequirements.supportLevel === "limited") {
    return "medium";
  }
  return "low";
};

const getAiRiskLevel = (values: DiscoveryValidatedValues): "low" | "medium" | "high" => {
  if (values.phase1Confirmation.advancedAiInPhase1 === "yes" || values.phase3Roadmap.timelineExpectation === "phase1") {
    return "high";
  }
  if (values.phase3Roadmap.timelineExpectation === "phase2") {
    return "medium";
  }
  return "low";
};

export const buildStructuredOutput = (values: DiscoveryValidatedValues) => {
  const phase1Scope = values.phase1Scope.selectedFeatures.map((feature) => ({
    feature: feature === "other" ? values.phase1Scope.otherFeature : labelMap[feature],
    dayOneRequirement: values.phase1Scope.featureDetails[feature]
  }));

  const integrations = values.integrations.selectedSystems.map((system) => ({
    system: system === "other" ? values.integrations.otherSystem : systemLabelMap[system],
    depth: values.integrations.details[system].depth,
    detail: values.integrations.details[system].detail
  }));

  const phase2Features = values.phase2Roadmap.selectedAreas.map((area) => ({
    feature: area === "other" ? values.phase2Roadmap.otherArea : phase2LabelMap[area],
    success_definition: values.phase2Roadmap.details[area].successDefinition,
    required_for_phase1: values.phase2Roadmap.details[area].requiredForPhase1
  }));

  const phase3Capabilities = values.phase3Roadmap.selectedCapabilities.map((capability) => ({
    capability: capability === "other" ? values.phase3Roadmap.otherCapability : phase3LabelMap[capability],
    detail: values.phase3Roadmap.capabilityDetails[capability]
  }));

  const keyRisks = buildRiskAreas(values);
  const scopeBleed = values.phase2Roadmap.selectedAreas.some((area) => values.phase2Roadmap.details[area].requiredForPhase1 === "yes");
  const aiRisk = getAiRiskLevel(values);
  const integrationRisk = getIntegrationRiskLevel(values);
  const offlineRisk = getOfflineRiskLevel(values);
  const phase1RiskLevel = aiRisk === "high" || integrationRisk === "high" || offlineRisk === "high" ? "high" : "medium";
  const phase2Loe = values.phase2Roadmap.selectedAreas.length >= 5 ? "large" : values.phase2Roadmap.selectedAreas.length >= 3 ? "medium" : "small";
  const phase3Loe = values.phase3Roadmap.selectedCapabilities.length >= 4 ? "very_large" : "large";
  const definitionOfDone = [
    "All selected Phase 1 capabilities are operational in production for target launch sites and users.",
    values.delivery.productionReadyDefinition,
    values.delivery.supportLevel
  ];
  const scopePlanningAgenda = [
    "Review each included Phase 1 requirement and confirm acceptance criteria by workflow.",
    "Validate integration ownership, data contracts, and dependency sequencing for launch systems.",
    `Align delivery plan to ${values.delivery.rapidDeploymentWeeks} weeks with ${values.delivery.priorityTradeoff} as the governing tradeoff priority.`,
    "Confirm release readiness gates, support model, and post-launch stabilization plan."
  ];

  return {
    phase1_scope: phase1Scope,
    inspection_operating_model: {
      scoring_method: values.phase1Scope.inspectionScoringMethod,
      fail_evidence_standard: values.phase1Scope.failEvidenceStandard,
      joint_inspection_expectation: values.phase1Scope.jointInspectionExpectation
    },
    phase1_definition_of_done: definitionOfDone,
    mobile_requirements: {
      native_reasons: values.mobileRequirements.selectedReasons,
      other_reason: values.mobileRequirements.otherExplanation || undefined,
      offline_detail: values.mobileRequirements.offlineDetail || undefined,
      app_store_internal_distribution_ok: values.mobileRequirements.appStoreInternalDistributionOk,
      performance_detail: values.mobileRequirements.performanceDetail || undefined
    },
    offline_requirements: {
      support_level: values.offlineRequirements.supportLevel,
      detail: values.offlineRequirements.detail || undefined
    },
    baseline: {
      systems_today: values.currentBaseline.systemsToday,
      must_replace: values.currentBaseline.mustReplace,
      can_defer: values.currentBaseline.canDefer,
      current_app_strategy: values.currentBaseline.mirrorApproach,
      hierarchy_requirement: values.currentBaseline.hierarchyRequirement,
      space_type_governance: values.currentBaseline.spaceTypeGovernance
    },
    priority_tradeoff: values.delivery.priorityTradeoff,
    current_app_strategy: values.currentBaseline.mirrorApproach,
    delivery_expectations: {
      phase1_timeline_weeks: values.delivery.rapidDeploymentWeeks,
      production_ready_definition: values.delivery.productionReadyDefinition,
      support_model: values.delivery.supportLevel,
      priority_tradeoff: values.delivery.priorityTradeoff
    },
    scope_planning_agenda: scopePlanningAgenda,
    phase_breakdown: {
      phase_1: {
        features: phase1Scope,
        risk_level: phase1RiskLevel
      },
      phase_2: {
        features: phase2Features,
        priority_order: values.phase2Roadmap.priorityRanking.filter(Boolean),
        expected_timeline: values.phase2Roadmap.expectedTimeline ?? "not_defined",
        deferred_modules: values.phase2Roadmap.deferredModules
      },
      phase_3: {
        capabilities: phase3Capabilities,
        data_readiness: values.phase3Roadmap.dataReadiness,
        timeline_expectation: values.phase3Roadmap.timelineExpectation,
        enablement_prerequisites: values.phase3Roadmap.aiEnablementPrerequisites,
        governance_owner: values.phase3Roadmap.aiGovernanceOwner
      }
    },
    risk_analysis: {
      scope_bleed: scopeBleed,
      ai_risk: aiRisk,
      integration_risk: integrationRisk,
      offline_risk: offlineRisk
    },
    recommendation: {
      suggested_phase_1_scope: phase1Scope,
      deferred_items: values.currentBaseline.canDefer,
      architecture_notes: buildArchitectureDirection(values)
    },
    loe_assessment: {
      phase_1: classifyLoe(values).classification.toLowerCase(),
      phase_2: phase2Loe,
      phase_3: phase3Loe
    },
    integrations,
    integration_operating_model: {
      adp_sync_mode: values.integrations.adpSyncMode,
      adp_latency_tolerance: values.integrations.adpLatencyTolerance,
      power_bi_mode: values.integrations.powerBiMode
    },
    analytics_operating_model: {
      location_health_scoring_model: values.analyticsAi.locationHealthScoringModel,
      management_rollup_expectations: values.analyticsAi.managementRollupExpectations
    },
    operations_controls: {
      work_item_urgency_rules: values.workflows.workItemUrgencyRules,
      assignee_notification_escalation: values.workflows.assigneeNotificationEscalation,
      case_types_in_scope: values.workflows.caseTypesInScope,
      case_routing_model: values.workflows.caseRoutingModel,
      public_safety_portal_scope: values.workflows.publicSafetyPortalScope,
      incident_compliance_flow: values.workflows.incidentComplianceFlow
    },
    workflows: values.workflows.topDailyWorkflows,
    scale: values.scale,
    risks: keyRisks
  };
};

const buildRiskAreas = (values: DiscoveryValidatedValues) => {
  const risks: string[] = [];

  if (values.mobileRequirements.selectedReasons.length > 0) {
    risks.push("Native mobile scope introduces separate distribution, device, and QA paths.");
  }

  if (values.offlineRequirements.supportLevel === "full") {
    risks.push("Full offline support requires sync conflict handling, local persistence, and operational retry logic.");
  }

  const bidirectionalCount = values.integrations.selectedSystems.filter(
    (system) => values.integrations.details[system].depth === "bidirectional"
  ).length;

  if (bidirectionalCount > 0) {
    risks.push("Real-time bidirectional integrations increase dependency coordination and test matrix complexity.");
  }

  if (values.scale.usersIn12Months > values.scale.usersAtLaunch * 3) {
    risks.push("Aggressive user growth may require multi-site scaling and stronger operational observability from day one.");
  }

  if (values.delivery.rapidDeploymentWeeks <= 8) {
    risks.push("The requested deployment timeline is compressed relative to the scope described.");
  }

  return risks;
};

const buildComplexityDrivers = (values: DiscoveryValidatedValues) => {
  const drivers = [
    `${values.phase1Scope.selectedFeatures.length} Day 1 capability areas are in launch scope.`,
    `${values.integrations.selectedSystems.length} integrations are required at launch.`,
    `Offline support level is ${values.offlineRequirements.supportLevel}.`,
    `${values.scale.usersAtLaunch} users at launch growing to ${values.scale.usersIn12Months} within 12 months.`
  ];

  if (values.mobileRequirements.selectedReasons.length > 0) {
    drivers.push(`Native mobile justification includes: ${values.mobileRequirements.selectedReasons.join(", ")}.`);
  }

  return drivers;
};

const buildArchitectureDirection = (values: DiscoveryValidatedValues) => {
  const recommendations = ["Use a modular web platform with workflow services, role-aware access control, and explicit audit trails."];

  if (values.mobileRequirements.selectedReasons.length > 0 || values.offlineRequirements.supportLevel !== "none") {
    recommendations.push("Plan for a shared domain layer with an offline-capable client strategy and sync orchestration.");
  }

  if (values.integrations.selectedSystems.length > 0) {
    recommendations.push("Isolate integrations behind connector services or event-driven adapters instead of coupling them to UI workflows.");
  }

  if (values.scale.numberOfSites > 20 || values.scale.usersIn12Months > 500) {
    recommendations.push("Include tenant-aware configuration, observability, and performance budgets early in architecture decisions.");
  }

  return recommendations.join(" ");
};

export const buildReadableSummary = (values: DiscoveryValidatedValues) => ({
  phase1Scope: values.phase1Scope.selectedFeatures
    .map((feature) => `${feature === "other" ? values.phase1Scope.otherFeature : labelMap[feature]}: ${values.phase1Scope.featureDetails[feature]}`)
    .join("\n"),
  keyComplexityDrivers: buildComplexityDrivers(values),
  riskAreas: buildRiskAreas(values),
  recommendedArchitectureDirection: buildArchitectureDirection(values)
});

export type LoeClassification = "Small" | "Medium" | "Large";

export const classifyLoe = (values: DiscoveryValidatedValues) => {
  let score = 0;

  score += values.phase1Scope.selectedFeatures.length;
  score += values.integrations.selectedSystems.length;

  if (values.offlineRequirements.supportLevel === "limited") {
    score += 2;
  }

  if (values.offlineRequirements.supportLevel === "full") {
    score += 4;
  }

  if (values.mobileRequirements.selectedReasons.length > 0) {
    score += 2;
  }

  score += values.integrations.selectedSystems.filter(
    (system) => values.integrations.details[system].depth === "bidirectional"
  ).length;

  if (values.scale.usersIn12Months > 500) {
    score += 2;
  }

  if (values.delivery.rapidDeploymentWeeks <= 8) {
    score += 2;
  }

  let classification: LoeClassification = "Small";
  let range = "2-4 months";

  if (score >= 8 && score < 14) {
    classification = "Medium";
    range = "4-8 months";
  }

  if (score >= 14) {
    classification = "Large";
    range = "8-18+ months";
  }

  return {
    classification,
    range,
    rationale: buildComplexityDrivers(values)
  };
};

export const aiReviewResponseSchema = z.object({
  status: z.enum(["pass", "needs_clarification"]),
  confidence: z.number().min(0).max(1),
  summary: z.string().min(1),
  missingDetails: z.array(z.string()).max(5),
  vaguePoints: z.array(z.string()).max(5),
  followUpQuestions: z.array(z.string()).max(5),
  suggestedNextChecks: z.array(z.string()).max(5)
});

export type AiReviewResponse = z.output<typeof aiReviewResponseSchema>;

export const aiReviewRequestSchema = z.object({
  sectionId: z.string(),
  sectionTitle: z.string(),
  objective: z.string(),
  checklist: z.array(z.string()),
  questionLabel: z.string().optional(),
  fieldPath: z.string().optional(),
  sectionData: z.unknown(),
  fullSnapshot: z.unknown(),
  aiProvider: z.enum(["auto", "gemini", "openai", "zai", "kimi"]).optional()
});

export type AiReviewRequest = z.input<typeof aiReviewRequestSchema>;
