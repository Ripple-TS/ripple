---
'@ripple-ts/adapter': patch
---

Reject same-origin fetch calls whose request signal has already aborted before dispatching to the in-process handler. Cancel the request body and preserve the signal's abort reason.
