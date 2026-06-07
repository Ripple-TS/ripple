---
"@tsrx/typescript-plugin": patch
"@ripple-ts/language-server": patch
---

Fix compile-error diagnostics collapsing to the top of the file when the error range has no exact mapping. Statements and elements are only covered by granular token mappings (keywords/punctuation are dropped), so a whole-statement range never matched the exact `findMappingBySourceRange` lookup and the Volar source map could not anchor an unmapped start offset. The virtual code now resolves such ranges by spanning the token mappings that overlap them, so diagnostics land on the right source line.
