# News SSR and hydration

Production-builds a generated news page for each target, then measures buffered
server rendering and committed browser hydration separately. The checked-in
dataset has 50 cards; `ssr-throughput` also exercises 500 cards.

The browser gate checks server-node adoption, article content, and a working theme
toggle. The hydration timing excludes network loading and includes the framework
commit. Vue Vapor fixtures use Vue’s standard compiled server renderer for SSR.
Dataset generation is shared and deterministic.

From the repository root:

```sh
pnpm bench --quick news
pnpm bench news
pnpm bench --record news
pnpm bench --compare news
```

Use `--targets=ripple,octane-tsrx,solid,vue-vapor` to select the priority
comparisons where fixture coverage exists. `pnpm bench --list` shows the current
matrix. Quick runs check correctness; normal runs establish timing baselines.

See the [runner documentation](../README.md) for setup, statistics, saved-run
comparison, and result paths, and [provenance](../UPSTREAM.md) for the pinned
upstream source and adaptations. Historical upstream scores are not baselines for
this checkout.
