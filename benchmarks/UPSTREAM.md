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
workloads; the byte suite retains rows, TodoMVC, and chat. Weather is deferred.

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
