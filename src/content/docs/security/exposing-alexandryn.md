---
title: Exposing Alexandryn beyond your machine
description: The two supported ways to make Alexandryn reachable from other devices or the internet, and what each requires.
---

Alexandryn listens on your local machine only by default (`127.0.0.1`). In the Docker
setup it starts closed, with no published port. Installing or starting it does not
expose your library to your network or the internet. That is a separate, deliberate step.

## What the server requires

The address Alexandryn listens on is set with `BIND_ADDRESS`. It decides what the server
insists on:

- **Loopback or a private address** (your home network, for example). The server will
  start without TLS. It does not check what sits in front of it: a port forward, a
  Docker port mapping, or a proxy can make a private address reachable from elsewhere,
  and none of those add TLS for you.
- **A public address.** The server refuses to start unless it terminates TLS itself,
  with a valid certificate. This is enforced in code.

So the server permits plain HTTP on a private address, but that is a limit on what it
enforces, not a recommendation. On plain HTTP your password crosses the network in the
clear. Put TLS in place before you make Alexandryn reachable beyond one machine, and do
not forward a port to the internet without it.

Authentication is required in every case. Cross-origin requests are denied by default.
You name the exact origins you trust, and start from none.

## The two supported setups

1. **Behind your own reverse proxy.** A proxy such as Caddy, nginx, or Traefik ends TLS
   in front of Alexandryn, and Alexandryn listens on a private address that the proxy
   reaches directly. Choose this if you already run a reverse proxy.
2. **Alexandryn ends TLS itself.** Either provide a certificate with `TLS_CERT_FILE` and
   `TLS_KEY_FILE`, or set `ACME_ENABLED` with a real domain name pointing at your server,
   and Alexandryn requests a certificate from Let's Encrypt. Choose this if you would
   rather not run a proxy. ACME needs a publicly reachable address, so it does not
   apply to a loopback or private one. There, use a certificate file or a proxy.

## Docker

In the Docker setup the server always listens on a fixed private address inside
Compose's own network, so the public-address rule never applies there. What decides who
can reach it is the port you publish. The example override file,
`docker-compose.override.yml.example`, publishes it on `127.0.0.1` only, which reaches the
server from the same machine and no other. Its comments advise putting TLS in place
before you change that address to a network interface.

Also see [How security works](/docs/security/how-security-works/) for what Alexandryn
does and does not do.
