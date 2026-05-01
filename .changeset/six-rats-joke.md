---
'@ripple-ts/language-server': patch
'@tsrx/react-playground': patch
'@tsrx/solid-playground': patch
'@tsrx/vue-playground': patch
---

We will no bump up the language-server version in zed's package.json config field automatically to keep things in sync

Fixed issue with Zed to look and find the project's language-server first - useful for dev

language-server was pointing to dist but dist wasn't published, also issues with bin, etc.
