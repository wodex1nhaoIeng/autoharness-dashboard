# Autoharness dashboard

Website: https://wodex1nhaoIeng.github.io/autoharness-dashboard/

Standalone static dashboard for Rust standard-library autoharness generation.
Includes the team's overview, searchable per-function inventory, baseline comparison,
and harness contributions per PR as of Srivatsan Samraj's source commit `976c355`.
Generated harnesses do not imply successful verification.

## Local use

Requires Node.js 22 and npm. Run `npm ci`, then `npm run dev`.
Run `npm run generate` to create the static site in `.output/public`.
No Rust checkout, submodules, Kani installation or backend is needed to view the site.

## Data

The browser reads `public/data/autoharness-dashboard.json` and
`public/data/autoharness-functions.json`. They are copied unchanged from the latest
team snapshot. The function inventory describes the captured baseline; the contribution
panel describes a separate measured comparison. Source caveats remain in the data and UI.

To import another run from the repository root:

```sh
node scripts/build-autoharness-dashboard.mjs /path/to/run public/data/autoharness-dashboard.json
```

The input folder must contain `snapshot.json`, the autoharness text listing named by
`listFile`, and the Kani JSON named by `kaniListFile`. Snapshot metadata includes
`generatedAt`, `expected.selected`, `expected.skipped`, `meta` (Kani commit,
verify-rust-std branch, target), `legacyPrevious`, `improvement.baseline`,
`improvement.afterChanges`, optional `contributions`, and `notes`.
The importer validates listing totals and writes both public JSON files.
Raw run files are not included in this repository.

## History and provenance

The team first implemented this dashboard inside a copy of
https://github.com/os-checker/distributed-verification, published separately at
https://github.com/wodex1nhaoIeng/practicum. That original website remains available.

This repository extracts only the two new team-authored pages, importer and data.
It does not contain the earlier project's Rust code, submodules, old chart, components,
layout, theme store, styles, build configuration or workflows. The application shell,
configuration and Pages workflow were written afresh here. Nuxt, Vue and PrimeVue remain
ordinary third-party dependencies.

The seven team commits from `bb9236d` through `976c355` are represented in order,
preserving original authors and author dates, with source commit references in each
message. The navigation-only `65784c6` is retained as an empty provenance commit because
the old layout is intentionally excluded. These are extracted commits with new hashes,
not the original commits; no pre-team commits are ancestors in this repository.

Push `main` to rebuild and deploy automatically using GitHub Pages (Actions source).
