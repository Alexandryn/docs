# Administering Alexandryn

This guide covers day-to-day administration once Alexandryn is running:
accounts, libraries, sources, and backups. It assumes you've already
completed first-run setup (see the self-hosting guide) and have an
administrator account.

## Accounts and roles

Every account has one of two roles:

- **Admin** — can manage sources, libraries, and other accounts, and can
  see operational information like the activity log and diagnostics.
- **Reader** — can browse, read, and manage their own reading progress,
  bookmarks, and highlights, but cannot change sources or library
  configuration. A reader can optionally be allowed to add works to a
  library from a source, if you enable that for the library (see
  below).

The first account created during setup is an admin. There's no separate
"owner" role above admin — every admin has equal administrative access.

## Libraries

Alexandryn supports more than one library namespace under one running
instance — useful for a household that wants separate collections (for
example, separating an adult's collection from a child's), or separate
permission levels for the same underlying server.

To create a library beyond the default one, use the library management
screen (admin only) and provide a name and optional description. You
can also decide there whether readers in that library are allowed to
add works from a configured source themselves, or whether only admins
can.

To give someone access to a library, create an invitation for their
email address and a role (admin or reader) from that library's
management screen. They accept it from a link; accepting creates their
account if they don't have one yet, or adds the membership if they do.

Every request to a multi-library instance operates against one active
library at a time. Switching libraries in the interface changes which
one subsequent actions apply to — it does not merge or search across
libraries at once.

## Sources

A source is where Alexandryn looks for book files: a local folder on
the server's filesystem, or an OPDS catalog (versions 1.2 and 2.0) over
the network. Adding a source is an admin action.

- **Local folder** — point it at a directory the container can read.
  If you're running Docker, that means mounting the directory into the
  container (add a volume mount in your own
  `docker-compose.override.yml`) — a path on your host that isn't
  mounted into the container isn't visible to Alexandryn no matter what
  you type into the source configuration.
- **OPDS catalog** — point it at the catalog's root URL. If the catalog
  requires credentials, Alexandryn stores them encrypted at rest (see
  the security reference) — this is exactly the credential material the
  self-hosting guide's note about the `app-data` volume and backups
  applies to.

After adding a source, use its health check to confirm Alexandryn can
actually reach it before relying on it. A source that fails its health
check won't produce useful import results.

## Importing books

Once a source is configured, run a discovery pass against it from the
Import screen. Alexandryn finds candidate files, matches them against
Open Library metadata where it can, and presents them for confirmation
— nothing is added to your library automatically without that
confirmation step. Review each candidate, correct the match if Open
Library guessed wrong or found nothing, and confirm the ones you want.

## Backup and restore

Two things need backing up together, not separately — a backup of one
without the other leaves you with a library you can browse but can't
fully use:

- **The database** (`postgres-data` volume): your catalog, accounts,
  collections, and reading data. Back it up with `pg_dump`, run against
  the running `postgres` container:

  ```
  docker compose --profile bundled-db exec postgres \
    pg_dump -U admin alexandryn > alexandryn-backup.sql
  ```

  (Adjust the username and database name if you changed
  `POSTGRES_USER` / `POSTGRES_DB` from their defaults.)

- **The app-data volume**: the encryption key protecting stored source
  credentials. Back up the Docker volume itself, for example:

  ```
  docker run --rm -v alexandryn_app-data:/data -v "$(pwd)":/backup \
    alpine tar czf /backup/alexandryn-app-data-backup.tar.gz -C /data .
  ```

  If you restore the database from a backup but not this volume (or
  vice versa, restore this volume against a database backup taken at a
  different time), any source credential encrypted under the old key
  becomes unreadable under the new one. Restore both from backups taken
  together, or be ready to re-enter source credentials after a partial
  restore.

Your library's actual book files are backed up separately, by whatever
means you already use for the source location itself (the folder or
the OPDS catalog) — Alexandryn doesn't copy source files into its own
storage, so there's nothing additional to back up there beyond the
database record of what's in your library.

To restore, bring the stack down, restore both volumes' contents from
your backups, and bring it back up.
