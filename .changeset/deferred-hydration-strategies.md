---
'ripple': patch
'@tsrx/ripple': patch
---

Add `Hydrate` and the `ripple/hydration` strategies `load`, `idle`, `visible`,
`interaction`, `media`, `condition`, and `never`. Retain initial SSR HTML until its
policy opens, reuse Activity's deferred context and scheduling machinery, and
preserve native interaction delivery through nested boundaries. Client-only mounts
render normally. Add typed policies, completion callbacks, cleanup, streaming,
root-specific async/transport support, documentation, and browser coverage.

Record deferred conditional choices in existing hydration comments so changed
branches reconcile locally without rebuilding edited siblings or adding markers.
