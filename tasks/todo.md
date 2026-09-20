# Tasks

- [x] **T1: Scaffold the Starlight site** (M)
  - Acceptance: `npm ci && npm run build` produces `dist/`; site title, base
    `/docs`, sidebar skeleton, accent colour from the website; ESLint, Prettier,
    `astro check` pass; `.gitignore` covers `dist`, `node_modules`, `.astro`.
  - Verify: `npm run build && npm run lint && npm run format:check`
  - Files: `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/content.config.ts`,
    `src/content/docs/index.mdx`, `src/styles/custom.css`, lint config

- [x] **T2: OpenAPI sync, check, and API reference** (M)
  - Acceptance: `sync:openapi` copies the file, writes `SOURCE.json`;
    `check:openapi` fails on a changed byte or wrong checksum; the built site has
    a page per tag or path group and every path in the spec appears; unit tests
    have failing fixtures.
  - Verify: `npm test && npm run build`, then count paths in `dist/`
  - Result: all 56 paths appear in the built site (72 API pages). `SOURCE.json`
    says `v1.0.0`, but that tag does not exist in `alexandryn` yet: the copy was
    taken from the phase 99 branch. After the tag exists, run `sync:openapi`
    again and confirm the checksum is unchanged; if it changed, the tag and the
    copy differ and the copy must follow the tag.
  - Depends on: T1
  - Files: `scripts/sync-openapi.ts`, `scripts/check-openapi.ts`, tests,
    `openapi/*`, `astro.config.mjs`

### Checkpoint A: the API reference builds from the real spec

- [x] **T3a: Getting started pages** (M): what it is, desktop install, Docker, first run
- [x] **T3b: Using Alexandryn pages** (M): sources, import, read on another device
- [x] **T3c: Administration, security, updating pages** (M)
  - Acceptance for T3: pages carry title and description; steps in order; each
    claim carried over from the old guides or verified against `../Alexandryn`
    (listed in the commit body); old guide files removed; sidebar complete.

### Checkpoint B: maintainer reads the content

- [x] **T4: Checks** (M): `check-links`, Playwright axe at 320/768/1280, keyboard,
      search, no third-party origin, content test
- [x] **T5: Pages workflow and README** (S)

### Checkpoint C: reviewers and sign-off

- [ ] **T6: Website points at the docs site** (S, website repo)
