import { z } from "zod";

const checkSchema = z.discriminatedUnion("op", [
	z.object({
		op: z.literal("equals"),
		field: z.string(),
		value: z.union([z.string(), z.number(), z.boolean()]),
	}),
	z.object({
		op: z.literal("differs"),
		fields: z.tuple([z.string(), z.string()]),
	}),
	z.object({
		op: z.literal("confidenceBelow"),
		field: z.string(),
		threshold: z.number(),
	}),
]);

export type Check = z.infer<typeof checkSchema>;

const ruleSchema = z
	.strictObject({
		id: z.string().min(1),
		text: z.string().min(1),
		citation: z.string().min(1),
		appliesTo: z.strictObject({
			dealKind: z.enum(["retail_sale", "trade_in"]).optional(),
			lienPresent: z.boolean().optional(),
		}),
		violatedWhen: checkSchema,
		kind: z.enum(["defect", "confirm", "advisory"]),
		document: z.string().min(1),
		whoActs: z.string().min(1),
		action: z.string().min(1),
		effectiveFrom: z.iso.date(),
		effectiveTo: z.iso.date().optional(),
	})
	.refine(
		(rule) =>
			rule.effectiveTo === undefined || rule.effectiveTo >= rule.effectiveFrom,
		{
			message: "effectiveTo must not be before effectiveFrom",
		},
	);

const rulesetSchema = z
	.strictObject({
		version: z.string().min(1),
		rules: z.array(ruleSchema),
	})
	.refine(
		(ruleset) =>
			new Set(ruleset.rules.map((r) => r.id)).size === ruleset.rules.length,
		{
			message: "Rule ids must be unique",
		},
	);

export type Rule = z.infer<typeof ruleSchema>;
export type Ruleset = z.infer<typeof rulesetSchema>;

export function parseRuleset(data: unknown): Ruleset {
	return rulesetSchema.parse(data);
}
