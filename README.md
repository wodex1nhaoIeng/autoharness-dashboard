# Autoharness dashboard

Website: https://wodex1nhaoIeng.github.io/autoharness-dashboard/

Standalone static dashboard that tracks how many of Kani's automatically generated harnesses
for the Rust standard library verify, fail or time out, run after run.

## Local use

Requires Node.js 22 and npm. Run `npm ci`, then `npm run dev`.
Run `npm run generate` to create the static site in `.output/public`.

## Data

Each run is imported from the `results.json` that verify-rust-std's
`scripts/kani-std-analysis/log_parser.py` writes (one record per harness):

```sh
node scripts/import-results.mjs /path/to/results.json 2026-10-27 --note "optional remark"
```

This writes, under `public/data/`:

- `latest.json`: totals, and the same totals split by crate and by function safety
- `harnesses.json`: one row per generated harness with its result, failed properties and time
- `history/<date>.json`: that run's totals, kept for good
- `history/index.json`: every saved run, rebuilt on each import, read by the chart

Only automatically generated harnesses are counted. A harness is *verified* when the result
starts with `SUCCESSFUL`, *timed out* when log_parser recorded time `TO`, *failed* when at least
one property failed, and *error* otherwise (Kani or CBMC stopped before a verdict).
Commit the changed files under `public/data/` to publish a run.

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
