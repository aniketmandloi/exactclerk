import type { GoldenCase } from "../src/index";

// Synthetic packets seeded from the prototype scenarios (branch prototype/preflight-finding).
export const texasGoldenCases: GoldenCase[] = [
	{
		name: "clean: 2016 Honda Civic retail sale",
		deal: {
			kind: "retail_sale",
			lienPresent: false,
			fields: {
				sellerSignaturePresent: { value: true, confidence: 0.98 },
				odometerReading: { value: 61250, confidence: 0.97 },
				buyerMailingAddress: {
					value: "412 Elm St, Austin TX",
					confidence: 0.96,
				},
				licenceAddress: { value: "412 Elm St, Austin TX", confidence: 0.96 },
			},
		},
		expected: [],
	},
	{
		name: "signature: 2014 Ford F-150 with no seller signature and a differing address",
		deal: {
			kind: "retail_sale",
			lienPresent: false,
			fields: {
				sellerSignaturePresent: { value: false, confidence: 0.95 },
				odometerReading: { value: 104882, confidence: 0.97 },
				buyerMailingAddress: { value: "PO Box 88, Waco TX", confidence: 0.94 },
				licenceAddress: { value: "17 Ranch Rd, Waco TX", confidence: 0.94 },
			},
		},
		expected: [
			{ ruleId: "title-seller-signature", kind: "defect", hardReject: true },
			{ ruleId: "buyer-address-match", kind: "confirm" },
		],
	},
	{
		name: "lien: 2012 Toyota Camry trade-in with no lien release",
		deal: {
			kind: "trade_in",
			lienPresent: true,
			fields: {
				sellerSignaturePresent: { value: true, confidence: 0.96 },
				odometerReading: { value: 143007, confidence: 0.95 },
				lienReleaseAttached: { value: false, confidence: 0.99 },
			},
		},
		expected: [{ ruleId: "lien-release", kind: "defect", hardReject: true }],
	},
	{
		name: "blurry: 2019 Nissan Altima with an unreadable odometer",
		deal: {
			kind: "retail_sale",
			lienPresent: false,
			fields: {
				sellerSignaturePresent: { value: true, confidence: 0.97 },
				odometerReading: { value: 48201, confidence: 0.4 },
				buyerMailingAddress: { value: "9 Pine Ct, Plano TX", confidence: 0.95 },
				licenceAddress: { value: "9 Pine Ct, Plano TX", confidence: 0.95 },
			},
		},
		expected: [{ ruleId: "odometer-reading", kind: "confirm" }],
	},
];
