---
'@tsrx/vite-plugin-solid': patch
---

Honor the `include` option on the Vite plugin. Previously it was typed and
documented on `TsrxSolidOptions` but never read — the plugin always matched
files via a hardcoded `.tsrx` extension check, so passing
`{ include: /pattern/ }` had no effect. `resolveId`, the virtual-id detection
and `handleHotUpdate` now all route through the user-supplied regex (or
`/\.tsrx$/` when none is provided), so extending or narrowing the set of
compiled sources works as advertised.
