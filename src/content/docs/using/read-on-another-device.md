---
title: Read on another device
description: Open your library from a phone, tablet, or second computer on your home network, and pair the device.
---

By default Alexandryn listens on the machine it runs on and nowhere else. Reading from
another device means making it reachable from your network, and then pairing the device.
Alexandryn always requires a login, whatever the address.

## Which setup can do this

- **The desktop app** listens on its own computer only. It has no setting to listen
  more widely. To read from other devices, run Alexandryn on a server with Docker.
- **Docker** lets you choose which network interface the port is published on. That
  is how you make it reachable.

## Make it reachable with Docker

Read [Exposing Alexandryn beyond your machine](/docs/security/exposing-alexandryn/)
first. The short version: on a home network the server will run over plain HTTP, which
means your password crosses the network unencrypted. Putting TLS in front of it is the
recommended setup.

Then, in your `docker-compose.override.yml`, change the published port. The example
file publishes it on this machine only:

```yaml
services:
  backend:
    ports:
      - '127.0.0.1:8080:8080'
```

Replace `127.0.0.1` with the address of this machine's home network interface, for
example `192.168.1.50`, and also uncomment the `CORS_ALLOWED_ORIGINS` line right below
it in the same file, set to that same address (`http://192.168.1.50:8080`). The server
already trusts the address it listens on inside Docker's own network, but a browser on
your LAN reaches it through the published port instead, at a different address the
server has no way to know on its own — without this, every request a browser makes,
including creating the first account, is rejected with "request origin is not allowed".
Use that specific address and not a bare `8080:8080`, which publishes the port on every
interface, including one that faces the internet if the machine has one.

Start it again with `docker compose --profile bundled-db up -d` once both lines are set.

Do not forward this port from your router to the internet without TLS in front of it.

## Pair the device

Other devices do not use your account password. A device pairs with a code:

1. On a device that is already signed in, open the network settings and start a pairing.
   It shows a code.
2. On the new device, scan the code or type it in.
3. From then on the new device has its own credential. It never sees or handles your
   password.

## Remove a device

The settings list every paired device, and you can revoke any of them one at a time.
Revoking a device stops it from starting a new session. A session that is already open
keeps working until its short-lived access token expires.
