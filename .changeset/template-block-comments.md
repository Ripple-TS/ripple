---
'@tsrx/core': patch
'@tsrx/prettier-plugin': patch
---

Strip `/* … */` block comments from template text on all targets. The
template raw-text scanner only recognized line comments, so block comments
in text position leaked into compiled output (production templates, server
output, and to_ts virtual code) and, in one position, were both recorded as
a comment and kept as text. Block comments are now removed from `JSXText`
and recorded as comments everywhere, and the Prettier plugin prints them
back (including before closing tags/fragments and in comment-only bodies)
instead of relying on the leaked text.
