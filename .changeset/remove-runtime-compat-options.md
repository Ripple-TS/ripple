---
'ripple': minor
'@ripple-ts/compat-react': patch
---

Remove the `compat` option from `mount()` and `hydrate()`, and stop exporting the old public compat types from `ripple`. Compat integrations are now expected to be provided by the Vite plugin via `ripple.config.ts`, while direct runtime tests can seed the generated global compat registry.

Also add the `reactCompat()` config-facing helper from `@ripple-ts/compat-react` for use in `ripple.config.ts`.
