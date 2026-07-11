# Review Learning
Version: 1.0.0

## Reusable lessons

1. A requirements remediation is not complete when prose and schemas exist;
   parser-derived scenario IDs, fixture existence, and semantic validator
   evidence must be checked together.
2. A deprecated contract must be removed from active fixture/transport coverage
   or a concrete rejection rule is required; a `deprecated` annotation alone is
   not a source-of-truth boundary.
3. Ownership tables must agree with module maps and named APIs. A module called
   `orchestration` can recreate a second coordinator even when prose says it
   must not.
4. Compatibility policy needs a machine-readable registry and migration
   fixtures; an integer schema version plus prose ranges is insufficient.

## Environment limitation

`keryx`, Node/Gherkin, and a Draft 2020-12 validator were unavailable. The
review therefore records parser, `$ref`, semantic, and fixture execution as
gates rather than inferring PASS from JSON parsing.

## No runtime claim

This iteration changed only the new managed review package. Requirements docs,
production code, branches, worktrees, and the immutable source review were not
modified.
