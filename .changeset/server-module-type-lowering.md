---
'@tsrx/core': patch
---

Add an opt-in `platform.serverModule` descriptor to `createJsxTransform`: in typeOnly output, a platform's file-local `module <blockName> { … }` server-module dialect and its boundary `import { x } from '<importSpecifier>'` statements are lowered to plain checkable TS (block imports hoisted, the block lowered to a namespace keeping the authored name, boundary imports lowered to destructures / `type` aliases, colliding hoisted locals aliased through a mangled namespace import). Verbatim, the dialect can never typecheck (TS1147 in-block import, TS2307 boundary import). Platforms without the option, and all runtime/build output, are untouched. The namespace references derived from the authored `'server'` specifier map its inner span with hover/navigation but WITHOUT semantic tokens, so the specifier keeps its string syntax highlighting instead of being partially repainted as a namespace token.
