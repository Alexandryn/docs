---
title: Exposing Alexandryn beyond your machine
description: The two supported ways to make Alexandryn reachable from other devices or the internet, and what each requires.
---

Alexandryn listens on your local machine only by default (`127.0.0.1`). In the Docker
setup it starts closed, with no published port. Installing or starting it does not
expose your library to your network or the internet. That is a separate, deliberate step.

## What the server requires

The address Alexandryn listens on decides what it insists on:

- **Loopback or a private address** (your home network, for example). Alexandryn is
  never directly reachable from a public address. It can run without TLS. If TLS is
  used, it can end at a reverse proxy in front of Alexandryn.
- **A publicly reachable address.** Alexandryn refuses to start unless it terminates
  TLS itself, with a valid certificate. This is enforced in code and cannot be left
  off by accident.

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

The example override file, `docker-compose.override.yml.example`, publishes the port on
`127.0.0.1` only. That reaches the server from the same machine and no other. Its
comments advise putting TLS in place before you change that address to a network
interface, because plain HTTP on a network sends passwords unencrypted.

Also see [How security works](/docs/security/how-security-works/) for what Alexandryn
does and does not do.
