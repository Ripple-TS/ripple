# @tsrx/eslint-parser

[![npm version](https://img.shields.io/npm/v/%40tsrx%2Feslint-parser?logo=npm)](https://www.npmjs.com/package/@tsrx/eslint-parser)
[![npm downloads](https://img.shields.io/npm/dm/%40tsrx%2Feslint-parser?logo=npm&label=downloads)](https://www.npmjs.com/package/@tsrx/eslint-parser)

ESLint parser for TSRX files. This parser enables ESLint to understand and lint
`.tsrx` files by default, using the shared TSRX parser from `@tsrx/core`.

## Installation

```bash
pnpm add --save-dev '@tsrx/eslint-parser'
# or
npm install --save-dev '@tsrx/eslint-parser'
# or
yarn add --dev '@tsrx/eslint-parser'
```

## Usage

### Flat Config (ESLint 9+)

```js
// eslint.config.js
import tsrxParser from '@tsrx/eslint-parser';
import tsrxPlugin from '@tsrx/eslint-plugin';

export default [
  {
    files: ['**/*.tsrx'],
    languageOptions: {
      parser: tsrxParser,
    },
    plugins: {
      ripple: tsrxPlugin,
    },
    rules: {
      ...tsrxPlugin.configs.recommended.rules,
    },
  },
];
```

### Legacy Config (.eslintrc)

```json
{
  "overrides": [
    {
      "files": ["*.tsrx"],
      "parser": "@tsrx/eslint-parser",
      "plugins": ["ripple"],
      "extends": ["plugin:ripple/recommended"]
    }
  ]
}
```

## How It Works

This parser uses the shared TSRX parser (`@tsrx/core`) to parse TSRX files into an
ESTree-compatible AST that ESLint can analyze.

The parser:

1. Parses the TSRX source code (`.tsrx`)
2. Normalizes the AST for ESLint traversal
3. Returns the ESTree AST to ESLint
4. Allows ESLint rules to analyze TSRX-specific patterns

## Supported Syntax

The parser supports TSRX syntax including:

- Native TSRX elements and fragments as JavaScript expressions
- Statement-based content inside returned TSRX fragments
- Function components that return TSRX, TSX, or standard JavaScript values
- `track()` reactive values (imported from `ripple`)
- `@` unboxing operator
- Reactive collections
- All standard JavaScript/TypeScript syntax

## Example

Given a `.tsrx` file:

```tsrx
import { track } from 'ripple';

export function Counter() {
  let &[count] = track(0);

  return <button onClick={() => count++}>
    {'Increment'}
    <span>{count}</span>
  </button>;
}
```

The parser will successfully parse this and allow ESLint rules (like those from
`@tsrx/eslint-plugin`) to check for:

- Track calls at module scope
- Missing @ operators
- Invalid rendering control flow
- And more

## Related Packages

- [@tsrx/eslint-plugin](https://www.npmjs.com/package/@tsrx/eslint-plugin) -
  ESLint rules for TSRX
- [@tsrx/prettier-plugin](https://www.npmjs.com/package/@tsrx/prettier-plugin) -
  Prettier plugin for TSRX

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
