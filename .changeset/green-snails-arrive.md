---
'@tsrx/react': patch
---

Allow React TSRX `for...of` control flow to use a `key` clause by applying the key to the emitted React loop item, while still letting an inline JSX `key` take precedence.
