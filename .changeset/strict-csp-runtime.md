---
'ripple': patch
---

Add a per-render `nonce` option for executable streaming scripts and scoped styles, including nested, late, and failed boundaries. Preserve explicitly supplied nonces when creating client scripts.

Restore the component context when rendering an asynchronous catch branch so late route fallbacks can read their provider.
