// Ported from TanStack/react-router at da2adec76dbe6c0da6d6a0d5640f7b9388217f45; see NOTICE.
import { expectTypeOf, test } from 'vitest';
import { createRootRoute, createRouter } from '@ripple-ts/tanstack-router';
import type { ErrorComponentProps } from '@ripple-ts/tanstack-router';

test('only boundary errors default to unknown', () => {
	expectTypeOf<ErrorComponentProps['error']>().toEqualTypeOf<unknown>();
	expectTypeOf<ErrorComponentProps<Error>['error']>().toEqualTypeOf<Error>();
	const routeTree = createRootRoute({
		errorComponent: ({ error }) => {
			expectTypeOf(error).toEqualTypeOf<unknown>();
			// @ts-expect-error Arbitrary thrown values require narrowing.
			error.message;
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
			// @ts-expect-error Arbitrary thrown values require narrowing.
			error.message;
			return null;
		},
		defaultOnCatch: (error) => {
			expectTypeOf(error).toEqualTypeOf<unknown>();
		},
	});
});
