---
'ripple': patch
'@tsrx/ripple': patch
---

Build a template that is one element with static attributes and at most a text child with DOM calls instead of parsing it. Parsing a `<template>` has a fixed cost that dwarfs such an element, and an app's first render pays it once per distinct template; a chain of 100 single-element components mounts about 35% faster.
