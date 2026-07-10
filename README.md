# SuperEarth Dispatch

A fan-made Reddit sidebar app for **Helldivers 2** subreddits. Visitors can see the current **Major Order** and **daily objectives** without logging into the game.

**Not affiliated with Arrowhead Game Studios or Sony Interactive Entertainment.**

## Features

- **Major Order** — current war assignment text in the subreddit sidebar
- **Daily objectives** — optional second section for personal order text
- **Moderator controls** — install settings to show or hide each section independently
- **Optional third-party daily data** — mods can enable an alternate daily-objectives source when available
- **Automatic updates** — order text refreshes on a schedule after install; no visitor action required
- **Read-only** — no game login, no progress tracking, no gameplay actions
- **Clear status** — shows when data is unavailable or temporarily stale, with source attribution

## Changelog

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
