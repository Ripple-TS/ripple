---
'@tsrx/prettier-plugin': patch
---

Keep trailing comments on `{expr}` template children. The JSX printers build
the `{ … }` form inline and only emitted the container's leading comments, so
a trailing comment on the same line (`{q} // hey`) was dropped from the
formatted output. Trailing line and block comments now print after the
closing `}`, staying on the child's line.
