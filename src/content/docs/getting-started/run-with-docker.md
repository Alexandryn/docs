---
title: Run with Docker
description: Run Alexandryn in the background on a server or NAS with Docker Compose.
---

Use this path when you want Alexandryn to keep running without a desktop window
open, for example on a home server or NAS. If you only want to use Alexandryn on
one computer, [the desktop app](/docs/getting-started/install-the-desktop-app/) is
simpler.

## What you need

- Docker with the Compose plugin. Check with `docker compose version`. The older
  standalone `docker-compose` script is not what this configuration uses, because
  it relies on Compose profiles.
- A machine that can stay on: a home server, a NAS that supports Docker, or a small
  always-on computer. Alexandryn is lightweight and does not need server hardware.
- Disk space for the images, plus room for your library's database. The
  application image is well under 100 MB. The bundled `postgres:16-alpine` image is
  the larger part, around 300 MB. The database grows with your library.
- An internet connection the first time you start it, to pull the base images and
  build the application image.

## Get the files

Clone or download the [`alexandryn` repository](https://github.com/Alexandryn/alexandryn),
or download only `docker-compose.yml`, `docker-compose.override.yml.example`, and
`.env.example` from it.

## Configure it

Copy `.env.example` to `.env` in the same directory as `docker-compose.yml`, then set:

- `OPEN_LIBRARY_USER_AGENT`. Required, no default. Open Library asks every client
  to identify itself, so set a descriptive value such as
  `MyAlexandryn/1.0 (your contact address)`.
- `POSTGRES_PASSWORD`. Required for the bundled database, no default. Choose a real
  password. Compose refuses to start the bundled database without one, on purpose.

If you already run your own PostgreSQL server, set `DATABASE_URL` in `.env` instead
of `POSTGRES_PASSWORD`, and leave out the `bundled-db` profile in the next step.

## Start it

With the bundled PostgreSQL database:

```sh
docker compose --profile bundled-db up -d
```

With your own PostgreSQL server:

```sh
docker compose up -d
```

`-d` keeps it running after you close the terminal. The `backend` and `postgres`
services restart on their own if they crash or the host reboots. On the first start
Docker builds the application image and sets up the database schema. You do not run
any migration command yourself.

## Reach it

By default the container publishes no port. Alexandryn is not reachable from
anywhere, including the machine it runs on, until you choose to publish one.

To reach it from the same machine:

1. Copy `docker-compose.override.yml.example` to `docker-compose.override.yml` in
   the same directory. The override file is yours to edit; do not share or commit it.
2. Start it again:

   ```sh
   docker compose --profile bundled-db up -d
   ```

This publishes the server at `http://localhost:8080` on that machine only. Open it
in a browser to [create the administrator account](/docs/getting-started/first-run-setup/).

To reach Alexandryn from other devices, see
[Read on another device](/docs/using/read-on-another-device/) and
[Exposing Alexandryn beyond your machine](/docs/security/exposing-alexandryn/).

## Check that it is healthy

Run `docker compose ps`. The `backend` service shows `healthy` once the server is
ready, not merely running. The image defines its own healthcheck against `/readyz`.

Two endpoints report the server's state, which is useful for monitoring:

- `GET /healthz` returns `200` as soon as the process accepts connections, whatever
  the state of the database.
- `GET /readyz` returns `200` once the database connection works and the schema is
  migrated, and `503` otherwise.

## Where your data lives

Two named volumes hold everything that must survive a restart or an update:

- `postgres-data` is your library's database: catalog, collections, reading
  progress, and accounts. It does not hold the book files, which stay wherever your
  sources point.
- `app-data` holds the key that protects stored source credentials, and a cached TLS
  certificate if you use ACME. If you lose this volume, every saved source credential
  becomes unrecoverable and has to be entered again. Back it up together with the
  database, as described in [Back up and restore](/docs/admin/back-up-and-restore/).

Both volumes survive `docker compose down` and image rebuilds. `docker compose down -v`
deletes them. Use it only on purpose, and only after a backup.
