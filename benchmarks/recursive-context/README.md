# Recursive context

Measures a balanced binary component tree with context reads at its leaves:
initial mount, root and subtree updates, partial unmount/remount, and full
disposal.

Correctness checks verify the affected leaves and context values. The upstream
repeated, order-balanced Octane TSRX/JSX controls remain separately labeled in
results. Other targets use their own context and reactivity APIs.

From the repository root:

```sh
pnpm bench --quick recursive-context
pnpm bench recursive-context
pnpm bench --record recursive-context
pnpm bench --compare recursive-context
```

Use `--targets=ripple,octane-tsrx,solid,vue-vapor` to select the priority
comparisons where fixture coverage exists. `pnpm bench --list` shows the current
matrix. Quick runs check correctness; normal runs establish timing baselines.

See the [runner documentation](../README.md) for setup, statistics, saved-run
comparison, and result paths, and [provenance](../UPSTREAM.md) for the pinned
upstream source and adaptations. Historical upstream scores are not baselines for
this checkout.
