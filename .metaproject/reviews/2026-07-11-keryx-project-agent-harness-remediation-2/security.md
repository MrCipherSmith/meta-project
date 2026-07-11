# Security Review
Version: 1.0.0
Status: PASS

The package defines read-only, trusted-local, and unattended-untrusted
profiles; Release 0 is fail-closed. Approval/action fingerprints,
provenance, canonical path and argv controls, network-broker checks, and
mandatory negative scenarios are present. Semantic fixtures verify no live
effects during replay and no remote provider state in the fake descriptor.
No BLOCKER/P0/P1.
