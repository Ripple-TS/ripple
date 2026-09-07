# Signal-favoring component chain

Measures a 100-component chain with stateful counters at C1, C11, through C91.
Operations cover shallow, middle, deep, and sweep updates, including
ancestor-first and descendant-first batching, plus mount and unmount.

This workload deliberately favors fine-grained updates: a signal renderer can
update the expressions that read a value without rerunning component bodies.
Hook-based renderers may use compiler or memoization bailouts. Correctness
verifies the final counters and affected output; the model difference remains
explicit. The source generator maintains component templates while
framework-specific adapters remain handwritten.

From the repository root:

```sh
pnpm bench --quick signal-favoring
pnpm bench signal-favoring
pnpm bench --record signal-favoring
pnpm bench --compare signal-favoring
```

Use `--targets=ripple,octane-tsrx,solid,vue-vapor` to select the priority
comparisons where fixture coverage exists. `pnpm bench --list` shows the current
matrix. Quick runs check correctness; normal runs establish timing baselines.

See the [runner documentation](../README.md) for setup, statistics, saved-run
comparison, and result paths, and [provenance](../UPSTREAM.md) for the pinned
upstream source and adaptations. Historical upstream scores are not baselines for
this checkout.
