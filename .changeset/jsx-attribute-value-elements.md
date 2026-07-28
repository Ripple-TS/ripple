---
'@tsrx/core': patch
---

Fix parse errors for multi-line JSX elements with element children used as attribute values (`prop={<div><span>x</span></div>}`), including nested paired elements and sibling elements after a nested close. The tokenizer's stale-text fixups counted contexts against the whole stack, which is blind inside a `{ … }` container; they now scope the count to the container so each still-open element keeps the children context its own closing tag pops.
