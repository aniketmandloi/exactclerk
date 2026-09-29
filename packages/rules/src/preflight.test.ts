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
  action: "Type the mileage you see on the signed disclosure so we do not guess.",
  effectiveFrom: "2020-01-01",
};

const lienReleaseRule = {
  id: "lien-release",
  text: "A recorded lien must be released before the title can transfer.",
  citation: CITATION,
  appliesTo: { lienPresent: true },
  violatedWhen: { op: "equals", field: "lienReleaseAttached", value: false },
  kind: "defect",
  document: "Title (back)",
  whoActs: "Dealer",
  action: "Ask the lienholder for a lien release and attach it.",
  effectiveFrom: "2020-01-01",
};

const ruleset = parseRuleset({
  version: "tx-1",
  rules: [signatureRule, odometerRule, lienReleaseRule],
});

const cleanSale: DealRecord = {
  kind: "retail_sale",
  lienPresent: false,
  fields: {
    sellerSignaturePresent: { value: true, confidence: 0.99 },
    odometerReading: { value: 48201, confidence: 0.99 },
    lienReleaseAttached: { value: false, confidence: 0.99 },
  },
};

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

  it("passes a clean packet to clerk review with no Findings", () => {
    const result = runPreflight(cleanSale, ruleset, asOf);

    expect(result.verdict).toBe("ready_for_clerk_review");
    expect(result.findings).toEqual([]);
  });

  it("applies a lien Rule only to Deals that have a lien", () => {
    const tradeInWithLien: DealRecord = {
      ...cleanSale,
      kind: "trade_in",
      lienPresent: true,
    };

    expect(runPreflight(tradeInWithLien, ruleset, asOf).findings.map((f) => f.ruleId)).toEqual([
      "lien-release",
    ]);
    expect(runPreflight(cleanSale, ruleset, asOf).findings).toEqual([]);
  });

  it("applies a trade-in Rule only to trade-in acquisitions", () => {
    const tradeInRule = {
      ...signatureRule,
      id: "trade-in-only",
      appliesTo: { dealKind: "trade_in" },
    };
    const tradeInRuleset = parseRuleset({
      version: "tx-1",
      rules: [tradeInRule],
    });

    expect(
      runPreflight({ ...unsignedSale, kind: "trade_in" }, tradeInRuleset, asOf).findings,
    ).toHaveLength(1);
    expect(runPreflight(unsignedSale, tradeInRuleset, asOf).findings).toEqual([]);
  });

  it("ignores a Rule outside its effective date range", () => {
    const bounded = parseRuleset({
      version: "tx-1",
      rules: [
        {
          ...signatureRule,
          effectiveFrom: "2026-01-01",
          effectiveTo: "2026-12-31",
        },
      ],
    });

    expect(runPreflight(unsignedSale, bounded, new Date("2025-12-31")).findings).toEqual([]);
    expect(runPreflight(unsignedSale, bounded, new Date("2026-06-01")).findings).toHaveLength(1);
    expect(runPreflight(unsignedSale, bounded, new Date("2027-01-01")).findings).toEqual([]);
  });

  it("lists Defects first, then Confirms, then Advisories", () => {
    const advisoryRule = { ...odometerRule, id: "advisory", kind: "advisory" };
    const mixed = parseRuleset({
      version: "tx-1",
      rules: [advisoryRule, odometerRule, signatureRule],
    });
    const everythingWrong: DealRecord = {
      ...unsignedSale,
      fields: {
        sellerSignaturePresent: { value: false, confidence: 0.99 },
        odometerReading: { value: 48201, confidence: 0.4 },
      },
    };

    expect(runPreflight(everythingWrong, mixed, asOf).findings.map((f) => f.kind)).toEqual([
      "defect",
      "confirm",
      "advisory",
    ]);
  });

  it("gives the same Findings for the same record and Ruleset, without changing either", () => {
    const record = structuredClone(unsignedSale);
    const before = structuredClone(ruleset);

    const first = runPreflight(record, ruleset, asOf);
    const second = runPreflight(record, ruleset, asOf);

    expect(second).toEqual(first);
    expect(record).toEqual(unsignedSale);
    expect(ruleset).toEqual(before);
  });

  it("asks the Dealer to confirm when two fields that should agree differ", () => {
    const addressRule = {
      ...odometerRule,
      id: "buyer-address",
      violatedWhen: {
        op: "differs",
        fields: ["buyerMailingAddress", "licenceAddress"],
      },
    };
    const addressRuleset = parseRuleset({
      version: "tx-1",
      rules: [addressRule],
    });
    const mismatch: DealRecord = {
      ...cleanSale,
      fields: {
        buyerMailingAddress: { value: "1 Elm St", confidence: 0.99 },
        licenceAddress: { value: "9 Oak Ave", confidence: 0.99 },
      },
    };
    const match: DealRecord = {
      ...mismatch,
      fields: {
        buyerMailingAddress: { value: "1 Elm St", confidence: 0.99 },
        licenceAddress: { value: "1 Elm St", confidence: 0.99 },
      },
    };

    expect(runPreflight(mismatch, addressRuleset, asOf).verdict).toBe("waiting_on_you");
    expect(runPreflight(match, addressRuleset, asOf).verdict).toBe("ready_for_clerk_review");
  });
});
