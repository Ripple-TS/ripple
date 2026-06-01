# TSRX Style Props CSS Variables RFP

## Summary

Add first-class TSRX support for props on `<style>` elements. These props compile
to CSS custom properties and are connected to runtime reactivity through each TSRX
target's native effect system.

This keeps `<style>` blocks static, preserves existing scoped CSS behavior, and
gives authors a familiar way to pass tracked values into styles without allowing
JavaScript interpolation inside CSS.

## Background

Today, TSRX `<style>` blocks are static CSS. Dynamic styling is handled manually
by setting CSS custom properties on elements and reading them with `var(...)`.

```tsx
function Button({ color }: { color: string }) {
  return <>
    <button class="button">"Save"</button>
    <style>
      .button {
        color: var(--button-color);
      }
    </style>
  </>;
}
```

This proposal formalizes that existing pattern at the stylesheet level:

```tsx
function Button({ color }: { color: string }) {
  return <>
    <button class="button">"Save"</button>
    <style {color}>
      .button {
        color: var(--color);
      }
    </style>
  </>;
}
```

The compiler rewrites the stylesheet to use generated TSRX-managed CSS variables,
while the target runtime keeps those variables updated when the corresponding
values change.

## Goals

- Support reactive style values without allowing JavaScript expressions inside
  CSS.
- Keep container element behavior separate from stylesheet behavior.
- Preserve existing TSRX scoped style semantics.
- Support the same authoring model across React, Preact, Solid, Ripple, and future
  TSRX targets.
- Allow defaults to come from explicit style props, existing stylesheet custom
  properties, CSS `var()` fallbacks, or `initial`.
- Allow scoped and global custom property patterns to continue working.

## Non-Goals

- Automatic container element generation.
- JavaScript interpolation inside `<style>` blocks.
- Full per-component-instance CSS variable isolation unless a target proposes a
  container strategy.
- Replacing existing inline `style={{ '--x': value }}` support.

## Proposed Syntax

All of the following forms should be supported:

```tsx
<style
  {color}
  color={value}
  --color={value}
  color={[value, 'red']}
  --color={[value, 'red']}
>
  .button {
    color: var(--color);
  }
</style>
```

Normalization rules:

- `{color}` is shorthand for `color={color}`.
- `color={value}` maps to CSS custom property `--color`.
- `--color={value}` is accepted as convenience syntax and normalizes to
  `color={value}` before target output.
- Tuple values use `[runtimeValue, defaultCssValue]`.
- `color` and `--color` are aliases. If both are provided on the same `<style>`
  element, source order decides and the last one wins.
- Known native `<style>` attributes such as `id`, `type`, `media`, `nonce`,
  `title`, `blocking`, `disabled`, and similar attributes are not transformed into
  CSS variables.

The `--`-prefixed form exists for author convenience because users are thinking in
CSS custom property names, while target framework component props are easier to
generate and consume as ordinary prop names.

```tsx
<style --color={themeColor} border={cssBorder}>
  .test {
    color: var(--color);
    border: var(--border);
  }
</style>
```

Compiles conceptually as if the author had written:

```tsx
<CssProps __hash="1ikjjlr" color={themeColor} border={cssBorder} />
```

Duplicate aliases use source order:

```tsx
<style color={baseColor} --color={themeColor}>
```

The effective prop is `color={themeColor}`.

## CSS Transform

For each style prop, the compiler generates a unique managed CSS custom property:

```css
--tsrx-<style-hash>-<prop-name>
```

Given:

```tsx
<style
  --color={[color, 'red']}
  {font}
  --global-margin={margin}
  {padding}
  border={cssBorder}
  radius={radius}
  shadow={shadow}
>
  :root {
    --global-margin: 6px;
    --fallback-shadow: 0 1px 2px rgb(0 0 0 / 0.2);
  }

  .test {
    color: var(--color);
    padding: var(--padding, var(--space-3, 12px));
    border: var(--border, 1px solid grey);
    border-radius: var(--radius, 4px);
    box-shadow: var(--shadow, var(--fallback-shadow));
    --font: 12px;
  }

  .test :global(button) {
    color: var(--color);
  }
</style>
```

The compiler should produce CSS equivalent to:

```css
<style id="style-tsrx-1ikjjlr">
  :root {
    --ripple-1ikjjlr-global-margin: 6px;
    --global-margin: var(--tsrx-1ikjjlr-global-margin, 6px);
    --fallback-shadow: 0 1px 2px rgb(0 0 0 / 0.2);
  }

  .test {
    color: var(--tsrx-1ikjjlr-color, --color);
    padding: var(--tsrx-1ikjjlr-padding, var(--space-3, 12px));
    border: var(--tsrx-1ikjjlr-border, var(--border, 1px solid grey));
    border-radius: var(--tsrx-1ikjjlr-radius, var(--radius, 4px));
    box-shadow: var(--tsrx-1ikjjlr-shadow, var(--shadow, var(--fallback-shadow)));
    --font: var(--tsrx-1ikjjlr-font, 12px);
  }

  .test :global(button) {
    color: var(--tsrx-1ikjjlr-color, var(--color));
  }
</style>
```

Default and runtime precedence:

1. Runtime value from the style prop, such as the current value of `color` in
   `--color={[color, 'red']}`.
2. Explicit tuple default, such as the `'red'` in `--color={[color, 'red']}`.
3. Matching custom property declaration in the stylesheet, such as `--font: 12px`.
4. Matching `var()` fallback, such as `var(--border, 1px solid grey)` or
   `var(--padding, var(--space-3, 12px))`.
5. `initial`.

If a prop default and a stylesheet default both exist, the prop default wins. This
makes the prop declaration the highest-priority static fallback while still
allowing stylesheet defaults to apply when the prop does not provide one. Authors
can opt into a stylesheet-driven fallback from the prop default by writing that
chain directly, for example `color={[color, 'var(--theme-color, red)']}`.

For each style prop:

- Matching custom property declarations have their values set to the TSRX-managed
  custom property.
- Matching non-declaration `var(--custom-prop)` usages are replaced by the
  TSRX-managed custom property.
- A generated default declaration is inserted into an appropriate stylesheet root
  so static CSS has a useful value before runtime effects run.

## Runtime Contract

Each TSRX platform should receive a small target-specific helper that maps the
original `<style>` prop names to generated CSS variable names.

For React, this can be implemented with `useEffect`. Other targets should use
their equivalent effect and cleanup APIs. For illustration, a generated React
helper can bake the stylesheet id into the variable prefix while still receiving
the same props the author wrote on `<style>`.

```tsx
function CssVarEffect({ name, value }: { name: CssVarName; value: CssVarValue }) {
  useEffect(() => {
    if (value == null || value === '') {
      document.documentElement.style.removeProperty(name);
      return;
    }

    var root_rule;
    var sheet = document.getElementById('theme-b').sheet;
    var rules = sheet?.cssRules ?? [];
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      if (rule.selectorText === ':root') {
        root_rule = rule;
        break;
      }
    }

    if (!root_rule) {
      sheet.insertRule(':root {}', rules.length);
    }
    root_rule.style.setProperty(name, value);

    return () => {
      root_rule.style.style.removeProperty(name);
    };
  }, [name, value]);

  return null;
}

function CssProps({
  __hash,
  ...props
}: {
  __hash: string;
  props: Record<string, CssVarValue>;
}) {
  return (
    <>
      {Object.entries(props).map(([propName, value]) => {
        const cssVarName = `--tsrx-${__hash}-${propName}` as CssVarName;

        return (
          <CssVarEffect
            id={`style-tsrx-${has}`}
            key={cssVarName}
            name={cssVarName}
            value={value}
          />
        );
      })}
    </>
  );
}
```

The author writes style prop names using either the regular form or the
CSS-custom-property-like `--` form:

```tsx
<style --color={color} border={cssBorder}>
  .test {
    color: var(--color);
    border: var(--border, 1px solid grey);
  }
</style>
```

The target output should preserve the same logical prop names when calling the
runtime helper. `--color` is normalized to `color` before this point:

```tsx
<CssProps color={color} border={cssBorder} />
```

`CssProps` then derives the generated CSS variable name for each prop. In other
words, `color={color}` remains the prop payload, and the helper maps `color` to
`--tsrx-1ikjjlr-color` before calling `style.setProperty(...)`.

Runtime behavior:

- On mount or value change, derive the generated variable name for each prop and
  set it on `document.documentElement.style`.
- On cleanup, remove the generated variable.
- `null` or `undefined` should remove the runtime override and allow the
  stylesheet default to apply again.
- Server output should rely on compiled stylesheet defaults and avoid DOM effects.

## Implementation Scope

The implementation should include:

- Parser/compiler support for props on TSRX `<style>` elements.
- CSS analysis for matching custom property declarations and `var()` usages.
- Generated managed variable names that are deterministic and collision resistant.
- Target-specific runtime helpers for supported TSRX platforms.
- Diagnostics for invalid style prop names, unsupported tuple shapes, and
  ambiguous defaults.
- Tests for shorthand, longhand, `--name`, defaults, native style attributes,
  nested `var()` fallback defaults, scoped CSS, `:global()`, SSR output, cleanup,
  and reactive updates.

## Open Questions

- Should multiple mounted instances of the same compiled style share root-level
  managed variables, or should instance isolation be required?
- Should tuple defaults be limited to static string and number literals so they
  can always be emitted into CSS?
- If multiple stylesheet defaults exist for the same prop, should TSRX use first
  match, last match, or emit a diagnostic?
- Should generated declarations always be inserted into `:root`, or should inline
  scoped `<style>` blocks receive a component-scope root when available?

## Expected Wins

- Simple, familiar prop syntax for connecting tracked variables to stylesheet
  values.
- Static CSS remains the source of truth for selectors, scoping, and fallback
  behavior.
- Custom property declarations can live at any selector level, allowing users to
  create scoped custom props.
- `:global()` remains available when authors intentionally want to affect child
  components or global descendants.
- Standalone classes with scoped custom properties can still be passed to children
  through style expression class maps.
- Tracked variables connected to the stylesheet can be passed to children and
  mutated, affecting parent styling or child-owned styling depending on the chosen
  data flow.

## First Slice

Proceed with compiler and CSS transform support for one target first, preferably
React because the effect behavior is easy to model and verify. Keep container
element strategy, formatter changes, and cross-target runtime helpers for
follow-up slices after the core transform semantics are accepted.
