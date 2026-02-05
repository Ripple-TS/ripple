import 'vitest';
import type { render as renderSSR } from 'ripple/server';
import type { parseHTML } from 'linkedom';

declare global {
	var render: typeof renderSSR;
	var parseHtml: typeof parseHTML;
}

interface CustomMatchers<R = unknown> {
	/**
	 * Compares HTML strings after stripping hydration markers.
	 * Hydration markers are: <!--[--> <!--[!--> <!--]-->
	 */
	toBeHtml(expected: string): R;
}

declare module 'vitest' {
	interface Assertion<T = any> extends CustomMatchers<T> {}
	interface AsymmetricMatchersContaining extends CustomMatchers {}
}
