---
'ripple': patch
---

Fix event delegation breaking when multiple roots (Portals, mounts) share or mix targets.

- `handle_root_events(target)` had no notion of multiple callers sharing the same `target` element. Each Portal (or the app root) calls it once on mount; its cleanup unconditionally removed the delegated event listeners from `target`. When two Portals both mount to `document.body` (e.g. a Modal and a SideSheet), closing the first tore down the delegated listeners for `document.body` entirely, silently breaking every click inside the second — no error, no warning. `handle_root_events` now ref-counts callers per target, and the delegated listeners are only torn down once every caller for that target has released it.
- The single `root_target` global is gone. `on()` now checks the element against every active root target, so attaching a listener directly to one root's target while another root (e.g. a Portal to a sibling layer) was acquired later no longer silently takes the broken delegated path.
- `Portal` acquires root event delegation in its own render block keyed on `target`, so a children-only update no longer releases and re-adds every delegated listener on the target.
