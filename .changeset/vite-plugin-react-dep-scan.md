---
'@tsrx/vite-plugin-react': patch
---

fix: make `.tsrx` imports visible to Vite's dependency scanner

Vite's dep scanner runs through Rolldown without the main plugin pipeline, so
any npm dependency imported only from `.tsrx` files was invisible at startup
and got discovered at request time instead, forcing a re-optimize and a full
page reload. The plugin now registers a dep-scan plugin under
`optimizeDeps.rolldownOptions.plugins` (plus the `.tsrx` entry in
`optimizeDeps.extensions`) that compiles `.tsrx` modules for the scan pass, so
their imports are crawled up front.
