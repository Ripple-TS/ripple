---
'@tsrx/prettier-plugin': patch
---

Keep comments attached to their TypeScript type arguments. `TSTypeReference` printed `<...>` type arguments as a flat comma join, which jammed a param's leading and trailing comments together inline (in reversed order) and needed two passes to converge. Type arguments now print through `printTSTypeParameterInstantiation`, so the list breaks like standard prettier: trailing comments stay on their param's line, own-line leading comments stay above their param, and a lone object-type argument still hugs the angle brackets (`Foo<{ ... }>`).
