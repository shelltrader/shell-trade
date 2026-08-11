# Release Manifests

This directory holds one evidence-based manifest for each future release. Do not create a manifest until a real release candidate exists.

Each future release manifest should eventually record:

- **BUILD**
- **COMMIT**
- **DEPLOYMENT**
- **DATE**
- **TEST STATUS**
- **PRODUCTION FINGERPRINT**
- **FOUNDER VERIFICATION**
- **RELEASE DECISION**

A manifest should also link to relevant regression evidence, production-verification evidence, known exceptions, rollback reference, and the approval/hold rationale. A build label or a local branch is not, by itself, a production manifest.

The local release boundary is `scripts/release_control.js`. Before a production action, the Release Manager prepares a complete manifest from `RELEASE_TEMPLATE.md`, atomically acquires the Git-common-directory lock, and runs the gate. The gate checks the full commit, build, exact `website/game.html` SHA-256, tracked `website/` tree identity, synchronized `cq-build` metadata, and `scripts/verify.js`; it never deploys.
