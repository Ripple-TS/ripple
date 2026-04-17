---
'@tsrx/ripple': patch
'ripple': patch
---

Fix children prop precedence when invoking components so that template children always win over an explicit `children=` attribute, while still respecting JSX-like ordering between explicit props and spreads when no template children are present.
