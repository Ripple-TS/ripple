import type { AddEventObject } from '#public';

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
	className?: string;
	id?: string;
	style?: string | Record<string, string | number>;
	title?: string;
	lang?: string;
	dir?: 'ltr' | 'rtl' | 'auto';
	tabIndex?: number;
	contentEditable?: boolean | 'true' | 'false' | 'inherit';
	draggable?: boolean;
	hidden?: boolean;
	spellCheck?: boolean;
	translate?: 'yes' | 'no';
	role?: string;

	// ARIA attributes
	'aria-label'?: string;
	'aria-labelledby'?: string;
	'aria-describedby'?: string;
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
	'aria-controls'?: string;
	'aria-current'?: boolean | 'true' | 'false' | 'page' | 'step' | 'location' | 'date' | 'time';
	'aria-owns'?: string;
	'aria-valuemin'?: number;
	'aria-valuemax'?: number;
	'aria-valuenow'?: number;
	'aria-valuetext'?: string;

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
	id?: string;
	lang?: string;
	tabIndex?: number;
	xmlBase?: string;
	xmlLang?: string;
	xmlSpace?: string;

	// Styling
	class?: ClassValue | undefined | null;
	className?: string;
	style?: string | Record<string, string | number>;

	// Presentation attributes
	alignmentBaseline?: 'auto' | 'baseline' | 'before-edge' | 'text-before-edge' | 'middle' | 'central' | 'after-edge' | 'text-after-edge' | 'ideographic' | 'alphabetic' | 'hanging' | 'mathematical' | 'inherit';
	baselineShift?: string | number;
	clip?: string;
	clipPath?: string;
	clipRule?: 'nonzero' | 'evenodd' | 'inherit';
	color?: string;
	colorInterpolation?: 'auto' | 'sRGB' | 'linearRGB' | 'inherit';
	colorInterpolationFilters?: 'auto' | 'sRGB' | 'linearRGB' | 'inherit';
	cursor?: string;
	direction?: 'ltr' | 'rtl' | 'inherit';
	display?: string;
	dominantBaseline?: 'auto' | 'text-bottom' | 'alphabetic' | 'ideographic' | 'middle' | 'central' | 'mathematical' | 'hanging' | 'text-top' | 'inherit';
	fill?: string;
	fillOpacity?: number | string;
	fillRule?: 'nonzero' | 'evenodd' | 'inherit';
	filter?: string;
	floodColor?: string;
	floodOpacity?: number | string;
	fontFamily?: string;
	fontSize?: string | number;
	fontSizeAdjust?: string | number;
	fontStretch?: string;
	fontStyle?: 'normal' | 'italic' | 'oblique' | 'inherit';
	fontVariant?: string;
	fontWeight?: string | number;
	glyphOrientationHorizontal?: string;
	glyphOrientationVertical?: string;
	imageRendering?: 'auto' | 'optimizeSpeed' | 'optimizeQuality' | 'inherit';
	letterSpacing?: string | number;
	lightingColor?: string;
	markerEnd?: string;
	markerMid?: string;
	markerStart?: string;
	mask?: string;
	opacity?: number | string;
	overflow?: 'visible' | 'hidden' | 'scroll' | 'auto' | 'inherit';
	pointerEvents?: 'bounding-box' | 'visiblePainted' | 'visibleFill' | 'visibleStroke' | 'visible' | 'painted' | 'fill' | 'stroke' | 'all' | 'none' | 'inherit';
	shapeRendering?: 'auto' | 'optimizeSpeed' | 'crispEdges' | 'geometricPrecision' | 'inherit';
	stopColor?: string;
	stopOpacity?: number | string;
	stroke?: string;
	strokeDasharray?: string | number;
	strokeDashoffset?: string | number;
	strokeLinecap?: 'butt' | 'round' | 'square' | 'inherit';
	strokeLinejoin?: 'miter' | 'round' | 'bevel' | 'inherit';
	strokeMiterlimit?: number | string;
	strokeOpacity?: number | string;
	strokeWidth?: string | number;
	textAnchor?: 'start' | 'middle' | 'end' | 'inherit';
	textDecoration?: string;
	textRendering?: 'auto' | 'optimizeSpeed' | 'optimizeLegibility' | 'geometricPrecision' | 'inherit';
	transform?: string;
	transformOrigin?: string;
	unicodeBidi?: 'normal' | 'embed' | 'isolate' | 'bidi-override' | 'isolate-override' | 'plaintext' | 'inherit';
	vectorEffect?: 'none' | 'non-scaling-stroke' | 'non-scaling-size' | 'non-rotation' | 'fixed-position';
	visibility?: 'visible' | 'hidden' | 'collapse' | 'inherit';
	wordSpacing?: string | number;
	writingMode?: 'horizontal-tb' | 'vertical-rl' | 'vertical-lr' | 'inherit';

	// Common SVG attributes
	width?: string | number;
	height?: string | number;
	x?: string | number;
	y?: string | number;
	viewBox?: string;
	preserveAspectRatio?: string;
	xmlns?: string;
	'xmlns:xlink'?: string;

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
	attributeName?: string;
	attributeType?: 'CSS' | 'XML' | 'auto';
	begin?: string;
	dur?: string;
	end?: string;
	min?: string;
	max?: string;
	restart?: 'always' | 'whenNotActive' | 'never';
	repeatCount?: number | 'indefinite';
	repeatDur?: string;
	fill?: 'freeze' | 'remove';
	calcMode?: 'discrete' | 'linear' | 'paced' | 'spline';
	values?: string;
	keyTimes?: string;
	keySplines?: string;
	from?: string | number;
	to?: string | number;
	by?: string | number;
	additive?: 'replace' | 'sum';
	accumulate?: 'none' | 'sum';
}

// SVG gradient attributes
interface SVGGradientAttributes extends SVGAttributes {
	gradientUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
	gradientTransform?: string;
	spreadMethod?: 'pad' | 'reflect' | 'repeat';
	href?: string;
	'xlink:href'?: string;
}

// SVG filter primitive attributes
interface SVGFilterAttributes {
	in?: string;
	result?: string;
	x?: string | number;
	y?: string | number;
	width?: string | number;
	height?: string | number;
}

// SVG transfer function attributes (for feFuncR, feFuncG, feFuncB, feFuncA)
interface SVGTransferFunctionAttributes {
	type?: 'identity' | 'table' | 'discrete' | 'linear' | 'gamma';
	tableValues?: string;
	slope?: number;
	intercept?: number;
	amplitude?: number;
	exponent?: number;
	offset?: number;
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
				href?: string;
				target?: string;
			};
			link: HTMLAttributes & {
				rel?: string;
				href?: string;
				type?: string;
				media?: string;
				as?: string;
				crossOrigin?: 'anonymous' | 'use-credentials';
				integrity?: string;
			};
			meta: HTMLAttributes & {
				name?: string;
				content?: string;
				charSet?: string;
				httpEquiv?: string;
				property?: string;
			};
			style: HTMLAttributes & {
				type?: string;
				media?: string;
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
				cite?: string;
			};
			dd: HTMLAttributes;
			div: HTMLAttributes;
			dl: HTMLAttributes;
			dt: HTMLAttributes;
			figcaption: HTMLAttributes;
			figure: HTMLAttributes;
			hr: HTMLAttributes;
			li: HTMLAttributes & {
				value?: number;
			};
			menu: HTMLAttributes;
			ol: HTMLAttributes & {
				reversed?: boolean;
				start?: number;
				type?: '1' | 'a' | 'A' | 'i' | 'I';
			};
			p: HTMLAttributes;
			pre: HTMLAttributes;
			ul: HTMLAttributes;

			// Inline text semantics
			a: HTMLAttributes & {
				href?: string;
				target?: string;
				rel?: string;
				download?: string | boolean;
				hrefLang?: string;
				type?: string;
				referrerPolicy?: string;
			};
			abbr: HTMLAttributes;
			b: HTMLAttributes;
			bdi: HTMLAttributes;
			bdo: HTMLAttributes;
			br: HTMLAttributes;
			cite: HTMLAttributes;
			code: HTMLAttributes;
			data: HTMLAttributes & {
				value?: string;
			};
			dfn: HTMLAttributes;
			em: HTMLAttributes;
			i: HTMLAttributes;
			kbd: HTMLAttributes;
			mark: HTMLAttributes;
			q: HTMLAttributes & {
				cite?: string;
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
				dateTime?: string;
			};
			u: HTMLAttributes;
			var: HTMLAttributes;
			wbr: HTMLAttributes;

			// Image and multimedia
			area: HTMLAttributes & {
				alt?: string;
				coords?: string;
				download?: string;
				href?: string;
				hrefLang?: string;
				media?: string;
				rel?: string;
				shape?: 'rect' | 'circle' | 'poly' | 'default';
				target?: string;
			};
			audio: HTMLAttributes & {
				src?: string;
				autoplay?: boolean;
				controls?: boolean;
				loop?: boolean;
				muted?: boolean;
				preload?: 'none' | 'metadata' | 'auto';
				crossOrigin?: 'anonymous' | 'use-credentials';
			};
			img: HTMLAttributes & {
				src?: string;
				alt?: string;
				width?: string | number;
				height?: string | number;
				loading?: 'eager' | 'lazy';
				crossOrigin?: 'anonymous' | 'use-credentials';
				decoding?: 'sync' | 'async' | 'auto';
				fetchPriority?: 'high' | 'low' | 'auto';
				referrerPolicy?: string;
				sizes?: string;
				srcSet?: string;
				useMap?: string;
			};
			map: HTMLAttributes & {
				name?: string;
			};
			track: HTMLAttributes & {
				default?: boolean;
				kind?: 'subtitles' | 'captions' | 'descriptions' | 'chapters' | 'metadata';
				label?: string;
				src?: string;
				srcLang?: string;
			};
			video: HTMLAttributes & {
				src?: string;
				autoplay?: boolean;
				controls?: boolean;
				loop?: boolean;
				muted?: boolean;
				preload?: 'none' | 'metadata' | 'auto';
				poster?: string;
				width?: string | number;
				height?: string | number;
				crossOrigin?: 'anonymous' | 'use-credentials';
				playsInline?: boolean;
			};

			// Embedded content
			embed: HTMLAttributes & {
				src?: string;
				type?: string;
				width?: string | number;
				height?: string | number;
			};
			iframe: HTMLAttributes & {
				src?: string;
				srcdoc?: string;
				name?: string;
				sandbox?: string;
				allow?: string;
				allowFullScreen?: boolean;
				width?: string | number;
				height?: string | number;
				loading?: 'eager' | 'lazy';
				referrerPolicy?: string;
			};
			object: HTMLAttributes & {
				data?: string;
				type?: string;
				name?: string;
				useMap?: string;
				width?: string | number;
				height?: string | number;
			};
			picture: HTMLAttributes;
			portal: HTMLAttributes & {
				referrerPolicy?: string;
				src?: string;
			};
			source: HTMLAttributes & {
				src?: string;
				type?: string;
				media?: string;
				sizes?: string;
				srcSet?: string;
			};

			// SVG and MathML
			svg: HTMLAttributes & SVGAttributes;
			math: HTMLAttributes;

			// SVG elements
			animate: HTMLAttributes & SVGAnimationAttributes;
			animateMotion: HTMLAttributes & SVGAnimationAttributes;
			animateTransform: HTMLAttributes & SVGAnimationAttributes & {
				type?: 'translate' | 'scale' | 'rotate' | 'skewX' | 'skewY';
			};
			circle: HTMLAttributes & SVGAttributes & {
				cx?: string | number;
				cy?: string | number;
				r?: string | number;
			};
			clipPath: HTMLAttributes & SVGAttributes & {
				clipPathUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
			};
			defs: HTMLAttributes & SVGAttributes;
			desc: HTMLAttributes & SVGAttributes;
			ellipse: HTMLAttributes & SVGAttributes & {
				cx?: string | number;
				cy?: string | number;
				rx?: string | number;
				ry?: string | number;
			};
			feBlend: HTMLAttributes & SVGFilterAttributes & {
				mode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';
				in2?: string;
			};
			feColorMatrix: HTMLAttributes & SVGFilterAttributes & {
				type?: 'matrix' | 'saturate' | 'hueRotate' | 'luminanceToAlpha';
				values?: string;
			};
			feComponentTransfer: HTMLAttributes & SVGFilterAttributes;
			feComposite: HTMLAttributes & SVGFilterAttributes & {
				operator?: 'over' | 'in' | 'out' | 'atop' | 'xor' | 'lighter' | 'arithmetic';
				in2?: string;
				k1?: number;
				k2?: number;
				k3?: number;
				k4?: number;
			};
			feConvolveMatrix: HTMLAttributes & SVGFilterAttributes;
			feDiffuseLighting: HTMLAttributes & SVGFilterAttributes;
			feDisplacementMap: HTMLAttributes & SVGFilterAttributes;
			feDistantLight: HTMLAttributes & SVGFilterAttributes & {
				azimuth?: number;
				elevation?: number;
			};
			feDropShadow: HTMLAttributes & SVGFilterAttributes & {
				dx?: number;
				dy?: number;
				stdDeviation?: number | string;
			};
			feFlood: HTMLAttributes & SVGFilterAttributes & {
				'flood-color'?: string;
				'flood-opacity'?: number | string;
			};
			feFuncA: HTMLAttributes & SVGTransferFunctionAttributes;
			feFuncB: HTMLAttributes & SVGTransferFunctionAttributes;
			feFuncG: HTMLAttributes & SVGTransferFunctionAttributes;
			feFuncR: HTMLAttributes & SVGTransferFunctionAttributes;
			feGaussianBlur: HTMLAttributes & SVGFilterAttributes & {
				stdDeviation?: number | string;
			};
			feImage: HTMLAttributes & SVGFilterAttributes;
			feMerge: HTMLAttributes & SVGFilterAttributes;
			feMergeNode: HTMLAttributes & SVGFilterAttributes;
			feMorphology: HTMLAttributes & SVGFilterAttributes & {
				operator?: 'erode' | 'dilate';
				radius?: number | string;
			};
			feOffset: HTMLAttributes & SVGFilterAttributes & {
				dx?: number;
				dy?: number;
			};
			fePointLight: HTMLAttributes & SVGFilterAttributes & {
				x?: number;
				y?: number;
				z?: number;
			};
			feSpecularLighting: HTMLAttributes & SVGFilterAttributes;
			feSpotLight: HTMLAttributes & SVGFilterAttributes & {
				x?: number;
				y?: number;
				z?: number;
				pointsAtX?: number;
				pointsAtY?: number;
				pointsAtZ?: number;
				specularExponent?: number;
				limitingConeAngle?: number;
			};
			feTile: HTMLAttributes & SVGFilterAttributes;
			feTurbulence: HTMLAttributes & SVGFilterAttributes & {
				baseFrequency?: number | string;
				numOctaves?: number;
				seed?: number;
				stitchTiles?: 'stitch' | 'noStitch';
				type?: 'fractalNoise' | 'turbulence';
			};
			filter: HTMLAttributes & SVGAttributes & {
				filterUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
				primitiveUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
				x?: string | number;
				y?: string | number;
				width?: string | number;
				height?: string | number;
			};
			foreignObject: HTMLAttributes & SVGAttributes & {
				x?: string | number;
				y?: string | number;
				width?: string | number;
				height?: string | number;
			};
			g: HTMLAttributes & SVGAttributes;
			image: HTMLAttributes & SVGAttributes & {
				href?: string;
				'xlink:href'?: string;
				x?: string | number;
				y?: string | number;
				width?: string | number;
				height?: string | number;
				preserveAspectRatio?: string;
			};
			line: HTMLAttributes & SVGAttributes & {
				x1?: string | number;
				y1?: string | number;
				x2?: string | number;
				y2?: string | number;
			};
			linearGradient: HTMLAttributes & SVGGradientAttributes & {
				x1?: string | number;
				y1?: string | number;
				x2?: string | number;
				y2?: string | number;
			};
			marker: HTMLAttributes & SVGAttributes & {
				markerHeight?: string | number;
				markerUnits?: 'strokeWidth' | 'userSpaceOnUse';
				markerWidth?: string | number;
				orient?: string | number;
				refX?: string | number;
				refY?: string | number;
			};
			mask: HTMLAttributes & SVGAttributes & {
				maskContentUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
				maskUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
				x?: string | number;
				y?: string | number;
				width?: string | number;
				height?: string | number;
			};
			metadata: HTMLAttributes & SVGAttributes;
			mpath: HTMLAttributes & SVGAttributes & {
				'xlink:href'?: string;
			};
			path: HTMLAttributes & SVGAttributes & {
				d?: string;
				pathLength?: number;
			};
			pattern: HTMLAttributes & SVGAttributes & {
				patternContentUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
				patternTransform?: string;
				patternUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
				x?: string | number;
				y?: string | number;
				width?: string | number;
				height?: string | number;
			};
			polygon: HTMLAttributes & SVGAttributes & {
				points?: string;
			};
			polyline: HTMLAttributes & SVGAttributes & {
				points?: string;
			};
			radialGradient: HTMLAttributes & SVGGradientAttributes & {
				cx?: string | number;
				cy?: string | number;
				r?: string | number;
				fx?: string | number;
				fy?: string | number;
				fr?: string | number;
			};
			rect: HTMLAttributes & SVGAttributes & {
				x?: string | number;
				y?: string | number;
				width?: string | number;
				height?: string | number;
				rx?: string | number;
				ry?: string | number;
			};
			set: HTMLAttributes & SVGAnimationAttributes;
			stop: HTMLAttributes & SVGAttributes & {
				offset?: string | number;
				'stop-color'?: string;
				'stop-opacity'?: number | string;
			};
			switch: HTMLAttributes & SVGAttributes;
			symbol: HTMLAttributes & SVGAttributes & {
				viewBox?: string;
				preserveAspectRatio?: string;
				refX?: string | number;
				refY?: string | number;
			};
			text: HTMLAttributes & SVGAttributes & SVGTextAttributes;
			textPath: HTMLAttributes & SVGAttributes & SVGTextAttributes & {
				href?: string;
				'xlink:href'?: string;
				startOffset?: string | number;
				method?: 'align' | 'stretch';
				spacing?: 'auto' | 'exact';
			};
			tspan: HTMLAttributes & SVGAttributes & SVGTextAttributes;
			use: HTMLAttributes & SVGAttributes & {
				href?: string;
				'xlink:href'?: string;
				x?: string | number;
				y?: string | number;
				width?: string | number;
				height?: string | number;
			};
			view: HTMLAttributes & SVGAttributes & {
				viewBox?: string;
				preserveAspectRatio?: string;
			};

			// Scripting
			canvas: HTMLAttributes & {
				width?: string | number;
				height?: string | number;
			};
			noscript: HTMLAttributes;
			script: HTMLAttributes & {
				src?: string;
				type?: string;
				async?: boolean;
				defer?: boolean;
				crossOrigin?: 'anonymous' | 'use-credentials';
				integrity?: string;
				noModule?: boolean;
				referrerPolicy?: string;
			};

			// Demarcating edits
			del: HTMLAttributes & {
				cite?: string;
				dateTime?: string;
			};
			ins: HTMLAttributes & {
				cite?: string;
				dateTime?: string;
			};

			// Table content
			caption: HTMLAttributes;
			col: HTMLAttributes & {
				span?: number;
			};
			colgroup: HTMLAttributes & {
				span?: number;
			};
			table: HTMLAttributes;
			tbody: HTMLAttributes;
			td: HTMLAttributes & {
				colSpan?: number;
				rowSpan?: number;
				headers?: string;
			};
			tfoot: HTMLAttributes;
			th: HTMLAttributes & {
				colSpan?: number;
				rowSpan?: number;
				headers?: string;
				scope?: 'row' | 'col' | 'rowgroup' | 'colgroup';
				abbr?: string;
			};
			thead: HTMLAttributes;
			tr: HTMLAttributes;

			// Forms
			button: HTMLAttributes & {
				type?: 'button' | 'submit' | 'reset';
				disabled?: boolean;
				form?: string;
				formAction?: string;
				formEncType?: string;
				formMethod?: string;
				formNoValidate?: boolean;
				formTarget?: string;
				name?: string;
				value?: string;
			};
			datalist: HTMLAttributes;
			fieldset: HTMLAttributes & {
				disabled?: boolean;
				form?: string;
				name?: string;
			};
			form: HTMLAttributes & {
				action?: string;
				method?: 'get' | 'post' | 'dialog';
				encType?: string;
				acceptCharset?: string;
				autoComplete?: 'on' | 'off';
				noValidate?: boolean;
				target?: string;
			};
			input: HTMLAttributes & {
				type?: string;
				value?: string | number;
				placeholder?: string;
				disabled?: boolean;
				name?: string;
				accept?: string;
				autoComplete?: string;
				autoFocus?: boolean;
				checked?: boolean;
				form?: string;
				formAction?: string;
				formEncType?: string;
				formMethod?: string;
				formNoValidate?: boolean;
				formTarget?: string;
				list?: string;
				max?: string | number;
				maxLength?: number;
				min?: string | number;
				minLength?: number;
				multiple?: boolean;
				pattern?: string;
				readOnly?: boolean;
				required?: boolean;
				size?: number;
				src?: string;
				step?: string | number;
				width?: string | number;
				height?: string | number;
			};
			label: HTMLAttributes & {
				for?: string;
				htmlFor?: string;
			};
			legend: HTMLAttributes;
			meter: HTMLAttributes & {
				value?: number;
				min?: number;
				max?: number;
				low?: number;
				high?: number;
				optimum?: number;
			};
			optgroup: HTMLAttributes & {
				disabled?: boolean;
				label?: string;
			};
			option: HTMLAttributes & {
				value?: string | number;
				selected?: boolean;
				disabled?: boolean;
				label?: string;
			};
			output: HTMLAttributes & {
				for?: string;
				htmlFor?: string;
				form?: string;
				name?: string;
			};
			progress: HTMLAttributes & {
				value?: number;
				max?: number;
			};
			select: HTMLAttributes & {
				disabled?: boolean;
				form?: string;
				multiple?: boolean;
				name?: string;
				required?: boolean;
				size?: number;
				autoComplete?: string;
			};
			textarea: HTMLAttributes & {
				placeholder?: string;
				disabled?: boolean;
				rows?: number;
				cols?: number;
				name?: string;
				form?: string;
				maxLength?: number;
				minLength?: number;
				readOnly?: boolean;
				required?: boolean;
				wrap?: 'soft' | 'hard';
				autoComplete?: string;
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
				name?: string;
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
