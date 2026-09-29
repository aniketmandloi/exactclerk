import { describe, expect, it } from "vitest";

import { type DealRecord, parseRuleset, runPreflight } from "./index";

const CITATION = "Title Manual, dealer chapter (section TBD)";
const asOf = new Date("2026-06-01");

const signatureRule = {
	id: "title-seller-signature",
	text: "Title must be assigned by the seller before transfer.",
	citation: CITATION,
	appliesTo: {},
	violatedWhen: { op: "equals", field: "sellerSignaturePresent", value: false },
	kind: "defect",
	document: "Title (front)",
	whoActs: "Previous owner",
	action: "Get the previous owner to sign the assignment line.",
	effectiveFrom: "2020-01-01",
};

const odometerRule = {
	id: "odometer-reading",
	text: "Odometer reading must be stated and match the disclosure.",
	citation: CITATION,
	appliesTo: {},
	violatedWhen: {
		op: "confidenceBelow",
		field: "odometerReading",
		threshold: 0.9,
	},
	kind: "confirm",
	document: "Odometer disclosure",
	whoActs: "Dealer",
	action:
		"Type the mileage you see on the signed disclosure so we do not guess.",
	effectiveFrom: "2020-01-01",
};

const ruleset = parseRuleset({
	version: "tx-1",
	rules: [signatureRule, odometerRule],
});

const unsignedSale: DealRecord = {
	kind: "retail_sale",
	lienPresent: false,
	fields: {
		sellerSignaturePresent: { value: false, confidence: 0.99 },
		odometerReading: { value: 48201, confidence: 0.99 },
	},
};

const blurryOdometerSale: DealRecord = {
	kind: "retail_sale",
	lienPresent: false,
	fields: {
		sellerSignaturePresent: { value: true, confidence: 0.99 },
		odometerReading: { value: 48201, confidence: 0.4 },
	},
};

describe("runPreflight", () => {
	it("flags a broken Rule as a Defect that cites the Rule and records the Ruleset version", () => {
		const result = runPreflight(unsignedSale, ruleset, asOf);

		expect(result.rulesetVersion).toBe("tx-1");
		expect(result.verdict).toBe("fix_before_filing");
		expect(result.findings).toEqual([
			{
				ruleId: "title-seller-signature",
				kind: "defect",
				document: "Title (front)",
				what: "Title must be assigned by the seller before transfer.",
				citation: CITATION,
				whoActs: "Previous owner",
				action: "Get the previous owner to sign the assignment line.",
			},
		]);
	});

	it("holds a packet that has an open Confirm from clerk review, and asks the Dealer", () => {
		const result = runPreflight(blurryOdometerSale, ruleset, asOf);

		expect(result.verdict).toBe("waiting_on_you");
		expect(result.findings.map((f) => [f.ruleId, f.kind, f.whoActs])).toEqual([
			["odometer-reading", "confirm", "Dealer"],
		]);
	});
});
