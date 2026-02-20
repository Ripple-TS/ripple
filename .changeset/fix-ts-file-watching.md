---
'@ripple-ts/language-server': patch
---

Fix language server not recognizing changes to `.ts` files

The language server now watches TypeScript and JavaScript files for changes on
disk. Previously, modifications to `.ts` files imported by `.ripple` files would
not be picked up by the language server until it was restarted, causing stale
diagnostics. This was because the `workspace/didChangeWatchedFiles` connection
handler was never registered (it requires calling
`server.fileWatcher.watchFiles()`). The fix adds explicit file watcher
registration for all TypeScript/JavaScript file extensions in the server's
`onInitialized` callback.
