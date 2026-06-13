# js-framework-benchmark — ripple-new

DOM-based benchmark that mirrors the canonical
[js-framework-benchmark](https://github.com/krausest/js-framework-benchmark)
suite. Drives the same six-button + table fixture against `ripple-new` and times
each operation via Playwright.

This complements the Node-only [`tracked-values`](../tracked-values.js)
micro-suite by measuring end-to-end render performance — which is where the
auto-callback transform and stable event-bundle optimization pay off.

## Layout

```
benchmarks/js-framework/
├── ripple-new/         # Vite app, dev server on :5176
├── run.mjs             # Playwright harness — drives each target N iterations
├── package.json        # umbrella; depends on playwright
├── results/            # output / scratch
└── README.md           # this file
```

## Quick start

```bash
# 1. From the repo root, install + sync workspaces:
pnpm install

# 2. Start the ripple-new bench dev server (terminal A):
pnpm --filter ripple-new-jsbench dev

# 3. Run the harness (terminal B):
pnpm --filter ripple-js-framework-benchmarks bench
# or for a longer sample (16 iterations × all 8 ops):
pnpm --filter ripple-js-framework-benchmarks bench:long
```

Output is a table of median + min millis per operation: `run`, `replace`,
`update`, `select`, `swap`, `remove`, `clear`. The harness uses
`page.evaluate(el.click)` to fire clicks synchronously inside the page — avoids
per-click CDP IPC overhead (~10ms each on Chromium) so the numbers reflect the
renderer's wall time, not Playwright transport.

## Comparing against an external baseline

To compare ripple-new against another live target (e.g. the inferno-next bench at
`inferno/benchmarks/inferno-next/` on its dev port 5175), pass a `TARGETS` env:

```bash
TARGETS='[
  {"name":"ripple-new",  "url":"http://localhost:5176/", "ready":"#run"},
  {"name":"inferno-next","url":"http://localhost:5175/", "ready":"#run"}
]' node run.mjs
```

The harness prints a side-by-side table, then a pairwise ratio block treating the
FIRST target as the baseline:

```
inferno-next / ripple-new ratio (median; <1 means inferno-next faster):
  run      1.07x  -- slower
  update   0.92x  ++ faster
  …
```

## What this fixture exercises

The `Main.tsrx` source is intentionally tuned to the surface that ripple-new's
compiler optimizes:

- **Auto-callback transform**: top-level handlers (`run`, `runLots`, `add`,
  `clear`, `update`, `swap`) only close over `setItems` / `setSelected` (stable
  `useState` setters) → compiler wraps them in `useCallback([setter])`. Button
  `$$click` slots never reassign after first mount.
- **Stable event-bundle**: per-row `onClick={() => select(row.id)}` and
  `onClick={() => remove(row)}` arrows compile to `{ fn: select, args: [row.id] }`
  bundles. Re-renders with the same row identity skip the property write entirely
  — load-bearing for the `swap` row.
- **Keyed `@for` reconciliation**: `@for (const row of items; key row.id)` drives
  LIS-based reorder; `swap` only mutates the two affected rows.
- **V8 hidden-class shape**: the `Block` class shape is preserved (see
  [`feedback_inferno_next_perf`](../../packages/ripple-new/audit/) memory).

## Methodology caveats

- Numbers depend on your CPU, browser version, and dev-vs-build mode. The harness
  loads the Vite dev server by default (not the production-built bundle), so JS
  code size and `optimize` flags are NOT what you'd ship — useful for iteration,
  not for absolute scoring.
- For "publishable" numbers, build first
  (`pnpm --filter ripple-new-jsbench build`), then
  `pnpm --filter ripple-new-jsbench preview` to serve the production output, then
  run the harness against that.
- Chromium is the default browser; results on Firefox / WebKit differ.
