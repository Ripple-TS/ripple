---
'@ripple-ts/vite-plugin': patch
'@tsrx/ripple': patch
---

Add a lightweight `@ripple-ts/vite-plugin/config` entry exporting `defineConfig`, `RenderRoute`, and `ServerRoute`, so production servers that read `ripple.config.ts` don't pull in the plugin. Mark `@tsrx/ripple` as side-effect free so bundlers can drop the unused compiler.
