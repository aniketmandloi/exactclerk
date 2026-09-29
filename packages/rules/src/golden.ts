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

export function runGoldenSet(cases: GoldenCase[], ruleset: Ruleset, asOf: Date): GoldenReport {
  const failures: string[] = [];
  let defects = 0;
  let defectsFound = 0;
  let hardRejects = 0;
  let hardRejectsFound = 0;
  let cleanCases = 0;
  let noisyCleanCases = 0;

  for (const goldenCase of cases) {
    const { findings } = runPreflight(goldenCase.deal, ruleset, asOf);
    const raised = (ruleId: string, kind: Finding["kind"]) =>
      findings.some((f) => f.ruleId === ruleId && f.kind === kind);

    for (const expected of goldenCase.expected) {
      const found = raised(expected.ruleId, expected.kind);
      if (!found) {
        failures.push(`${goldenCase.name}: missed ${expected.kind} ${expected.ruleId}`);
      }
      if (expected.kind === "defect") {
        defects++;
        if (found) defectsFound++;
      }
      if (expected.hardReject) {
        hardRejects++;
        if (found) hardRejectsFound++;
      }
    }

    const unexpected = findings.filter(
      (f) =>
        f.kind !== "advisory" &&
        !goldenCase.expected.some((e) => e.ruleId === f.ruleId && e.kind === f.kind),
    );
    for (const f of unexpected) {
      failures.push(`${goldenCase.name}: unexpected ${f.kind} ${f.ruleId}`);
    }

    if (goldenCase.expected.length === 0) {
      cleanCases++;
      if (unexpected.length > 0) noisyCleanCases++;
    }
  }

  return {
    defectRecall: ratio(defectsFound, defects, 1),
    hardRejectRecall: ratio(hardRejectsFound, hardRejects, 1),
    nuisanceRate: ratio(noisyCleanCases, cleanCases, 0),
    failures,
  };
}
