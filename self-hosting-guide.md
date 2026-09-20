# Self-hosting Alexandryn with Docker

This guide covers running Alexandryn on your own server or NAS using
Docker. If you only want to use Alexandryn on one computer, the desktop
application is simpler — you don't need this guide. Use this path when
you want Alexandryn to run continuously in the background, reachable
without a desktop window open.

## Prerequisites

- Docker with the Compose plugin (`docker compose`, not the older
  standalone `docker-compose` script) — this configuration uses Compose
  profiles, which need a reasonably current Compose version. Most
  current Docker installations include the plugin already; check with
  `docker compose version`.
- A machine that can stay on: a home server, a NAS that supports Docker,
  or a small always-on computer. Alexandryn itself is lightweight — it
  doesn't need dedicated server hardware.
- A few hundred MB of disk space for the images themselves (the
  application image is small, well under 100 MB; the bundled
  `postgres:16-alpine` image is the larger part, around 300 MB), plus
  however much space your library's database and, if you're using the
  bundled database, its own storage need. This scales with your library
  size, not with a fixed minimum.

## Getting the files

Clone or download the `alexandryn` repository, or download just
`docker-compose.yml`, `docker-compose.override.yml.example`, and
`.env.example` from it. You don't need the full source tree to run the
container — only these configuration files, plus a working internet
connection the first time you start it (to pull the base image and
build it, or to pull a published image once one exists).

## Configuration

Copy `.env.example` to `.env` in the same directory as
`docker-compose.yml`, and fill in:

- `OPEN_LIBRARY_USER_AGENT` — required, no default. Open Library's API
  requires every client to identify itself with a descriptive
  User-Agent string. Set something that identifies your instance, for
  example `MyAlexandryn/1.0 (myemail@example.com)`. A placeholder value
  here would misrepresent your instance to Open Library's real API, so
  there's no built-in default to fall back on.
- `POSTGRES_PASSWORD` — required if you're using the bundled database
  (below), no default. Set a real password; Alexandryn refuses to start
  the bundled database without one, on purpose — a shipped default
  password is a security hole waiting to happen, not a convenience.

If you already run your own PostgreSQL server and would rather point
Alexandryn at it than run a bundled one, set `DATABASE_URL` directly
instead of `POSTGRES_PASSWORD`, and don't use the `bundled-db` profile
in the next step.

## Starting Alexandryn

With the bundled PostgreSQL database (the simplest path for most
people):

```
docker compose --profile bundled-db up -d
```

Against your own external PostgreSQL server (with `DATABASE_URL` set in
`.env`):

```
docker compose up -d
```

Either way, `-d` runs it in the background so it keeps running after you
close your terminal, and both services restart automatically if they
crash or the host reboots.

On first start, Docker builds the application image (or pulls a
published one, once this project publishes one) and initializes the
database schema automatically — you don't need to run any migration
command yourself.

## Reaching Alexandryn

By default, the container publishes no network port at all — it's not
reachable from anywhere, including your own machine, until you say so.
This is deliberate: Alexandryn never assumes network exposure is safe
just because you configured it, and the default configuration ships
closed.

To reach Alexandryn from the same machine the container runs on, copy
`docker-compose.override.yml.example` to `docker-compose.override.yml`
in the same directory (this file is meant to be edited locally and
never shared or committed anywhere — it's specific to your setup) and
restart:

```
docker compose --profile bundled-db up -d
```

This publishes the server on `http://localhost:8080`, reachable only
from that same machine. Open that address in a browser to continue to
first-run setup, below.

To reach Alexandryn from other devices on your home network, or from
outside your network, see the security reference — that requires
setting up TLS first, not just publishing a port further.

## First-run setup

The first time you open Alexandryn (desktop or self-hosted), it shows a
setup screen instead of a login screen — nothing exists yet to log in
to. Create the initial administrator account: a username, an email
address, and a password (8 to 128 characters). This account has full
administrative access, including creating other users and configuring
sources.

Once this account exists, the setup screen never appears again — every
subsequent visit shows the ordinary login screen.

## Verifying it's healthy

Two endpoints report on the server's own state, useful for confirming
it's actually working (and for anything monitoring it, like a
reverse-proxy healthcheck):

- `GET /healthz` — returns `200` the instant the process is accepting
  connections at all, independent of the database. Useful for "is the
  process alive."
- `GET /readyz` — returns `200` once the database connection is
  established and the schema is migrated; `503` otherwise. Useful for
  "is it actually ready to serve requests."

The Docker image also defines its own container healthcheck against
`/readyz`, so `docker compose ps` shows `healthy` once the server is
actually ready, not just running.

## Persistent data

Two named volumes hold everything that needs to survive a restart or an
upgrade:

- `postgres-data` — your library's database: catalog, collections,
  reading progress, accounts, everything except the book files
  themselves (which live wherever your configured sources point).
- `app-data` — a small directory holding an encryption key used to
  protect stored source credentials at rest, and a cached TLS
  certificate if you've set up ACME (see the security reference). If
  this volume is lost, every source credential you've saved becomes
  unrecoverable and needs to be re-entered — it isn't backed up
  separately from the encryption key that protects it, so back both up
  together (see the administration guide).

Both are Docker named volumes, so they survive `docker compose down`
(without `-v`) and image rebuilds. `docker compose down -v` removes
them — only do this deliberately, and only after you've backed up
anything you want to keep.
