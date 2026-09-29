import { describe, expect, it } from "vitest";

import { parseRuleset } from "./index";

const rule = {
  id: "title-seller-signature",
  text: "Title must be assigned by the seller before transfer.",
  citation: "Title Manual, dealer chapter (section TBD)",
  appliesTo: {},
  violatedWhen: { op: "equals", field: "sellerSignaturePresent", value: false },
  kind: "defect",
  document: "Title (front)",
  whoActs: "Previous owner",
  action: "Get the previous owner to sign the assignment line.",
  effectiveFrom: "2020-01-01",
};

describe("parseRuleset", () => {
  it("accepts a Ruleset whose Rules carry a citation", () => {
    const ruleset = parseRuleset({ version: "tx-1", rules: [rule] });

    expect(ruleset.version).toBe("tx-1");
    expect(ruleset.rules).toHaveLength(1);
  });

  it("rejects a Rule with no citation", () => {
    const { citation: _citation, ...uncited } = rule;

    expect(() => parseRuleset({ version: "tx-1", rules: [uncited] })).toThrow();
  });

  it("rejects a Rule with an empty citation", () => {
    expect(() => parseRuleset({ version: "tx-1", rules: [{ ...rule, citation: "" }] })).toThrow();
  });

  it("rejects a Rule whose applicability has an unknown key instead of applying it to every Deal", () => {
    expect(() =>
      parseRuleset({
        version: "tx-1",
        rules: [{ ...rule, appliesTo: { lien_present: true } }],
      }),
    ).toThrow();
  });

  it("rejects two Rules with the same id", () => {
    expect(() => parseRuleset({ version: "tx-1", rules: [rule, rule] })).toThrow();
  });

  it("rejects a Rule that stops being effective before it starts", () => {
    expect(() =>
      parseRuleset({
        version: "tx-1",
        rules: [{ ...rule, effectiveFrom: "2026-01-01", effectiveTo: "2025-12-31" }],
      }),
    ).toThrow();
  });
});
