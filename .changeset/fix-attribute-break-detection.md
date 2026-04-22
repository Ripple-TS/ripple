---
'@ripple-ts/prettier-plugin': patch
---

Fix attribute-breaking detection so breakable inline docs (such as single-line source object literals that may wrap) trigger opening-tag breaking even when they do not contain hardline markers.
