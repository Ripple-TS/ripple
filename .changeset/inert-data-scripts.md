---
'@tsrx/ripple': patch
'ripple': patch
---

Allow scripts with statically known data MIME types, such as `application/json`,
outside the head. Preserve script attributes and raw text on the client, and
adopt existing server-rendered scripts during hydration without duplicating or
re-executing them.
