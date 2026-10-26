---
'@tsrx/ripple': patch
---

Skip unchanged reactive DOM property assignments during unrelated template updates,
so updating a dialog's class does not close a dialog opened with `showModal()`.
