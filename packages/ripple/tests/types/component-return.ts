// Compile-only assertions for `Component`'s return type. `mount`, `hydrate`,
// and the server `render` all take a `Component`, so this type decides which
// components typecheck at their call sites. The accepted values below are the
// ones both runtimes render (see `render_value` in
// src/runtime/internal/client/expression.js and `render_expression` in
// src/runtime/internal/server/index.js); the rejected ones fall through to
// stringification or throw.
import type { Component } from 'ripple';

const returns_nothing: Component = () => {};
const returns_string: Component = () => 'text';
const returns_number: Component = () => 42;
const returns_bigint: Component = () => 1n;
const returns_boolean: Component = () => true;
const returns_null: Component = () => null;
const returns_undefined: Component = () => undefined;
const returns_array: Component = () => ['text', 42, null, ['nested']];

// A component that only sometimes returns early still has to typecheck.
const returns_union: Component<{ ready: boolean }> = (props) => {
	if (!props.ready) {
		return 'Waiting';
	}
};

// @ts-expect-error promises are not awaited by either runtime
const returns_promise: Component = async () => 'text';

// @ts-expect-error a function is stringified, not called
const returns_function: Component = () => () => 'text';

// @ts-expect-error the client throws on `symbol + ''`
const returns_symbol: Component = () => Symbol('nope');

export type {};

void returns_nothing;
void returns_string;
void returns_number;
void returns_bigint;
void returns_boolean;
void returns_null;
void returns_undefined;
void returns_array;
void returns_union;
void returns_promise;
void returns_function;
void returns_symbol;
