# Updating your self-hosted instance

Alexandryn applies its own database schema migrations automatically on
startup — there's no separate migration command to run. Updating is
mostly a matter of getting a new image running.

## Before you update

Back up both persistent volumes (`postgres-data` and `app-data`) as
described in the administration guide. Migrations run automatically and
are written to be safe to apply, but a backup taken immediately before
an update is the cheapest insurance against anything going wrong during
it — a version mismatch you didn't expect, a host crash mid-migration,
or simple human error.

Check the changelog for the version you're updating to. Anything listed
under a `Removed` or `Changed` heading is the kind of thing worth
reading before you update, not after something behaves differently than
you expected.

## Updating

If you're running a published image:

```
docker compose pull
docker compose --profile bundled-db up -d
```

The second command recreates the `backend` container against the newly
pulled image; `postgres` and both named volumes are untouched.
Migrations run as part of that container's normal startup sequence, the
same as any other start.

If you're building from source instead of pulling a published image,
update your local checkout (`git pull`, or download the new release's
source) and rebuild:

```
docker compose --profile bundled-db up -d --build
```

## Verifying the update

Check `docker compose ps` — the `backend` service should show `healthy`
within a few seconds of starting (see the self-hosting guide's health
check section for what that actually checks). If it doesn't reach
healthy, check its logs:

```
docker compose logs backend
```

A migration failure, a configuration problem, or a database connectivity
issue all show up here with a specific reason — Alexandryn's own
startup sequence is designed to fail with a clear message rather than
start in a half-working state.

## If something goes wrong

Restore both volumes from the backup you took before updating, and
bring the previous image version back up
(`docker compose --profile bundled-db up -d` after checking out or
pulling the previous version's image tag). Because migrations run
automatically forward, there's no supported automatic downgrade path —
restoring from your pre-update backup is the way back, not rolling the
schema back in place.
