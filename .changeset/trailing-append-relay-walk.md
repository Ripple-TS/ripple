---
'@tsrx/ripple': patch
'ripple': patch
---

perf: cheaper keyed lists. A `@for` or `@if` that trails template siblings appends into its parent element instead of inserting before a `<!>` placeholder. A list item whose updates live in one render block carries that block on the item block itself (`_$_.item`), and a keyed item that only its render block reads is held as it is instead of in a tracked, re-running its block directly when the key's item is replaced. Leaf text is written without a DOM read, from the value the render block last wrote. A keyed diff that re-lays most of its items walks the range front to back instead of appending every item at the end, about half the reorder cost in Chromium and far less right after a layout flush.
