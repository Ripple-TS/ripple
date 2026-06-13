# signal-favoring bench

A second adjacent benchmark to [`recursive-context`](../recursive-context/). The
recursive-context bench measures wide fan-out across a balanced binary tree. This
one measures the **signal vs hook update cascade** along a deep linear chain.

The bench is named honestly: it has a structural bias toward signal-based
reactivity (Solid, ripple) over hook-based reactivity (React, ripple-new). When
state changes at a mid-chain node, signal frameworks re-evaluate **only the text
expression that read the signal** — they don't re-render any component bodies.
Hook frameworks re-render the owning component, which cascades through every
descendant unless wrapped in `memo`.

The point of the bench is not to declare a winner — it's to **quantify how much
the cascade actually costs** in absolute terms. Often less than you'd expect.

## Layout

```
benchmarks/signal-favoring/
├── ripple-new/        # Vite app, dev :5190
├── solid/             # Vite app, dev :5191 (Solid 2.0 beta)
├── react/             # Vite app, dev :5192 (React 19)
├── ripple/            # Vite app, dev :5193
├── gen.mjs            # Source generator for all 4 App fixtures
├── run.mjs            # Playwright harness — drives all adapters
├── package.json       # umbrella: `pnpm bench`
└── README.md
```

## Shape

A linear chain of 100 uniquely-named components `C1 → C2 → ... → C100`. Each
component renders a `<div>` with its index and its child component. Stateful
counters live at every tenth position: `C1, C11, C21, ..., C91` (10 stateful in
total).

Each stateful component owns its own counter via the framework's native primitive:

| framework      | primitive                | what a `setN(v+1)` triggers                                            |
| -------------- | ------------------------ | ---------------------------------------------------------------------- |
| **ripple-new** | `useState` (React-shape) | re-render of `CN`, cascade through `CN+1 .. C100`                      |
| **react**      | `useState`               | re-render of `CN`, cascade through `CN+1 .. C100`                      |
| **solid**      | `createSignal`           | re-evaluate the `{v()}` text expression in `CN`; descendants untouched |
| **ripple**     | `track()`                | re-evaluate the `{v}` text expression in `CN`; descendants untouched   |

Generator-driven so the chain length, stateful spacing, and per-component shape
stay consistent across frameworks. Edit `gen.mjs` and re-run `node gen.mjs` to
regenerate all four App fixtures.

## Six measurements

- **MOUNT** — initial render of all 100 components.
- **BUMP_SHALLOW** — `__bumpAt1()`. Hook frameworks cascade through 99 components;
  signal frameworks update one text node. This is the bench's worst case for
  hooks.
- **BUMP_MIDDLE** — `__bumpAt51()`. Hook frameworks cascade through ~50
  components.
- **BUMP_DEEP** — `__bumpAt91()`. Hook frameworks cascade through ~10 components.
  As the depth gets closer to the leaf, the cost converges with signal frameworks.
- **BUMP_SWEEP** — bump every stateful component in lockstep. Single rAF gate at
  the end, so paint cost is amortised across all 10 bumps.
- **UNMOUNT** — full teardown via the framework's unmount API.

The harness also prints a derived **cascade ratio** per target:
`bump_shallow / bump_deep`. Hook frameworks should land around 10× (99 vs 10
cascading renders); signal frameworks should land near 1× (both updates do the
same one-text-node work).

## Quick start

```bash
# 1. From the repo root, install:
pnpm install

# 2. (Optional) regenerate fixtures if you edited gen.mjs:
node benchmarks/signal-favoring/gen.mjs

# 3. Start each adapter's dev server (separate terminals):
pnpm --filter ripple-new-signal-bench dev    # :5190
pnpm --filter solid-signal-bench dev         # :5191
pnpm --filter react-signal-bench dev         # :5192
pnpm --filter ripple-signal-bench dev        # :5193

# 4. Run the harness:
pnpm --filter @benchmarks/signal-favoring bench
# or for a longer sample:
pnpm --filter @benchmarks/signal-favoring bench:long
```

## Measurement contract

Each adapter installs these globals on `window`:

| global           | what it does                                                                     |
| ---------------- | -------------------------------------------------------------------------------- |
| `__mount()`      | calls the framework's mount API (deferred — index.html does NOT auto-mount)      |
| `__bumpAt<N>()`  | for N in 1, 11, 21, ..., 91: bumps the counter inside `CN`                       |
| `__unmount()`    | tears down via the framework's unmount API                                       |
| `__reset()`      | `__unmount()` + clear `target.children` — for between-iteration cleanup          |
| `__ready = true` | last line of `main.{js,jsx}`; harness gates on `page.waitForFunction("__ready")` |

The harness:

- **MOUNT**: fresh `page.goto` per sample.
- **BUMP\_** ops: one page, `__mount()` once, then loop `__bumpAt<N>()` ×
  (warmup + iter).
- **BUMP_SWEEP**: same shape but executes all 10 bumps in a single in-page loop
  before the rAF gate.
- **UNMOUNT**: one page; per iteration `__mount()` (untimed), time `__unmount()`,
  then `__reset()`.

Default: 5 warmups + 20 iters. Pass an integer to `bench` to override iters.
