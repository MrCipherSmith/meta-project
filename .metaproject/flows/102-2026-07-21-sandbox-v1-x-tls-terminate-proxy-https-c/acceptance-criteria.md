# Acceptance Criteria

Rules:

- Criteria lines use the exact format `- ACn: <criterion>`.
- After `flow freeze` this file is checksum-protected: any edit outside
  `keryx flow ac update` fails every gate and status transition.
- Completion requires every ACn to be confirmed via
  `keryx flow ac confirm <id> <ACn>`.

## Criteria

- AC1: An ephemeral per-run CA issues host-bound leaf certificates via the system `openssl` (no npm dependency), with SAN set, chaining to the CA, cached per host, and all key material removed on dispose.
- AC2: An allowlisted `CONNECT` can be TLS-terminated (opt-in) and relayed to the real upstream, with a client that trusts only the run CA; non-allowlisted hosts are still refused before any TLS work.
- AC3: The run CA certificate is delivered to the contained process through the standard CA-trust env vars (SSL_CERT_FILE, CURL_CA_BUNDLE, NODE_EXTRA_CA_CERTS, REQUESTS_CA_BUNDLE, GIT_SSL_CAINFO) and removed on close; the system trust store is never modified and the CA private key never leaves the proxy worker.
- AC4: Credential masking works over real HTTPS: the upstream receives the real credential, the sentinel never appears on the wire, and no substitution occurs for hosts outside injectHosts.
- AC5: Masking is exposed via `--mask-env NAME@host` / `KERYX_SANDBOX_MASK_ENV` and is REFUSED without TLS termination; the real credential is never forwarded to the contained process. Full suite green and `tsc` clean.
