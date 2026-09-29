## Agent skills

### Model Guidance

Our default model is Opus 5.5 High for optimal performance and quality.  
For easier or exploratory tasks (e.g., exploration, information retrieval), subagents can use Sonnet 5.5 High to save on costs and increase efficiency.

### Issue tracker

Issues are managed in GitHub Issues for `aniketmandloi/exactclerk`, using the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Code quality

All contributions should maintain excellent code quality.

### Commit guidelines

Commits should be small, focused (atomic), and must not have Co-Authors listed.
