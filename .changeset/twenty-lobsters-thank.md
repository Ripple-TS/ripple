---
'ripple': patch
---

Fix `trackAsync` server error handling so production sanitization is applied consistently between SSR catch rendering and hydration error envelopes, preventing hydration mismatches.
