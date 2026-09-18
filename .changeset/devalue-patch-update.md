---
'ripple': patch
'@ripple-ts/vite-plugin': patch
---

Update devalue to 5.9.4 and refresh the patched `stringify` fast paths to the current state of sveltejs/devalue#190: error paths are recorded without per-entry work, Map entries no longer allocate, quoted property names are cached, and the `tagOf` shortcut is gone.
