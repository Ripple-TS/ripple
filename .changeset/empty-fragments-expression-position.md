---
'@tsrx/ripple': patch
'@tsrx/core': patch
---

Keep empty fragments in expression position: `let b = <></>` stays `<></>` instead of `null`, and `let c = <><></></>` keeps both levels instead of collapsing to `<></>`. Applies to the React, Preact, Solid, Vue, and Ripple to_ts targets.
