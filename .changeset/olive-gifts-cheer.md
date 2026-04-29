---
'@tsrx/rspack-plugin-vue': patch
---

Add a Vue Rspack plugin that compiles `.tsrx` with `@tsrx/vue`, runs the
result through `vue-jsx-vapor`, and extracts component-local `<style>` blocks
through Rspack's CSS pipeline.
