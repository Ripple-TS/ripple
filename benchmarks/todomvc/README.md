# TodoMVC interactions

Measures adding, editing, toggling, filtering, and deleting todos through the same
visible interface. Each operation begins from a defined state and includes the
required framework commit.

The gates check visible list contents, counts, completion state, editing behavior,
and retained DOM where required. DOM census measurements are reported separately
from timing.

From the repository root:

```sh
pnpm bench --quick todomvc
pnpm bench todomvc
pnpm bench --record todomvc
pnpm bench --compare todomvc
```

Use `--targets=ripple,octane-tsrx,solid,vue-vapor` to select the priority
comparisons where fixture coverage exists. `pnpm bench --list` shows the current
matrix. Quick runs check correctness; normal runs establish timing baselines.

See the [runner documentation](../README.md) for setup, statistics, saved-run
comparison, and result paths, and [provenance](../UPSTREAM.md) for the pinned
upstream source and adaptations. Historical upstream scores are not baselines for
this checkout.
