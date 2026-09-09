/** @import { NAMESPACE_URI } from './constants.js' */

/**
 * Creates a text node that serves as an anchor point in the DOM.
 * @returns {Text}
 */
export function create_anchor() {
	return document.createTextNode('');
}

/**
 * Checks if an object is a tracked object (has a numeric 'f' property).
 * @param {any} v - The object to check.
 * @returns {boolean}
 */
export function is_ripple_object(v) {
	return typeof v === 'object' && v !== null && typeof (/** @type {any} */ (v).f) === 'number';
}

/**
 * Converts a tag name to its corresponding namespace.
 * @param {keyof SVGElementTagNameMap | keyof MathMLElementTagNameMap | keyof HTMLElementTagNameMap} element
 * @param {keyof typeof NAMESPACE_URI} current_namespace
 * @returns {keyof typeof NAMESPACE_URI}
 */
export function top_element_to_ns(element, current_namespace) {
	if (element === 'svg') {
		return 'svg';
	} else if (element === 'math') {
		return 'mathml';
	} else {
		return current_namespace;
	}
}

/**
 * Unprefixed CSS properties whose numeric value is unitless (aligned with
 * React's `isUnitlessNumber` list, trimmed to properties actually reachable
 * through `style.setProperty` on client and through plain string
 * concatenation on the server).
 * @type {readonly string[]}
 */
const UNPREFIXED_UNITLESS_NUMBER_PROPERTIES = [
	'animation-iteration-count',
	'aspect-ratio',
	'border-image-outset',
	'border-image-slice',
	'border-image-width',
	'box-flex',
	'box-flex-group',
	'box-ordinal-group',
	'column-count',
	'columns',
	'flex',
	'flex-grow',
	'flex-negative',
	'flex-order',
	'flex-positive',
	'flex-shrink',
	'font-weight',
	'grid-area',
	'grid-column',
	'grid-column-end',
	'grid-column-span',
	'grid-column-start',
	'grid-row',
	'grid-row-end',
	'grid-row-span',
	'grid-row-start',
	'line-clamp',
	'line-height',
	'opacity',
	'order',
	'orphans',
	'tab-size',
	'widows',
	'z-index',
	'zoom',
	'fill-opacity',
	'flood-opacity',
	'stop-opacity',
	'stroke-dasharray',
	'stroke-dashoffset',
	'stroke-miterlimit',
	'stroke-opacity',
	'stroke-width',
];

/**
 * Vendor prefixes (as they appear in a kebab-cased CSS property name) that
 * can precede any of the unitless properties above — e.g. `-webkit-line-clamp`,
 * `-moz-tab-size`. Every unprefixed entry is unitless with any of these
 * prefixes too, the same way React expands `Webkit`/`ms`/`Moz`/`O` variants
 * of its own unitless list.
 * @type {readonly string[]}
 */
const VENDOR_PREFIXES = ['-webkit-', '-moz-', '-ms-', '-o-'];

/**
 * Every unitless CSS property, unprefixed and vendor-prefixed, as a lookup
 * set keyed by the exact kebab-cased name `normalize_css_property_name`
 * produces.
 * @type {Set<string>}
 */
const UNITLESS_NUMBER_PROPERTIES = new Set([
	...UNPREFIXED_UNITLESS_NUMBER_PROPERTIES,
	...VENDOR_PREFIXES.flatMap((prefix) =>
		UNPREFIXED_UNITLESS_NUMBER_PROPERTIES.map((prop) => `${prefix}${prop}`),
	),
]);

/**
 * `style.setProperty(prop, value)` on the client, and plain string
 * concatenation into the `style` HTML attribute on the server, both silently
 * produce a bare unitless number for a property that requires a unit (e.g.
 * `width`, `top`, `margin`) — the client drops the assignment entirely with
 * no error, and the server emits markup the client then can't hydrate into a
 * working value either. `String(400)` produces exactly that bare number, so
 * a caller passing `{ width: 400 }` (a very common ergonomic shape, and the
 * one the `style` JSX attribute's `string | number` type explicitly invites)
 * silently ends up with no width instead of `400px`.
 *
 * CSS custom properties (`--foo`) are always left as a bare number: they are
 * commonly used as unitless multipliers, counters, or opacities read back by
 * `var(--foo)` in a calc()/multiplication context, and `normalize_css_property_name`
 * itself already leaves `--`-prefixed names untouched for the same reason.
 * @param {string} css_prop kebab-cased CSS property name (or a `--custom-property`)
 * @param {string | number} raw_value
 * @returns {string}
 */
export function format_style_value(css_prop, raw_value) {
	if (
		typeof raw_value === 'number' &&
		raw_value !== 0 &&
		!css_prop.startsWith('--') &&
		!UNITLESS_NUMBER_PROPERTIES.has(css_prop)
	) {
		return `${raw_value}px`;
	}
	return String(raw_value);
}
