# Flow Journal

- 2026-07-22T12:05:44.354Z - flow created
- 2026-07-22T12:09:14.640Z - task-added: T5: Repo-wide id allocation: shared git-common-dir lock + ledger in nextFlowId/init (with non-git fallback)
- 2026-07-22T12:09:14.810Z - task-added: T6: Ambiguity-safe resolveFlowDir + fail-closed callers (flow CLI, review --flow, ManagedFlowPort)
- 2026-07-22T12:09:14.998Z - task-added: T7: Duplicate-id rule in keryx flow check + collision marker in flow list
- 2026-07-22T12:09:15.158Z - task-added: T8: keryx flow renumber command (move dir, rewrite flow.json id, history event, old->new mapping)
- 2026-07-22T12:09:15.299Z - task-added: T9: Repair existing collisions 002/084/103 via renumber; handle the 002 AC checksum mismatch explicitly
- 2026-07-22T12:09:15.446Z - task-added: T10: Document repo-wide allocation + worktree rule in flow skill and project memory
- 2026-07-22T13:43:11.496Z - frozen: 10 criteria; checksum recorded
- 2026-07-22T13:43:17.203Z - started
- 2026-07-22 - decisions taken before freeze (user): (1) repair colliding pairs by renumbering the later-created member via the new `keryx flow renumber`; (2) the duplicate-id rule in `keryx flow check` is a hard gate failure, flipped hard only after T9 lands so `main` is never knowingly red.
- 2026-07-22 - pre-existing, unrelated to this flow's changes: `keryx flow check` already fails on `002-2026-07-10-gdgraph-java-python-import-resolution` (acceptance criteria checksum mismatch). Tracked by AC8 — must not be silently rewritten by the renumbering in T9.
