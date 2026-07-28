---
'@tsrx/core': patch
---

Fix a parse error for multi-line JSX elements with element children used as attribute values (`prop={<div><span>x</span></div>}`). The tokenizer's stale-text fixup popped the value element's own children context before its closing tag, unbalancing the context stack so the token after the container's `}` failed to parse.
