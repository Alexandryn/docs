# Plan: documentation site

Spec: `../SPEC.md`. Vertical slices, tests first, one commit per task.

## Order

1. **Scaffold** a Starlight site that builds, with lint, format, and CI-equivalent commands.
2. **OpenAPI sync and check**, then render it as the API reference.
3. **Content**, one section at a time, each claim carried over or checked.
4. **Checks**: internal links, axe, keyboard, search, no third-party origin.
5. **Pages workflow** and README.
6. **Website change** (other repo).

## Risks

| Risk | Mitigation |
| --- | --- |
| `starlight-openapi` does not render OpenAPI 3.1 features the contract uses (e.g. `type: [string, 'null']`, `$ref` siblings) | T2 builds against the real file first; if it fails, fall back to a generated Markdown page or a link to the YAML and record it |
| Rewriting guides introduces claims that are not true | Carry over from the checked guides; verify each new statement against `../Alexandryn` and list what was checked in the commit |
| Pagefind index needs a built site, so search cannot be tested in dev | E2E runs against `astro preview` after a full build |
| Actions blocked | Run every check locally; the workflow is unverified until Actions returns |
| Starlight/Astro pre-1.0 churn (0.42) | Pin exact versions in the lockfile; upgrade deliberately |

## Checkpoints

- **A** after T2: the API reference builds from the real spec.
- **B** after T3: all pages written and read through once by the maintainer.
- **C** after T5: two fresh reviewers (code + security), then maintainer sign-off.
