# Alexandryn documentation

The documentation site for [Alexandryn](https://github.com/Alexandryn/alexandryn), a
self-hosted digital library. It is built with [Astro Starlight](https://starlight.astro.build)
and published at https://alexandryn.github.io/docs/.

The pages are Markdown in `src/content/docs/`. The API reference is generated from
`openapi/openapi.yaml`.

## Commands

| Command                                                | What it does                                              |
| ------------------------------------------------------ | --------------------------------------------------------- |
| `npm ci`                                               | Install dependencies                                      |
| `npm run dev`                                          | Start the development server                              |
| `npm run build`                                        | Type-check and build the site, including the search index |
| `npm run preview`                                      | Serve the built site                                      |
| `npm run lint` / `npm run format:check`                | ESLint and Prettier                                       |
| `npm test`                                             | Unit tests for the scripts and the content rules          |
| `npm run check:openapi`                                | Fail if `openapi/openapi.yaml` was edited by hand         |
| `npm run sync:openapi -- --from <path> --tag <vX.Y.Z>` | Copy the API contract from an alexandryn release          |

## The API contract

`openapi/openapi.yaml` is a copy. The source of truth is `api/openapi.yaml` in the
`alexandryn` repository, and it must be changed there. To update the copy after a
release, run the sync command against a checkout of that release's tag, and commit the
result together with `openapi/SOURCE.json`, which records the tag and a checksum.
Do not edit `openapi/openapi.yaml` by hand; `npm run check:openapi` fails if you do.
