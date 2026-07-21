---
'@tsrx/core': patch
'@tsrx/ripple': patch
'@tsrx/prettier-plugin': patch
'@tsrx/typescript-plugin': patch
'@ripple-ts/language-server': patch
---

Add an explicit whole-body raw-text expression grammar for scripts:
`<script>{= expression}</script>`. Static script bodies remain verbatim raw
JavaScript or TypeScript, while dynamic bodies expose their real expression AST
to framework compilers. Update formatting, editor mappings, syntax grammars,
and embedded-language handling for the new unambiguous form.

The shared JSX transform now rejects this form with the stable
`tsrx-dynamic-script-unsupported` diagnostic, so the bundled React, Preact,
Solid, and Vue compilers cannot silently pass the marked expression to target
renderers with incompatible client, SSR, or hydration behavior. Factory targets
may opt in only through a dedicated hook that consumes the parser marker and
provides a whole-script-safe target lowering. The Ripple renderer retains its
target-specific
`tsrx-ripple-dynamic-script-unsupported` diagnostic until it has a whole-script
client/SSR/hydration primitive that can preserve attributes and prevent script
breakouts without corrupting JavaScript or JSON.
