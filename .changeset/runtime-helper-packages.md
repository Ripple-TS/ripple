---
"@tsrx/runtime": patch
"@tsrx/react-runtime": patch
"@tsrx/preact-runtime": patch
"@tsrx/solid-runtime": patch
"@tsrx/vue-runtime": patch
"@tsrx/core": patch
"@tsrx/react": patch
"@tsrx/preact": patch
"@tsrx/solid": patch
"@tsrx/vue": patch
"@tsrx/vite-plugin-react": patch
"@tsrx/vite-plugin-preact": patch
"@tsrx/vite-plugin-solid": patch
"@tsrx/vite-plugin-vue": patch
"@tsrx/rspack-plugin-react": patch
"@tsrx/rspack-plugin-preact": patch
"@tsrx/rspack-plugin-solid": patch
"@tsrx/rspack-plugin-vue": patch
"@tsrx/bun-plugin-react": patch
"@tsrx/bun-plugin-preact": patch
"@tsrx/bun-plugin-solid": patch
"@tsrx/bun-plugin-vue": patch
"@tsrx/turbopack-plugin-react": patch
---

Split compiler-emitted helpers into shared and renderer-specific runtime packages,
and add opt-in direct runtime imports across supported build integrations.
