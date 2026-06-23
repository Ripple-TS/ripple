# recursive-context bench — ripple vs react vs solid

This benchmark measures **deep recursive component trees** with Context reads at
every leaf — the workload that stresses createBlock/renderBlock overhead per node,
hook-slot allocation per scope, and Context lookup through the active-component
parent chain.

## Layout

```
benchmarks/recursive-context/
├── solid/             # Vite app, dev :5187 (Solid 2.0 beta)
├── react/             # Vite app, dev :5186 (React 19)
├── ripple/            # Vite app, dev :5184
├── run.mjs            # Playwright harness — drives all adapters
├── package.json       # umbrella: `pnpm bench`
└── README.md
```

## Shape

Balanced binary tree, depth `D=10` → **1024 leaves**, **2047 total components**.
Each leaf reads two Context values (root + local) and renders one `<span>` with
the leaf's path + both values.

- Deep nesting (1000 levels) is degenerate (a single linear chain).
- Pure wide fanout (1000 siblings) is a separate axis (flat-list rendering).
- A balanced tree exercises both axes: component-call overhead AND DOM
  reconciliation.

## Six measurements

The bench separates three orthogonal axes: **fan-out scope** (global vs subtree
updates), **structural change** (toggle a subtree on/off vs mutate a value), and
**teardown scale** (full container vs partial branch).

- **MOUNT** — empty DOM → fully painted tree. Exercises createBlock × N,
  renderBlock × N, hook-slot allocation × N, Context subscription × N.
- **UPDATE_ROOT** — mutates the root context value; **every leaf re-reads** (1024
  leaves). Exercises renderBlock × N, hook-slot lookup × N, Context lookup × N.
- **UPDATE_PARTIAL** — mutates state on a single mid-node at depth `M=5`; only its
  **2^(D−M) = 32 leaves** re-read. If the framework scopes descendant updates
  correctly, this should be ≈32× faster than UPDATE_ROOT. A ratio closer to 1×
  means the framework is wastefully re-running unaffected branches.
- **PARTIAL_UNMOUNT** — toggles a `visible` flag on the Mid component so the
  conditional render drops its subtree; **32 leaves** unmount, the rest of the
  tree stays put. Mid itself remains mounted so its state handle stays valid for
  re-show. Exercises per-block teardown without the full-container shortcut that
  UNMOUNT can take.
- **PARTIAL_REMOUNT** — flips the same flag back on; the **32-leaf subtree is
  constructed fresh** and re-subscribes to both contexts. Exercises a scoped mount
  path that exercises the same code as MOUNT but at 1/32 the work — useful for
  separating per-component overhead from total tree cost.
- **UNMOUNT** — full teardown via the framework's unmount API. Some frameworks
  (Solid with owner-tree dispose) can short-circuit this; the contrast against
  PARTIAL_UNMOUNT shows whether the win is structural or only applies to the
  whole-container case.

## Quick start

```bash
# 1. From the repo root, install:
pnpm install

# 2. Start each adapter's dev server (separate terminals):
pnpm --filter solid-recursive-bench dev         # :5187
pnpm --filter react-recursive-bench dev         # :5186
pnpm --filter ripple-recursive-bench dev        # :5184

# 3. Run the harness:
pnpm --filter @benchmarks/recursive-context bench
# or for a longer sample:
pnpm --filter @benchmarks/recursive-context bench:long
```

Output is a side-by-side table of median / min / p95 millis per op, followed by a
pairwise ratio block, e.g.:

```
solid / ripple ratio (median; <1 means solid faster):
  mount             0.71x  ++ faster
  update_root       0.59x  ++ faster
  update_partial    0.84x  ++ faster
  partial_unmount   0.74x  ++ faster
  partial_remount   0.48x  ++ faster
  unmount           0.25x  ++ faster
```

## Measurement contract

Each adapter installs these globals on `window`:

| global               | what it does                                                                                               |
| -------------------- | ---------------------------------------------------------------------------------------------------------- |
| `__mount()`          | calls the framework's mount API (deferred — index.html does NOT auto-mount, so MOUNT timing is meaningful) |
| `__updateRoot()`     | mutates the root context value; all leaves re-render                                                       |
| `__updatePartial()`  | mutates state on the mid-node at depth `M=5`; only its 32-leaf subtree re-renders                          |
| `__partialUnmount()` | flips Mid's `visible` flag to false; the 32-leaf subtree unmounts. Mid itself stays mounted                |
| `__partialRemount()` | flips Mid's `visible` flag back to true; the 32-leaf subtree is freshly constructed                        |
| `__unmount()`        | tears down via the framework's unmount API; does NOT pre-clear `target.children`                           |
| `__reset()`          | `__unmount()` + clear `target.children` — for between-iteration cleanup                                    |
| `__ready = true`     | last line of `main.js`; the harness gates on `page.waitForFunction("__ready")`                             |

The harness:

- **MOUNT**: fresh `page.goto` per sample so module-eval cost is amortized across
  iterations rather than across samples.
- **UPDATE_ROOT / UPDATE_PARTIAL**: one page, `__mount()` once, then loop
  `__updateRoot()` / `__updatePartial()` × (warmup + iter). The two are sampled in
  alternating rounds so any GC/JIT noise hits them symmetrically.
- **PARTIAL_UNMOUNT / PARTIAL_REMOUNT**: one page, `__mount()` once, then per
  iteration time `__partialUnmount()` followed by `__partialRemount()` and record
  BOTH halves. Alternating in lockstep means GC/JIT noise hits both ops
  symmetrically — important because they're mirrored work (tear down 32 leaves vs
  build 32 leaves).
- **UNMOUNT**: one page; per iteration `__mount()` (untimed), time `__unmount()`,
  then `__reset()` + small sleep before the next iteration.

Default: 5 warmups + 20 iters. Pass an integer to `bench` to override iters
(`bench:long` runs 40).
