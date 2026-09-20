---
title: Read on another device
description: Open your library from a phone, tablet, or second computer on your home network.
---

By default Alexandryn listens on the machine it runs on and nowhere else. Reading from
another device means turning network access on, and pairing the device.

## Turn on network access

Alexandryn always requires a login, and it will not listen beyond your own machine
until you turn network access on. How far you can go depends on the address it
listens on:

- A **private address**, such as one on your home network, can run without TLS.
- A **publicly reachable address** requires TLS. Alexandryn refuses to start without it.

For the two supported ways to set up TLS, and what each one needs, see
[Exposing Alexandryn beyond your machine](/docs/security/exposing-alexandryn/).

## Pair the device

Other devices do not use your account password. A device pairs with a code:

1. On a device that is already signed in, open the settings and start a pairing. It
   shows a code.
2. On the new device, scan the code or type it in.
3. From then on the new device has its own credential. It never sees or handles your
   password.

## Remove a device

The settings list every paired device, and you can revoke any of them one at a time.
Revoking a device stops it from starting a new session. A session that is already open
keeps working until its short-lived access token expires.
