---
title: Update Alexandryn
description: Back up, update a Docker setup, check that it started, and roll back if it did not.
---

Alexandryn applies its own database migrations when it starts. There is no separate
migration command. Updating means getting the new version running.

## Before you update

1. **Back up both volumes**, `postgres-data` and `app-data`, as described in
   [Back up and restore](/docs/admin/back-up-and-restore/). Migrations run
   automatically and are written to be safe, but a backup taken just before an update is
   the cheapest insurance against a host crash, an unexpected version mismatch, or a
   simple mistake.
2. **Read the changelog** for the version you are updating to. Anything under a
   `Removed` or `Changed` heading is worth reading before you update.

## Update

Update your local copy of the `alexandryn` repository (`git pull`, or download the new
release's source) and rebuild:

```sh
docker compose --profile bundled-db up -d --build
```

This recreates the `backend` container from the new source. The `postgres` container
and both named volumes are untouched. Migrations run as part of the container's normal
start.

## Check that it started

Run `docker compose ps`. The `backend` service should show `healthy` within a few
seconds. If it does not, read its logs:

```sh
docker compose logs backend
```

A failed migration, a configuration problem, or a database connection problem shows up
there with a specific reason. Alexandryn is built to stop with a clear message, and not
to start in a half-working state.

## If something goes wrong

Restore both volumes from the backup you took before updating, then bring the previous
version back up: check out or pull the previous version, and run
`docker compose --profile bundled-db up -d`. Migrations only run forward, so there is no
supported way to downgrade the schema in place. Restoring from your pre-update backup is
the way back.
