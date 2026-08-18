# `@tsrx/runtime`

Renderer-neutral runtime helpers used by TSRX compiled output. This package is
intentionally independent of `@tsrx/core`.

Most applications do not install it directly. Renderer runtime packages depend on
it and expose the helpers their compiled output needs.

Available subpaths:

- `@tsrx/runtime/ref`
- `@tsrx/runtime/iterable`
- `@tsrx/runtime/language-helpers`
