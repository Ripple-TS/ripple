---
'@tsrx/core': patch
'@tsrx/ripple': patch
'@tsrx/typescript-plugin': patch
'@tsrx/prettier-plugin': patch
---

Treat `<script>…</script>` as a raw-text element (like `<style>`) so its body can
contain real JS/TS — including markup-significant characters such as `<`, `{`, and
`}` — instead of being parsed as template markup. The body is captured verbatim on
the element's `content`.

Editors now get embedded TypeScript intellisense inside `<script>` bodies
(type-aware completions, hover, go-to-definition, and diagnostics), mapped back
to the `.tsrx` source — the same way `<style>` bodies get embedded CSS. Every
body is treated as TypeScript in the editor (a superset of JavaScript); the
`type` attribute only matters to the runtime transforms. This works across all
tsrx targets, since the parser and compiler changes live in shared core and the
language server is target-neutral.

The compiler emits a new `scriptMappings` array on `VolarMappingsResult`, and every
target renders the inline raw-text `<script>` body verbatim (the parser mirrors the
body as a text child for generic element paths; the Ripple client and server inject
it as the script's text content). The Prettier plugin formats the body as
JavaScript/TypeScript in a block layout, the same way `<style>` bodies are formatted
as CSS.
