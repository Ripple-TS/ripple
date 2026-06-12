# recursive-context bench — ripple-new vs ripple

A second benchmark adjacent to [`js-framework`](../js-framework/). Where js-framework-benchmark measures wide flat-list rendering (1000 rows in a table), this one measures **deep recursive component trees** with Context reads at every leaf — the workload that stresses createBlock/renderBlock overhead per node, hook-slot allocation per scope, and Context lookup through the active-component parent chain.

## Layout

```
benchmarks/recursive-context/
├── ripple-new/        # Vite app, dev :5185
├── ripple/            # Vite app, dev :5184
├── run.mjs            # Playwright harness — drives both adapters
├── package.json       # umbrella: `pnpm bench`
└── README.md
```

## Shape

Balanced binary tree, depth `D=10` → **1024 leaves**, **2047 total components**. Each leaf reads two Context values (root + local) and renders one `<span>` with the leaf's path + both values.

- Deep nesting (1000 levels) is degenerate (a single linear chain).
- Pure wide fanout (1000 siblings) is what `@for` already exercises in js-framework.
- A balanced tree exercises both axes: component-call overhead AND DOM reconciliation.

## Four measurements

The bench distinguishes a global fan-out update from a scoped subtree update — that ratio reveals how well the framework localizes work.

- **MOUNT** — empty DOM → fully painted tree. Exercises createBlock × N, renderBlock × N, hook-slot allocation × N, Context subscription × N.
- **UPDATE_ROOT** — mutates the root context value; **every leaf re-reads** (1024 leaves). Exercises renderBlock × N, hook-slot lookup × N, Context lookup × N.
- **UPDATE_PARTIAL** — mutates state on a single mid-node at depth `M=5`; only its **2^(D−M) = 32 leaves** re-read. If the framework scopes descendant updates correctly, this should be ≈32× faster than UPDATE_ROOT. A ratio closer to 1× means the framework is wastefully re-running unaffected branches.
- **UNMOUNT** — full teardown via the framework's unmount API.

## Quick start

```bash
# 1. From the repo root, install:
pnpm install

# 2. Start both adapter dev servers (separate terminals):
pnpm --filter ripple-new-recursive-bench dev    # :5185
pnpm --filter ripple-recursive-bench dev        # :5184

# 3. Run the harness:
pnpm --filter @benchmarks/recursive-context bench
# or for a longer sample:
pnpm --filter @benchmarks/recursive-context bench:long
```

Output is a side-by-side table of median / min / p95 millis per op, followed by a pairwise ratio block, e.g.:

```
ripple-new / ripple ratio (median; <1 means ripple-new faster):
  mount           0.80x  ++ faster
  update_root     0.66x  ++ faster
  update_partial  0.55x  ++ faster
  unmount         0.66x  ++ faster
```

## Measurement contract

Each adapter installs these globals on `window`:

| global | what it does |
|---|---|
| `__mount()` | calls the framework's mount API (deferred — index.html does NOT auto-mount, so MOUNT timing is meaningful) |
| `__updateRoot()` | mutates the root context value; all leaves re-render |
| `__updatePartial()` | mutates state on the mid-node at depth `M=5`; only its 32-leaf subtree re-renders |
| `__unmount()` | tears down via the framework's unmount API; does NOT pre-clear `target.children` |
| `__reset()` | `__unmount()` + clear `target.children` — for between-iteration cleanup |
| `__ready = true` | last line of `main.js`; the harness gates on `page.waitForFunction("__ready")` |

The harness:

- **MOUNT**: fresh `page.goto` per sample so module-eval cost is amortized across iterations rather than across samples.
- **UPDATE_ROOT / UPDATE_PARTIAL**: one page, `__mount()` once, then loop `__updateRoot()` / `__updatePartial()` × (warmup + iter). The two are sampled in alternating rounds so any GC/JIT noise hits them symmetrically.
- **UNMOUNT**: one page; per iteration `__mount()` (untimed), time `__unmount()`, then `__reset()` + small sleep before the next iteration.

Default: 5 warmups + 20 iters. Pass an integer to `bench` to override iters (`bench:long` runs 40).
