# Effectful keyed lists

Measures 1,000 keyed rows with cross-module components, effects, shared callback
refs, and layout probes on every tenth row. Operations include unchanged and
changed dependencies, clear, remount, and scattered removal.

Setup and cleanup counters are correctness requirements. Required passive-effect
settling stays inside lifecycle measurements. Every target uses its native
lifecycle APIs while preserving the observable resource contract.

From the repository root:

```sh
pnpm bench --quick effectful-list
pnpm bench effectful-list
pnpm bench --record effectful-list
pnpm bench --compare effectful-list
```

Use `--targets=ripple,octane-tsrx,solid,vue-vapor` to select the priority
comparisons where fixture coverage exists. `pnpm bench --list` shows the current
matrix. Quick runs check correctness; normal runs establish timing baselines.

See the [runner documentation](../README.md) for setup, statistics, saved-run
comparison, and result paths, and [provenance](../UPSTREAM.md) for the pinned
upstream source and adaptations. Historical upstream scores are not baselines for
this checkout.
