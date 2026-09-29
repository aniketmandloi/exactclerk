import { type DealRecord, type Finding, runPreflight } from "./preflight";
import type { Ruleset } from "./ruleset";

export type GoldenCase = {
	name: string;
	deal: DealRecord;
	expected: { ruleId: string; kind: Finding["kind"]; hardReject?: boolean }[];
};

export type GoldenReport = {
	defectRecall: number;
	hardRejectRecall: number;
	nuisanceRate: number;
	failures: string[];
};

function ratio(part: number, whole: number, whenEmpty: number): number {
	return whole === 0 ? whenEmpty : part / whole;
}

export function runGoldenSet(
	cases: GoldenCase[],
	ruleset: Ruleset,
	asOf: Date,
): GoldenReport {
	const failures: string[] = [];
	let defects = 0;
	let defectsFound = 0;
	let hardRejects = 0;
	let hardRejectsFound = 0;
	let cleanCases = 0;
	let noisyCleanCases = 0;

	for (const goldenCase of cases) {
		const { findings } = runPreflight(goldenCase.deal, ruleset, asOf);

		for (const expected of goldenCase.expected) {
			if (expected.kind !== "defect") continue;
			const found = findings.some((f) => f.ruleId === expected.ruleId);
			defects++;
			if (found) defectsFound++;
			else
				failures.push(`${goldenCase.name}: missed defect ${expected.ruleId}`);
			if (expected.hardReject) {
				hardRejects++;
				if (found) hardRejectsFound++;
			}
		}

		if (goldenCase.expected.length === 0) {
			cleanCases++;
			const blocking = findings.filter((f) => f.kind !== "advisory");
			if (blocking.length > 0) noisyCleanCases++;
			for (const f of blocking) {
				failures.push(`${goldenCase.name}: unexpected ${f.kind} ${f.ruleId}`);
			}
		}
	}

	return {
		defectRecall: ratio(defectsFound, defects, 1),
		hardRejectRecall: ratio(hardRejectsFound, hardRejects, 1),
		nuisanceRate: ratio(noisyCleanCases, cleanCases, 0),
		failures,
	};
}
