import type { DefaultValues, FieldPath } from "react-hook-form";
import { z } from "zod";

const requestTypeOptions = ["feature", "bug", "content", "integration", "other"] as const;
const urgencyOptions = ["low", "normal", "high", "critical"] as const;
const yesNoOptions = ["yes", "no"] as const;

const VAGUE_PHRASES = [
  "something like",
  "etc",
  "and so on",
  "asap",
  "soon",
  "good",
  "better",
  "nice",
  "stuff",
  "things",
  "maybe",
  "somehow"
] as const;

const MIN_SPECIFIC_WORDS = 8;

const textInput = () => z.string().trim();
const optionalTextInput = () => textInput().optional();
const urlArrayInput = () => z.array(z.string().trim()).default([]);

const countSpecificWords = (value: string) =>
  value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length >= 3).length;

const findVaguePhrase = (value: string) => {
  const normalized = value.toLowerCase();
  return VAGUE_PHRASES.find((phrase) => normalized.includes(phrase));
};

const addSpecificityIssue = (
  value: string,
  ctx: z.RefinementCtx,
  path: (string | number)[],
  label: string
) => {
  if (!value) {
    return;
  }

  if (countSpecificWords(value) < MIN_SPECIFIC_WORDS) {
    ctx.addIssue({
      code: "custom",
      path,
      message: `${label} needs more concrete detail. Include actors, actions, constraints, or examples.`
    });
  }

  const vaguePhrase = findVaguePhrase(value);
  if (vaguePhrase) {
    ctx.addIssue({
      code: "custom",
      path,
      message: `${label} is too vague because it includes "${vaguePhrase}". Replace it with measurable detail.`
    });
  }
};

const maybeUrl = z
  .string()
  .trim()
  .url("Enter a valid URL.")
  .or(z.literal(""));

const FormSchemaBase = z.object({
  requestType: z.enum(requestTypeOptions),
  requestTitle: textInput().min(10, "Title must be at least 10 characters."),
  problemStatement: textInput().min(30, "Problem statement must be at least 30 characters."),
  desiredOutcome: textInput().min(30, "Desired outcome must be at least 30 characters."),
  audience: textInput().min(15, "Audience must be at least 15 characters."),
  successMetrics: textInput().min(20, "Success metrics must be at least 20 characters."),
  urgency: z.enum(urgencyOptions),
  deadlineKnown: z.enum(yesNoOptions),
  deadlineDate: optionalTextInput(),
  existingSystem: z.enum(yesNoOptions),
  currentWorkflow: optionalTextInput(),
  blockers: z.array(textInput().min(5, "Blocker entries must be at least 5 characters.")).default([]),
  requiresIntegrations: z.enum(yesNoOptions),
  integrationSystems: z.array(textInput().min(2, "Integration names must be at least 2 characters.")).default([]),
  supportingLinks: urlArrayInput(),
  exampleReferences: z.array(maybeUrl).default([]),
  additionalNotes: optionalTextInput(),
  contactName: textInput().min(2, "Contact name must be at least 2 characters."),
  contactEmail: z.email("Enter a valid email address."),
  contactTeam: textInput().min(2, "Team must be at least 2 characters.")
});

const FormSchema = FormSchemaBase.superRefine((values, ctx) => {
    addSpecificityIssue(values.problemStatement, ctx, ["problemStatement"], "Problem statement");
    addSpecificityIssue(values.desiredOutcome, ctx, ["desiredOutcome"], "Desired outcome");
    addSpecificityIssue(values.audience, ctx, ["audience"], "Audience");
    addSpecificityIssue(values.successMetrics, ctx, ["successMetrics"], "Success metrics");

    if (values.deadlineKnown === "yes" && !values.deadlineDate) {
      ctx.addIssue({
        code: "custom",
        path: ["deadlineDate"],
        message: "Deadline date is required when a deadline is known."
      });
    }

    if (values.deadlineKnown === "yes" && values.deadlineDate) {
      const parsedDate = Date.parse(values.deadlineDate);
      if (Number.isNaN(parsedDate)) {
        ctx.addIssue({
          code: "custom",
          path: ["deadlineDate"],
          message: "Deadline date must be a valid date."
        });
      }
    }

    if (values.existingSystem === "yes") {
      if (!values.currentWorkflow || values.currentWorkflow.length < 20) {
        ctx.addIssue({
          code: "custom",
          path: ["currentWorkflow"],
          message: "Describe the current workflow when an existing system is involved."
        });
      } else {
        addSpecificityIssue(values.currentWorkflow, ctx, ["currentWorkflow"], "Current workflow");
      }
    }

    if (values.requiresIntegrations === "yes" && values.integrationSystems.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["integrationSystems"],
        message: "List at least one integration system."
      });
    }

    values.exampleReferences.forEach((reference, index) => {
      if (!reference) {
        return;
      }

      const result = z.url().safeParse(reference);
      if (!result.success) {
        ctx.addIssue({
          code: "custom",
          path: ["exampleReferences", index],
          message: "Example references must be valid URLs or blank placeholders."
        });
      }
    });
});

export type QuestionnaireFormValues = z.input<typeof FormSchema>;
export type QuestionnaireValidatedValues = z.output<typeof FormSchema>;

export const questionnaireSchema = FormSchema;

export const defaultQuestionnaireValues: DefaultValues<QuestionnaireFormValues> = {
  requestType: "feature",
  requestTitle: "",
  problemStatement: "",
  desiredOutcome: "",
  audience: "",
  successMetrics: "",
  urgency: "normal",
  deadlineKnown: "no",
  deadlineDate: undefined,
  existingSystem: "no",
  currentWorkflow: undefined,
  blockers: [],
  requiresIntegrations: "no",
  integrationSystems: [],
  supportingLinks: [],
  exampleReferences: [""],
  additionalNotes: undefined,
  contactName: "",
  contactEmail: "",
  contactTeam: ""
};

export type QuestionnaireSectionId =
  | "overview"
  | "scope"
  | "delivery"
  | "systems"
  | "references"
  | "contact";

export type QuestionnaireBranchPredicate = (values: QuestionnaireFormValues) => boolean;

export type QuestionnaireFieldConfig = {
  path: FieldPath<QuestionnaireFormValues>;
  label: string;
  required?: boolean;
  visibleWhen?: QuestionnaireBranchPredicate;
};

export type QuestionnaireSection = {
  id: QuestionnaireSectionId;
  title: string;
  description: string;
  visibleWhen?: QuestionnaireBranchPredicate;
  fields: QuestionnaireFieldConfig[];
};

export type QuestionnaireBranchRule = {
  id: string;
  condition: string;
  effect: string;
};

export type QuestionnaireValidationRule = {
  id: string;
  scope: string;
  rule: string;
};

export type QuestionnaireOutputDefinition = {
  id: "json" | "report" | "loe";
  label: string;
  description: string;
};

export const branchingPredicates = {
  hasDeadline: (values: QuestionnaireFormValues) => values.deadlineKnown === "yes",
  hasExistingSystem: (values: QuestionnaireFormValues) => values.existingSystem === "yes",
  hasIntegrations: (values: QuestionnaireFormValues) => values.requiresIntegrations === "yes",
  hasReferences: (values: QuestionnaireFormValues) =>
    (values.supportingLinks?.length ?? 0) > 0 ||
    (values.exampleReferences?.some((reference) => reference.trim().length > 0) ?? false)
} satisfies Record<string, QuestionnaireBranchPredicate>;

export const questionnaireSections: QuestionnaireSection[] = [
  {
    id: "overview",
    title: "Request overview",
    description: "Identify the request and explain the business problem.",
    fields: [
      { path: "requestType", label: "Request type", required: true },
      { path: "requestTitle", label: "Title", required: true },
      { path: "problemStatement", label: "Problem statement", required: true }
    ]
  },
  {
    id: "scope",
    title: "Scope and success",
    description: "Clarify who this is for and how success should be measured.",
    fields: [
      { path: "desiredOutcome", label: "Desired outcome", required: true },
      { path: "audience", label: "Audience", required: true },
      { path: "successMetrics", label: "Success metrics", required: true },
      { path: "blockers", label: "Known blockers" }
    ]
  },
  {
    id: "delivery",
    title: "Timing",
    description: "Capture urgency and any concrete deadline.",
    fields: [
      { path: "urgency", label: "Urgency", required: true },
      { path: "deadlineKnown", label: "Deadline known", required: true },
      {
        path: "deadlineDate",
        label: "Deadline date",
        visibleWhen: branchingPredicates.hasDeadline
      }
    ]
  },
  {
    id: "systems",
    title: "Systems and integrations",
    description: "Describe the current environment and external dependencies.",
    fields: [
      { path: "existingSystem", label: "Existing system", required: true },
      {
        path: "currentWorkflow",
        label: "Current workflow",
        visibleWhen: branchingPredicates.hasExistingSystem
      },
      { path: "requiresIntegrations", label: "Requires integrations", required: true },
      {
        path: "integrationSystems",
        label: "Integration systems",
        visibleWhen: branchingPredicates.hasIntegrations
      }
    ]
  },
  {
    id: "references",
    title: "References",
    description: "Provide examples, supporting material, and extra context.",
    fields: [
      { path: "supportingLinks", label: "Supporting links" },
      { path: "exampleReferences", label: "Example references" },
      { path: "additionalNotes", label: "Additional notes" }
    ]
  },
  {
    id: "contact",
    title: "Contact",
    description: "Identify the request owner for follow-up.",
    fields: [
      { path: "contactName", label: "Contact name", required: true },
      { path: "contactEmail", label: "Contact email", required: true },
      { path: "contactTeam", label: "Contact team", required: true }
    ]
  }
];

export const getVisibleSections = (values: QuestionnaireFormValues) =>
  questionnaireSections.filter((section) => (section.visibleWhen ? section.visibleWhen(values) : true));

export const getVisibleFields = (values: QuestionnaireFormValues) =>
  getVisibleSections(values).flatMap((section) =>
    section.fields.filter((field) => (field.visibleWhen ? field.visibleWhen(values) : true))
  );

export const questionnaireBranchingRules: QuestionnaireBranchRule[] = [
  {
    id: "deadline-date",
    condition: "`deadlineKnown` is `yes`",
    effect: "Reveal and require `deadlineDate`."
  },
  {
    id: "current-workflow",
    condition: "`existingSystem` is `yes`",
    effect: "Reveal and require a concrete `currentWorkflow` description."
  },
  {
    id: "integration-systems",
    condition: "`requiresIntegrations` is `yes`",
    effect: "Reveal and require at least one item in `integrationSystems`."
  },
  {
    id: "reference-summary",
    condition: "Any reference URL field contains a non-blank value",
    effect: "Mark the references path as active for downstream summaries and reporting."
  }
];

export const antiVaguenessRules: QuestionnaireValidationRule[] = [
  {
    id: "specificity-threshold",
    scope: "Specificity",
    rule: `Narrative fields must contain at least ${MIN_SPECIFIC_WORDS} words with 3+ characters.`
  },
  {
    id: "vague-phrases",
    scope: "Specificity",
    rule: `Narrative fields reject vague phrases such as ${VAGUE_PHRASES.map((phrase) => `"${phrase}"`).join(", ")}.`
  }
];

export const questionnaireValidationRules: QuestionnaireValidationRule[] = [
  {
    id: "required-core-fields",
    scope: "Required fields",
    rule: "Request overview, success criteria, urgency, and contact ownership are always required."
  },
  {
    id: "minimum-detail",
    scope: "Minimum detail",
    rule: "Key narrative fields have minimum character counts before specificity checks run."
  },
  {
    id: "deadline-branch",
    scope: "Conditional fields",
    rule: "A valid `deadlineDate` is required only when `deadlineKnown` is `yes`."
  },
  {
    id: "system-branch",
    scope: "Conditional fields",
    rule: "A concrete `currentWorkflow` is required only when `existingSystem` is `yes`."
  },
  {
    id: "integration-branch",
    scope: "Conditional fields",
    rule: "`integrationSystems` must contain at least one entry only when `requiresIntegrations` is `yes`."
  },
  {
    id: "reference-urls",
    scope: "Reference URLs",
    rule: "Reference collections accept blank placeholders during editing, but emitted outputs contain only valid URLs."
  },
  ...antiVaguenessRules
];

const sanitizeString = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const sanitizeStringList = (values: string[]) => values.map((value) => value.trim()).filter(Boolean);

export const QuestionnaireSubmissionSchema = z.object({
  summary: z.object({
    title: z.string(),
    type: z.enum(requestTypeOptions),
    urgency: z.enum(urgencyOptions)
  }),
  request: z.object({
    problemStatement: z.string(),
    desiredOutcome: z.string(),
    audience: z.string(),
    successMetrics: z.string(),
    blockers: z.array(z.string())
  }),
  delivery: z.object({
    deadlineDate: z.string().optional()
  }),
  systems: z.object({
    currentWorkflow: z.string().optional(),
    integrationSystems: z.array(z.string())
  }),
  references: z.object({
    supportingLinks: z.array(z.string().url()),
    exampleReferences: z.array(z.string().url()),
    additionalNotes: z.string().optional()
  }),
  contact: z.object({
    name: z.string(),
    email: z.email(),
    team: z.string()
  })
});

export type QuestionnaireSubmission = z.output<typeof QuestionnaireSubmissionSchema>;

export const toQuestionnaireSubmission = (
  values: QuestionnaireValidatedValues
): QuestionnaireSubmission => {
  const submission = {
    summary: {
      title: values.requestTitle,
      type: values.requestType,
      urgency: values.urgency
    },
    request: {
      problemStatement: values.problemStatement,
      desiredOutcome: values.desiredOutcome,
      audience: values.audience,
      successMetrics: values.successMetrics,
      blockers: sanitizeStringList(values.blockers)
    },
    delivery: {
      deadlineDate: sanitizeString(values.deadlineDate)
    },
    systems: {
      currentWorkflow: sanitizeString(values.currentWorkflow),
      integrationSystems: sanitizeStringList(values.integrationSystems)
    },
    references: {
      supportingLinks: sanitizeStringList(values.supportingLinks),
      exampleReferences: sanitizeStringList(values.exampleReferences),
      additionalNotes: sanitizeString(values.additionalNotes)
    },
    contact: {
      name: values.contactName,
      email: values.contactEmail,
      team: values.contactTeam
    }
  };

  return QuestionnaireSubmissionSchema.parse(submission);
};

export const QuestionnaireReportSchema = z.object({
  headline: z.string(),
  executiveSummary: z.string(),
  sectionNarrative: z.array(
    z.object({
      sectionId: z.string(),
      title: z.string(),
      detail: z.string()
    })
  ),
  risks: z.array(z.string()),
  openQuestions: z.array(z.string()),
  recommendedNextStep: z.string()
});

export type QuestionnaireReport = z.output<typeof QuestionnaireReportSchema>;

const buildRiskList = (values: QuestionnaireValidatedValues) => {
  const risks: string[] = [];

  if (values.urgency === "critical" && values.deadlineKnown === "no") {
    risks.push("Urgency is marked critical but no committed deadline is defined.");
  }

  if (values.requiresIntegrations === "yes" && values.integrationSystems.length > 2) {
    risks.push("Multiple integrations increase delivery coordination and testing complexity.");
  }

  if (values.blockers.length > 0) {
    risks.push(`Known blockers were supplied: ${sanitizeStringList(values.blockers).join(", ")}.`);
  }

  return risks;
};

const buildOpenQuestions = (values: QuestionnaireValidatedValues) => {
  const questions: string[] = [];

  if (values.deadlineKnown === "no") {
    questions.push("What date or event should be treated as the delivery target?");
  }

  if (values.requiresIntegrations === "yes") {
    questions.push("Which integration owners and environments are required for validation?");
  }

  if (values.existingSystem === "no") {
    questions.push("Should this request assume a net-new workflow or extend an existing platform later?");
  }

  return questions;
};

export const toQuestionnaireReport = (
  values: QuestionnaireValidatedValues
): QuestionnaireReport => {
  const report = {
    headline: `${values.requestTitle} (${values.requestType})`,
    executiveSummary: `${values.problemStatement} Desired outcome: ${values.desiredOutcome}`,
    sectionNarrative: [
      {
        sectionId: "overview",
        title: "Request overview",
        detail: values.problemStatement
      },
      {
        sectionId: "scope",
        title: "Scope and success",
        detail: `${values.desiredOutcome} Audience: ${values.audience} Success metrics: ${values.successMetrics}`
      },
      {
        sectionId: "delivery",
        title: "Timing",
        detail:
          values.deadlineKnown === "yes" && values.deadlineDate
            ? `Urgency is ${values.urgency} with a deadline of ${values.deadlineDate}.`
            : `Urgency is ${values.urgency} and no fixed deadline was provided.`
      },
      {
        sectionId: "systems",
        title: "Systems and integrations",
        detail:
          values.existingSystem === "yes"
            ? `${values.currentWorkflow} Integrations: ${sanitizeStringList(values.integrationSystems).join(", ") || "none"}`
            : `No existing system was identified. Integrations: ${sanitizeStringList(values.integrationSystems).join(", ") || "none"}`
      }
    ],
    risks: buildRiskList(values),
    openQuestions: buildOpenQuestions(values),
    recommendedNextStep:
      values.urgency === "critical"
        ? "Run a scoping review immediately and confirm the deadline owner."
        : "Review scope, dependencies, and success metrics with the request owner before estimating."
  };

  return QuestionnaireReportSchema.parse(report);
};

const loeSizeOptions = ["S", "M", "L", "XL"] as const;
const loeImpactOptions = ["low", "medium", "high"] as const;

export const QuestionnaireLoeSchema = z.object({
  score: z.number().int().min(0),
  tShirtSize: z.enum(loeSizeOptions),
  rationale: z.array(
    z.object({
      driver: z.string(),
      impact: z.enum(loeImpactOptions),
      reason: z.string()
    })
  ),
  assumptions: z.array(z.string())
});

export type QuestionnaireLoe = z.output<typeof QuestionnaireLoeSchema>;

const scoreToSize = (score: number): QuestionnaireLoe["tShirtSize"] => {
  if (score <= 2) {
    return "S";
  }

  if (score <= 4) {
    return "M";
  }

  if (score <= 6) {
    return "L";
  }

  return "XL";
};

export const toQuestionnaireLoe = (values: QuestionnaireValidatedValues): QuestionnaireLoe => {
  const rationale: QuestionnaireLoe["rationale"] = [];
  let score = 1;

  rationale.push({
    driver: "Base delivery",
    impact: "low",
    reason: "Every request carries a minimum implementation and coordination cost."
  });

  if (values.urgency === "high" || values.urgency === "critical") {
    score += 1;
    rationale.push({
      driver: "Urgency",
      impact: "medium",
      reason: `Urgency is ${values.urgency}, which compresses planning and review time.`
    });
  }

  if (values.existingSystem === "yes") {
    score += 1;
    rationale.push({
      driver: "Existing system constraints",
      impact: "medium",
      reason: "The request must fit an existing workflow and likely needs change-management review."
    });
  }

  if (values.requiresIntegrations === "yes") {
    const integrationCount = sanitizeStringList(values.integrationSystems).length;
    score += integrationCount >= 3 ? 2 : 1;
    rationale.push({
      driver: "Integrations",
      impact: integrationCount >= 3 ? "high" : "medium",
      reason:
        integrationCount >= 3
          ? "Three or more integrations materially increase coordination and verification effort."
          : "At least one external integration adds implementation and testing overhead."
    });
  }

  if (sanitizeStringList(values.blockers).length > 0) {
    score += 1;
    rationale.push({
      driver: "Known blockers",
      impact: "medium",
      reason: "Pre-existing blockers reduce delivery predictability and usually expand effort."
    });
  }

  return QuestionnaireLoeSchema.parse({
    score,
    tShirtSize: scoreToSize(score),
    rationale,
    assumptions: [
      "Estimate assumes requirements will not materially expand after intake.",
      "Estimate excludes downstream procurement, legal review, or vendor timelines."
    ]
  });
};

export const questionnaireOutputDefinitions: QuestionnaireOutputDefinition[] = [
  {
    id: "json",
    label: "JSON submission payload",
    description: "Normalized object for API ingestion and workflow automation."
  },
  {
    id: "report",
    label: "Narrative report",
    description: "Plain-language summary with section rollups, risks, and open questions."
  },
  {
    id: "loe",
    label: "LOE estimate",
    description: "T-shirt sized effort estimate with scored delivery drivers and assumptions."
  }
];

export const QuestionnaireDraftSchema = z.object({
  savedAt: z.iso.datetime(),
  values: FormSchemaBase.partial()
});

export type QuestionnaireDraft = z.output<typeof QuestionnaireDraftSchema>;

export const toQuestionnaireDraft = (
  values: Partial<QuestionnaireFormValues>,
  savedAt = new Date().toISOString()
): QuestionnaireDraft => QuestionnaireDraftSchema.parse({ savedAt, values });
