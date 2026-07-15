# App Review prep — superearth-dispatch

## Data path (S3 cache mode)

**Reviewer doc (GitHub Pages):** https://powered-on.github.io/superearth-dispatch/s3-cache-mode.html

Devvit does **not** call game APIs. Order text comes from a single public JSON object on FA-controlled Amazon S3, written by GitHub Actions outside Devvit.

| Item | Value |
|------|--------|
| Devvit `permissions.http` | Enabled for `s3.amazonaws.com`, `*.s3.amazonaws.com` only |
| Order ingestion | GitHub Actions → S3 `orders-cache.json` |
| Public object | `https://superearth-dispatch-orders-live-prod.s3.us-east-1.amazonaws.com/orders-cache.json` |
| Devvit read | Anonymous `fetch()` of object URL only |
| Client network | `/api/orders` only |
| Publish cadence (UTC) | GHA `:00, :10, :20, …` |
| Read cadence (UTC) | Devvit `refreshOrders` `:05, :15, :25, …` |

**Operator setup:** [s3-orders-cache-aws-setup.md](https://github.com/powered-on/FA-Dev-Tooling/blob/main/projects/superearth-dispatch/runbooks/s3-orders-cache-aws-setup.md) · [s3-orders-cache-gha-setup.md](https://github.com/powered-on/FA-Dev-Tooling/blob/main/projects/superearth-dispatch/runbooks/s3-orders-cache-gha-setup.md)

**Paste-ready review language:** `FA Dev Tooling/notes/hub-wiki-review-disclosure.md` (S3 section)

### Data flow

1. GitHub Actions fetches public Major Order from `api.helldivers2.dev` and Personal Orders from `api.diveharder.com`.
2. Workflow writes versioned JSON to S3 (`orders-cache.json`) via OIDC-scoped IAM role.
3. Devvit cron / mod refresh fetches that object, parses JSON, merges into per-install Redis when `lastUpdated` advances.
4. Sidebar widget and webview render from Redis.

### What Devvit does not do

- No `fetch()` to game APIs
- No Reddit user IDs in cache payload or upstream game API calls
- No visitor browser calls to third-party domains

## Permissions justification

| Permission | Why |
|------------|-----|
| `redis` | Per-installation cache of order text between cron refreshes |
| `reddit` (moderator) | Install trigger creates sidebar widget and showcase post |
| `http` | Anonymous read of FA S3 orders cache object only |

## Manual verification matrix

| AC | Steps |
|----|-------|
| AC-S3.1 | `devvit.json`: `http.enable: true`; domains include S3 hosts used by fetch URL |
| AC-S3.2 | Cron logs show `orders cache read`; no `hub wiki read`; no Devvit `upstream api.helldivers2.dev` |
| AC-S3.3 | Webview network trace: only `/api/orders` |
| AC-S3.4 | Public S3 object contains valid JSON after GHA run |
| AC-S3.5 | Install settings hide Major / Personal sections independently |
| AC-S3.6 | Stale/unavailable when object missing or parse fails; merge guard skips when `lastUpdated` unchanged |
| AC-S3.7 | Footer attribution: Major/Personal external sync |
| AC-S3.8 | `devvit upload` validates with HTTP enabled |
| AC-CAD.1 | After GHA publish, next `:05/:15/…` Devvit run merges when `lastUpdated` advances |

## Fan project disclaimer

Unofficial fan tool. Not affiliated with Arrowhead Game Studios or Sony Interactive Entertainment. Order text © respective data providers.

## Legacy paths

- **Hub wiki mode:** [hub-wiki-mode.html](https://powered-on.github.io/superearth-dispatch/hub-wiki-mode.html) — rollback reference
- **HTTP domain exceptions:** [domain-exceptions.html](https://powered-on.github.io/superearth-dispatch/domain-exceptions.html)
