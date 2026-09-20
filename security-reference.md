# Security reference

This document describes Alexandryn's security model as it actually
works: what's on by default, what you have to opt into, and what it
deliberately does not do. It's written for a self-hosting operator
deciding how to expose their instance, not as a general security
primer.

## Authentication

Every account has a username, an email address, and a password hashed
with Argon2id — passwords are never stored or logged in plaintext.
Sessions use short-lived signed access tokens plus a longer-lived
refresh token, so a stolen access token has a limited window of use
even if it's never explicitly revoked. Repeated failed login attempts
are rate-limited per account and per network address.

Two-factor authentication (TOTP, the standard six-digit authenticator-
app code) is available per account and optional — an admin cannot force
it on for other accounts, each account owner enables it for themselves.

Tokens issued for one purpose — a multi-factor verification step, a
device-pairing grant — cannot be used as an ordinary access token even
if captured, because they're signed with cryptographically distinct key
material and carry a type the access-token check rejects.

## Network exposure

Alexandryn binds to your local machine only by default (`127.0.0.1`, or
the equivalent isolated-by-default behavior in the Docker target — see
the self-hosting guide). Nothing about installing or starting it
exposes your library to your network or the internet; that's a
separate, deliberate step.

There are exactly two supported ways to make Alexandryn reachable
beyond the machine it runs on, and both require TLS — there's no
supported way to expose the library over plain HTTP beyond localhost:

1. **Behind your own reverse proxy** that already terminates TLS (for
   example, Caddy, nginx, or Traefik in front of the container), with
   Alexandryn itself bound to a private address the proxy reaches
   directly. Use this if you already run a reverse proxy for other
   services.
2. **Alexandryn terminates TLS itself**, either with a certificate file
   you provide (`TLS_CERT_FILE` / `TLS_KEY_FILE`) or by requesting one
   automatically via ACME (Let's Encrypt) when `ACME_ENABLED` is set
   with a real domain name pointed at your server. Use this if you'd
   rather not run a separate proxy.

Whichever mode you choose, if the address Alexandryn binds to is
publicly routable, it refuses to start at all without one of these two
TLS configurations in place — this is enforced in code, not left as a
setting you could accidentally leave off. A private, non-loopback
address (your home LAN, for instance) is allowed to run without TLS,
since it's not reachable from the public internet either way — but
anything reachable beyond your own network needs TLS regardless of
whether you consider the risk acceptable.

Cross-origin requests are denied by default; you name the exact origins
you trust, rather than starting from an allow-everything default and
narrowing it.

## Device pairing

Reaching Alexandryn from another device on your network (a phone, a
tablet, a second computer) uses a pairing flow: the device scans a code
or enters one shown by an already-authenticated session, and gets its
own credential from that point on — it never sees or handles the
account password. You can see every paired device and revoke any of
them individually from the settings screen. Revoking a pairing stops
that device's ability to establish a new session; it doesn't force out
one that's already mid-session until its current access token expires
(15 minutes).

## What Alexandryn does not do

- **No relay or tunnel.** Alexandryn does not operate any service on
  your behalf to make your instance reachable from outside your
  network — no built-in tunnel, no forwarding service, nothing that
  routes traffic through infrastructure this project runs. If your
  instance is reachable from the internet, that's a network path you
  set up yourself (port forwarding, a VPN, a reverse proxy on a server
  you control), not something Alexandryn arranged.
- **No cloud sync.** Reading progress, bookmarks, and library data sync
  only between your own paired devices, talking directly to your own
  instance. Nothing is sent to, or stored by, any server this project
  operates — because none exists. Metadata lookups (Open Library) are
  the one outbound network call Alexandryn makes to a third party, and
  it's limited to searching for and fetching public bibliographic
  information, never your library contents or reading activity.
- **No telemetry.** Alexandryn does not report usage, errors, or any
  other information back to this project. Diagnostics and activity
  logs stay on your own instance, for your own operational use.

## What's logged, and what isn't

Structured logs include request paths, status codes, and a correlation
ID useful for tracing one request through the system — never a
password, a session token, a stored source credential, a full
filesystem path under your home directory, or the content of what
anyone is reading.
