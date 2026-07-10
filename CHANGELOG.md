# Changelog

## 0.0.4 — 2026-07-10

### Changed

- HTTP domain request narrowed to official AHGS host only (`api.live.prod.thehelldiversgame.com`); diveharder removed from `devvit.json` pending separate approval
- Third-party personal API toggle defaults off; clear message when domain not declared

## 0.0.3 — 2026-07-10

### Fixed

- Stale state no longer reuses failed “Unavailable” placeholder text as if it were live order data
- AHGS client: browser-like headers, robust WarID parsing, clearer upstream error messages in UI
- Unavailable sections show fetch error detail instead of fake major-order copy

## 0.1.0 — 2026-07-09

### Added

- Devvit Web app with sidebar webview (`sidebar.html`) and `/api/orders` cache reader
- Per-installation cron refresh (45 min) with settings-aware fetch discipline
- Major Order from official AHGS (`WarID` → `Assignment/War/{season}`)
- Personal objectives from diveharder third-party API (official AHGS personal path stubbed pending Arrowhead Q1)
- Install settings: `showMajorOrder`, `showPersonalObjectives`, `personalUseThirdPartyApi`
- Sidebar textarea widget sync on install and cron
- Partial/stale/unavailable section states and source attribution footer
