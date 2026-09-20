---
title: Add a source
description: Tell Alexandryn where your book files are, from a local folder or an OPDS catalog.
---

A source is where Alexandryn looks for book files. Adding one is an administrator task.
There are two kinds:

- **A local folder** on the machine running Alexandryn.
- **An OPDS catalog** (versions 1.2 and 2.0) reachable over the network.

## A local folder

Point the source at a directory that Alexandryn can read.

If you run Alexandryn with Docker, the directory has to be mounted into the
container first. Add a volume mount in your own `docker-compose.override.yml`. A path
on your host that is not mounted into the container is invisible to Alexandryn, no
matter what you type into the source settings.

## An OPDS catalog

Point the source at the catalog's root URL. If the catalog needs credentials,
Alexandryn stores them encrypted. That encryption key lives in the `app-data` volume,
so include it in your [backups](/docs/admin/back-up-and-restore/).

## Check that it works

After you add a source, run its health check. It confirms that Alexandryn can reach
the source. A source that fails the check will not produce useful import results.

## Next

- [Import books](/docs/using/import-books/) from the source.
