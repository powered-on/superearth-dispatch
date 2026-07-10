# SuperEarth Dispatch

A fan-made Reddit sidebar app for **Helldivers 2** subreddits. Visitors can see the current **Major Order** and **Personal Orders** without logging into the game.

**Not affiliated with Arrowhead Game Studios or Sony Interactive Entertainment.**

## Features

- **Major Order** — current war assignment text in the subreddit sidebar
- **Personal Orders** — optional second section for personal order text (renamed from Daily Objectives)
- **Moderator controls** — install settings to show or hide each section independently
- **Optional third-party personal data** — mods can enable an alternate personal-orders source when available
- **Automatic updates** — order text refreshes on a schedule after install; no visitor action required
- **Read-only** — no game login and no gameplay actions
- **Goal breakdown** — major order tasks show kill quotas and planet hold targets with faction-colored progress
- **Clear status** — standby, stale, and unavailable states with source attribution

## Why this app needs HTTP domain exceptions

Reddit Devvit blocks outbound HTTP unless each **exact hostname** is declared in `devvit.json` and approved for the app. SuperEarth Dispatch cannot show live Major Order text without that permission — the assignment data lives on external game APIs, not on Reddit.

This app is **read-only**. It does not log players into Helldivers 2, perform in-game actions, or collect visitor credentials. Moderators install it on a subreddit; visitors see cached order text in the sidebar widget or post webview.

### How network access is used

| Concern | What we do |
|--------|------------|
| **Who calls external APIs** | Devvit **server** code only (scheduled cron + moderator “refresh” actions). Never the visitor’s browser. |
| **What the webview calls** | This app’s own `/api/orders` endpoint, which reads Redis cache. No third-party URLs in client-side code. |
| **What we send upstream** | Anonymous `GET` requests. Identification headers (`X-Super-Client`, `X-Super-Contact`) so the community API maintainer can reach us about abuse or breaking changes — no Reddit user data, no game accounts. |
| **What we store** | Normalized order text and progress numbers in per-subreddit Redis between refreshes. |
| **Refresh rate** | Default every 45 minutes per installation; only sections enabled in mod settings are fetched. |

### Domains declared in `devvit.json`

#### `api.helldivers2.dev` — **required for Major Order**

**Why:** The sidebar’s primary feature is the current Major Order (title, briefing, task goals, expiry). That text must be fetched from a Helldivers 2 war API and cached server-side.

**Why not Arrowhead directly:** We previously requested `api.live.prod.thehelldiversgame.com` and it was rejected. The [helldivers-2/api](https://github.com/helldivers-2/api) community project provides a `/raw/` passthrough of the same public assignment payloads and asks third-party apps to use it instead of hammering Arrowhead production servers. We use only their documented raw endpoints:

- `GET /raw/api/WarSeason/current/WarID`
- `GET /raw/api/v2/Assignment/War/{season}`

**Implementation:** `src/server/services/ahgsClient.ts`

**Data flow:** Public assignment JSON → mapped to display text → Redis → sidebar widget / post webview.

#### Reddit S3 upload hosts — **custom sidebar widget images**

**Why:** Reddit `custom` sidebar widgets require an `imageData` URL even when the widget is text/CSS-driven. The app uploads a minimal placeholder image via Reddit’s widget image API; responses are served from Reddit-owned S3 buckets.

**Hosts (already approved):**

- `reddit-uploaded-media.s3.amazonaws.com`
- `reddit-uploaded-media.s3-accelerate.amazonaws.com`
- `reddit-subreddit-uploaded-media.s3.amazonaws.com`
- `reddit-subreddit-uploaded-media.s3-accelerate.amazonaws.com`

**When used:** Custom-widget bootstrap and sync — not for order data.

#### Not currently requested

- **`api.diveharder.com`** — optional third-party Personal Orders source; install toggle defaults **off**. Will be requested in a separate review if mods need it.
- **`random.org` / `www.random.org`** — listed for compatibility; globally allow-listed by Devvit and unused in the current build.

### Privacy and terms

External fetching is described in [docs/PRIVACY.md](docs/PRIVACY.md) and [docs/TERMS.md](docs/TERMS.md). **Reviewer-facing domain justification:** [powered-on.github.io/superearth-dispatch/domain-exceptions.html](https://powered-on.github.io/superearth-dispatch/domain-exceptions.html). App review notes: [REVIEW.md](REVIEW.md).

## Changelog

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

## Custom sidebar widget (HD2 styling)

Devvit cannot reliably **create** Reddit `custom` sidebar widgets (platform `imageData` gap). Use a one-time PRAW bootstrap, then let the app **update** the widget on refresh and cron sync.

1. Create a [Reddit script app](https://www.reddit.com/prefs/apps) and note client id/secret.
2. As a subreddit mod:

```bash
pip install -r scripts/requirements.txt
export REDDIT_CLIENT_ID=...
export REDDIT_CLIENT_SECRET=...
export REDDIT_USERNAME=...
export REDDIT_PASSWORD=...
export SED_SUBREDDIT=your_subreddit_name   # optional; default playtest sub
python scripts/create-custom-widget.py
```

3. Upload/playtest the Devvit app and trigger **Force refresh** (or wait for cron).

**Notes**

- Do not delete the custom widget manually; **Re-add sidebar widget** updates an existing custom widget instead of replacing it with textarea.
- Subreddits without the PRAW bootstrap continue to use the textarea fallback.
- Re-add without a custom widget still creates textarea and points mods to the script above.
