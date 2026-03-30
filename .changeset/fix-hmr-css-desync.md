---
'@ripple-ts/vite-plugin': patch
---

Fix HMR update causing component styling to disappear

When editing a component's scoped CSS, the CSS hash changes but the virtual CSS module was not being invalidated or included in the HMR update. This caused the browser to keep stale CSS selectors that no longer matched the component's new hash-scoped class names, making all styling disappear until a full dev server restart.

The fix eagerly re-compiles the `.ripple` file in the `hotUpdate` hook to update the CSS cache, then invalidates and includes the virtual CSS module in the HMR update so the browser receives fresh CSS in sync with the re-rendered component.
