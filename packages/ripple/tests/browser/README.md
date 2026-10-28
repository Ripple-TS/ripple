# Activity task trace

Use Ripple's Playwright and Vite dev dependencies:

```bash
pnpm --filter ripple exec node tests/browser/activity.js
```

The fixture builds real SSR/client bundles and runs Chromium with native
`scheduler.postTask` and with the timer fallback. It checks that ordinary root
hydration finishes first, twelve hidden boundaries initialize in twelve distinct
tasks, input-handling tasks execute between boundaries, and hidden user effects do
not start. It also checks that a client-only build excludes deferred hydration
modules.

The JSON trace records task, initialization, input, timer, and animation-frame
timestamps. It is written to the system temporary directory as
`ripple-activity-trace.json`; set `ACTIVITY_TRACE` to choose another path. Frame
records are observations, not an assertion that every boundary gets a paint.

# Hydrate contract and initial work

```bash
pnpm --filter ripple exec node tests/browser/hydrate.js
```

The production Vite/Chromium fixture exercises native viewport and media changes,
idle callbacks and the timer fallback, nested keyboard/focus/non-bubbling intent,
checkboxes, bindings edited before hydration, links, cancellation, propagation,
and form submission. First clicks reach their handlers with both Activity around
Hydrate and Hydrate around Activity. SSR styles for a `never()` child remain
available after the SSR style tag is replaced by the extracted Vite CSS. It
asserts that client-only builds exclude deferred hydration modules and unused
Hydrate exports are removed.

A 2,500-row SSR section initializes zero row components before its condition
opens, compared with 2,500 for the eager variant. Both variants request the same
single script: this measures deferred initialization, not reduced downloads. The
report includes Chromium's version, initial component counts, root-walk
measurements, and production JavaScript raw/gzip bytes. It is written to
`ripple-hydrate-trace.json` in the system temporary directory; set `HYDRATE_TRACE`
to choose another destination. Timing is descriptive, not a fixed-speed assertion.

See [the issue coverage checklist](../hydration/hydrate-plan.md) for the strategy
matrix and runtime/compiler/SSR integration cases.

Both scripts are checked by `pnpm typecheck`. For the browser tests alone, run
`pnpm exec tsgo --noEmit -p packages/ripple/tests/browser/tsconfig.json`.
