---
title: How security works
description: Accounts, sign-in, two-factor authentication, and what Alexandryn logs.
---

This page describes Alexandryn's security model as it actually works: what is on by
default, what you have to turn on, and what it deliberately does not do. It is written
for the person deciding how to run and expose an instance.

## Sign-in

Every account has a username, an email address, and a password. Passwords are hashed
with Argon2id, and never stored or logged in plaintext.

Sessions use short-lived signed access tokens plus a longer-lived refresh token, so a
stolen access token works only for a limited time. Repeated failed sign-in attempts are
rate-limited.

Two-factor authentication is available for each account and is optional. It uses the
standard six-digit code from an authenticator app (TOTP). An admin cannot turn it on for
other accounts. Each person enables it for themselves.

A token issued for one purpose, such as a multi-factor step or a device-pairing grant,
cannot be used as an ordinary access token, even if someone captures it. It is signed
with different key material and carries a type that the access check rejects.

## What Alexandryn does not do

- **No relay or tunnel.** Alexandryn runs no service to make your instance reachable
  from outside your network. If it is reachable from the internet, you set up that path
  yourself: port forwarding, a VPN, or a reverse proxy on a server you control.
- **No cloud sync.** Reading progress, bookmarks, and library data sync only between
  your own paired devices, directly with your own instance. This project operates no
  server that could store them. By default the only outside service Alexandryn contacts
  is Open Library, for metadata. It searches for and fetches public bibliographic
  information, never your library contents or reading activity. If you turn on ACME for
  TLS, Alexandryn also contacts the certificate authority to obtain your certificate.
- **No telemetry.** Alexandryn does not report usage, errors, or anything else to this
  project. Diagnostics and activity logs stay on your instance.

## What is logged

Structured logs include request paths, status codes, and a correlation ID for tracing
one request. They never include a password, a session token, a stored source credential,
a full path under your home directory, or the content of what anyone is reading.
