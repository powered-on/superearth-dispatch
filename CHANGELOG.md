# Changelog

## Unreleased — S3 orders cache

### Changed

- **S3 cache path:** Devvit reads public `orders-cache.json` from FA-controlled S3 via approved `s3.amazonaws.com` hosts; no game API calls from Devvit
- `permissions.http` enabled for `s3.amazonaws.com` and `*.s3.amazonaws.com` only
- GitHub Actions workflow `.github/workflows/sync-orders-s3.yml` + `npm run orders:sync` (OIDC upload, no Reddit OAuth)
- UTC cadence: GHA publish `:00/:10/…`; Devvit `refreshOrders` `:05/:15/…`; `syncWidget` every 5 minutes
- Operator runbooks: `FA Dev Tooling/projects/superearth-dispatch/runbooks/s3-orders-cache-aws-setup.md`, `s3-orders-cache-gha-setup.md`
- Hub wiki path archived; `hub-wiki-github-actions.md` retained for rollback reference only

## Unreleased — hub wiki mode (superseded)

### Changed

- Hub wiki only: Devvit read via `getWikiPage`; replaced by S3 cache path above
