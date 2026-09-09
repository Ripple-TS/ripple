# @tsrx/ripple

Ripple's compiler target for the published `@tsrx/core` language infrastructure.
Use `compile(source, filename, options)` to produce client or server JavaScript.

## Primitive text inference

Ripple uses direct text updates for locally proven primitives, including typed
local values, primitive operators, template strings, and unshadowed `String()`,
`Number()`, `Boolean()`, `BigInt()`, and `Date()` calls. Sequences use the last
expression's type while preserving evaluation of earlier expressions. Constructor
calls such as `new Date()` remain object values. Visible replacements of built-ins
disable their inferred conversion behavior; explicit `as string` keeps its
existing text behavior.

For imported types, aliases, function return types, and control-flow narrowing,
Vite applications can enable
`ripple({ textTypes: { tsconfig: 'tsconfig.json' } })`. The plugin manages the
checker automatically; see the
[Vite plugin guide](../vite-plugin/README.md#optional-typescript-text-inference).

### Direct Compiler Usage

The following example is for custom compiler integrations. Use the Node-only
`@tsrx/ripple/typescript` entry point to manage TypeScript analysis yourself.
Install TypeScript 5.9.3 or newer and enable `strictNullChecks` in the project.
The ordinary compiler entry point does not load TypeScript.

```js
import { compile } from '@tsrx/ripple';
import { createTextTypeProject as create_text_type_project } from '@tsrx/ripple/typescript';
import { readFileSync as read_file_sync } from 'node:fs';
import { resolve } from 'node:path';

const filename = resolve('src/App.tsrx');
const source = read_file_sync(filename, 'utf8');
const project = create_text_type_project({ tsconfig: 'tsconfig.json' });
try {
  const text_type_facts = project.getTextTypeFacts(filename, source);
  const client = compile(source, filename, { textTypeFacts: text_type_facts });
  const server = compile(source, filename, {
    mode: 'server',
    textTypeFacts: text_type_facts,
  });
  project.assertUnchanged();
} finally {
  project.dispose();
}
```

Checker proofs cover primitive strings, numbers, bigints, and unions of those
types. Unknown, nullable, boxed, object, and unresolved types retain local
inference. The checker enables `noUncheckedIndexedAccess` so potentially missing
entries do not become non-null text proofs. Ambiguous source mappings are skipped.

Facts are serializable and tied to the exact filename and source version. Supply
identical facts to client and server compilation: text classification affects
hydration layout. Each project caches a filesystem snapshot without watchers. Call
`invalidate()` after edits to reload the configuration and all imported types;
recompile affected components even when their own source did not change.
`assertUnchanged()` detects edits to files read by the current snapshot.

The Vite plugin manages this lifecycle through its `textTypes` option.
