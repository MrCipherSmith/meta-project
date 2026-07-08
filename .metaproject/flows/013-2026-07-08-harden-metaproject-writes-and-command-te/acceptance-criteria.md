# Acceptance Criteria

Rules:

- Criteria lines use the exact format `- ACn: <criterion>`.
- After `flow freeze` this file is checksum-protected: any edit outside
  `gd-metapro flow ac update` fails every gate and status transition.
- Completion requires every ACn to be confirmed via
  `gd-metapro flow ac confirm <id> <ACn>`.

## Criteria

- AC1: `flow init` must allocate unique flow directories when two init calls run concurrently in the same repository.
- AC2: `writeFlow` and new shared write helpers must write JSON/Markdown through same-directory temp files followed by rename.
- AC3: Project-skill registry updates and catalog regeneration must run under a shared gdskills lock.
- AC4: Learning proposal application must be concurrency-safe: only one concurrent apply succeeds and the other reports the proposal already applied.
- AC5: Targeted Bun tests for flow and gdskills hardening must pass with zero failures.
