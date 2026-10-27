---
'@ripple-ts/vite-plugin': patch
---

Compile installed TSRX source dependencies when Vite appends a cache version query. Keep compiler filenames, source maps, and scoped CSS identity stable across query changes, and leave raw/URL imports to Vite's resource handling.
