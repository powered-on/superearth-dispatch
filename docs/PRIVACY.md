# Privacy Policy — SuperEarth Dispatch

**Last updated:** July 10, 2026

SuperEarth Dispatch (“the App”) is a fan-made [Reddit Devvit](https://developers.reddit.com/) application that displays public Helldivers 2 war information in a subreddit sidebar. This policy describes what data the App handles.

**Not affiliated with Arrowhead Game Studios, Sony Interactive Entertainment, or Reddit, Inc.**

## Summary

The App is read-only for visitors. It does not require Helldivers 2 login, does not collect game credentials, and does not ask sidebar viewers to submit personal information.

## Information we do not collect from visitors

The App does not intentionally collect, store, or sell:

- Real names, email addresses, or phone numbers from sidebar viewers
- Helldivers 2 account credentials or in-game identifiers
- Precise location data
- Payment or financial information

## Information processed by Reddit

Installing and using the App on a subreddit is subject to [Reddit’s Privacy Policy](https://www.reddit.com/policies/privacy-policy) and [Reddit’s User Agreement](https://www.reddit.com/policies/user-agreement). Reddit processes moderator account data, subreddit context, and platform telemetry according to its own policies.

## Server-side data fetching

When enabled by subreddit moderators, the App’s server periodically fetches **public** game status from external APIs:

| Purpose | Host |
|---------|------|
| Major Order | `api.helldivers2.dev` (community API; Arrowhead assignment data via `/raw/`) |
| Daily objectives (optional) | `api.diveharder.com` (third-party, if enabled in install settings) |

These requests are made by the App server on a schedule (approximately every 45 minutes). **No per-visitor identity or Reddit user data is sent to these APIs** as part of normal operation.

## Data stored by the App

The App caches normalized order text (titles, objectives, expiry metadata) in **Devvit Redis** scoped to each subreddit installation. This cache is used to render the sidebar widget and webview. Cached content is derived from public upstream APIs, not from individual Reddit users.

## Logs

Server logs may include technical diagnostics (timestamps, fetch success/failure, error messages). These logs are used for troubleshooting and are not sold.

## Children

The App is not directed at children under 13. We do not knowingly collect personal information from children.

## Changes

We may update this policy as the App or Reddit platform requirements change. The “Last updated” date at the top will be revised when material changes are made.

## Contact

Questions or privacy requests:

- [GitHub Issues — powered-on/superearth-dispatch](https://github.com/powered-on/superearth-dispatch/issues)

## Source code

Source: [github.com/powered-on/superearth-dispatch](https://github.com/powered-on/superearth-dispatch)
