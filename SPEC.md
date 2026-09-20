# Spec: Alexandryn documentation site

| | |
|---|---|
| **Status** | `APPROVED`: scope and three decisions approved by the maintainer 2026-09-20 (tool, OpenAPI handling, hosting) |
| **Repo** | `docs` (public, separate from `alexandryn`, per ADR 0006) |
| **Design source** | None. No design canvas covers a documentation site, so it is *unclassified* under ADR 0003's addendum. The maintainer chose scope and tooling without asking for a design; the site uses Starlight's defaults with the website's accent colour, and no screen is invented. Consulted 2026-09-20: `ANALYSIS.md` lists only the Electron, Electron/Admin, Web, and Mobile canvases and the missing Design system screen. |

## Objective

Give people who run Alexandryn a real documentation site: searchable, with
navigation, readable by a person who has not read the code. Today the guides
are four Markdown files on GitHub, written more as reference notes than as
help. The site also shows the API contract, so developers can read the OpenAPI
specification as pages instead of a 3,900-line YAML file.

Users: someone installing Alexandryn on a laptop or a home server, an
administrator setting up accounts and sources, and a developer writing a client.

Success is a static site that a visitor can search, that tells them what to do
in order, and whose API reference matches the released contract.

## Decisions (approved 2026-09-20)

- **Tool:** Astro Starlight. Static output, built-in client-side search
  (Pagefind), accessible defaults, content stays Markdown.
- **OpenAPI:** a *synced copy per release*. `alexandryn/api/openapi.yaml` stays
  the source of truth, guarded by its contract tests. This repo holds a copy
  and records which release and checksum it came from; a check fails if the
  copy has drifted.
- **Hosting:** GitHub Pages from this repo, at `https://alexandryn.github.io/docs/`.

## Tech stack

- Astro 7 and `@astrojs/starlight` 0.42, Node >= 24 (Astro needs >= 22.12).
- `starlight-openapi` 0.26 renders the specification as pages at build time.
- Dev: Playwright and `@axe-core/playwright` (same as the website), Vitest for
  the sync and link scripts, ESLint, Prettier.

Dependency reasons (constitution section 9), recorded before adding:

| Package | What it does | Why not stdlib | What breaks if abandoned |
| --- | --- | --- | --- |
| `astro`, `@astrojs/starlight` | Builds the site, navigation, and search from Markdown | A docs site with search and accessible navigation is a large amount of code to write and keep accessible | The site stops building; the Markdown content moves to another generator |
| `starlight-openapi` | Turns `openapi.yaml` into reference pages | Rendering 56 paths with schemas by hand goes stale immediately | The API reference; the guides are unaffected. Fallback: link to the raw YAML |
| `@playwright/test`, `@axe-core/playwright` | Real-browser accessibility and search checks | jsdom has no layout or Pagefind | The e2e suite only |

## Commands

```
Install:      npm ci
Dev:          npm run dev
Build:        npm run build              # astro check && astro build && pagefind
Preview:      npm run preview
Lint:         npm run lint
Format:       npm run format:check
Unit tests:   npm test
E2E + axe:    npx playwright test
Sync spec:    npm run sync:openapi -- --from ../Alexandryn/api/openapi.yaml --tag v1.0.0
Check spec:   npm run check:openapi     # copy matches its recorded checksum
Check links:  npm run check:links       # internal links and anchors in dist/
```

## Project structure

```
src/content/docs/        pages (Markdown): getting-started/, using/, admin/, security/, updating/
src/content/docs/api/    landing page for the API reference
openapi/openapi.yaml     synced copy of the contract
openapi/SOURCE.json      { "tag", "sha256", "syncedAt" }
scripts/                 sync-openapi.ts, check-openapi.ts, check-links.ts (+ tests)
e2e/                     Playwright specs
astro.config.mjs         site, base, sidebar, starlight-openapi
.github/workflows/       pages.yml
```

## Content

Pages are written for the person doing the task: what you will do, the steps in
order, how to tell it worked, what to do if it did not. No page describes the
code.

Rules for every page:

- No new claim about the software. Each statement is either carried over from
  the existing guides (already checked against the code) or checked against the
  `alexandryn` source before it is written. Anything unverified is left out or
  marked as unverified (constitution section 12).
- Interface and product wording follows constitution section 11: plain,
  specific, calm; no marketing voice, no exclamation marks.
- Commands are copy-pasteable and were run, or the page says they were not.

Planned pages (from the four existing guides, split by task):

- **Getting started:** what Alexandryn is; install the desktop app (including the
  unsigned-installer warning); run with Docker (from the self-hosting guide);
  first run.
- **Using Alexandryn:** add a source; import books; read on another device
  (turning on network access).
- **Administration:** accounts and libraries; sources; backups and export.
- **Security:** how network access works and what Alexandryn does not do.
- **Updating:** pull a new version and check that it started.
- **API reference:** generated from `openapi.yaml`, with a short introduction.

## Testing strategy

- **Unit (Vitest):** `sync-openapi` (copies, records tag and checksum, refuses a
  missing or non-3.1 file), `check-openapi` (fails on a changed byte, a missing
  record, a wrong checksum), `check-links` (internal links and anchors resolve
  in `dist/`; fails on a broken one). Each has a fixture that proves it fails.
- **E2E (Playwright):** zero axe violations on the home page, one guide page,
  and one API page at 320, 768, and 1280 px; keyboard reaches the search box and
  the sidebar; search returns a known page; the API reference lists every path
  in the spec (count read from the file); no request to another origin.
- **Content:** a test that every page has a title and a description, and that
  none contains an exclamation mark or the placeholder `example.com`.

## Boundaries

- **Always:** run the checks before each commit; keep `openapi/openapi.yaml`
  byte-identical to the recorded source; verify a claim against the code before
  writing it; record a reason for each dependency.
- **Ask first:** adding a dependency beyond the table above; changing the
  hosting or the base URL; moving the OpenAPI source of truth.
- **Never:** hand-edit `openapi/openapi.yaml` (change it in `alexandryn`, then
  sync); load a font, script, or stylesheet from a third-party origin; commit
  to `main` (work on a branch); describe behaviour the software does not have.

## Success criteria

1. `npm run build` produces a static site; every guide page is reachable from
   the sidebar and from search.
2. The API reference lists every path in `openapi/openapi.yaml`.
3. `check:openapi` passes; it fails if the spec is edited by hand.
4. Zero axe violations at 320, 768, and 1280 px on the sampled pages.
5. No request to a third-party origin at runtime.
6. Every internal link and anchor resolves.
7. Search finds a page by a word in its body, not only its title.
8. No claim in the pages that was not carried over or checked.

## Website change

In the website repo: the Documentation section's four guide cards and the
Docker link point at the matching docs-site pages, and the "API contract" card
points at the API reference. That is a separate, small change in that repo,
with its own tests.

## Open questions

- The docs repo has no LICENSE yet; the maintainer has not chosen one.
- Versioned docs (one site per release) are out of scope for 1.0.0.
- Whether the Pages workflow can run while Actions billing is blocked is not
  known; the site is verified locally either way.
