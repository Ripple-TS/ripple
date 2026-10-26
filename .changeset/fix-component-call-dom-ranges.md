---
'@tsrx/ripple': patch
---

Keep root template expression DOM ranges intact when component calls render nested control flow, so conditional cleanup and keyed list updates remove and move all child nodes.
