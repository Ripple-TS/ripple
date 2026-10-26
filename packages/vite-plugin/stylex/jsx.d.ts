import type { StyleXStyles } from '@stylexjs/stylex';
import type {} from 'ripple/jsx-runtime';

declare module 'ripple/jsx-runtime' {
	namespace Ripple {
		interface HTMLAttributes<Target extends globalThis.Element = globalThis.HTMLElement> {
			sx?: StyleXStyles;
		}

		interface SVGAttributes<Target extends globalThis.SVGElement = globalThis.SVGElement> {
			sx?: StyleXStyles;
		}
	}
}
