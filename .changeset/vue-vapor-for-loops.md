---
'@tsrx/vue': patch
'@tsrx/vite-plugin-vue': patch
'@tsrx/rspack-plugin-vue': patch
---

Lower Vue `for...of` templates to `VaporFor` so loop item and key callbacks preserve types. Update the Vue plugin bridge and peer floor for the `vue-jsx-vapor` runtime that provides `VaporFor`.
