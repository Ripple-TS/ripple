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

## Custom serialization

Define `transport` in `ripple.config.ts` to share custom types between the server
and browser. The same handlers serialize `trackAsync` hydration results and RPC
arguments/results in both directions:

```ts
import { defineConfig } from '@ripple-ts/vite-plugin';
import { Money } from './src/money';

export default defineConfig({
  transport: {
    Money: {
      encode: (value) => value instanceof Money && [value.amount, value.currency],
      decode: ([amount, currency]) => new Money(amount, currency),
    },
  },
});
```

Handlers are synchronous and must run in both environments, so their imports must
be browser compatible. `encode` returns truthy serializable data when it
recognizes a value, or `false`/`undefined` otherwise. Wrap falsy encoded data in
an array or object. `decode` reconstructs the value from that data. Encoders can
also recognize plain objects by shape.

Without a transport, or with `transport: {}`, plain data in hydration payloads
travels as raw JSON; values requiring devalue retain its built-in encoding. A
nonempty transport uses devalue for all hydration payloads so every value can be
offered to the encoders. RPC always uses devalue. The plugin registers the
transport automatically before rendering, hydration, and RPC handling.
