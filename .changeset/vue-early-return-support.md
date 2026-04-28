---
'@tsrx/core': patch
'@tsrx/vue': patch
---

Fix Vue early-return lowering so continuation-local refs stay stable across parent updates.

Also make `if (cond) return;` early returns in Vue components reactive after mount. Previously the early return was emitted as a setup-time `if` block, which only evaluated `cond` once when `setup()` ran and never again — so flipping the condition after mount didn't toggle the continuation.

The lowering now picks one of two paths based on the continuation:

- **Pure JSX continuation** — inlined as a render-time ternary (`cond ? null : <continuation/>`). Cheapest path, no extra component.
- **Continuation with setup-time statements** (`provide`, `watch`, `watchEffect`, declarations, plain function calls, etc.) — moved into a `StatementBodyHook` helper component whose setup runs only when the helper mounts. This keeps those statements scoped to the continuation's lifecycle so e.g. `provide` is only visible to descendants while the continuation is active.

React, Preact, and Solid lowering is unchanged: their bodies re-run on every render, so the existing setup-time `if` already behaves reactively.
