---
'@tsrx/typescript-plugin': patch
---

Support the octane tsrx target: resolve octane projects to the compiler entry inside the `octane` package (`src/compiler/volar.js`, via a new optional per-candidate entry path), and normalize its camelCase `compileToVolarMappings` export to the plugin's `compile_to_volar_mappings` contract so already-published octane versions work in both the editor plugin and `tsrx-tsc`. Also stop `tsrx-tsc` runs from warning `getExtraServiceScripts() is not available` once per file.
