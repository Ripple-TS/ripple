---
'ripple': patch
'@ripple-ts/vite-plugin': patch
'@tsrx/ripple': patch
'@ripple-ts/adapter-node': patch
'@ripple-ts/adapter-bun': patch
---

feat: build shapes. `ripple({ ssr: false })` builds a client-only app: components compile without the hydration cursor or `track()` serialization hashes (`hydration: false` on the compiler), the runtime's hydration paths are compiled out through its `HYDRATION` build constant, and `hydrate()` throws; `ssr: true` compiles every module for the server. `prerender()` on `ripple/server` renders a component to static HTML with every boundary settled and the CSS as text, and a `RenderRoute` marked `prerender: true` is rendered through the built server entry at build time into `<outDir>/client<path>/index.html`, which the node and bun adapters now serve for a directory request before the server renders. The client build's `index.html` template moves to the server output so a static handler never serves its placeholders.
