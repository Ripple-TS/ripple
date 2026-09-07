# Executable production bundle size

Builds the keyed table, TodoMVC, and chat-stream fixtures with normalized esbuild
minification. Reports app, framework, and total JavaScript bytes, each as raw,
gzip, and Brotli sizes. CSS and HTML are not included.

Framework accounting includes installed packages, virtual helpers, and the local
Ripple runtime. Each emitted JavaScript file is compressed independently. Chromium
then loads the actual built artifacts and exercises their public interactions
before bytes are accepted. Weather-app and Octane-only reachability/budget
fixtures are outside this initial port.

From the repository root:

```sh
pnpm bench --quick bundle-size
pnpm bench bundle-size
pnpm bench --record bundle-size
pnpm bench --compare bundle-size
```

Use `--targets=ripple,octane-tsrx,solid,vue-vapor` to select the priority
comparisons where fixture coverage exists. `pnpm bench --list` shows the current
matrix. Quick runs check correctness; normal runs establish timing baselines.

See the [runner documentation](../README.md) for setup, statistics, saved-run
comparison, and result paths, and [provenance](../UPSTREAM.md) for the pinned
upstream source and adaptations. Historical upstream scores are not baselines for
this checkout.
