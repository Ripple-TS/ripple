# @tsrx/eslint-parser

[![npm version](https://img.shields.io/npm/v/%40tsrx%2Feslint-parser?logo=npm)](https://www.npmjs.com/package/@tsrx/eslint-parser)
[![npm downloads](https://img.shields.io/npm/dm/%40tsrx%2Feslint-parser?logo=npm&label=downloads)](https://www.npmjs.com/package/@tsrx/eslint-parser)

ESLint parser for Ripple component files. This parser enables ESLint to understand
and lint `.tsrx` files by default, while also supporting `.tsrx` files through
Ripple's built-in compiler.

## Installation

```bash
pnpm add --save-dev '@tsrx/eslint-parser' ripple
# or
npm install --save-dev '@tsrx/eslint-parser' ripple
# or
yarn add --dev '@tsrx/eslint-parser' ripple
```

**Note:** This parser requires `ripple` as a peer dependency.

## Usage

### Flat Config (ESLint 9+)

```js
// eslint.config.js
import rippleParser from '@tsrx/eslint-parser';
import ripplePlugin from '@tsrx/eslint-plugin';

export default [
  {
    files: ['**/*.{tsrx,ripple}'],
    languageOptions: {
      parser: rippleParser,
    },
    plugins: {
      ripple: ripplePlugin,
    },
    rules: {
      ...ripplePlugin.configs.recommended.rules,
    },
  },
];
```

### Legacy Config (.eslintrc)

```json
{
  "overrides": [
    {
      "files": ["*.tsrx", "*.tsrx"],
      "parser": "@tsrx/eslint-parser",
      "plugins": ["ripple"],
      "extends": ["plugin:ripple/recommended"]
    }
  ]
}
```

## How It Works

This parser uses Ripple's compiler (`ripple/compiler`) to parse Ripple component
files into an ESTree-compatible AST that ESLint can analyze. The Ripple compiler
already outputs ESTree-compliant ASTs, making integration straightforward.

The parser:

1. Loads the Ripple compiler
2. Parses the component source code (`.tsrx` or `.tsrx`)
3. Returns the ESTree AST to ESLint
4. Allows ESLint rules to analyze Ripple-specific patterns

## Supported Syntax

The parser supports all Ripple syntax including:

- `component` declarations
- `track()` reactive values (imported from `ripple`)
- `@` unboxing operator
- Reactive collections (`RippleArray`, `RippleObject`, etc.)
- JSX-like templating inside components
- All standard JavaScript/TypeScript syntax

## Example

Given a `.tsrx` file:

```ripple
import { track } from 'ripple';

export component Counter() {
  let count = track(0);

  <div>
    <button onClick={() => @count++}>Increment</button>
    <span>{@count}</span>
  </div>
}
```

The parser will successfully parse this and allow ESLint rules (like those from
`@tsrx/eslint-plugin`) to check for:

- Track calls at module scope
- Missing @ operators
- Component export requirements
- And more

## Limitations

- The parser requires Node.js runtime as it uses `require()` to load the Ripple
  compiler
- Browser-based linting is not currently supported

## Related Packages

- [@tsrx/eslint-plugin](https://www.npmjs.com/package/@tsrx/eslint-plugin) -
  ESLint rules for Ripple
- [ripple](https://ripplejs.com) - The Ripple framework
- [@ripple-ts/vite-plugin](https://www.npmjs.com/package/@ripple-ts/vite-plugin) -
  Vite plugin for Ripple
- [@tsrx/prettier-plugin](https://www.npmjs.com/package/@tsrx/prettier-plugin) -
  Prettier plugin for Ripple

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
