# SuperEarth Dispatch

Read-only Devvit app that shows **Helldivers 2 Major Order** and **daily objectives** for casual subreddit visitors. Data refreshes every 45 minutes via per-installation cron into Redis; the webview reads cache only.

**Not affiliated with Arrowhead Game Studios or Sony Interactive Entertainment.**

**Repository:** [github.com/powered-on/superearth-dispatch](https://github.com/powered-on/superearth-dispatch)  
**Reddit app:** [developers.reddit.com/apps/superearth-dispatch](https://developers.reddit.com/apps/superearth-dispatch)

## Legal (for Devvit / App Review)

| Document | Link |
|----------|------|
| Privacy Policy | [docs/PRIVACY.md](https://github.com/powered-on/superearth-dispatch/blob/main/docs/PRIVACY.md) |
| Terms and Conditions | [docs/TERMS.md](https://github.com/powered-on/superearth-dispatch/blob/main/docs/TERMS.md) |
| Software license | [LICENSE](https://github.com/powered-on/superearth-dispatch/blob/main/LICENSE) (GPL-3.0) |

## Features

- Mod install settings: show/hide Major Order and daily objectives independently
- Personal objectives: third-party API (`api.diveharder.com`) or official Arrowhead path (when configured)
- Cron fetches **enabled sections only** from each section's configured upstream
- Sidebar webview + synced sidebar textarea widget (markdown fallback for classic sidebar)
- Footer shows `lastUpdated` and data source attribution

## Data sources

| Section | Default source | Upstream |
|---------|----------------|----------|
| Major Order | Arrowhead (required) | `api.live.prod.thehelldiversgame.com` |
| Daily objectives | Third-party (toggle) | `api.diveharder.com/v1/personal_order` |

Declared in `devvit.json` → `permissions.http.domains`.

## Development

**Requirements:** Node 22+, Reddit developer account, mod access to a test subreddit (&lt;200 members for private playtest).

```bash
npm install
npm run login
npm run dev          # build + playtest on r/superearth_dispat_dev
```

Other commands:

- `npm run playtest` — playtest without rebuilding first (use after `npm run build`)
- `npm run logs` — stream server logs from the playtest sub
- `npm run build` — production client + server bundles
- `npm run upload` — upload private app version
- `npm run launch` — submit for App Review (required for subs with 200+ members)
- `npm test` — mapper unit tests

**Playtest sub:** [r/superearth_dispat_dev](https://www.reddit.com/r/superearth_dispat_dev/?playtest=superearth-dispatch)

## Install (moderators)

1. Install **superearth-dispatch** from the Devvit app directory on your subreddit.
2. Configure install settings (Major Order, daily objectives, third-party personal API).
3. The app creates a sidebar widget and an initial refresh on install. No ongoing mod action required for data freshness.

## App Review checklist

- [x] README documents data sources and unofficial fan-tool status
- [x] Privacy Policy and Terms linked in README
- [ ] `devvit.json` HTTP domains approved in [Developer Settings](https://developers.reddit.com/apps/superearth-dispatch/developer-settings)
- [ ] `devvit.json` declares `api.live.prod.thehelldiversgame.com` and `api.diveharder.com`
- [ ] Changelog maintained in `CHANGELOG.md`
- [ ] Playtest on pilot sub: webview loads, toggles work, cron advances `lastUpdated`
- [ ] No per-visitor game login; no `progress[]` UI

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
