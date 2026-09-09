# @ripple-ts/vite-plugin

```js
import { ripple } from '@ripple-ts/vite-plugin';

export default {
  plugins: [ripple()],
};
```

## Optional TypeScript text inference

To use the TypeScript checker to recognize primitive DOM children from imported
types and function return types, enable `textTypes`:

```js
ripple({ textTypes: { tsconfig: 'tsconfig.json' } });
```

The tsconfig path resolves from Vite's project root. Install TypeScript 5.9.3 or
newer and enable `strictNullChecks`. The option applies only to one-shot
production builds. Development servers, HMR, and watched builds use local syntax
inference.

Ripple's automatic client/server build shares one checker snapshot and fails if
its inputs change during the build. Independently invoked client and server builds
must use the same option, tsconfig, and stable source tree. Each fresh build
reevaluates imported types and recompiles eligible cached modules.

See [`@tsrx/ripple`](../tsrx-ripple/README.md#primitive-text-inference) for the
inference boundaries and the direct compiler API.
