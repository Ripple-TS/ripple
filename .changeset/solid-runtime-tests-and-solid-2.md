---
'@tsrx/solid': patch
'@tsrx/vite-plugin-solid': patch
---

Target Solid 2.0 beta. The Solid transform now emits `<Errored>` / `<Loading>`
instead of `<ErrorBoundary>` / `<Suspense>` (renamed in Solid 2.0 core). The
Vite plugin re-anchors virtual `.tsrx.tsx` ids when the host bundler strips the
workspace root (e.g. Vitest test entries). A new `tsrx-solid-runtime` Vitest
project runs Solid components end-to-end in jsdom, mirroring the existing React
runtime test matrix.
