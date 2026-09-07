# UIbench desktop matrix

This suite adapts the public desktop workload matrix from Boris Kaul's
[UIbench](https://github.com/localvoid/uibench) for Octane's unified benchmark
runner. It measures one synchronous state-to-state commit for each of the 96
published desktop cases against production React Compiler, native Preact, Solid 2,
Vue Vapor, Ripple, and Inferno controls:

- four table shapes (`[100,4]`, `[50,4]`, `[100,2]`, `[50,2]`) across render,
  remove-all, two sorts, four sparse filters, and four sparse class updates;
- four sparse updates of 100 animated boxes;
- five flat/deep tree shapes for render and remove-all;
- reverse, insertion, removal, and end-to-end/start-to-end moves across four tree
  shapes;
- the four historical library worst-case reorder patterns; and
- the `[10,10,10,10]` and ten-level binary no-change trees.

The operation names and dimensions remain unchanged so results are recognizable to
anyone familiar with UIbench. The data is deterministic and keys are stable across
every state transition.

## Provenance and licensing

The workload was specified from these immutable upstream revisions:

- `localvoid/uibench` at
  [`3acab5c1900c642b1411faf5f690be43ec2cc578`](https://github.com/localvoid/uibench/tree/3acab5c1900c642b1411faf5f690be43ec2cc578)
- `localvoid/uibench-base` at
  [`efacae672bbf4133360a928305876ee1de643e64`](https://github.com/localvoid/uibench-base/tree/efacae672bbf4133360a928305876ee1de643e64)

Neither repository contains a license text. `uibench-base/package.json` declares
only the ambiguous value `BSD`; the aggregator has no license field. For that
reason this directory does **not** vendor upstream source, bundles, or assets. The
public operation matrix and workload sizes are used as the behavioral
specification, while the model, renderers, harness, data, and styles are fresh
Octane repository code under this repository's license.

## Correctness boundary

Timing starts only after every case passes three gates across two complete matrix
passes, revisiting every `before`/`after` transition after all other cases have
run:

1. The live DOM is serialized at both endpoints into a semantic
   table/animation/tree signature and compared with the deterministic model.
2. Every keyed row, box, and tree node that survives a transition must retain its
   DOM identity.
3. Every target must report the same signatures and element counts for all 96
   endpoints. Framework marker comments are reported nowhere in the oracle and
   cannot make a target pass with missing visible output.

`cases`, `elements_largest`, and `identity_shared` are emitted as deterministic
operations for exact same-run ratio guards. A gate failure or browser error raised
during setup, warmup, or timing writes a failed JSON payload and exits non-zero.

## Measurement

Each sample first commits the case's `before` snapshot, yields so rendering and
layout from setup settle, requests exposed browser GC, and times only synchronous
commits of the `after` snapshot. The sub-0.1 ms cases repeat that forward
transition inside each sample, with every reset commit outside its inner timer;
the harness reports the mean milliseconds per forward commit. The case-sized
repetition count overcomes Chromium's timer granularity without mixing the inverse
transition into the result. This matches UIbench's default JavaScript-time mode;
it does not request style/layout/paint timing. React uses React 19, `flushSync`,
and the repository's production React Compiler integration. Preact uses native
hooks and keyed JSX; its queued microtask commit is awaited inside the timing
window. Solid uses the pinned Solid 2 beta production renderer, keyed
`createStore`/`reconcile`, and `flush()`; private copies of both Solid endpoints
are prepared outside the timer so reconciliation cannot mutate shared workload
snapshots. Vue uses the production Vue Vapor 3.6 renderer, a keyed `v-for`, and an
awaited `nextTick()` inside the timing window. Ripple uses the production `.tsrx`
compiler, a tracked snapshot, keyed `@for` blocks, and `flushSync`. Inferno uses
its native class state and public `rerender()` flush. Octane uses the production
`.tsrx` compiler and `flushSync`. All seven previews send COOP/COEP headers, and
the harness rejects a page that is not cross-origin isolated, so sub-millisecond
cases retain the browser's high-resolution timer rather than collapsing to 0.1 ms
buckets.

The suite keeps React Compiler and Preact as distinct VDOM controls and Solid as a
fine-grained reactive control. Its purpose is a faithful, compact extraction of
the workload matrix and a guard on Octane's keyed reconciler and prev-guarded
update paths, not another broad framework leaderboard; those already exist in
`js-framework`, `effectful-list`, and `recursive-context`.

## Running

```bash
node benchmarks/bench.mjs --quick uibench
node benchmarks/bench.mjs uibench
```

Standalone, after starting the production previews:

```bash
pnpm --filter octane-tsrx-uibench-bench build
pnpm --filter react-uibench-bench build
pnpm --filter solid-uibench-bench build
pnpm --filter preact-uibench-bench build
pnpm --filter vue-vapor-uibench-bench build
pnpm --filter ripple-uibench-bench build
pnpm --filter inferno-uibench-bench build
pnpm --filter octane-tsrx-uibench-bench preview # :5315
pnpm --filter react-uibench-bench preview       # :5316
pnpm --filter solid-uibench-bench preview       # :5317
pnpm --filter preact-uibench-bench preview      # :5318
pnpm --filter vue-vapor-uibench-bench preview   # :5319
pnpm --filter ripple-uibench-bench preview      # :5322
pnpm --filter inferno-uibench-bench preview     # :5325
node benchmarks/uibench/run.mjs 10
```
