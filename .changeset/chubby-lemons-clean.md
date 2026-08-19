---
'ripple': patch
---

Fix event delegation breaking for a Portal when a sibling Portal sharing the same target unmounts.

`handle_root_events(target)` had no notion of multiple callers sharing the same `target` element. Each Portal (or the app root) calls it once on mount and returns a cleanup function; that cleanup unconditionally removed the delegated event listeners from `target` and reset the shared `root_target` state. When two Portals both mount to `document.body` (a very common case — e.g. a Modal and a SideSheet both portaling there), closing/unmounting the first one would tear down the delegated `click` (and other) listeners for `document.body` entirely, silently breaking every click inside the second Portal even though it was still open. The DOM nodes and their `__click` handler references were untouched — only the root delegation listener was gone — so the failure had no error, no warning, and no obvious cause from either component's own code.

`handle_root_events` now ref-counts callers per `target` (`root_target_refs: Map<Element, { count, registered_events }>`). The delegated listeners for a given target are only actually torn down once every caller for that target has released it.
