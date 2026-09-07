# Database monitor snapshots

Measures complete and sparse database-monitor snapshots, remounting, sorting, and
teardown. Data generation and expected visible database/query output are
deterministic.

Preserve the imported state models: Ripple uses tracked state and immutable
snapshot replacement; Solid’s fixture uses its native store/reconcile model.
Correctness checks verify output and update completion. Different reactivity
strategies are part of the comparison, not identical internal algorithms.

From the repository root:

```sh
pnpm bench --quick dbmon
pnpm bench dbmon
pnpm bench --record dbmon
pnpm bench --compare dbmon
```

Use `--targets=ripple,octane-tsrx,solid,vue-vapor` to select the priority
comparisons where fixture coverage exists. `pnpm bench --list` shows the current
matrix. Quick runs check correctness; normal runs establish timing baselines.

See the [runner documentation](../README.md) for setup, statistics, saved-run
comparison, and result paths, and [provenance](../UPSTREAM.md) for the pinned
upstream source and adaptations. Historical upstream scores are not baselines for
this checkout.
