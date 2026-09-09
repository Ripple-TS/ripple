---
'ripple': patch
---

Reduce cold mount and hydration compilation work for the default root boundary and `@try` blocks by moving pending, catch, and streaming helpers out of boundary initialization.
