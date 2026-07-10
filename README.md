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

## Changelog

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
