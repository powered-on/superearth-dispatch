# App Review prep — superearth-dispatch

## Domain declarations (`devvit.json`)

**Reviewer doc (GitHub Pages):** https://powered-on.github.io/superearth-dispatch/domain-exceptions.html

- `api.helldivers2.dev` — Major Order via community API `/raw/` passthrough (Arrowhead assignment data)
- Reddit S3 upload hosts — custom widget image bootstrap (already approved)
- `api.diveharder.com` — deferred; optional third-party personal orders when separately approved

## Permissions justification

| Permission | Why |
|------------|-----|
| `redis` | Per-installation cache of order text between cron refreshes |
| `http` | Cron fetches enabled upstream sections only |
| `reddit` (moderator) | Install trigger creates sidebar widget and optional showcase post |

## Manual verification matrix

| AC | Steps |
|----|-------|
| AC-HRS.1 | Install on test sub; visitor sees loading → content in sidebar widget / webview |
| AC-HRS.2 | Toggle four show/source combinations; confirm sections hide independently |
| AC-HRS.3 | Cron logs: personal third-party toggle switches diveharder vs AHGS personal stub |
| AC-HRS.4 | Two cron cycles; `lastUpdated` advances without mod action |
| AC-HRS.5 | Disabled section → no upstream URL logged for that section |
| AC-HRS.6 | Major shows `setting.*` text only; no progress UI |
| AC-HRS.7 | Personal shows objectives; no progress UI |
| AC-HRS.8 | Webview network trace: only `/api/orders` |
| AC-HRS.9 | Simulate diveharder failure; major still renders if cached |
| AC-HRS.10 | Footer timestamp matches Redis `lastUpdated` |
| AC-HRS.11 | Footer attribution matches install settings |
| AC-HRS.12 | `devvit upload` dry-run / config validates declared domains |

## Fan project disclaimer

Unofficial fan tool. Not affiliated with Arrowhead Game Studios or Sony Interactive Entertainment. Order text © respective data providers.
