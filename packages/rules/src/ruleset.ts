import { z } from "zod";

export type Check =
	| { op: "missing"; field: string }
	| { op: "equals"; field: string; value: string | number | boolean }
	| { op: "differs"; fields: [string, string] }
	| { op: "confidenceBelow"; field: string; threshold: number }
	| { op: "all"; of: Check[] }
	| { op: "not"; of: Check };

const checkSchema: z.ZodType<Check> = z.lazy(() =>
	z.discriminatedUnion("op", [
		z.object({ op: z.literal("missing"), field: z.string() }),
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
		z.object({ op: z.literal("all"), of: z.array(checkSchema) }),
		z.object({ op: z.literal("not"), of: checkSchema }),
	]),
);

const ruleSchema = z.object({
	id: z.string().min(1),
	text: z.string().min(1),
	citation: z.string().min(1),
	appliesTo: z.object({
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
});

const rulesetSchema = z.object({
	version: z.string().min(1),
	rules: z.array(ruleSchema),
});

export type Rule = z.infer<typeof ruleSchema>;
export type Ruleset = z.infer<typeof rulesetSchema>;

export function parseRuleset(data: unknown): Ruleset {
	return rulesetSchema.parse(data);
}
