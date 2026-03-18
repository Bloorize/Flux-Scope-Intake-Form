import {
  antiVaguenessRules,
  questionnaireBranchingRules,
  questionnaireOutputDefinitions,
  questionnaireSections,
  questionnaireValidationRules
} from "../domain/questionnaire";

export const schemaContract = {
  title: "Questions Form Contract",
  summary:
    "Canonical contract for intake structure, conditional paths, anti-vagueness constraints, and downstream JSON, report, and LOE outputs.",
  sections: questionnaireSections.map((section, index) => ({
    id: String(index + 1).padStart(2, "0"),
    title: section.title,
    description: section.description,
    fields: section.fields.map((field) => field.label)
  })),
  branchingLogic: questionnaireBranchingRules,
  validationRules: questionnaireValidationRules,
  antiVaguenessRules,
  outputFormats: questionnaireOutputDefinitions.map((definition) => ({
    ...definition,
    shape:
      definition.id === "json"
        ? ["summary", "request", "delivery", "systems", "references", "contact"]
        : definition.id === "report"
          ? ["headline", "executiveSummary", "sectionNarrative", "risks", "openQuestions", "recommendedNextStep"]
          : ["score", "tShirtSize", "rationale", "assumptions"]
  }))
} as const;
