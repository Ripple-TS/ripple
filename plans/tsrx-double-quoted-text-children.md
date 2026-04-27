# TSRX Double-Quoted Text Children Plan

## Issue

GitHub issue #761 asks for less noisy static text in TSRX templates. Today static
strings must be written as JavaScript expressions inside braces:

```text
<p>{'Hello world'}</p>
<p>{'Clicked '}{count}{' times'}</p>
```

The requested ergonomic improvement is to allow quoted static text directly
between template tags.

## Decision

Support only double-quoted static text children:

```text
<p>"Hello world"</p>
<p>"Clicked " {count} " times"</p>
```

Keep all JavaScript expressions inside braces:

```text
<p>{value}</p>
<p>{'single quoted JS string'}</p>
<p>{`Count: ${count}`}</p>
<p>{count > 0 ? 'Ready' : 'Waiting'}</p>
```

Rationale:

- Double quotes match JSX attribute string syntax, so the rule feels familiar.
- Single quotes remain ordinary JavaScript string syntax and avoid ambiguity with
  prose apostrophes.
- Backticks remain JavaScript template literals, which preserves interpolation as
  expression syntax.
- The parser can lower this shorthand to the existing `Text` node shape, so render
  targets reuse existing text handling.

## Implementation Slices

1. Parser support in `packages/tsrx/src/plugin.js`.
   - Recognize a double-quoted string literal in normal TSRX template child
     position.
   - Emit the existing `Text` node shape with a `Literal` expression.
   - Preserve source location/range on both the `Text` node and inner literal.
   - Do not apply this inside `<tsx>` or `<tsx:*>`, where JSX text semantics
     should remain unchanged.

2. Render-target verification.
   - Ripple client/server should reuse existing `Text` lowering and child
     normalization.
   - React, Preact, Solid, and Vue targets should reuse shared JSX transform
     behavior where applicable.
   - Confirm Solid text-content optimization still sees the parsed node as `Text`.

3. Formatting support.
   - Update the Prettier plugin to round-trip the shorthand.
   - Prefer printing eligible static text shorthand with double quotes regardless
     of the `singleQuote` option, because the feature syntax itself is
     double-quote-only.
   - Keep `{text ...}` and non-static expressions in their existing forms.

4. Tests.
   - Parser coverage for `<p>"hello"</p>` and
     `<p>"clicked " {count} " times"</p>`.
   - Escaping coverage such as `<p>"She said \"hi\""</p>`.
   - Negative or unchanged-behavior coverage for single quotes and backticks
     outside braces.
   - Ensure no behavior change inside `<tsx>` / `<tsx:*>` blocks.
   - Target output coverage for Ripple client/server plus React, Preact, Solid,
     and Vue where relevant.
   - Prettier format and round-trip coverage.

5. Documentation.
   - Update `README.md` and `packages/tsrx/README.md`.
   - Update `website/public/llms.txt` and `website-tsrx/public/llms.txt`.
   - Update TSRX website docs/features/specification pages that currently say all
     text must use braces.
   - Show direct double-quoted text for static content and braces for expressions.

## First Slice

Proceed with parser support only. Keep formatter, render-target-specific
assertions, docs, and changesets for follow-up slices after the syntax is accepted
by the core parser.
