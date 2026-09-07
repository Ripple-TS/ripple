# Buffered SSR throughput

Reuses the production news fixtures at 50 and 500 cards. Normal runs use the
declared per-configuration time budget; quick runs use 50 cards only. Each
returned body is materialized with `Buffer.byteLength` inside the timed operation.

The harness checks article counts and records render latency, operations per
second, payload metadata, and RSS/heap growth. Memory deltas without forced GC are
diagnostics, not leak proofs. Generated news datasets are restored in a `finally`
block. Octane-only waterfall, deopt, escape, and private compiler-work fixtures
are outside this port.

From the repository root:

```sh
pnpm bench --quick ssr-throughput
pnpm bench ssr-throughput
pnpm bench --record ssr-throughput
pnpm bench --compare ssr-throughput
```

Use `--targets=ripple,octane-tsrx,solid,vue-vapor` to select the priority
comparisons where fixture coverage exists. `pnpm bench --list` shows the current
matrix. Quick runs check correctness; normal runs establish timing baselines.

See the [runner documentation](../README.md) for setup, statistics, saved-run
comparison, and result paths, and [provenance](../UPSTREAM.md) for the pinned
upstream source and adaptations. Historical upstream scores are not baselines for
this checkout.
