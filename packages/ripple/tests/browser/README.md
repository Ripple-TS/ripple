# Activity task trace

Use the workspace's existing Playwright and Vite dependencies:

```bash
pnpm --filter @ripple-ts/tanstack-router exec node ../ripple/tests/browser/activity.js
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
