# for-reconcile bench

Quantifies keyed-`@for` reconcile cost on a **real (Chromium) DOM** against the
**production build**, for four item shapes that hit different anchor-resolution
paths in `packages/ripple/src/runtime/internal/client/for.js` / `switch.js`:

| shape     | item body                    | item block `s.start` | reconcile anchor path         |
| --------- | ---------------------------- | -------------------- | ----------------------------- |
| `direct`  | `<div>{x}</div>`             | set                  | O(1) property read            |
| `wrapped` | `<div><RowIf {item}/></div>` | set                  | O(1) property read            |
| `single`  | `<RowIf {item}/>`            | **null** (#1307)     | descend child blocks          |
| `switch`  | `<RowSwitch {item}/>`        | **null** (#1307)     | descend child blocks (switch) |

`single`/`switch` are the wrapper-elided shapes from the 0.3.85 optimization (PR
#1307). After the wrapper `<!>` was removed, the item block no longer records its
own `s.start`, so reconciliation resolves the real first/last node by descending
child blocks (`get_first_node`/`get_last_node`). This bench measures whether that
descent costs anything versus the O(1) shapes and versus 0.3.84.

## Run

```bash
# current workspace runtime (with the fix):
cd ripple && pnpm build && pnpm preview     # serves prod build on :5190
node ../run.mjs 25                          # in another shell

# vs 0.3.84: build a standalone fixture pinned to ripple@0.3.84 +
# @ripple-ts/vite-plugin@0.3.84, serve on :5191, then:
URL=http://localhost:5191/ node run.mjs 25
```

Each op flushes synchronously (`flushSync`) and is timed with `gc()` before every
sample, isolating framework + DOM cost from paint/GC jitter (median of 25, +8
warmup, N=1000 rows).

## Measured results (N=1000, Chromium headless)

Same source shape, **current+fix vs 0.3.84** (ms, median; lower is better):

| shape.op       | 0.3.84 | current+fix | Δ        |
| -------------- | ------ | ----------- | -------- |
| single.mount   | 17.5   | 13.2        | **−25%** |
| single.reverse | 5.0    | 4.2         | **−16%** |
| single.shuffle | 5.7    | 4.8         | **−16%** |
| switch.mount   | 18.2   | 14.0        | **−23%** |
| switch.reverse | 4.9    | 4.2         | **−14%** |
| switch.shuffle | 5.5    | 4.9         | **−11%** |

Within the current runtime, the descent path (`single`/`switch`) reconcile is
statistically equal to the O(1) `wrapped` path (reverse ≈0.95×, shuffle ≈1.0×),
and `single` mounts faster than `wrapped` (fewer DOM nodes). Building the current
fixture with vs without the fix gives identical `direct`/`wrapped` numbers, so the
`get_first_node`/`block_start` resolution adds no measurable reconcile overhead.

Note: `direct`/`wrapped` absolute numbers differ slightly across versions from
toolchain differences (the workspace fixture builds with a newer Vite than the
pinned-0.3.84 fixture) and other unrelated #1307 runtime changes — not from this
fix.
