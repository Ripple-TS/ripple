# Nested asynchronous data

Measures initialization and version updates through ten nested levels with
independent requests and the same simulated 16 ms delay. Each fixture uses its
framework’s native async model.

The deepest result and request/version state must settle correctly. Interpret
total latency relative to the shared delay floor; this is not a pure CPU
benchmark. A missing target fixture does not imply that its framework cannot
express asynchronous work.

From the repository root:

```sh
pnpm bench --quick async-waterfall
pnpm bench async-waterfall
pnpm bench --record async-waterfall
pnpm bench --compare async-waterfall
```

Use `--targets=ripple,octane-tsrx,solid,vue-vapor` to select the priority
comparisons where fixture coverage exists. `pnpm bench --list` shows the current
matrix. Quick runs check correctness; normal runs establish timing baselines.

See the [runner documentation](../README.md) for setup, statistics, saved-run
comparison, and result paths, and [provenance](../UPSTREAM.md) for the pinned
upstream source and adaptations. Historical upstream scores are not baselines for
this checkout.
