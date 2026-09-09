---
'ripple': patch
'@ripple-ts/vite-plugin': patch
---

Add custom serialization for trackAsync hydration and RPC arguments/results using
`transport` handlers in ripple.config.ts. Register matching encoders and decoders
automatically in development and production, and expose `setTransport` for custom
integrations. Apps without a transport retain the plain JSON hydration fast path.
Provide a browser entry for config helpers so importing defineConfig does not
load the Vite plugin's Node.js dependencies during hydration.
Remove unused transport wiring from client builds and avoid double-encoding
configured hydration payloads.
