---
'@tsrx/core': patch
'@tsrx/solid': patch
---

Keep an empty expression container fragment in expression position: `let c = <>{}</>` (and `<>{/* comment */}</>`) now stays `<></>` instead of collapsing to a bare empty expression (`let c = ;`), which was a syntax error. Applies to the React, Preact, Solid, and Vue to_ts targets (Ripple already produced `<></>`).
