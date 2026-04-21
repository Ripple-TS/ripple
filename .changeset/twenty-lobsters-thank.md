---
'ripple': patch
'@tsrx/ripple': patch
---
Add SSR-to-client serialization/hydration for trackAsync by emitting per-call JSON <script> envelopes (resolved payload + direct dependency hashes, or sanitized error message) and consuming/removing them during client hydration to avoid re-running the user async function.
Add proper error handling routing to catch blocks with actual error messages in DEV and safe production error messages, all with correct hydration support
