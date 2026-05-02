---
"@tsrx/core": patch
"@tsrx/ripple": patch
"@tsrx/prettier-plugin": patch
"@ripple-ts/language-server": patch
"@tsrx/mcp": patch
---

Replace Ripple `#server` blocks with proposal-aligned `module server` declarations and imports from `server`.
Preserve Volar mappings for submodule import identifiers after Ripple lowers server imports.
