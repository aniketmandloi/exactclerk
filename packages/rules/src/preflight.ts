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
		case "confidenceBelow": {
			const field = deal.fields[check.field];
			return field !== undefined && field.confidence < check.threshold;
		}
		default:
			throw new Error(`Check "${check.op}" is not implemented`);
	}
}

function applies(rule: Rule, deal: DealRecord): boolean {
	const { lienPresent } = rule.appliesTo;
	return lienPresent === undefined || lienPresent === deal.lienPresent;
}

function verdictFor(findings: Finding[]): PreflightResult["verdict"] {
	if (findings.some((f) => f.kind === "defect")) return "fix_before_filing";
	if (findings.some((f) => f.kind === "confirm")) return "waiting_on_you";
	return "ready_for_clerk_review";
}

export function runPreflight(
	deal: DealRecord,
	ruleset: Ruleset,
	_asOf: Date,
): PreflightResult {
	const findings = ruleset.rules
		.filter(
			(rule) => applies(rule, deal) && isViolated(rule.violatedWhen, deal),
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
		);

	return {
		rulesetVersion: ruleset.version,
		verdict: verdictFor(findings),
		findings,
	};
}
