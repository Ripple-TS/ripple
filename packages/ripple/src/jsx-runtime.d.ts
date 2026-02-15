import type { AddEventObject } from '#public';
import type { Nullable } from '#helpers';

/**
 * Ripple JSX Runtime Type Definitions
 * Ripple components are imperative and don't return JSX elements
 */

// Ripple components don't return JSX elements - they're imperative
export type ComponentType<P = {}> = (props: P) => void;

/**
 * Create a JSX element (for elements with children)
 * In Ripple, this doesn't return anything - components are imperative
 */
export function jsx(
	type: string | ComponentType<any>,
	props?: any,
	key?: string | number | null,
): void;

export function rsx(
	type: string | ComponentType<any>,
	props?: any,
	key?: string | number | null,
): void;

/**
 * Create a JSX element with static children (optimization for multiple children)
 * In Ripple, this doesn't return anything - components are imperative
 */
export function jsxs(
	type: string | ComponentType<any>,
	props?: any,
	key?: string | number | null,
): void;

/**
 * JSX Fragment component
 * In Ripple, fragments are imperative and don't return anything
 */
export function Fragment(props: { children?: any }): void;

export type ClassValue = string | import('clsx').ClassArray | import('clsx').ClassDictionary;

// Base HTML attributes
interface HTMLAttributes {
	class?: ClassValue | undefined | null;
	className?: Nullable<string>;
	id?: Nullable<string>;
	style?: Nullable<string> | Record<string, string | number>;
	title?: Nullable<string>;
	lang?: Nullable<string>;
	dir?: 'ltr' | 'rtl' | 'auto';
	tabIndex?: Nullable<number>;
	contentEditable?: boolean | 'true' | 'false' | 'inherit';
	draggable?: boolean;
	hidden?: boolean;
	spellCheck?: boolean;
	translate?: 'yes' | 'no';
	role?: Nullable<string>;

	// ARIA attributes
	'aria-label'?: Nullable<string>;
	'aria-labelledby'?: Nullable<string>;
	'aria-describedby'?: Nullable<string>;
	'aria-hidden'?: boolean | 'true' | 'false';
	'aria-expanded'?: boolean | 'true' | 'false';
	'aria-pressed'?: boolean | 'true' | 'false' | 'mixed';
	'aria-selected'?: boolean | 'true' | 'false';
	'aria-checked'?: boolean | 'true' | 'false' | 'mixed';
	'aria-disabled'?: boolean | 'true' | 'false';
	'aria-readonly'?: boolean | 'true' | 'false';
	'aria-required'?: boolean | 'true' | 'false';
	'aria-live'?: 'off' | 'polite' | 'assertive';
	'aria-atomic'?: boolean | 'true' | 'false';
	'aria-busy'?: boolean | 'true' | 'false';
	'aria-controls'?: Nullable<string>;
	'aria-current'?: boolean | 'true' | 'false' | 'page' | 'step' | 'location' | 'date' | 'time';
	'aria-owns'?: Nullable<string>;
	'aria-valuemin'?: Nullable<number>;
	'aria-valuemax'?: Nullable<number>;
	'aria-valuenow'?: Nullable<number>;
	'aria-valuetext'?: Nullable<string>;

	// Event handlers
	onClick?: EventListener | AddEventObject;
	onDblClick?: EventListener | AddEventObject;
	onInput?: EventListener | AddEventObject;
	onChange?: EventListener | AddEventObject;
	onSubmit?: EventListener | AddEventObject;
	onFocus?: EventListener | AddEventObject;
	onBlur?: EventListener | AddEventObject;
	onKeyDown?: EventListener | AddEventObject;
	onKeyUp?: EventListener | AddEventObject;
	onKeyPress?: EventListener | AddEventObject;
	onMouseDown?: EventListener | AddEventObject;
	onMouseUp?: EventListener | AddEventObject;
	onMouseEnter?: EventListener | AddEventObject;
	onMouseLeave?: EventListener | AddEventObject;
	onMouseMove?: EventListener | AddEventObject;
	onMouseOver?: EventListener | AddEventObject;
	onMouseOut?: EventListener | AddEventObject;
	onWheel?: EventListener | AddEventObject;
	onScroll?: EventListener | AddEventObject;
	onTouchStart?: EventListener | AddEventObject;
	onTouchMove?: EventListener | AddEventObject;
	onTouchEnd?: EventListener | AddEventObject;
	onTouchCancel?: EventListener | AddEventObject;
	onDragStart?: EventListener | AddEventObject;
	onDrag?: EventListener | AddEventObject;
	onDragEnd?: EventListener | AddEventObject;
	onDragEnter?: EventListener | AddEventObject;
	onDragLeave?: EventListener | AddEventObject;
	onDragOver?: EventListener | AddEventObject;
	onDrop?: EventListener | AddEventObject;
	onCopy?: EventListener | AddEventObject;
	onCut?: EventListener | AddEventObject;
	onPaste?: EventListener | AddEventObject;
	onLoad?: EventListener | AddEventObject;
	onError?: EventListener | AddEventObject;
	onResize?: EventListener | AddEventObject;
	onAnimationStart?: EventListener | AddEventObject;
	onAnimationEnd?: EventListener | AddEventObject;
	onAnimationIteration?: EventListener | AddEventObject;
	onTransitionEnd?: EventListener | AddEventObject;

	children?: any;
	[key: string]: any;
}

// SVG common attributes
interface SVGAttributes {
	// Core attributes
	id?: Nullable<string>;
	lang?: Nullable<string>;
	tabIndex?: Nullable<number>;
	xmlBase?: Nullable<string>;
	xmlLang?: Nullable<string>;
	xmlSpace?: Nullable<string>;

	// Styling
	class?: ClassValue | undefined | null;
	className?: Nullable<string>;
	style?: Nullable<string> | Record<string, string | number>;

	// Presentation attributes
	alignmentBaseline?:
		| 'auto'
		| 'baseline'
		| 'before-edge'
		| 'text-before-edge'
		| 'middle'
		| 'central'
		| 'after-edge'
		| 'text-after-edge'
		| 'ideographic'
		| 'alphabetic'
		| 'hanging'
		| 'mathematical'
		| 'inherit';
	baselineShift?: string | number;
	clip?: Nullable<string>;
	clipPath?: Nullable<string>;
	clipRule?: 'nonzero' | 'evenodd' | 'inherit';
	color?: Nullable<string>;
	colorInterpolation?: 'auto' | 'sRGB' | 'linearRGB' | 'inherit';
	colorInterpolationFilters?: 'auto' | 'sRGB' | 'linearRGB' | 'inherit';
	cursor?: Nullable<string>;
	direction?: 'ltr' | 'rtl' | 'inherit';
	display?: Nullable<string>;
	dominantBaseline?:
		| 'auto'
		| 'text-bottom'
		| 'alphabetic'
		| 'ideographic'
		| 'middle'
		| 'central'
		| 'mathematical'
		| 'hanging'
		| 'text-top'
		| 'inherit';
	fill?: Nullable<string>;
	fillOpacity?: number | string;
	fillRule?: 'nonzero' | 'evenodd' | 'inherit';
	filter?: Nullable<string>;
	floodColor?: Nullable<string>;
	floodOpacity?: number | string;
	fontFamily?: Nullable<string>;
	fontSize?: string | number;
	fontSizeAdjust?: string | number;
	fontStretch?: Nullable<string>;
	fontStyle?: 'normal' | 'italic' | 'oblique' | 'inherit';
	fontVariant?: Nullable<string>;
	fontWeight?: string | number;
	glyphOrientationHorizontal?: Nullable<string>;
	glyphOrientationVertical?: Nullable<string>;
	imageRendering?: 'auto' | 'optimizeSpeed' | 'optimizeQuality' | 'inherit';
	letterSpacing?: string | number;
	lightingColor?: Nullable<string>;
	markerEnd?: Nullable<string>;
	markerMid?: Nullable<string>;
	markerStart?: Nullable<string>;
	mask?: Nullable<string>;
	opacity?: number | string;
	overflow?: 'visible' | 'hidden' | 'scroll' | 'auto' | 'inherit';
	pointerEvents?:
		| 'bounding-box'
		| 'visiblePainted'
		| 'visibleFill'
		| 'visibleStroke'
		| 'visible'
		| 'painted'
		| 'fill'
		| 'stroke'
		| 'all'
		| 'none'
		| 'inherit';
	shapeRendering?: 'auto' | 'optimizeSpeed' | 'crispEdges' | 'geometricPrecision' | 'inherit';
	stopColor?: Nullable<string>;
	stopOpacity?: number | string;
	stroke?: Nullable<string>;
	strokeDasharray?: string | number;
	strokeDashoffset?: string | number;
	strokeLinecap?: 'butt' | 'round' | 'square' | 'inherit';
	strokeLinejoin?: 'miter' | 'round' | 'bevel' | 'inherit';
	strokeMiterlimit?: number | string;
	strokeOpacity?: number | string;
	strokeWidth?: string | number;
	textAnchor?: 'start' | 'middle' | 'end' | 'inherit';
	textDecoration?: Nullable<string>;
	textRendering?:
		| 'auto'
		| 'optimizeSpeed'
		| 'optimizeLegibility'
		| 'geometricPrecision'
		| 'inherit';
	transform?: Nullable<string>;
	transformOrigin?: Nullable<string>;
	unicodeBidi?:
		| 'normal'
		| 'embed'
		| 'isolate'
		| 'bidi-override'
		| 'isolate-override'
		| 'plaintext'
		| 'inherit';
	vectorEffect?:
		| 'none'
		| 'non-scaling-stroke'
		| 'non-scaling-size'
		| 'non-rotation'
		| 'fixed-position';
	visibility?: 'visible' | 'hidden' | 'collapse' | 'inherit';
	wordSpacing?: string | number;
	writingMode?: 'horizontal-tb' | 'vertical-rl' | 'vertical-lr' | 'inherit';

	// Common SVG attributes
	width?: string | number;
	height?: string | number;
	x?: string | number;
	y?: string | number;
	viewBox?: Nullable<string>;
	preserveAspectRatio?: Nullable<string>;
	xmlns?: Nullable<string>;
	'xmlns:xlink'?: Nullable<string>;

	// Event handlers (inherited from HTML but included for clarity)
	onClick?: EventListener | AddEventObject;
	onMouseDown?: EventListener | AddEventObject;
	onMouseUp?: EventListener | AddEventObject;
	onMouseMove?: EventListener | AddEventObject;
	onMouseEnter?: EventListener | AddEventObject;
	onMouseLeave?: EventListener | AddEventObject;
	onMouseOver?: EventListener | AddEventObject;
	onMouseOut?: EventListener | AddEventObject;
	onFocus?: EventListener | AddEventObject;
	onBlur?: EventListener | AddEventObject;
	onLoad?: EventListener | AddEventObject;
	onError?: EventListener | AddEventObject;

	children?: any;
	[key: string]: any;
}

// SVG animation attributes
interface SVGAnimationAttributes {
	attributeName?: Nullable<string>;
	attributeType?: 'CSS' | 'XML' | 'auto';
	begin?: Nullable<string>;
	dur?: Nullable<string>;
	end?: Nullable<string>;
	min?: Nullable<string>;
	max?: Nullable<string>;
	restart?: 'always' | 'whenNotActive' | 'never';
	repeatCount?: number | 'indefinite';
	repeatDur?: Nullable<string>;
	fill?: 'freeze' | 'remove';
	calcMode?: 'discrete' | 'linear' | 'paced' | 'spline';
	values?: Nullable<string>;
	keyTimes?: Nullable<string>;
	keySplines?: Nullable<string>;
	from?: string | number;
	to?: string | number;
	by?: string | number;
	additive?: 'replace' | 'sum';
	accumulate?: 'none' | 'sum';
}

// SVG gradient attributes
interface SVGGradientAttributes extends SVGAttributes {
	gradientUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
	gradientTransform?: Nullable<string>;
	spreadMethod?: 'pad' | 'reflect' | 'repeat';
	href?: Nullable<string>;
	'xlink:href'?: Nullable<string>;
}

// SVG filter primitive attributes
interface SVGFilterAttributes {
	in?: Nullable<string>;
	result?: Nullable<string>;
	x?: string | number;
	y?: string | number;
	width?: string | number;
	height?: string | number;
}

// SVG transfer function attributes (for feFuncR, feFuncG, feFuncB, feFuncA)
interface SVGTransferFunctionAttributes {
	type?: 'identity' | 'table' | 'discrete' | 'linear' | 'gamma';
	tableValues?: Nullable<string>;
	slope?: Nullable<number>;
	intercept?: Nullable<number>;
	amplitude?: Nullable<number>;
	exponent?: Nullable<number>;
	offset?: Nullable<number>;
}

// SVG text attributes
interface SVGTextAttributes {
	x?: string | number;
	y?: string | number;
	dx?: string | number;
	dy?: string | number;
	rotate?: string | number;
	lengthAdjust?: 'spacing' | 'spacingAndGlyphs';
	textLength?: string | number;
}

// Global JSX namespace for TypeScript
declare global {
	namespace JSX {
		// In Ripple, JSX expressions don't return elements - they're imperative
		type Element = void;

		interface IntrinsicElements {
			// Document metadata
			head: HTMLAttributes;
			title: HTMLAttributes;
			base: HTMLAttributes & {
				href?: Nullable<string>;
				target?: Nullable<string>;
			};
			link: HTMLAttributes & {
				rel?: Nullable<string>;
				href?: Nullable<string>;
				type?: Nullable<string>;
				media?: Nullable<string>;
				as?: Nullable<string>;
				crossOrigin?: 'anonymous' | 'use-credentials';
				integrity?: Nullable<string>;
			};
			meta: HTMLAttributes & {
				name?: Nullable<string>;
				content?: Nullable<string>;
				charSet?: Nullable<string>;
				httpEquiv?: Nullable<string>;
				property?: Nullable<string>;
			};
			style: HTMLAttributes & {
				type?: Nullable<string>;
				media?: Nullable<string>;
			};

			// Sectioning root
			body: HTMLAttributes;

			// Content sectioning
			address: HTMLAttributes;
			article: HTMLAttributes;
			aside: HTMLAttributes;
			footer: HTMLAttributes;
			header: HTMLAttributes;
			h1: HTMLAttributes;
			h2: HTMLAttributes;
			h3: HTMLAttributes;
			h4: HTMLAttributes;
			h5: HTMLAttributes;
			h6: HTMLAttributes;
			hgroup: HTMLAttributes;
			main: HTMLAttributes;
			nav: HTMLAttributes;
			section: HTMLAttributes;
			search: HTMLAttributes;

			// Text content
			blockquote: HTMLAttributes & {
				cite?: Nullable<string>;
			};
			dd: HTMLAttributes;
			div: HTMLAttributes;
			dl: HTMLAttributes;
			dt: HTMLAttributes;
			figcaption: HTMLAttributes;
			figure: HTMLAttributes;
			hr: HTMLAttributes;
			li: HTMLAttributes & {
				value?: Nullable<number>;
			};
			menu: HTMLAttributes;
			ol: HTMLAttributes & {
				reversed?: boolean;
				start?: Nullable<number>;
				type?: '1' | 'a' | 'A' | 'i' | 'I';
			};
			p: HTMLAttributes;
			pre: HTMLAttributes;
			ul: HTMLAttributes;

			// Inline text semantics
			a: HTMLAttributes & {
				href?: Nullable<string>;
				target?: Nullable<string>;
				rel?: Nullable<string>;
				download?: string | boolean;
				hrefLang?: Nullable<string>;
				type?: Nullable<string>;
				referrerPolicy?: Nullable<string>;
			};
			abbr: HTMLAttributes;
			b: HTMLAttributes;
			bdi: HTMLAttributes;
			bdo: HTMLAttributes;
			br: HTMLAttributes;
			cite: HTMLAttributes;
			code: HTMLAttributes;
			data: HTMLAttributes & {
				value?: Nullable<string>;
			};
			dfn: HTMLAttributes;
			em: HTMLAttributes;
			i: HTMLAttributes;
			kbd: HTMLAttributes;
			mark: HTMLAttributes;
			q: HTMLAttributes & {
				cite?: Nullable<string>;
			};
			rp: HTMLAttributes;
			rt: HTMLAttributes;
			ruby: HTMLAttributes;
			s: HTMLAttributes;
			samp: HTMLAttributes;
			small: HTMLAttributes;
			span: HTMLAttributes;
			strong: HTMLAttributes;
			sub: HTMLAttributes;
			sup: HTMLAttributes;
			time: HTMLAttributes & {
				dateTime?: Nullable<string>;
			};
			u: HTMLAttributes;
			var: HTMLAttributes;
			wbr: HTMLAttributes;

			// Image and multimedia
			area: HTMLAttributes & {
				alt?: Nullable<string>;
				coords?: Nullable<string>;
				download?: Nullable<string>;
				href?: Nullable<string>;
				hrefLang?: Nullable<string>;
				media?: Nullable<string>;
				rel?: Nullable<string>;
				shape?: 'rect' | 'circle' | 'poly' | 'default';
				target?: Nullable<string>;
			};
			audio: HTMLAttributes & {
				src?: Nullable<string>;
				autoplay?: boolean;
				controls?: boolean;
				loop?: boolean;
				muted?: boolean;
				preload?: 'none' | 'metadata' | 'auto';
				crossOrigin?: 'anonymous' | 'use-credentials';
			};
			img: HTMLAttributes & {
				src?: Nullable<string>;
				alt?: Nullable<string>;
				width?: string | number;
				height?: string | number;
				loading?: 'eager' | 'lazy';
				crossOrigin?: 'anonymous' | 'use-credentials';
				decoding?: 'sync' | 'async' | 'auto';
				fetchPriority?: 'high' | 'low' | 'auto';
				referrerPolicy?: Nullable<string>;
				sizes?: Nullable<string>;
				srcSet?: Nullable<string>;
				useMap?: Nullable<string>;
			};
			map: HTMLAttributes & {
				name?: Nullable<string>;
			};
			track: HTMLAttributes & {
				default?: boolean;
				kind?: 'subtitles' | 'captions' | 'descriptions' | 'chapters' | 'metadata';
				label?: Nullable<string>;
				src?: Nullable<string>;
				srcLang?: Nullable<string>;
			};
			video: HTMLAttributes & {
				src?: Nullable<string>;
				autoplay?: boolean;
				controls?: boolean;
				loop?: boolean;
				muted?: boolean;
				preload?: 'none' | 'metadata' | 'auto';
				poster?: Nullable<string>;
				width?: string | number;
				height?: string | number;
				crossOrigin?: 'anonymous' | 'use-credentials';
				playsInline?: boolean;
			};

			// Embedded content
			embed: HTMLAttributes & {
				src?: Nullable<string>;
				type?: Nullable<string>;
				width?: string | number;
				height?: string | number;
			};
			iframe: HTMLAttributes & {
				src?: Nullable<string>;
				srcdoc?: Nullable<string>;
				name?: Nullable<string>;
				sandbox?: Nullable<string>;
				allow?: Nullable<string>;
				allowFullScreen?: boolean;
				width?: string | number;
				height?: string | number;
				loading?: 'eager' | 'lazy';
				referrerPolicy?: Nullable<string>;
			};
			object: HTMLAttributes & {
				data?: Nullable<string>;
				type?: Nullable<string>;
				name?: Nullable<string>;
				useMap?: Nullable<string>;
				width?: string | number;
				height?: string | number;
			};
			picture: HTMLAttributes;
			portal: HTMLAttributes & {
				referrerPolicy?: Nullable<string>;
				src?: Nullable<string>;
			};
			source: HTMLAttributes & {
				src?: Nullable<string>;
				type?: Nullable<string>;
				media?: Nullable<string>;
				sizes?: Nullable<string>;
				srcSet?: Nullable<string>;
			};

			// SVG and MathML
			svg: HTMLAttributes & SVGAttributes;
			math: HTMLAttributes;

			// SVG elements
			animate: HTMLAttributes & SVGAnimationAttributes;
			animateMotion: HTMLAttributes & SVGAnimationAttributes;
			animateTransform: HTMLAttributes &
				SVGAnimationAttributes & {
					type?: 'translate' | 'scale' | 'rotate' | 'skewX' | 'skewY';
				};
			circle: HTMLAttributes &
				SVGAttributes & {
					cx?: string | number;
					cy?: string | number;
					r?: string | number;
				};
			clipPath: HTMLAttributes &
				SVGAttributes & {
					clipPathUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
				};
			defs: HTMLAttributes & SVGAttributes;
			desc: HTMLAttributes & SVGAttributes;
			ellipse: HTMLAttributes &
				SVGAttributes & {
					cx?: string | number;
					cy?: string | number;
					rx?: string | number;
					ry?: string | number;
				};
			feBlend: HTMLAttributes &
				SVGFilterAttributes & {
					mode?:
						| 'normal'
						| 'multiply'
						| 'screen'
						| 'overlay'
						| 'darken'
						| 'lighten'
						| 'color-dodge'
						| 'color-burn'
						| 'hard-light'
						| 'soft-light'
						| 'difference'
						| 'exclusion'
						| 'hue'
						| 'saturation'
						| 'color'
						| 'luminosity';
					in2?: Nullable<string>;
				};
			feColorMatrix: HTMLAttributes &
				SVGFilterAttributes & {
					type?: 'matrix' | 'saturate' | 'hueRotate' | 'luminanceToAlpha';
					values?: Nullable<string>;
				};
			feComponentTransfer: HTMLAttributes & SVGFilterAttributes;
			feComposite: HTMLAttributes &
				SVGFilterAttributes & {
					operator?: 'over' | 'in' | 'out' | 'atop' | 'xor' | 'lighter' | 'arithmetic';
					in2?: Nullable<string>;
					k1?: Nullable<number>;
					k2?: Nullable<number>;
					k3?: Nullable<number>;
					k4?: Nullable<number>;
				};
			feConvolveMatrix: HTMLAttributes & SVGFilterAttributes;
			feDiffuseLighting: HTMLAttributes & SVGFilterAttributes;
			feDisplacementMap: HTMLAttributes & SVGFilterAttributes;
			feDistantLight: HTMLAttributes &
				SVGFilterAttributes & {
					azimuth?: Nullable<number>;
					elevation?: Nullable<number>;
				};
			feDropShadow: HTMLAttributes &
				SVGFilterAttributes & {
					dx?: Nullable<number>;
					dy?: Nullable<number>;
					stdDeviation?: number | string;
				};
			feFlood: HTMLAttributes &
				SVGFilterAttributes & {
					'flood-color'?: Nullable<string>;
					'flood-opacity'?: number | string;
				};
			feFuncA: HTMLAttributes & SVGTransferFunctionAttributes;
			feFuncB: HTMLAttributes & SVGTransferFunctionAttributes;
			feFuncG: HTMLAttributes & SVGTransferFunctionAttributes;
			feFuncR: HTMLAttributes & SVGTransferFunctionAttributes;
			feGaussianBlur: HTMLAttributes &
				SVGFilterAttributes & {
					stdDeviation?: number | string;
				};
			feImage: HTMLAttributes & SVGFilterAttributes;
			feMerge: HTMLAttributes & SVGFilterAttributes;
			feMergeNode: HTMLAttributes & SVGFilterAttributes;
			feMorphology: HTMLAttributes &
				SVGFilterAttributes & {
					operator?: 'erode' | 'dilate';
					radius?: number | string;
				};
			feOffset: HTMLAttributes &
				SVGFilterAttributes & {
					dx?: Nullable<number>;
					dy?: Nullable<number>;
				};
			fePointLight: HTMLAttributes &
				SVGFilterAttributes & {
					x?: Nullable<number>;
					y?: Nullable<number>;
					z?: Nullable<number>;
				};
			feSpecularLighting: HTMLAttributes & SVGFilterAttributes;
			feSpotLight: HTMLAttributes &
				SVGFilterAttributes & {
					x?: Nullable<number>;
					y?: Nullable<number>;
					z?: Nullable<number>;
					pointsAtX?: Nullable<number>;
					pointsAtY?: Nullable<number>;
					pointsAtZ?: Nullable<number>;
					specularExponent?: Nullable<number>;
					limitingConeAngle?: Nullable<number>;
				};
			feTile: HTMLAttributes & SVGFilterAttributes;
			feTurbulence: HTMLAttributes &
				SVGFilterAttributes & {
					baseFrequency?: number | string;
					numOctaves?: Nullable<number>;
					seed?: Nullable<number>;
					stitchTiles?: 'stitch' | 'noStitch';
					type?: 'fractalNoise' | 'turbulence';
				};
			filter: HTMLAttributes &
				SVGAttributes & {
					filterUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
					primitiveUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
					x?: string | number;
					y?: string | number;
					width?: string | number;
					height?: string | number;
				};
			foreignObject: HTMLAttributes &
				SVGAttributes & {
					x?: string | number;
					y?: string | number;
					width?: string | number;
					height?: string | number;
				};
			g: HTMLAttributes & SVGAttributes;
			image: HTMLAttributes &
				SVGAttributes & {
					href?: Nullable<string>;
					'xlink:href'?: Nullable<string>;
					x?: string | number;
					y?: string | number;
					width?: string | number;
					height?: string | number;
					preserveAspectRatio?: Nullable<string>;
				};
			line: HTMLAttributes &
				SVGAttributes & {
					x1?: string | number;
					y1?: string | number;
					x2?: string | number;
					y2?: string | number;
				};
			linearGradient: HTMLAttributes &
				SVGGradientAttributes & {
					x1?: string | number;
					y1?: string | number;
					x2?: string | number;
					y2?: string | number;
				};
			marker: HTMLAttributes &
				SVGAttributes & {
					markerHeight?: string | number;
					markerUnits?: 'strokeWidth' | 'userSpaceOnUse';
					markerWidth?: string | number;
					orient?: string | number;
					refX?: string | number;
					refY?: string | number;
				};
			mask: HTMLAttributes &
				SVGAttributes & {
					maskContentUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
					maskUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
					x?: string | number;
					y?: string | number;
					width?: string | number;
					height?: string | number;
				};
			metadata: HTMLAttributes & SVGAttributes;
			mpath: HTMLAttributes &
				SVGAttributes & {
					'xlink:href'?: Nullable<string>;
				};
			path: HTMLAttributes &
				SVGAttributes & {
					d?: Nullable<string>;
					pathLength?: Nullable<number>;
				};
			pattern: HTMLAttributes &
				SVGAttributes & {
					patternContentUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
					patternTransform?: Nullable<string>;
					patternUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
					x?: string | number;
					y?: string | number;
					width?: string | number;
					height?: string | number;
				};
			polygon: HTMLAttributes &
				SVGAttributes & {
					points?: Nullable<string>;
				};
			polyline: HTMLAttributes &
				SVGAttributes & {
					points?: Nullable<string>;
				};
			radialGradient: HTMLAttributes &
				SVGGradientAttributes & {
					cx?: string | number;
					cy?: string | number;
					r?: string | number;
					fx?: string | number;
					fy?: string | number;
					fr?: string | number;
				};
			rect: HTMLAttributes &
				SVGAttributes & {
					x?: string | number;
					y?: string | number;
					width?: string | number;
					height?: string | number;
					rx?: string | number;
					ry?: string | number;
				};
			set: HTMLAttributes & SVGAnimationAttributes;
			stop: HTMLAttributes &
				SVGAttributes & {
					offset?: string | number;
					'stop-color'?: Nullable<string>;
					'stop-opacity'?: number | string;
				};
			switch: HTMLAttributes & SVGAttributes;
			symbol: HTMLAttributes &
				SVGAttributes & {
					viewBox?: Nullable<string>;
					preserveAspectRatio?: Nullable<string>;
					refX?: string | number;
					refY?: string | number;
				};
			text: HTMLAttributes & SVGAttributes & SVGTextAttributes;
			textPath: HTMLAttributes &
				SVGAttributes &
				SVGTextAttributes & {
					href?: Nullable<string>;
					'xlink:href'?: Nullable<string>;
					startOffset?: string | number;
					method?: 'align' | 'stretch';
					spacing?: 'auto' | 'exact';
				};
			tspan: HTMLAttributes & SVGAttributes & SVGTextAttributes;
			use: HTMLAttributes &
				SVGAttributes & {
					href?: Nullable<string>;
					'xlink:href'?: Nullable<string>;
					x?: string | number;
					y?: string | number;
					width?: string | number;
					height?: string | number;
				};
			view: HTMLAttributes &
				SVGAttributes & {
					viewBox?: Nullable<string>;
					preserveAspectRatio?: Nullable<string>;
				};

			// Scripting
			canvas: HTMLAttributes & {
				width?: string | number;
				height?: string | number;
			};
			noscript: HTMLAttributes;
			script: HTMLAttributes & {
				src?: Nullable<string>;
				type?: Nullable<string>;
				async?: boolean;
				defer?: boolean;
				crossOrigin?: 'anonymous' | 'use-credentials';
				integrity?: Nullable<string>;
				noModule?: boolean;
				referrerPolicy?: Nullable<string>;
			};

			// Demarcating edits
			del: HTMLAttributes & {
				cite?: Nullable<string>;
				dateTime?: Nullable<string>;
			};
			ins: HTMLAttributes & {
				cite?: Nullable<string>;
				dateTime?: Nullable<string>;
			};

			// Table content
			caption: HTMLAttributes;
			col: HTMLAttributes & {
				span?: Nullable<number>;
			};
			colgroup: HTMLAttributes & {
				span?: Nullable<number>;
			};
			table: HTMLAttributes;
			tbody: HTMLAttributes;
			td: HTMLAttributes & {
				colSpan?: Nullable<number>;
				rowSpan?: Nullable<number>;
				headers?: Nullable<string>;
			};
			tfoot: HTMLAttributes;
			th: HTMLAttributes & {
				colSpan?: Nullable<number>;
				rowSpan?: Nullable<number>;
				headers?: Nullable<string>;
				scope?: 'row' | 'col' | 'rowgroup' | 'colgroup';
				abbr?: Nullable<string>;
			};
			thead: HTMLAttributes;
			tr: HTMLAttributes;

			// Forms
			button: HTMLAttributes & {
				type?: 'button' | 'submit' | 'reset';
				disabled?: boolean;
				form?: Nullable<string>;
				formAction?: Nullable<string>;
				formEncType?: Nullable<string>;
				formMethod?: Nullable<string>;
				formNoValidate?: boolean;
				formTarget?: Nullable<string>;
				name?: Nullable<string>;
				value?: Nullable<string>;
			};
			datalist: HTMLAttributes;
			fieldset: HTMLAttributes & {
				disabled?: boolean;
				form?: Nullable<string>;
				name?: Nullable<string>;
			};
			form: HTMLAttributes & {
				action?: Nullable<string>;
				method?: 'get' | 'post' | 'dialog';
				encType?: Nullable<string>;
				acceptCharset?: Nullable<string>;
				autoComplete?: 'on' | 'off';
				noValidate?: boolean;
				target?: Nullable<string>;
			};
			input: HTMLAttributes & {
				type?: Nullable<string>;
				value?: string | number;
				placeholder?: Nullable<string>;
				disabled?: boolean;
				name?: Nullable<string>;
				accept?: Nullable<string>;
				autoComplete?: Nullable<string>;
				autoFocus?: boolean;
				checked?: boolean;
				form?: Nullable<string>;
				formAction?: Nullable<string>;
				formEncType?: Nullable<string>;
				formMethod?: Nullable<string>;
				formNoValidate?: boolean;
				formTarget?: Nullable<string>;
				list?: Nullable<string>;
				max?: string | number;
				maxLength?: Nullable<number>;
				min?: string | number;
				minLength?: Nullable<number>;
				multiple?: boolean;
				pattern?: Nullable<string>;
				readOnly?: boolean;
				required?: boolean;
				size?: Nullable<number>;
				src?: Nullable<string>;
				step?: string | number;
				width?: string | number;
				height?: string | number;
			};
			label: HTMLAttributes & {
				for?: Nullable<string>;
				htmlFor?: Nullable<string>;
			};
			legend: HTMLAttributes;
			meter: HTMLAttributes & {
				value?: Nullable<number>;
				min?: Nullable<number>;
				max?: Nullable<number>;
				low?: Nullable<number>;
				high?: Nullable<number>;
				optimum?: Nullable<number>;
			};
			optgroup: HTMLAttributes & {
				disabled?: boolean;
				label?: Nullable<string>;
			};
			option: HTMLAttributes & {
				value?: string | number;
				selected?: boolean;
				disabled?: boolean;
				label?: Nullable<string>;
			};
			output: HTMLAttributes & {
				for?: Nullable<string>;
				htmlFor?: Nullable<string>;
				form?: Nullable<string>;
				name?: Nullable<string>;
			};
			progress: HTMLAttributes & {
				value?: Nullable<number>;
				max?: Nullable<number>;
			};
			select: HTMLAttributes & {
				disabled?: boolean;
				form?: Nullable<string>;
				multiple?: boolean;
				name?: Nullable<string>;
				required?: boolean;
				size?: Nullable<number>;
				autoComplete?: Nullable<string>;
			};
			textarea: HTMLAttributes & {
				placeholder?: Nullable<string>;
				disabled?: boolean;
				rows?: Nullable<number>;
				cols?: Nullable<number>;
				name?: Nullable<string>;
				form?: Nullable<string>;
				maxLength?: Nullable<number>;
				minLength?: Nullable<number>;
				readOnly?: boolean;
				required?: boolean;
				wrap?: 'soft' | 'hard';
				autoComplete?: Nullable<string>;
				autoFocus?: boolean;
			};

			// Interactive elements
			details: HTMLAttributes & {
				open?: boolean;
			};
			dialog: HTMLAttributes & {
				open?: boolean;
			};
			summary: HTMLAttributes;

			// Web Components
			slot: HTMLAttributes & {
				name?: Nullable<string>;
			};
			template: HTMLAttributes;

			// Catch-all for any other elements
			[elemName: string]: HTMLAttributes;
		}

		interface ElementChildrenAttribute {
			children: {};
		}
	}
}
