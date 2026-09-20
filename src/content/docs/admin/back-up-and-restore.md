---
title: Back up and restore
description: Back up the database and the app-data volume together, and restore them.
---

Back up two things together. A backup of one without the other leaves you with a
library you can browse but cannot fully use.

## The database

The `postgres-data` volume holds your catalog, accounts, collections, and reading
data. Back it up with `pg_dump` against the running `postgres` container:

```sh
docker compose --profile bundled-db exec postgres \
  pg_dump -U admin alexandryn > alexandryn-backup.sql
```

If you changed `POSTGRES_USER` or `POSTGRES_DB` from their defaults (`admin` and
`alexandryn`), use your values instead.

## The app-data volume

This volume holds the encryption key for stored source credentials. Back up the
volume itself, for example:

```sh
docker run --rm -v alexandryn_app-data:/data -v "$(pwd)":/backup \
  alpine tar czf /backup/alexandryn-app-data-backup.tar.gz -C /data .
```

Restore the database and this volume from backups taken together. If they come from
different times, any source credential encrypted under the old key becomes unreadable,
and you will need to enter your source credentials again.

## Your book files

Alexandryn does not copy your book files into its own storage, so there is nothing more
to back up here. Back up the source location itself, the folder or the OPDS catalog, the
way you already do. Your database backup records what is in your library.

## Restore

1. Bring the stack down.
2. Restore the contents of both volumes from your backups.
3. Bring it back up.
