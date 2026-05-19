---
"@tsrx/ripple": patch
"@tsrx/core": patch
"ripple": patch
---

Parse nested `<tsrx>` islands inside `<tsx>` expression containers as native TSRX so setup declarations and references keep Volar mappings, and hydrate deeply nested `<tsx>`/`<tsrx>` expression values without skipping server markers.
