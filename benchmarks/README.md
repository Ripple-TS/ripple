# Ripple benchmarks

Production benchmarks ported from Octane, comparing this checkout's Ripple runtime
and compiler with pinned Octane, Solid, Vue Vapor, React (with React Compiler),
Preact, Svelte, and Inferno implementations. See [UPSTREAM.md](UPSTREAM.md) for
provenance and adaptations. These benchmarks measure individual operations, not a
single overall framework score.

## Run

Benchmarks are run locally, with no benchmark CI job or scheduled runs. Use Node
24; the initial recordings used Node 24.18.0. From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm --filter ripple-benchmarks exec playwright install chromium
pnpm bench --list
pnpm bench:quick
pnpm bench js-framework js-framework-reorder
pnpm bench --quick --targets=ripple,octane-tsrx,solid,vue-vapor js-framework
pnpm bench --record js-framework
pnpm bench --compare js-framework
pnpm --filter ripple-benchmarks test
```

The runner builds production fixtures, starts their preview servers, waits for
readiness, runs workloads sequentially, checks results, and stops only its own
processes. An occupied port is an error. Run one benchmark process at a time on an
otherwise idle machine. Browser binaries are pinned by the Playwright dependency.
Browser measurements use real headless Chromium and its DOM, layout, event, and
JavaScript engines. SSR timings run in Node; bundle-size verification also
executes the built apps in Chromium.

`--quick` reduces repetitions and warmup for correctness smoke checks; it does not
establish performance wins. A normal run preserves the upstream iteration counts.
Avoid comparing quick and normal results or timings from different machines.

| Option                   | Behavior                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| suite names              | Run only those suites; default is the complete suite.                                           |
| `--list`                 | Show suites and supported targets.                                                              |
| `--targets=ripple,solid` | Select named targets; unknown names fail and unavailable capabilities are reported as N/A.      |
| `--quick`                | Reduced iterations or SSR time budget.                                                          |
| `--record`               | Save successful results to local baselines.                                                     |
| `--compare`              | Compare against local baselines; missing baselines and regressions fail.                        |
| `--ratios`               | Enforce reviewed same-run guards in `baselines/ratios.json`; missing required comparisons fail. |
| `--results-dir=path`     | Override `benchmarks/results/`. Relative paths use the repository root.                         |
| `--baseline-dir=path`    | Override `benchmarks/baselines/local/`.                                                         |
| `--timeout=milliseconds` | Per-build/harness timeout; default 30 minutes.                                                  |

Each suite can also be run directly with its `run.mjs`. Browser harnesses then
require production preview servers; prefer the unified runner for dependency and
process management. `suites.json` declares the supported matrix, ports, and
iterations. Server and byte suites build their own fixtures.

## Workloads

| Suite                  | Measures                                                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `js-framework`         | Keyed row creation, update, selection, swapping, removal, and clear.                                                         |
| `js-framework-reorder` | Reverse, shuffle, rotation, and displacement with retained-node identity checks.                                             |
| `recursive-context`    | Tree creation, global/subtree context updates, and disposal.                                                                 |
| `signal-favoring`      | Local updates through deep component chains.                                                                                 |
| `news`                 | Buffered server rendering and interactive DOM hydration.                                                                     |
| `todomvc`              | Editing, filtering, toggling, and deleting todos.                                                                            |
| `chat-stream`          | Deterministic token streaming, conversation switching, and controlled input.                                                 |
| `dbmon`                | Repeated database-monitor snapshots and query updates.                                                                       |
| `uibench`              | List, table, tree, text, and attribute operations.                                                                           |
| `effectful-list`       | Row effects, refs, layout probes, and cleanup.                                                                               |
| `memo-wall`            | Unchanged inputs, one changed item, and context updates.                                                                     |
| `portal-swarm`         | Portal creation, updates, events, and disposal.                                                                              |
| `async-waterfall`      | Independent nested async work and version changes.                                                                           |
| `streaming-ssr`        | Shell delivery and complete asynchronous server streams.                                                                     |
| `ssr-throughput`       | Sustained news-page SSR at 50/500 cards; quick mode uses 50.                                                                 |
| `reconcile-anchors`    | Ripple-only direct, wrapped, conditional-component, and switch-component list anchors; retained from the former local suite. |
| `bundle-size`          | Normalized app/framework/total JS bytes for rows, TodoMVC, and chat.                                                         |

Capability gaps stay explicit. For example, the streaming comparison includes
frameworks with an applicable streaming renderer; it does not turn buffered HTML
into a synthetic stream. Vue's server-side news measurement uses Vue SSR even
though its browser fixture uses Vapor. Memo-wall includes a separately labeled
uncompiled React control. Not every upstream framework has every fixture.

## Relative comparisons

The primary shared signal is Ripple's score divided by a reference framework's
score for the same operation, measured in the same local invocation. For latency,
bytes, and counts, a ratio below 1 favors Ripple. Keep the workload, framework and
compiler versions, browser version, and throttle settings with each result.

```sh
pnpm bench --targets=ripple,octane-tsrx,solid,vue-vapor --results-dir=benchmarks/results/my-run js-framework
pnpm bench --ratios --targets=ripple,octane-tsrx,solid,vue-vapor js-framework
```

`--ratios` applies the reviewed limits in `baselines/ratios.json` locally. Ratios
reduce shared machine effects but do not eliminate differences in CPU
architecture, memory, browser behavior, or noise. Compare compatible workloads and
version sets; a faster competitor can increase Ripple's ratio even if Ripple
itself has not slowed down. Bytes and counts are separate from timing metrics.

The Git-maintained ratio limits are the shared regression reference. Saved run
output and logs under `benchmarks/results/` are also kept in Git. Absolute
`--record`/`--compare` results are optional same-machine diagnostics, not portable
performance requirements. Baseline changes are explicit reviewed changes; running
a benchmark never silently relaxes a limit.

## Results and interpretation

`results/<suite>.json` contains target/operation statistics and correctness
failures. `results/summary.json` records the invocation outcome. Failed or missing
measurements cannot produce a successful baseline. Build and preview logs are
saved beside results. The runner exits nonzero if any selected suite fails.

Timing scores are milliseconds, generally the mean of an upstream-selected stable
sample window, with median/min/p95 and uncertainty diagnostics. Short runs fall
back to the upstream median policy. SSR throughput also exposes operations per
second; its primary `render` score remains time per render. Bytes and DOM counts
are separate metrics. Frameworks must finish the work required by each operation
inside its timing window, including queued commits where applicable. Expensive
correctness checks run outside timing windows.

The result metadata identifies Node/pnpm, CPU/OS, revision/dirty state, lockfile
checksum, browser executable, and selected targets. The committed lockfile pins
resolved dependency versions. Preserve metadata when sharing results. Every timed
fixture builds with Vite's default esbuild minifier, so the frameworks are
compared under one build contract; `bundle-size` uses normalized esbuild
minification and per-file gzip/Brotli compression. These are different build
contracts, not interchangeable measurements.

Local timing regression checks require both score growth over 15% and minimum
growth over 10%, with an additional 0.1ms threshold for sub-millisecond baselines.
Deterministic metrics use strict comparisons. These are regression tolerances, not
proof of a performance win. Record normal runs repeatedly and compare paired
competitors on the same machine before claiming an improvement. Do not copy
historical Octane scores or relax correctness gates to improve rankings.

Saved results and logs under `benchmarks/results/` are kept in Git. Local
references under `benchmarks/baselines/local/`, builds, and profiles remain
ignored. The committed ratio guards were initialized from three normal full-matrix
runs, with measured noise headroom. They use fresh Ripple comparisons rather than
Octane's historical thresholds. See `baselines/README.md` for the refresh policy.

## Normal baseline report

After three successful normal runs, generate the operation-level gap report:

```sh
node benchmarks/report.mjs benchmarks/results/baseline-1 benchmarks/results/baseline-2 benchmarks/results/baseline-3
```

The reporter rejects smoke results, failed suites, and mismatched machine,
workload, runtime-source, or lockfile metadata. It writes Markdown and JSON under
`benchmarks/results/`. Use `--output=path.md` to choose another destination.
Repeat with different `--targets=` orders to expose order effects; capability
exclusions remain explicit. The recursive-context and signal suites additionally
retain upstream's repeated, order-balanced Octane dialect controls.

The individual suite READMEs retain upstream workload explanations and historical
context. Use this README, `suites.json`, and `UPSTREAM.md` for the runnable Ripple
matrix, dependency versions, and excluded Octane-only instrumentation. Historical
upstream numbers are not baselines for this checkout.

To retain named runs, pass `--results-dir=benchmarks/results/run-before` and
`--results-dir=benchmarks/results/run-after`. `benchmarks/compare.mjs` compares
those saved files without running benchmarks again, using the same regression
rules. It rejects failed, incomplete, or incompatible baselines. An optional list
of suite names limits the comparison.

Every imported suite includes Ripple. When Ripple is selected, the runner also
requires it to cover every measured operation in the selected comparison,
including the consumer-paced streaming CPU cases. Ripple ports use native Ripple
APIs while retaining the corresponding TSRX workload structure.

For a before/after comparison of a specific suite:

```sh
pnpm bench --results-dir=benchmarks/results/run-before js-framework
# Make the runtime/compiler change, keeping the benchmark workload unchanged.
pnpm bench --results-dir=benchmarks/results/run-after js-framework
node benchmarks/compare.mjs benchmarks/results/run-before benchmarks/results/run-after js-framework
```

The workload fingerprint covers measured harnesses, fixtures, build configuration,
statistics, and dependencies. Recording/reporting tools have a separate runner
fingerprint, so a bookkeeping correction does not invalidate unchanged workloads.
The initial snapshots retain their original recording fingerprint and explicitly
note the metadata-only correction of TodoMVC's class-write counter to `count`. No
measured values were changed.

## Octane 0.2.6 update

The fixture dependency is now pinned to Octane 0.2.6, with the benchmark changes
from upstream commit `45f9761557dcdc8c8d7455b511386f2642d0db08`. The 17 default
suites are unchanged; `js-framework-clear-1k` is an additional opt-in diagnostic
listed by `--list`. Use `--cpu-throttle=4` with a selected table suite to exercise
Chromium CPU throttling. See [table diagnostics](js-framework/README.md).

The original baseline recordings and guards are preserved as 0.2.4 references. No
new normal baselines were recorded for this update. Old reports remain historical
evidence, not measurements of 0.2.6. The offline comparison still checks
workload/toolchain fingerprints, so an old-vs-new comparison may report a metadata
mismatch; preserved snapshots have not been altered to conceal it.

The runner's `--compare` can still use the retained local references for existing
operations when explicitly requested. Saved historical runs remain comparable to
one another. The new opt-in 1k diagnostic has no old baseline and should be run
without `--compare` until one is deliberately recorded.
