# Acceptance criteria — flow 106

- AC1: load empty/missing sandbox.json → empty defaults, no throw.
- AC2: env overrides file for maskMode/shell/tls.
- AC3: file used when env unset (maskMode/tls/shell).
- AC4: save round-trip; file mode 0600.
- AC5: no API key fields accepted/written.
- AC6: shell_exec and resolveMasksFromSandboxEnv (harness path) consult sandbox-config when env unset.
