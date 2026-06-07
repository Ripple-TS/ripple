---
"@tsrx/core": patch
---

Fix line-tracking desync when a code-block setup statement following a render node is mis-read as JSX text. Re-reading the statement now rewinds the line counter along with the position, so node `loc` lines stay correct and source-map mapping no longer crashes ("Location line ... out of bounds") for blocks without a trailing newline.
