---
title: Back up and restore
description: Back up the database and the app-data volume, protect the copies, and restore them.
---

Back up two things, taken at the same time. A database backup without the key that goes
with it leaves you with a library you can browse but cannot fully use.

## Protect the backups

The two backups are sensitive. The database dump holds account data, including password
hashes. The app-data volume holds the key that encrypts your stored source credentials.
Someone who has both can read those credentials.

- Run `umask 077` in your shell before the commands below, so the files are readable only
  by you.
- Encrypt the copies before you store them anywhere other than this machine.
- Where you can, keep the database dump and the key backup in separate places. They only
  have to match in time, not sit together.

## The database

The `postgres-data` volume holds your catalog, accounts, collections, and reading data.
Back it up with `pg_dump` against the running `postgres` container. The `-T` flag keeps
Compose from allocating a terminal, which could alter the output:

```sh
docker compose --profile bundled-db exec -T postgres \
  pg_dump -U admin alexandryn > alexandryn-backup.sql
```

If you changed `POSTGRES_USER` or `POSTGRES_DB` from their defaults (`admin` and
`alexandryn`), use your values instead.

## The app-data volume

Back up the volume itself. Compose prefixes the volume name with your project name, which
is normally the name of the directory that holds `docker-compose.yml`. Find the exact name
first:

```sh
docker volume ls --filter name=app-data
```

Then, using that name in place of `alexandryn_app-data`:

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

These steps have not been tested against a real backup. Try them on a copy of your setup
first, and keep the backups until you have confirmed the restore worked.

1. Bring the stack down: `docker compose --profile bundled-db down`.
2. Restore the app-data volume by extracting the archive into it:

   ```sh
   docker run --rm -v alexandryn_app-data:/data -v "$(pwd)":/backup \
     alpine sh -c 'cd /data && tar xzf /backup/alexandryn-app-data-backup.tar.gz'
   ```

3. Start only the database, and wait until it reports healthy in `docker compose ps`:

   ```sh
   docker compose --profile bundled-db up -d postgres
   ```

4. Load the dump into an empty database. If the database already has tables from an
   earlier start, remove the `postgres-data` volume first (`docker volume rm`, with the
   name from `docker volume ls`), start `postgres` again, and then load:

   ```sh
   docker compose --profile bundled-db exec -T postgres \
     psql -U admin -d alexandryn < alexandryn-backup.sql
   ```

5. Bring the rest up: `docker compose --profile bundled-db up -d`.
