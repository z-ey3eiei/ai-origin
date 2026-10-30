# ONEORIGIN

## ONEORIGIN Workspace v1.1.0-beta.1

**Release channel: Public Beta · Public deployment: read-only**

Developer workspace built with Next.js, Primer React, and server-side AI and AWS adapters. This release adds the Tools & projects hub, supplied ONEORIGIN artwork, Thai typography, JSON export, and a shared version label across the app and its release endpoint.

> Public Beta is not a production-readiness certification. Public deployments block AI requests, knowledge search, uploads, and data mutations at the API boundary. Development behavior is preserved. There is no sign-in flow in this release; a browser-linked workspace cookie is not account authentication.

### Pages

| Route             | Purpose                                                                   |
| ----------------- | ------------------------------------------------------------------------- |
| `/`               | Public workspace overview                                                 |
| `/ecosystem`      | Existing websites, repositories, evidence, and JSON export                |
| `/playground`     | Chat interface; inference is disabled on public deployments               |
| `/models`         | Model catalog                                                             |
| `/knowledge`      | Knowledge interface; search and writes are disabled on public deployments |
| `/logs`           | Browser-workspace request history                                         |
| `/infrastructure` | Connection diagnostics; not a readiness guarantee                         |
| `/settings`       | Workspace configuration; saving is disabled on public deployments         |
| `/docs`           | Deployment guidance                                                       |
| `/api/release`    | Release name, version, channel, repository, and read-only state           |

### Existing platforms

- [DevStack](https://devstack.bid/) · [repository](https://github.com/developer-devstack/devstack.bid)
- [Aibotq](https://www.aibotq.dev/) · [repository](https://github.com/developer-devstack/aibotq-site)
- [ONEORIGIN](https://1origin.dev/) · [repository](https://github.com/examplessdk-lgtm/one.origin)
- [This workspace](https://github.com/z-ey3eiei/ai-origin)

These are links, not connected runtime tools. An available page or environment variable does not prove working authentication, inference, storage permissions, or deployment pipelines.

### Release checks

- TypeScript: `pnpm typecheck`
- Development API smoke checks: `pnpm test:api` with the dev server running
- Production build: `pnpm build`
- Production smoke checks: set `TEST_BASE_URL` to the production server and run `pnpm test:api`

Smoke checks do not perform paid inference, upload documents, or write AWS records. The public API boundary is tested separately for chat, generation, uploads, settings, and knowledge operations, including requests without an Origin header.

### Before enabling public AI or data changes

1. Implement real authentication and verify two-account data isolation. Keep Home public, prompt for login when sending chat, and return Home after login.
2. Verify the intended AWS identity and resource permissions, then test actual inference in an approved environment.
3. Add abuse controls that cannot be reset by replacing a browser cookie, and verify quotas, E2E behavior, and rollback.
4. Review and deliberately remove the read-only release gate. Do not remove it only to make a button work.

The app reads its version from `package.json`; update this README alongside the package version for each release. Secrets and credentials do not belong in Git.
