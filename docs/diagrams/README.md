# Standalone engineering diagrams

Each diagram has an independently editable SVG, a 2× PNG export and a Mermaid logical source.

1. `01-runtime-interfaces`: sequence of GitHub CLI query, pure issue selection, Paseo CLI dispatch and Session receipt; Skill files are instruction dependencies.
2. `02-intake-loop`: foreground owner lock, actual dispatchOnce/chooseIssue branches, polling and exit.
3. `03-dispatch-recovery`: active intent, ambiguous or parsed receipt, operator reconciliation and clearing. No completed-Issue deduplication exists in this prototype.
4. `04-candidate-review-loop`: role/artifact handoffs defined by Skill documents, candidate validation and correction loops. These phases are not functions in an implemented workflow engine.

Mermaid captures the same logical relations; it is not a pixel-identical rendering of the manually laid-out SVG. PNG and SVG are in `../images/`. Function inputs, results and complete CLI examples are documented in `../engineering-interfaces.zh-TW.md`.
