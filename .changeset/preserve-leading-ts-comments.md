---
'@tsrx/core': patch
---

Re-emit preserved leading comments in typeOnly output: `@jsxImportSource`/`@jsxRuntime`/`@jsxFrag`/`@jsx` pragmas join the preserved-comment set, and the shared tsx printer now writes preserved comments that lead the program at the top of the virtual TSX. Previously comment stripping silently dropped them, retyping a file's JSX or re-enabling checking a leading `@ts-nocheck` had disabled.
