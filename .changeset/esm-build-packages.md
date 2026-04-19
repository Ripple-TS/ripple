---
'@ripple-ts/language-server': patch
'@ripple-ts/typescript-plugin': patch
'@ripple-ts/vscode-plugin': patch
---

Convert the Ripple language server, TypeScript plugin, and VS Code extension codebases from CommonJS source files to ESM source files, while publishing built dist entrypoints instead of source files.

This updates package metadata such as `type: module` and dist-based `main` paths, replaces `require` and `module.exports` usage with `import` and `export`, and adds tsdown bundling configs that emit CommonJS dist output plus a dist/package.json that forces `type: commonjs`.

Development builds also include sourcemaps.
