import type { Check, Rule, Ruleset } from "./ruleset";

type FieldValue = string | number | boolean | null;

export type DealRecord = {
  kind: "retail_sale" | "trade_in";
  lienPresent: boolean;
  fields: Record<string, { value: FieldValue; confidence: number }>;
};

export type Finding = {
  ruleId: string;
  kind: "defect" | "confirm" | "advisory";
  document: string;
  what: string;
  citation: string;
  whoActs: string;
  action: string;
};

export type PreflightResult = {
  rulesetVersion: string;
  verdict: "fix_before_filing" | "waiting_on_you" | "ready_for_clerk_review";
  findings: Finding[];
};

function isViolated(check: Check, deal: DealRecord): boolean {
  switch (check.op) {
    case "equals":
      return deal.fields[check.field]?.value === check.value;
    case "confidenceBelow":
      // A field the reader returned nothing for is unread, so it must not pass as a confident read.
      return (deal.fields[check.field]?.confidence ?? 0) < check.threshold;
    case "differs": {
      const [a, b] = check.fields.map((name) => deal.fields[name]?.value);
      return a != null && b != null && a !== b;
    }
  }
}

const KIND_ORDER: Finding["kind"][] = ["defect", "confirm", "advisory"];

function inEffect(rule: Rule, asOf: Date): boolean {
  const day = asOf.toISOString().slice(0, 10);
  return rule.effectiveFrom <= day && (rule.effectiveTo === undefined || day <= rule.effectiveTo);
}

function applies(rule: Rule, deal: DealRecord): boolean {
  const { dealKind, lienPresent } = rule.appliesTo;
  return (
    (dealKind === undefined || dealKind === deal.kind) &&
    (lienPresent === undefined || lienPresent === deal.lienPresent)
  );
}

function verdictFor(findings: Finding[]): PreflightResult["verdict"] {
  if (findings.some((f) => f.kind === "defect")) return "fix_before_filing";
  if (findings.some((f) => f.kind === "confirm")) return "waiting_on_you";
  return "ready_for_clerk_review";
}

export function runPreflight(deal: DealRecord, ruleset: Ruleset, asOf: Date): PreflightResult {
  const findings = ruleset.rules
    .filter(
      (rule) => inEffect(rule, asOf) && applies(rule, deal) && isViolated(rule.violatedWhen, deal),
    )
    .map(
      (rule): Finding => ({
        ruleId: rule.id,
        kind: rule.kind,
        document: rule.document,
        what: rule.text,
        citation: rule.citation,
        whoActs: rule.whoActs,
        action: rule.action,
      }),
    )
    .sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));

  return {
    rulesetVersion: ruleset.version,
    verdict: verdictFor(findings),
    findings,
  };
}
