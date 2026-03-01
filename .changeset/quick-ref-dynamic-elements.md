---
'ripple': patch
---

Fix ref handling for dynamic elements with reactive spread props to avoid
read-only/proxy symbol errors and prevent unnecessary ref teardown/recreation.
