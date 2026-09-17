# Nested asynchronous data

Measures initialization and version updates through ten nested levels with
independent requests and the same simulated 16 ms delay. Each fixture uses its
framework’s native async model.

`init` measures mounting until the deepest level renders version 0; `update`
measures a version bump until that level renders the new value. Each sample pair
uses a fresh page and promise cache, with completion observed through DOM
mutations. Both operations score the mean across all fresh-page samples.

The harness and fixture workloads match Octane `main` at
[`de270e3b46310ffa228aea574e89b999b094dfec`](https://github.com/octanejs/octane/commit/de270e3b46310ffa228aea574e89b999b094dfec).
All seven fixtures explicitly use esbuild minification. Dependencies use this
repository’s benchmark catalog, published `octane@0.2.6`, and workspace Ripple;
Ripple retains its local TypeScript configuration and disabled root boundary.

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
