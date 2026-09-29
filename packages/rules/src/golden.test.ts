import { describe, expect, it } from "vitest";

import {
	type DealRecord,
	type GoldenCase,
	parseRuleset,
	runGoldenSet,
} from "./index";

const CITATION = "Title Manual, dealer chapter (section TBD)";
const asOf = new Date("2026-06-01");

const rule = (id: string, field: string, kind: "defect" | "confirm") => ({
	id,
	text: `${id} text`,
	citation: CITATION,
	appliesTo: {},
	violatedWhen: { op: "equals", field, value: false },
	kind,
	document: "Title (front)",
	whoActs: "Dealer",
	action: `${id} action`,
	effectiveFrom: "2020-01-01",
});

const deal = (fields: Record<string, boolean>): DealRecord => ({
	kind: "retail_sale",
	lienPresent: false,
	fields: Object.fromEntries(
		Object.entries(fields).map(([name, value]) => [
			name,
			{ value, confidence: 0.99 },
		]),
	),
});

const ruleset = parseRuleset({
	version: "tx-1",
	rules: [
		rule("signature", "signed", "defect"),
		rule("odometer", "odometerRead", "confirm"),
	],
});

const cases: GoldenCase[] = [
	{
		name: "clean",
		deal: deal({ signed: true, odometerRead: true }),
		expected: [],
	},
	{
		name: "unsigned",
		deal: deal({ signed: false, odometerRead: true }),
		expected: [{ ruleId: "signature", kind: "defect", hardReject: true }],
	},
];

describe("runGoldenSet", () => {
	it("scores a Ruleset that catches every expected Defect and nothing on a clean packet", () => {
		const report = runGoldenSet(cases, ruleset, asOf);

		expect(report).toMatchObject({
			defectRecall: 1,
			hardRejectRecall: 1,
			nuisanceRate: 0,
			failures: [],
		});
	});

	it("reports a missed Defect as lower recall and names the case", () => {
		const blind = parseRuleset({
			version: "tx-2",
			rules: [rule("odometer", "odometerRead", "confirm")],
		});

		const report = runGoldenSet(cases, blind, asOf);

		expect(report.defectRecall).toBe(0);
		expect(report.hardRejectRecall).toBe(0);
		expect(report.failures).toEqual(["unsigned: missed defect signature"]);
	});

	it("counts a clean packet that draws a Finding as nuisance", () => {
		const noisy = [
			...cases,
			{
				name: "clean-but-noisy",
				deal: deal({ signed: true, odometerRead: false }),
				expected: [],
			},
		];

		const report = runGoldenSet(noisy, ruleset, asOf);

		expect(report.nuisanceRate).toBe(0.5);
		expect(report.failures).toEqual([
			"clean-but-noisy: unexpected confirm odometer",
		]);
	});
});
