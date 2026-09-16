# Executable production bundle size

Run `pnpm bench bundle-size` from the repository root. Use
`--targets=ripple,react` to limit frameworks or `--results-dir=path` to retain a
separate run.

The comparative build and measurement contract matches Octane `origin/main` at
`68515636eebde7d6f5db7180131908bfb0656c7a` (2026-09-16):

- Build rows, TodoMVC, chat-stream, and weather with each fixture's Vite plugin,
  production mode, `minify: 'esbuild'`, and `target: 'esnext'`.
- Split authored application modules from framework dependencies, workspace
  runtime modules, and bundler helpers.
- Sum emitted `.js` and `.mjs` files. Compress each file independently with the
  highest gzip and Brotli levels; total bytes are the sum of the two buckets.
  HTML, styles, and other public assets are excluded.
- Report raw, gzip, and Brotli bytes for the total, app, and framework buckets.
  TodoMVC, chat, and weather operations use `todo_`, `chat_`, and `weather_`
  prefixes; rows are unprefixed.

Ripple-specific integration remains deliberate: workspace runtime attribution uses
`packages/ripple`, Octane uses the pinned published package, target filtering is
supported, and every measured build must pass browser interaction checks. The
matrix also includes Ripple weather and Vue Vapor rows, beyond upstream's matrix.
Versions remain pinned by this repository's benchmark catalog and lockfile;
matching methodology does not imply matching bytes across different dependencies.

Octane's `octane-tsrx-budget` and `octane-jsx-budget` rows are committed limits,
not measured framework builds. They are not imported as competitors or Ripple
baselines. Upstream's separate `bundle-reachability` suite depends on Octane's
private feature fixtures and bindings and is outside this comparative suite.

Use `pnpm bench --list` to inspect the supported matrix. To record and compare
local references:

```sh
pnpm bench --record bundle-size
pnpm bench --compare bundle-size
```

See the [runner documentation](../README.md) for setup, saved-run comparison, and
result paths, and [provenance](../UPSTREAM.md) for source revisions and
adaptations. Historical upstream scores are not baselines for this checkout.
