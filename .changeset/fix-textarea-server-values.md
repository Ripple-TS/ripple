---
'@tsrx/ripple': patch
'ripple': patch
---

Render textarea values as escaped text content during SSR and omit hydration
markers from textarea expression children. Preserve leading newlines and support
literal and spread values on the client, including reactive updates after hydration.
