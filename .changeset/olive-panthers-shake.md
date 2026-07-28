---
'@tsrx/typescript-plugin': patch
'@ripple-ts/vscode-plugin': patch
---

fix: detect the published Octane compiler under `dist/`, and rename `RIPPLE_DEBUG` to `TSRX_DEBUG`

Automatic compiler detection only probed `octane/src/compiler/volar.js`, a path
that published `octane` releases do not ship — they contain `dist/` and expose
the compiler as `octane/compiler/volar`. Every `.tsrx` file in an Octane project
therefore reported `Ripple compiler not found` and was parsed as plain
TypeScript unless the project declared `"tsrx": { "compiler": "octane/compiler/volar" }`
by hand.

Candidates can now list several entry paths, and Octane probes
`dist/compiler/volar.js` first, falling back to `src/compiler/volar.js` for
source checkouts.

The debug logging environment variable is now `TSRX_DEBUG` instead of
`RIPPLE_DEBUG`. The old name is no longer read, so anything that sets it —
scripts, launch configs, CI — needs updating to keep verbose language-tooling
logs.
