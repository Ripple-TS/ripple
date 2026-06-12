---
'@tsrx/core': patch
'@tsrx/prettier-plugin': patch
'@tsrx/ripple': patch
'@tsrx/react': patch
'@tsrx/preact': patch
'@tsrx/solid': patch
'@tsrx/vue': patch
'@tsrx/eslint-parser': patch
---

Make style scope hashes unique per style block and per file. The hash was
derived from the style block's content alone, so two `<style>` blocks with
identical CSS — in different components of the same file, or in different
files — collided and shared a scope. The hash input now includes the filename
and the line/column where the `<style>` tag starts. Because the filename may
be an absolute path, the hash also switched from the reversible djb2 hash to
the truncated SHA-256 hash so file structure can't be recovered from class
names in the shipped bundle.

The `filename` parameter of `parse`, `parseModule`, and the per-target `parse`
wrappers is now required (typed as a non-empty string), and parsing a `<style>`
element without one throws a clear error instead of silently seeding the hash
with an empty name. The prettier plugin and eslint parser pass their host's
file path through, falling back to a plugin-specific placeholder when
formatting or linting in-memory text.
