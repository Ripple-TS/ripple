# Keyed table operations

Measures creating 1,000 and 10,000 rows, replacing and appending data, updating
every tenth label, selecting, swapping, removing, and clearing. The clear
operation starts from 10,000 rows. Seeded label generation and committed DOM
updates are part of the workload.

Each timed click verifies its expected DOM change immediately after the timer
stops, before another scheduler turn. The harness also verifies inserted-row
order, surviving node identity, and delegated selection across all targets.
`js-framework-reorder` uses the same fixture apps for reverse, shuffle, rotation,
insertion, removal, and displacement checks. Octane-specific private allocator and
production-call budgets remain in the upstream repository.

From the repository root:

```sh
pnpm bench --quick js-framework
pnpm bench js-framework
pnpm bench --record js-framework
pnpm bench --compare js-framework
```

Use `--targets=ripple,octane-tsrx,solid,vue-vapor` to select the priority
comparisons where fixture coverage exists. All fixtures build with Vite's default
esbuild minifier. `pnpm bench --list` shows the current matrix. Quick runs check
correctness; normal runs establish timing baselines.

Run the additional reorder matrix with `pnpm bench js-framework-reorder`. The
Ripple-only anchor diagnostic is `pnpm bench reconcile-anchors`.

See the [runner documentation](../README.md) for setup, statistics, saved-run
comparison, and result paths, and [provenance](../UPSTREAM.md) for the pinned
upstream source and adaptations. Historical upstream scores are not baselines for
this checkout.

## Opt-in 1,000-row clear

The canonical `clear` operation remains a 10,000-row clear. To run the upstream
1,000-row diagnostic separately, with or without 4× Chromium CPU throttling:

```sh
pnpm bench --quick js-framework-clear-1k
pnpm bench --quick --cpu-throttle=4 --targets=ripple,octane-tsrx,solid,vue-vapor js-framework-clear-1k
```

The diagnostic reports `clear_1k` under `js-framework-clear-1k`, and is excluded
from default suite selection. Normal runs use 15 samples and 5 warmups; quick
checks use 3 samples and 1 warmup. Throttle rate is recorded in result metadata,
and comparisons reject different rates. CPU throttling is available for
`js-framework` and `js-framework-clear-1k` only.

Direct harness invocation also accepts `CLEAR_1K=1 CPU_THROTTLE=4`, with
production preview servers already running. The unified runner selects the
diagnostic by name and controls its environment to protect the canonical result
namespace. These in-page click timings exclude paint and automation latency; they
are not interchangeable with the official framework benchmark's Chrome timeline
scores.
