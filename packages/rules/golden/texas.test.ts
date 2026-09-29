import { expect, it } from "vitest";
import texas from "../rulesets/texas.json";
import { parseRuleset, runGoldenSet } from "../src/index";
import { texasGoldenCases } from "./texas";

// Every Ruleset change must keep these thresholds. Tighten them as the golden set grows.
it("the Texas Ruleset meets the golden-set thresholds", () => {
  const report = runGoldenSet(texasGoldenCases, parseRuleset(texas), new Date("2026-06-01"));

  expect(report.failures).toEqual([]);
  expect(report.defectRecall).toBe(1);
  expect(report.hardRejectRecall).toBe(1);
  expect(report.nuisanceRate).toBe(0);
});
