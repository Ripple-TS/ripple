---
'@tsrx/prettier-plugin': patch
---

Treat rendered JSX text as whitespace-significant so formatting never changes
the program. TSRX compilers keep a rendered text child's parsed value verbatim
(only whitespace-only runs containing a newline are dropped), but the printer
used to re-wrap element bodies purely by print width — collapsing
`<Item>\n\tKangaroo\n</Item>` to `<Item>Kangaroo</Item>`, splitting inline
text onto new lines, re-indenting multi-line text, and collapsing repeated
spaces — all of which changed the rendered textContent. Rendered text is now
reproduced byte-for-byte: boundaries that touch text are frozen, and layout
only changes at seams the tokenizer already treats as elastic (dropped
whitespace-only runs and skipped runs after closing tags), where re-wrapping
cannot affect the parsed text. Comments authored inside a text run are now
printed from the run's raw source slice so reprinting them no longer inserts
extra lines into the text.
