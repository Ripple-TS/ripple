---
'@tsrx/ripple': patch
---

Support ordinary TypeScript enums in `.tsrx` client and server output through the existing compiler visitors. Preserve lexical scope, numeric reverse mappings, string members and computed initializers, while retaining TypeScript syntax and Volar mappings for editor support. Const enums, declaration merging and enums inside runtime namespaces or class static blocks remain unsupported with actionable diagnostics.
