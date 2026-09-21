---
title: Install the desktop app
description: Download Alexandryn for macOS, Windows, or Linux and open it for the first time.
---

The desktop app is the simplest way to use Alexandryn on one computer. It runs the
server for you and opens the library in its own window. It listens on that computer only.

1. Open the [Alexandryn releases page](https://github.com/Alexandryn/alexandryn/releases/latest).
2. Download the installer for your system: macOS, Windows, or Linux.
3. Open the installer and follow your system's prompts.
4. Open Alexandryn. On the first run it asks you to [create an administrator account](/docs/getting-started/first-run-setup/).

## Your system will warn you

The installers are not yet code-signed, so macOS and Windows warn you the first
time you open Alexandryn. The warning is about the missing signature.

## Check your download

Each release lists a `SHA256SUMS.txt` file beside the installers. To check a download,
compute the file's SHA-256 checksum and compare it with the line for that file:

- Linux: `sha256sum <file>`
- macOS: `shasum -a 256 <file>`
- Windows (PowerShell): `Get-FileHash <file>`

If the two do not match, download the file again. The checksums sit on the same release
page as the installers, so this catches a damaged or mismatched download. It does not
show that the release itself is genuine: a match does not rule out tampering at the
source. Download only from the official releases page linked above.

## Reading on other devices

To read from a phone or tablet, see [Read on another device](/docs/using/read-on-another-device/).
