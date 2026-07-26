---
'@tsrx/prettier-plugin': patch
---

fix: print bigint and numeric literals from their source form

Formatting a file containing a bigint literal threw `TypeError: Do not know how
to serialize a BigInt`, because every non-string literal was reprinted with
`JSON.stringify(node.value)`. Literals now print from `raw`: bigints keep their
radix (`0xffn`), and numeric literals keep their radix, digit separators, and
exponent (`0xff`, `1_000_000`, `1e21`) instead of being rewritten to their
decimal value.
