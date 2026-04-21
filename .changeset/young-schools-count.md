---
"@tsrx/react": patch
---

Fix React `for` loop key generation in compiled output:

- Ensure hook-extracted loop wrapper components receive a `key` when using `for (...; index index)` and no explicit key is provided.
- Ensure non-hook loop item elements also receive an implicit `key={index}` fallback in the same indexed-loop scenario.
- Add regression tests covering both hook and non-hook conditional loop paths.
