---
'@tsrx/ripple': patch
---

Strip variable definite assignment assertions from client and server JavaScript
output so declarations such as `let count!: number` compile to valid JavaScript.
