# @tsrx/eslint-plugin

[![npm version](https://img.shields.io/npm/v/%40tsrx%2Feslint-plugin?logo=npm)](https://www.npmjs.com/package/@tsrx/eslint-plugin)
[![npm downloads](https://img.shields.io/npm/dm/%40tsrx%2Feslint-plugin?logo=npm&label=downloads)](https://www.npmjs.com/package/@tsrx/eslint-plugin)

ESLint plugin for [Ripple](https://ripplejs.com) - helps enforce best practices
and catch common mistakes when writing Ripple applications.

Works just like `eslint-plugin-react` - simply install and use the recommended
config!

## Installation

```bash
npm install --save-dev '@tsrx/eslint-plugin'
# or
yarn add --dev '@tsrx/eslint-plugin'
# or
pnpm add --save-dev '@tsrx/eslint-plugin'
```

## Usage

### Flat Config (ESLint 9+)

```js
// eslint.config.js
import ripple from '@tsrx/eslint-plugin';

export default [...ripple.configs.recommended];
```

The plugin automatically:

- Detects and uses `@tsrx/eslint-parser` if installed for `.tsrx` files
- Detects and uses `@typescript-eslint/parser` if installed for `.ts`/`.tsx` files
- Excludes `.d.ts` files, `node_modules`, `dist`, and `build` directories from
  linting
- Works with `.ts`, `.tsx`, and `.tsrx` files

### Legacy Config (.eslintrc)

```json
{
  "plugins": ["ripple"],
  "extends": ["plugin:ripple/recommended"]
}
```

## Configurations

### `recommended`

The recommended configuration enables all rules at their default severity levels
(errors and warnings).

```js
import ripple from '@tsrx/eslint-plugin';

export default [
  {
    plugins: { ripple },
    rules: ripple.configs.recommended.rules,
  },
];
```

### `strict`

The strict configuration enables all rules as errors.

```js
import ripple from '@tsrx/eslint-plugin';

export default [
  {
    plugins: { ripple },
    rules: ripple.configs.strict.rules,
  },
];
```

## Rules

### `ripple/no-module-scope-track` (error)

Prevents calling `track()` at module scope. Tracked values must be created inside
a function body.

❌ **Incorrect:**

```js
import { track } from 'ripple';

// This will cause runtime errors
let globalCount = track(0);

export function App() {
  return <div>{globalCount}</div>;
}
```

✅ **Correct:**

```js
import { track } from 'ripple';

export function App() {
  let count = track(0);

  return <div>{count}</div>;
}
```

### `ripple/prefer-oninput` (warning, fixable)

Recommends using `onInput` instead of `onChange` for form inputs. Unlike React,
Ripple doesn't have synthetic events, so `onInput` is the correct event handler.

❌ **Incorrect:**

```jsx
<input onChange={handleChange} />
```

✅ **Correct:**

```jsx
<input onInput={handleInput} />
```

This rule is auto-fixable with `--fix`.

### `ripple/control-flow-jsx` (error)

Checks template control flow inside functions that return native TSRX. `@for`
blocks should render template output, while ordinary `for...of` loops inside
`effect()` callbacks should not render JSX.

### `ripple/no-lazy-destructuring-in-modules` (error)

Prevents using lazy destructuring (`&[]` / `&{}`) in TypeScript/JavaScript
modules. In `.ts`/`.js` files, you should use `.value` to read and write tracked
values instead.

❌ **Incorrect:**

```ts
// count.ts
import { track, effect } from 'ripple';

export function useCount() {
  const &[count] = track(1);
  effect(() => {
    console.log(count); // Error: Cannot use &[] in TypeScript modules
  });
  return { count };
}
```

✅ **Correct:**

```ts
// count.ts
import { track, effect } from 'ripple';

export function useCount() {
  const count = track(1);

  // Use .value to read tracked values
  const double = track(() => count.value * 2);

  effect(() => {
    console.log('count is', count.value);
  });

  return { count, double };
}
```

**Note:** Lazy destructuring (`&[]` / `&{}`) is only valid in TSRX files. In
TypeScript modules, use `.value` to read and write tracked values.

### `ripple/no-return-in-component` (deprecated)

This compatibility rule is now a no-op. TSRX components are ordinary functions, so
returning native TSRX is the expected authoring style.

## Custom Configuration

You can customize individual rules in your ESLint config:

```js
export default [
  {
    plugins: { ripple },
    rules: {
      'ripple/no-module-scope-track': 'error',
      'ripple/prefer-oninput': 'error', // Make this an error instead of warning
      'ripple/control-flow-jsx': 'error',
      'ripple/no-lazy-destructuring-in-modules': 'error',
      'ripple/valid-for-of-key': 'error',
    },
  },
];
```

The plugin will automatically detect and use the Ripple parser for `.tsrx` files.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Related

- [Ripple](https://ripplejs.com) - The Ripple framework
- [@ripple-ts/vite-plugin](https://www.npmjs.com/package/@ripple-ts/vite-plugin) -
  Vite plugin for Ripple
- [@tsrx/prettier-plugin](https://www.npmjs.com/package/@tsrx/prettier-plugin) -
  Prettier plugin for Ripple
