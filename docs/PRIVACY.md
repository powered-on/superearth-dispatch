# Privacy Policy — SuperEarth Dispatch

**Last updated:** July 15, 2026

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

### Devvit app (per subreddit installation)

The App’s Devvit server does **not** make outbound HTTP requests to external game APIs. It performs an anonymous `GET` of a single public JSON object on developer-operated Amazon S3 (`orders-cache.json`), parses public order text, and caches it in Devvit Redis for the sidebar widget and webview.

### External sync job (developer-operated)

Public game data shown by the App is kept current by a **scheduled job outside Devvit** (GitHub Actions in the [open-source repository](https://github.com/powered-on/superearth-dispatch)). That job:

| Purpose | Host | Called from |
|---------|------|-------------|
| Major Order | `api.helldivers2.dev` | GitHub Actions (not Devvit) |
| Personal Orders | `api.diveharder.com` | GitHub Actions (not Devvit) |

The job uses anonymous `GET` requests and community API identification headers (`X-Super-Client`, `X-Super-Contact`). It does not receive Reddit user IDs or other personal information from the App or from Reddit viewers.

The job writes normalized order JSON to S3 using a scoped IAM role (OIDC from GitHub Actions). The object is publicly readable. Default publish cadence is every **10 minutes UTC** (`:00, :10, :20, …`).

**No per-visitor identity or Reddit user data is sent to game APIs** as part of normal operation.

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
