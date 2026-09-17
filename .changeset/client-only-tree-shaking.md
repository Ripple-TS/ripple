---
'ripple': patch
'@tsrx/ripple': patch
'@ripple-ts/vite-plugin': patch
---

perf: a `class` expression the compiler can prove to be a string writes through a string-only `set_class`, so the clsx-style joiner ships only with a bundle that composes classes from arrays or objects; templates in the SVG or MathML namespace parse through a `template_ns` entry that an HTML-only bundle never loads; and the class joiner is one module shared by the client and server renderers, so `ripple` no longer depends on `clsx`. `ripple({ rootBoundary: false })` builds an app that renders without the default root try/pending/catch boundary and leaves the boundary runtime out of the bundle; a `rootBoundary` option on `mount()` or `hydrate()` then throws. The `ripple` package declares `sideEffects: false`, and dynamic attribute, style and spread helpers live in their own runtime module, so a bundle that never sets an attribute dynamically drops them along with the attribute tables they consult. The plugin's `ssr: false` and `rootBoundary: false` rewrite the runtime's build-constant imports to literals at transform time, which every bundler folds while tree-shaking.
