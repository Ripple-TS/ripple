---
'@tsrx/react': patch
'@tsrx/solid': patch
---

Preserve source order when non-JSX statements are interleaved with JSX children. Previously all statements ran before any JSX was constructed, so mutations between siblings (e.g. `<b>{"hi" + a}</b>; a = "two"; <b>{"hi" + a}</b>`) were observed by every sibling; each JSX child is now captured at its textual position.
