# Benchmark provenance

Imported from the local checkout of
[octanejs/octane](https://github.com/octanejs/octane), revision
`5ec6040ab28f59bcc3376a35add700202fd1098b`, on 2026-09-06. The source checkout was
clean. Upstream license: MIT; see [LICENSE.octane](LICENSE.octane).
Fixture-specific upstream attribution remains in the imported sources.

The import includes 16 comparative suites, their required framework fixtures,
shared statistics, DOM census, streaming verification, React Compiler integration,
and Inferno JSX integration. Octane-only compiler work counters, private bindings,
deopt workloads, native renderers, and the larger integration applications are
outside this port. The buffered throughput suite retains comparative news
workloads; the byte suite initially retained rows, TodoMVC, and chat. Weather was
added in the synchronization below.

Ripple fixture dependencies resolve to this workspace's `ripple`, `@tsrx/ripple`,
and `@ripple-ts/vite-plugin`, replacing upstream's published Ripple dependencies.
Octane is pinned to the published `octane@0.2.6`; this is a released competitor,
not a claim that its package contents equal every change at the source revision.
No benchmark requires a neighboring checkout or copies shared TSRX compiler code.

Benchmark dependencies use a separate `benchmarks` catalog. Versions start from
upstream's resolved catalog. Solid is aligned to `2.0.0-rc.3`, required by the
published `@tsrx/solid@0.1.67`; its Babel transform is aligned separately from the
repository's older default catalog. The lockfile records exact versions and
integrities. Svelte's optional editor/typechecker command is omitted: Vite's
production compiler builds and validates these fixture applications.

The unified Ripple runner replaces upstream's kill-by-port cleanup with owned
process groups, supports consistent target selection, and treats correctness
failures as fatal. The upstream Ripple reorder waiver is not imported. Upstream
absolute baselines, Octane performance budgets, and ratio thresholds are not
imported. The original framework operation contracts and correctness gates remain
the starting point for comparison; changes required for current dependencies are
validated against those contracts.

The consumer-paced streaming CPU scenarios also have a Ripple implementation:
10/100/800 cards and 50 cards released in groups of five. It follows the Octane
TSRX workload using Ripple's public `createStream()`/`render()` APIs and tracked
async values. Coverage validation rejects future scenarios that omit Ripple.

## Octane 0.2.6 synchronization (2026-09-07)

Ported the benchmark changes from
[`45f9761557dcdc8c8d7455b511386f2642d0db08`](https://github.com/octanejs/octane/commit/45f9761557dcdc8c8d7455b511386f2642d0db08):

- Verify each click's DOM change immediately after stopping its timer, before a
  later scheduler turn can hide an incomplete commit.
- Retain the public Octane `flushSync` hooks already present in this port.
- Add the separate, opt-in `js-framework-clear-1k` diagnostic and CPU throttling.
  It reuses the full fixture matrix, including native Ripple.

The timing callback is factored into `js-framework/click.mjs` for tests of its
commit/validation boundary. Ripple's all-framework insertion and identity checks
remain enabled. Upstream changes to private Octane scratch-allocation and
production-call counters do not apply to this port's excluded diagnostics.

All benchmark Octane dependencies are pinned to the published **0.2.6** release,
which resolves its required published `@tsrx/core` dependency. Other framework
pins remain unchanged. Existing baseline/result snapshots, reports, and ratio
guards are retained unchanged: they still describe the original **0.2.4** runs.
They were not rerun, rewritten, or relabeled as 0.2.6 measurements. Follow-up
smoke output is kept separately under `tmp/octane-026-*/`.

## Weather application synchronization (2026-09-16)

Imported the comparative weather fixtures, shared assets, interaction harness, and
Lighthouse runner from Octane `origin/main` at
[`5ead1ff2c000f3bb322e7d4fd1d5786161195189`](https://github.com/octanejs/octane/commit/5ead1ff2c000f3bb322e7d4fd1d5786161195189).
Added a native Ripple port and `weather_*` bundle measurements, with the same
observable interaction checks applied to the measured production bundles. The
weather suite uses standard Vue, separately named `vue`; the other suites retain
`vue-vapor`. Dependencies follow the existing benchmark catalog, with pinned
Lighthouse and Chrome launcher added. Octane-only codegen budgets and the separate
Octane/React delivery experiment are excluded. Shared framework source remains
external, and historical results and baselines are unchanged.

The weather UI and assets retain Alicia Sykes’s MIT attribution in
[weather-app/UPSTREAM_LICENSE](weather-app/UPSTREAM_LICENSE).

## Bundle-size parity review (2026-09-16)

Reviewed the comparative runner, framework fixture sources, and Vite configs
against Octane `origin/main` at
[`68515636eebde7d6f5db7180131908bfb0656c7a`](https://github.com/octanejs/octane/commit/68515636eebde7d6f5db7180131908bfb0656c7a).
The build, chunk split, and compression algorithms already matched. Synchronized
the TodoMVC and chat Octane entry files to upstream's equivalent `flushSync`
imports. Ripple's workspace attribution, additional framework coverage, target
selection, result units, and executable-bundle checks are retained.

Upstream's fixed Octane budget rows and separate Octane-only reachability suite
remain outside this port. See [bundle-size/README.md](bundle-size/README.md) for
the measurement contract and deliberate integration differences. Existing
baselines and historical result files are unchanged.

Executed the upstream runner against this checkout's fixtures and dependencies,
adapting only module/output paths and workspace runtime attribution. All 279 byte
metrics from the 31 common builds matched exactly. The full Ripple runner also
passed all 33 builds and their browser interaction checks. These checks establish
measurement parity under the same toolchain, not equality with Octane's workspace
runtime or its committed budget limits.

## SVG dashboard synchronization (2026-09-16)

Imported the SVG dashboard fixtures and comparative harness from Octane
`origin/main` at
[`de270e3b46310ffa228aea574e89b999b094dfec`](https://github.com/octanejs/octane/commit/de270e3b46310ffa228aea574e89b999b094dfec).
Added native Ripple tracked state, keyed SVG updates, dynamic icon tags, and SVG
portal tooltips. Ripple's TypeScript and Vite settings follow portal-swarm.

All six fixtures participate in the identical-data gate; Inferno's comment-only
variation is normalized. Namespace, operation replay, keyed identity, and DOM
parity gates are retained, with uncaught browser errors made fatal. Each sample
forces layout immediately before its timer, matching this repository's timing
convention. Octane-only production-call instrumentation and budgets are excluded.
See [svg-dashboard/README.md](svg-dashboard/README.md) for the runnable workload.

The suite exercises namespace preservation across block reruns, fixed separately
in [#1490](https://github.com/Ripple-TS/ripple/pull/1490). This import contains
only benchmark fixtures, harness integration, and documentation. All six
frameworks pass the imported operation and namespace gates with identical
canonical DOM hashes at mount and after the complete gate sequence.

## Async-waterfall synchronization (2026-09-17)

Compared the complete async-waterfall suite with Octane `origin/main` at
[`de270e3b46310ffa228aea574e89b999b094dfec`](https://github.com/octanejs/octane/commit/de270e3b46310ffa228aea574e89b999b094dfec).
The harness, data modules, and framework workloads already matched. Imported
upstream’s explicit esbuild minification setting for all seven fixtures and
declared esbuild through the benchmark catalog for Vite 8.

Retained this repository’s dependency catalog, published Octane 0.2.6 pin, and
workspace Ripple dependencies, TypeScript configuration, and disabled root
boundary. The ten-level workload, 16 ms delay, cold-page sampling, and init/update
completion contract are unchanged. Historical results and baselines are unchanged.

All seven production builds and the two-iteration init/update smoke run pass.
Smoke output is kept separately under `tmp/async-waterfall-sync-smoke/`.
