---
'@tsrx/core': patch
---

Treat `<` in markup text as a literal character when it cannot start a tag, so `<span><3</span>` parses instead of throwing `Unexpected token`. The JSX printer emits such text (and raw-text `<script>` bodies) with `<` escaped as `&lt;`, so the compiled output of JSX targets stays parseable by downstream toolchains
