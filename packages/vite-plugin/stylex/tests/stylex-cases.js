// Each case crosses both compiler passes, rather than exercising StyleX alone.
export const stylex_cases = [
	{
		name: 'pseudo classes, pseudo elements, media, supports, and container queries',
		style: `{
  color: { default: 'red', ':hover': 'blue', '@media (min-width: 800px)': 'green' },
  content: { default: null, '::before': '"hello"' },
  display: { default: 'block', '@supports (display: grid)': 'grid' },
  padding: { default: 4, '@container (min-width: 300px)': 12 },
}`,
		css: [/:hover/, /:before/, /@media/, /@supports/, /@container/, /padding:\s*12px/],
	},
	{
		name: 'keyframes',
		setup: `const animation = stylex.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });`,
		style: `{ animationName: animation, animationDuration: '2s' }`,
		css: [/@keyframes/, /animation-name:/, /animation-duration:\s*2s/],
	},
	{
		name: 'viewTransitionClass',
		setup: `const transition = stylex.viewTransitionClass({
  group: { animationDuration: '3s' }, imagePair: { isolation: 'isolate' },
  old: { opacity: 0 }, new: { opacity: 1 },
});`,
		style: `{ viewTransitionClass: transition }`,
		css: [
			/::view-transition-group/,
			/::view-transition-image-pair/,
			/::view-transition-old/,
			/::view-transition-new/,
		],
	},
	{
		name: 'positionTry',
		setup: `const fallback = stylex.positionTry({ positionArea: 'top', width: '123px' });`,
		style: `{ positionTryFallbacks: fallback }`,
		css: [/@position-try/, /position-try-fallbacks:/, /width:\s*123px/],
	},
	{
		name: 'firstThatWorks',
		options: { lightningcssOptions: { targets: { safari: 9 << 16 } } },
		style: `{ position: stylex.firstThatWorks('sticky', '-webkit-sticky', 'fixed') }`,
		css: [/position:\s*-webkit-sticky;\s*position:\s*sticky/],
	},
	{
		name: 'defineConsts across modules',
		setup: `import { breakpoints } from './constants.stylex';`,
		files: {
			'constants.stylex.ts': `import * as stylex from '@stylexjs/stylex';
export const breakpoints = stylex.defineConsts({ wide: '@media (min-width: 900px)', layer: '1234' });`,
		},
		style: `{ zIndex: breakpoints.layer, color: { default: 'red', [breakpoints.wide]: 'blue' } }`,
		css: [/z-index:\s*1234/, /@media[^{}]*900px/],
	},
	{
		name: 'defineVars, createTheme, and conditional theme values',
		setup: `import { colors } from './colors.stylex';
const theme = stylex.createTheme(colors, { accent: { default: 'purple', '@media (prefers-color-scheme: dark)': 'pink' } });`,
		files: {
			'colors.stylex.ts': `import * as stylex from '@stylexjs/stylex';
export const colors = stylex.defineVars({ accent: 'orange' });`,
		},
		style: `{ color: colors.accent }`,
		attrs: 'theme, styles.root',
		css: [/:root/, /var\(--/, /prefers-color-scheme:\s*dark/, /purple/, /pink/],
	},
	...['ancestor', 'descendant', 'anySibling', 'siblingBefore', 'siblingAfter'].map((selector) => ({
		name: `when.${selector}, defaultMarker, and defineMarker`,
		setup: `import { marker } from './markers.stylex';`,
		files: {
			'markers.stylex.ts': `import * as stylex from '@stylexjs/stylex';
export const marker = stylex.defineMarker();`,
		},
		style: `{ color: { default: 'red', [stylex.when.${selector}(':hover')]: 'blue', [stylex.when.${selector}('[data-open]', marker)]: 'green' } }`,
		attrs: 'stylex.defaultMarker(), marker, styles.root',
		css: [
			/:hover/,
			/\[data-open\]/,
			...(selector === 'ancestor' || selector === 'siblingBefore' ? [] : [/:has\(/]),
		],
	})),
	{
		name: 'env values and functions',
		options: { env: { color: 'tomato', space: (value) => `${value * 7}px` } },
		style: `{ color: stylex.env.color, padding: stylex.env.space(3) }`,
		css: [/color:\s*(tomato|#ff6347)/, /padding:\s*21px/],
	},
	{
		name: 'static and dynamic atoms',
		setup: `import x from '@stylexjs/atoms';`,
		style: `{ color: 'red' }`,
		attrs: 'styles.root, x.display.flex, x.padding._16px, x.width(27)',
		css: [/display:\s*flex/, /padding:\s*16px/, /width:\s*var\(--/],
	},
	{
		name: 'CSS layer configuration and logical properties',
		options: { useCSSLayers: { before: ['reset'], after: ['utilities'], prefix: 'stylex' } },
		style: `{ marginInlineStart: 9, paddingBlock: 3 }`,
		css: [/@layer reset[;,]/, /stylex\.priority/, /utilities/, /margin-inline-start:\s*9px/],
	},
	{
		name: 'nested variables, constants, themes, and conditional values within a token module',
		setup: `import { nestedStyles, theme } from './nested.stylex';`,
		files: {
			'nested.stylex.ts': `import * as stylex from '@stylexjs/stylex';
export const nested = stylex.unstable_defineVarsNested({ colors: {
  accent: stylex.unstable_conditional({ default: 'red', '@media (prefers-color-scheme: dark)': 'pink' }),
} });
export const constants = stylex.unstable_defineConstsNested({ layers: { modal: '2345' } });
export const theme = stylex.unstable_createThemeNested(nested, { colors: { accent: 'purple' } });
export const nestedStyles = stylex.create({ root: { color: nested.colors.accent, zIndex: constants.layers.modal } });`,
		},
		style: `{ display: 'block' }`,
		attrs: 'theme, styles.root, nestedStyles.root',
		css: [/var\(--/, /z-index:\s*2345/, /prefers-color-scheme:\s*dark/, /purple/],
	},
];

export const typed_variables = {
	angle: ['90deg', 'angle'],
	color: ['red', 'color'],
	url: ['url("https://example.com/image.png")', 'url'],
	image: ['linear-gradient(red, blue)', 'image'],
	integer: [2, 'integer'],
	lengthPercentage: ['20%', 'length-percentage'],
	length: ['10px', 'length'],
	percentage: ['50%', 'percentage'],
	number: [0.5, 'number'],
	resolution: ['2dppx', 'resolution'],
	time: ['1s', 'time'],
	transformFunction: ['rotate(45deg)', 'transform-function'],
	transformList: ['rotate(45deg) scale(2)', 'transform-list'],
};
