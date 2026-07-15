# SuperEarth Dispatch

A fan-made Reddit sidebar app for **Helldivers 2** subreddits. Visitors can see the current **Major Order** and **Personal Orders** without logging into the game.

**Not affiliated with Arrowhead Game Studios or Sony Interactive Entertainment.**

## Features

- **Major Order** — current war assignment text in the subreddit sidebar
- **Personal Orders** — optional second section for personal order text (renamed from Daily Objectives)
- **Moderator controls** — install settings to show or hide each section independently
- **Automatic updates** — order text refreshes on a schedule after install; no visitor action required
- **Read-only** — no game login and no gameplay actions
- **Goal breakdown** — major order tasks show kill quotas and planet hold targets with faction-colored progress
- **Clear status** — standby, stale, and unavailable states with source attribution

## S3 orders cache data path

Reddit denied Devvit HTTP for game APIs. SuperEarth Dispatch uses an **S3 cache**: GitHub Actions fetches public order data and writes JSON to a public S3 object; Devvit reads that URL through approved S3 hostnames only.

| Layer | Behavior |
|-------|----------|
| **External sync** | GHA (UTC `:00/:10/…`) fetches `api.helldivers2.dev` + `api.diveharder.com` → S3 `orders-cache.json` |
| **Devvit server** | Cron (UTC `:05/:15/…`) + mod refresh `fetch` S3 cache only |
| **Webview** | `/api/orders` (Redis cache) — no third-party URLs in the browser |
| **Visitors** | Read-only; no game login; no Reddit user data sent to game APIs |

**Operator setup:** `FA Dev Tooling/projects/superearth-dispatch/runbooks/s3-orders-cache-aws-setup.md` · `s3-orders-cache-gha-setup.md`

**Reviewer doc:** [s3-cache-mode.html](docs/s3-cache-mode.html) · [REVIEW.md](REVIEW.md) · [PRIVACY.md](docs/PRIVACY.md)

## Changelog

### Unreleased — S3 orders cache

- S3 public JSON cache; Devvit HTTP enabled for `s3.amazonaws.com` only
- GHA workflow `sync-orders-s3.yml` + `npm run orders:sync` (OIDC)
- UTC offset cadence: publisher `:00/:10/…`, reader `:05/:15/…`

### Unreleased — hub wiki mode (superseded)

- Hub wiki path retired; see archived runbook `hub-wiki-github-actions.md`

### 0.0.44 — 2026-07-10

- **Textarea-only sidebar widget:** dropped custom widget create (Devvit proto gap) and PRAW bootstrap; install/re-add/sync always use textarea with HD2 Markdown styling
- Removed Reddit S3 upload domains from `devvit.json` (no longer needed)
- Legacy custom widgets removed on sync

### 0.0.37 — 2026-07-10

- Major Order fetch via `api.helldivers2.dev` community API (`/raw/` passthrough) instead of direct Arrowhead host
- HTTP allowlist narrowed to `api.helldivers2.dev` plus already-approved Reddit S3 upload domains

### 0.0.36 — 2026-07-10

- **Textarea fallback styling:** blockquote goal panels, Unicode progress bars, faction emoji on kill quotas (🟧🟥🟪), ⬛/🟩 hold boxes
- Custom widget CSS: base Rajdhani/Barlow typography aligned with execution mock
- Widget sync cron every 5 minutes; PRAW bootstrap script for custom widget creation

### 0.0.35 — 2026-07-10

- **PRAW + Devvit split:** custom sidebar widget bootstrap via `scripts/create-custom-widget.py`; app updates existing custom widgets (text/css/height) instead of deleting them
- Re-add preserves and refreshes PRAW-created custom widgets; textarea fallback still used when no custom widget exists

### 0.0.18 — 2026-07-10

- Fix widget placeholder URL: prefer UploadSrImg, resolve S3 Location/websocket CDN URL for imageData

### 0.0.17 — 2026-07-10

- Custom widget placeholder: use Reddit widget image upload API (not post media); show custom error on textarea fallback

### 0.0.16 — 2026-07-10

- Custom sidebar widget: upload 1×1 placeholder image for required `imageData` field

### 0.0.15 — 2026-07-10

- Fix custom widget create: omit empty `imageData` (Reddit rejects `[]`); fall back to textarea widget on create failure

### 0.0.14 — 2026-07-10

- Fix re-add sidebar widget: verified deletes, subreddit context fallback, markdown fallback, clearer errors

### 0.0.13 — 2026-07-10

- Install settings: **Force refresh button** and **Re-add sidebar widget** toggles
- Moderator toolbar on Live Orders post when settings are enabled
- Matching overflow-menu actions for force refresh and sidebar widget re-add

### 0.0.12 — 2026-07-10

- Post webview layout fills the feed pane (two-column Major/Personal on wide viewports)

### 0.0.11 — 2026-07-10

- Fix sidebar migration: legacy textarea widgets are deleted before creating the custom widget
- Add **Refresh orders now** on app posts (⋯ menu on Live Orders post)

### 0.0.10 — 2026-07-10

- Sidebar widget upgraded from textarea to **custom widget** with HD2-styled scoped CSS
- Faction-colored goal markup, static countdown text, and CSS progress hints in sidebar
- Devvit post webview styled to Vision mock (HD2 panels, header, badges, callouts)
- Post inline height set to `tall` for fuller order display

### 0.0.9 — 2026-07-10

- Renamed user-facing **Daily Objectives** to **Personal Orders**
- Live countdown timers on Major Order and Personal Orders
- Major order goal breakdown from API tasks (kill quotas, planet hold/liberate targets)
- Faction-colored goals and progress bars; solid boxes for planet hold completion
- Major order **standby** state when AHGS returns no active assignment

### 0.0.7 — 2026-07-10

- Restored daily-objectives fetch for when third-party domain access is approved

### 0.0.6 — 2026-07-10

- Updated external domain configuration for Reddit platform review

### 0.0.4 — 2026-07-10

- Narrowed domain request to official game API host; third-party daily source deferred pending approval
- Third-party daily toggle defaults off until domain access is available

### 0.0.3 — 2026-07-10

- Fixed misleading “stale” display when order data had never loaded successfully
- Clearer error messages when order data is unavailable

### 0.1.0 — 2026-07-09

- Initial release: Major Order and daily objectives in subreddit sidebar
- Moderator install settings for each section
- Scheduled background refresh and sidebar widget sync
- Partial, stale, and unavailable states with source attribution

## Sidebar widget

The app uses a **textarea** sidebar widget (scalable on every install — no manual mod steps). Content is Markdown with HD2-themed styling:

- Dark header/background colors via widget `styles`
- Unicode progress bars (`█` / `░`) for kill quotas
- Faction emoji on goals (🟧 Terminid, 🟥 Automaton, etc.)
- ⬛/🟩 hold boxes for planet objectives

Install or **Re-add sidebar widget** creates/updates the widget automatically. Cron sync runs every 5 minutes.

**Custom widgets (scoped CSS)** are deferred until Reddit/Devvit fixes `WidgetImage.name` in the widgets proto. See `FA Dev Tooling/notes/Devvit troubleshooting.md`.
