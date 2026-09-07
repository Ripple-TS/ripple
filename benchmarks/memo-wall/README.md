# Memo and fine-grained update boundaries

Measures unchanged parent updates, a single changed row, and context propagation
through 1,000 children. The full matrix includes compiled React and a separately
labeled uncompiled control.

Fine-grained renderers do not rerun component bodies merely because a parent value
changes. Their near-zero unchanged-parent measurements reflect that model. The
fixtures retain the upstream row-object identity choices and verify work counters,
changed output, and context consumers.

From the repository root:

```sh
pnpm bench --quick memo-wall
pnpm bench memo-wall
pnpm bench --record memo-wall
pnpm bench --compare memo-wall
```

Use `--targets=ripple,octane-tsrx,solid,vue-vapor` to select the priority
comparisons where fixture coverage exists. `pnpm bench --list` shows the current
matrix. Quick runs check correctness; normal runs establish timing baselines.

See the [runner documentation](../README.md) for setup, statistics, saved-run
comparison, and result paths, and [provenance](../UPSTREAM.md) for the pinned
upstream source and adaptations. Historical upstream scores are not baselines for
this checkout.
