// Ported from TanStack/solid-router at da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { expectTypeOf, test } from 'vitest';
import { createRootRoute, createRouter } from '@ripple-ts/tanstack-router';
import type { ErrorComponentProps } from '@ripple-ts/tanstack-router';

test('Ripple boundary errors preserve unknown thrown values', () => {
	expectTypeOf<ErrorComponentProps['error']>().toEqualTypeOf<unknown>();
	expectTypeOf<ErrorComponentProps<unknown>['error']>().toEqualTypeOf<unknown>();
	// Ripple uses native @try boundaries; route callbacks retain these types.
	const routeTree = createRootRoute({
		errorComponent: ({ error }) => {
			expectTypeOf(error).toEqualTypeOf<unknown>();
			return null;
		},
		onCatch: (error) => {
			expectTypeOf(error).toEqualTypeOf<unknown>();
		},
		onError: (error) => {
			expectTypeOf(error).toBeAny();
		},
	});
	createRouter({
		routeTree,
		defaultErrorComponent: ({ error }) => {
			expectTypeOf(error).toEqualTypeOf<unknown>();
			return null;
		},
		defaultOnCatch: (error) => {
			expectTypeOf(error).toEqualTypeOf<unknown>();
		},
	});
});
