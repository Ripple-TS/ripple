---
'ripple': patch
---

Namespace serialized `trackAsync` data and streaming boundary identifiers per server render so independently rendered roots can hydrate and receive streamed chunks without consuming each other's data.
