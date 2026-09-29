# Rules are data and the engine is deterministic; the model only reads

State Rulesets are versioned data files, and a deterministic engine evaluates them over a structured Deal record. A model extracts fields from documents (with per-field confidence) and proposes Rejection-to-Rule mappings, but never decides pass or fail. Every Finding cites a Rule, and each Preflight Check records the Ruleset version it used. The alternative, letting a model judge packets directly, would be cheaper to start but cannot cite, replay, or audit a decision, which a Dealer relying on a cleared title needs.

Low-confidence reads become Confirm Findings instead of guesses.
