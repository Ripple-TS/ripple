---
title: Troubleshooting in Ripple
---

# Troubleshooting Common Errors

## Unterminated regular expression

While this may be caused by an actual unterminated regular expression, most of the
time, it's caused by unquoted text in a template. Static text should be written
as a direct double-quoted child; JavaScript expressions should use {braces}.

```ripple
export function TextBrace() {
  return <>
    // ✔️ valid
    <p>"Hello world!"</p>

    // ❌ invalid
    // <p>Hello world!</p>
  </>;
}
```

Read more: [Syntax](/docs/guide/syntax)

## GitHub does not highlight .tsrx files

GitHub does not currently recognize `.tsrx` files as their own language, so
source files may render without syntax highlighting. To opt into TSX highlighting
on GitHub, add this rule to your repository's `.gitattributes` file:

```gitattributes
*.tsrx linguist-language=TSX
```

This only changes how GitHub displays `.tsrx` files. It does not affect Ripple
compilation, editor support, or local tooling.

## Unexpected token `}`. Did you mean `&rbrace;` or `{"}"}`?

If you've verified that you don't have any unclosed braces and are still
encountering this, check for any usage of void elements that aren't using JSX
self-closing syntax.

```ripple
export function Bracey() {
  return <>
    // ✔️ valid
    <input />
    <img />
    <hr />
    <br />

    // ❌ invalid
    // <input>
    // <img>
    // <hr>
    // <br>
  </>;
}
```

Read more: [Syntax](/docs/guide/syntax)
