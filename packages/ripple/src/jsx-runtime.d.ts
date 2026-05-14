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

type Event<
	Target extends globalThis.EventTarget,
	EventType extends globalThis.Event,
> = EventType & {
	readonly currentTarget: Target;
};

type EventHandler<Target extends globalThis.EventTarget, EventType extends globalThis.Event> = (
	this: Target,
	event: Event<Target, EventType>,
) => void;

type EventHandlerObject<
	Target extends globalThis.EventTarget,
	EventType extends globalThis.Event,
> = Omit<AddEventObject, 'handleEvent'> & {
	handleEvent(this: Target, event: Event<Target, EventType>): void;
};

type EventHandlerValue<Target extends globalThis.EventTarget, EventType extends globalThis.Event> =
	| EventHandler<Target, EventType>
	| EventHandlerObject<Target, EventType>;

type ElementEventHandler<
	Target extends globalThis.EventTarget,
	Type extends keyof GlobalEventHandlersEventMap,
> = EventHandlerValue<Target, GlobalEventHandlersEventMap[Type]>;

type SVGElementAttributes<Tag extends keyof SVGElementTagNameMap> = HTMLAttributes<
	SVGElementTagNameMap[Tag]
> &
	SVGAttributes<SVGElementTagNameMap[Tag]>;

type BaseHTMLAttributes<Target extends HTMLBaseElement = HTMLBaseElement> =
	HTMLAttributes<Target> & {
		href?: Nullable<string>;
		target?: Nullable<string>;
	};

type LinkHTMLAttributes<Target extends HTMLLinkElement = HTMLLinkElement> =
	HTMLAttributes<Target> & {
		rel?: Nullable<string>;
		href?: Nullable<string>;
		type?: Nullable<string>;
		media?: Nullable<string>;
		as?: Nullable<string>;
		crossOrigin?: 'anonymous' | 'use-credentials';
		integrity?: Nullable<string>;
	};

type MetaHTMLAttributes<Target extends HTMLMetaElement = HTMLMetaElement> =
	HTMLAttributes<Target> & {
		name?: Nullable<string>;
		content?: Nullable<string>;
		charSet?: Nullable<string>;
		httpEquiv?: Nullable<string>;
		property?: Nullable<string>;
	};

type StyleHTMLAttributes<Target extends HTMLStyleElement = HTMLStyleElement> =
	HTMLAttributes<Target> & {
		type?: Nullable<string>;
		media?: Nullable<string>;
	};

type BlockquoteHTMLAttributes<Target extends HTMLQuoteElement = HTMLQuoteElement> =
	HTMLAttributes<Target> & {
		cite?: Nullable<string>;
	};

type LiHTMLAttributes<Target extends HTMLLIElement = HTMLLIElement> = HTMLAttributes<Target> & {
	value?: Nullable<number>;
};

type OlHTMLAttributes<Target extends HTMLOListElement = HTMLOListElement> =
	HTMLAttributes<Target> & {
		reversed?: boolean;
		start?: Nullable<number>;
		type?: '1' | 'a' | 'A' | 'i' | 'I';
	};

type AnchorHTMLAttributes<Target extends HTMLAnchorElement = HTMLAnchorElement> =
	HTMLAttributes<Target> & {
		href?: Nullable<string>;
		target?: Nullable<string>;
		rel?: Nullable<string>;
		download?: string | boolean;
		hrefLang?: Nullable<string>;
		type?: Nullable<string>;
		referrerPolicy?: Nullable<string>;
	};

type DataHTMLAttributes<Target extends HTMLDataElement = HTMLDataElement> =
	HTMLAttributes<Target> & {
		value?: Nullable<string>;
	};

type QuoteHTMLAttributes<Target extends HTMLQuoteElement = HTMLQuoteElement> =
	HTMLAttributes<Target> & {
		cite?: Nullable<string>;
	};

type TimeHTMLAttributes<Target extends HTMLTimeElement = HTMLTimeElement> =
	HTMLAttributes<Target> & {
		dateTime?: Nullable<string>;
	};

type AreaHTMLAttributes<Target extends HTMLAreaElement = HTMLAreaElement> =
	HTMLAttributes<Target> & {
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

type AudioHTMLAttributes<Target extends HTMLAudioElement = HTMLAudioElement> =
	HTMLAttributes<Target> & {
		src?: Nullable<string>;
		autoplay?: boolean;
		controls?: boolean;
		loop?: boolean;
		muted?: boolean;
		preload?: 'none' | 'metadata' | 'auto';
		crossOrigin?: 'anonymous' | 'use-credentials';
	};

type ImgHTMLAttributes<Target extends HTMLImageElement = HTMLImageElement> =
	HTMLAttributes<Target> & {
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

type MapHTMLAttributes<Target extends HTMLMapElement = HTMLMapElement> = HTMLAttributes<Target> & {
	name?: Nullable<string>;
};

type TrackHTMLAttributes<Target extends HTMLTrackElement = HTMLTrackElement> =
	HTMLAttributes<Target> & {
		default?: boolean;
		kind?: 'subtitles' | 'captions' | 'descriptions' | 'chapters' | 'metadata';
		label?: Nullable<string>;
		src?: Nullable<string>;
		srcLang?: Nullable<string>;
	};

type VideoHTMLAttributes<Target extends HTMLVideoElement = HTMLVideoElement> =
	HTMLAttributes<Target> & {
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

type EmbedHTMLAttributes<Target extends HTMLEmbedElement = HTMLEmbedElement> =
	HTMLAttributes<Target> & {
		src?: Nullable<string>;
		type?: Nullable<string>;
		width?: string | number;
		height?: string | number;
	};

type IframeHTMLAttributes<Target extends HTMLIFrameElement = HTMLIFrameElement> =
	HTMLAttributes<Target> & {
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

type ObjectHTMLAttributes<Target extends HTMLObjectElement = HTMLObjectElement> =
	HTMLAttributes<Target> & {
		data?: Nullable<string>;
		type?: Nullable<string>;
		name?: Nullable<string>;
		useMap?: Nullable<string>;
		width?: string | number;
		height?: string | number;
	};

type PortalHTMLAttributes<Target extends HTMLElement = HTMLElement> = HTMLAttributes<Target> & {
	referrerPolicy?: Nullable<string>;
	src?: Nullable<string>;
};

type SourceHTMLAttributes<Target extends HTMLSourceElement = HTMLSourceElement> =
	HTMLAttributes<Target> & {
		src?: Nullable<string>;
		type?: Nullable<string>;
		media?: Nullable<string>;
		sizes?: Nullable<string>;
		srcSet?: Nullable<string>;
	};

type CanvasHTMLAttributes<Target extends HTMLCanvasElement = HTMLCanvasElement> =
	HTMLAttributes<Target> & {
		width?: string | number;
		height?: string | number;
	};

type ScriptHTMLAttributes<Target extends HTMLScriptElement = HTMLScriptElement> =
	HTMLAttributes<Target> & {
		src?: Nullable<string>;
		type?: Nullable<string>;
		async?: boolean;
		defer?: boolean;
		crossOrigin?: 'anonymous' | 'use-credentials';
		integrity?: Nullable<string>;
		noModule?: boolean;
		referrerPolicy?: Nullable<string>;
	};

type ModHTMLAttributes<Target extends HTMLModElement = HTMLModElement> = HTMLAttributes<Target> & {
	cite?: Nullable<string>;
	dateTime?: Nullable<string>;
};

type ColHTMLAttributes<Target extends HTMLTableColElement = HTMLTableColElement> =
	HTMLAttributes<Target> & {
		span?: Nullable<number>;
	};

type TableCellHTMLAttributes<Target extends HTMLTableCellElement = HTMLTableCellElement> =
	HTMLAttributes<Target> & {
		colSpan?: Nullable<number>;
		rowSpan?: Nullable<number>;
		headers?: Nullable<string>;
	};

type ThHTMLAttributes<Target extends HTMLTableCellElement = HTMLTableCellElement> =
	TableCellHTMLAttributes<Target> & {
		scope?: 'row' | 'col' | 'rowgroup' | 'colgroup';
		abbr?: Nullable<string>;
	};

type ButtonHTMLAttributes<Target extends HTMLButtonElement = HTMLButtonElement> =
	HTMLAttributes<Target> & {
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

type FieldsetHTMLAttributes<Target extends HTMLFieldSetElement = HTMLFieldSetElement> =
	HTMLAttributes<Target> & {
		disabled?: boolean;
		form?: Nullable<string>;
		name?: Nullable<string>;
	};

type FormHTMLAttributes<Target extends HTMLFormElement = HTMLFormElement> =
	HTMLAttributes<Target> & {
		action?: Nullable<string>;
		method?: 'get' | 'post' | 'dialog';
		encType?: Nullable<string>;
		acceptCharset?: Nullable<string>;
		autoComplete?: 'on' | 'off';
		noValidate?: boolean;
		target?: Nullable<string>;
	};

type InputHTMLAttributes<Target extends HTMLInputElement = HTMLInputElement> =
	HTMLAttributes<Target> & {
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

type LabelHTMLAttributes<Target extends HTMLLabelElement = HTMLLabelElement> =
	HTMLAttributes<Target> & {
		for?: Nullable<string>;
		htmlFor?: Nullable<string>;
	};

type MeterHTMLAttributes<Target extends HTMLMeterElement = HTMLMeterElement> =
	HTMLAttributes<Target> & {
		value?: Nullable<number>;
		min?: Nullable<number>;
		max?: Nullable<number>;
		low?: Nullable<number>;
		high?: Nullable<number>;
		optimum?: Nullable<number>;
	};

type OptgroupHTMLAttributes<Target extends HTMLOptGroupElement = HTMLOptGroupElement> =
	HTMLAttributes<Target> & {
		disabled?: boolean;
		label?: Nullable<string>;
	};

type OptionHTMLAttributes<Target extends HTMLOptionElement = HTMLOptionElement> =
	HTMLAttributes<Target> & {
		value?: string | number;
		selected?: boolean;
		disabled?: boolean;
		label?: Nullable<string>;
	};

type OutputHTMLAttributes<Target extends HTMLOutputElement = HTMLOutputElement> =
	HTMLAttributes<Target> & {
		for?: Nullable<string>;
		htmlFor?: Nullable<string>;
		form?: Nullable<string>;
		name?: Nullable<string>;
	};

type ProgressHTMLAttributes<Target extends HTMLProgressElement = HTMLProgressElement> =
	HTMLAttributes<Target> & {
		value?: Nullable<number>;
		max?: Nullable<number>;
	};

type SelectHTMLAttributes<Target extends HTMLSelectElement = HTMLSelectElement> =
	HTMLAttributes<Target> & {
		disabled?: boolean;
		form?: Nullable<string>;
		multiple?: boolean;
		name?: Nullable<string>;
		required?: boolean;
		size?: Nullable<number>;
		autoComplete?: Nullable<string>;
	};

type TextareaHTMLAttributes<Target extends HTMLTextAreaElement = HTMLTextAreaElement> =
	HTMLAttributes<Target> & {
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

type DetailsHTMLAttributes<Target extends HTMLDetailsElement = HTMLDetailsElement> =
	HTMLAttributes<Target> & {
		open?: boolean;
	};

type DialogHTMLAttributes<Target extends HTMLDialogElement = HTMLDialogElement> =
	HTMLAttributes<Target> & {
		open?: boolean;
	};

type SlotHTMLAttributes<Target extends HTMLSlotElement = HTMLSlotElement> =
	HTMLAttributes<Target> & {
		name?: Nullable<string>;
	};

// Base HTML attributes
interface HTMLAttributes<Target extends globalThis.Element = globalThis.HTMLElement> {
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
	onClick?: ElementEventHandler<Target, 'click'>;
	onClickCapture?: ElementEventHandler<Target, 'click'>;
	onDblClick?: ElementEventHandler<Target, 'dblclick'>;
	onDblClickCapture?: ElementEventHandler<Target, 'dblclick'>;
	onInput?: ElementEventHandler<Target, 'input'>;
	onInputCapture?: ElementEventHandler<Target, 'input'>;
	onChange?: ElementEventHandler<Target, 'change'>;
	onChangeCapture?: ElementEventHandler<Target, 'change'>;
	onSubmit?: ElementEventHandler<Target, 'submit'>;
	onSubmitCapture?: ElementEventHandler<Target, 'submit'>;
	onFocus?: ElementEventHandler<Target, 'focus'>;
	onFocusCapture?: ElementEventHandler<Target, 'focus'>;
	onBlur?: ElementEventHandler<Target, 'blur'>;
	onBlurCapture?: ElementEventHandler<Target, 'blur'>;
	onKeyDown?: ElementEventHandler<Target, 'keydown'>;
	onKeyDownCapture?: ElementEventHandler<Target, 'keydown'>;
	onKeyUp?: ElementEventHandler<Target, 'keyup'>;
	onKeyUpCapture?: ElementEventHandler<Target, 'keyup'>;
	onKeyPress?: ElementEventHandler<Target, 'keypress'>;
	onKeyPressCapture?: ElementEventHandler<Target, 'keypress'>;
	onMouseDown?: ElementEventHandler<Target, 'mousedown'>;
	onMouseDownCapture?: ElementEventHandler<Target, 'mousedown'>;
	onMouseUp?: ElementEventHandler<Target, 'mouseup'>;
	onMouseUpCapture?: ElementEventHandler<Target, 'mouseup'>;
	onMouseEnter?: ElementEventHandler<Target, 'mouseenter'>;
	onMouseEnterCapture?: ElementEventHandler<Target, 'mouseenter'>;
	onMouseLeave?: ElementEventHandler<Target, 'mouseleave'>;
	onMouseLeaveCapture?: ElementEventHandler<Target, 'mouseleave'>;
	onMouseMove?: ElementEventHandler<Target, 'mousemove'>;
	onMouseMoveCapture?: ElementEventHandler<Target, 'mousemove'>;
	onMouseOver?: ElementEventHandler<Target, 'mouseover'>;
	onMouseOverCapture?: ElementEventHandler<Target, 'mouseover'>;
	onMouseOut?: ElementEventHandler<Target, 'mouseout'>;
	onMouseOutCapture?: ElementEventHandler<Target, 'mouseout'>;
	onWheel?: ElementEventHandler<Target, 'wheel'>;
	onWheelCapture?: ElementEventHandler<Target, 'wheel'>;
	onScroll?: ElementEventHandler<Target, 'scroll'>;
	onScrollCapture?: ElementEventHandler<Target, 'scroll'>;
	onTouchStart?: ElementEventHandler<Target, 'touchstart'>;
	onTouchStartCapture?: ElementEventHandler<Target, 'touchstart'>;
	onTouchMove?: ElementEventHandler<Target, 'touchmove'>;
	onTouchMoveCapture?: ElementEventHandler<Target, 'touchmove'>;
	onTouchEnd?: ElementEventHandler<Target, 'touchend'>;
	onTouchEndCapture?: ElementEventHandler<Target, 'touchend'>;
	onTouchCancel?: ElementEventHandler<Target, 'touchcancel'>;
	onTouchCancelCapture?: ElementEventHandler<Target, 'touchcancel'>;
	onDragStart?: ElementEventHandler<Target, 'dragstart'>;
	onDragStartCapture?: ElementEventHandler<Target, 'dragstart'>;
	onDrag?: ElementEventHandler<Target, 'drag'>;
	onDragCapture?: ElementEventHandler<Target, 'drag'>;
	onDragEnd?: ElementEventHandler<Target, 'dragend'>;
	onDragEndCapture?: ElementEventHandler<Target, 'dragend'>;
	onDragEnter?: ElementEventHandler<Target, 'dragenter'>;
	onDragEnterCapture?: ElementEventHandler<Target, 'dragenter'>;
	onDragLeave?: ElementEventHandler<Target, 'dragleave'>;
	onDragLeaveCapture?: ElementEventHandler<Target, 'dragleave'>;
	onDragOver?: ElementEventHandler<Target, 'dragover'>;
	onDragOverCapture?: ElementEventHandler<Target, 'dragover'>;
	onDrop?: ElementEventHandler<Target, 'drop'>;
	onDropCapture?: ElementEventHandler<Target, 'drop'>;
	onCopy?: ElementEventHandler<Target, 'copy'>;
	onCopyCapture?: ElementEventHandler<Target, 'copy'>;
	onCut?: ElementEventHandler<Target, 'cut'>;
	onCutCapture?: ElementEventHandler<Target, 'cut'>;
	onPaste?: ElementEventHandler<Target, 'paste'>;
	onPasteCapture?: ElementEventHandler<Target, 'paste'>;
	onLoad?: ElementEventHandler<Target, 'load'>;
	onLoadCapture?: ElementEventHandler<Target, 'load'>;
	onError?: ElementEventHandler<Target, 'error'>;
	onErrorCapture?: ElementEventHandler<Target, 'error'>;
	onResize?: ElementEventHandler<Target, 'resize'>;
	onResizeCapture?: ElementEventHandler<Target, 'resize'>;
	onAnimationStart?: ElementEventHandler<Target, 'animationstart'>;
	onAnimationStartCapture?: ElementEventHandler<Target, 'animationstart'>;
	onAnimationEnd?: ElementEventHandler<Target, 'animationend'>;
	onAnimationEndCapture?: ElementEventHandler<Target, 'animationend'>;
	onAnimationIteration?: ElementEventHandler<Target, 'animationiteration'>;
	onAnimationIterationCapture?: ElementEventHandler<Target, 'animationiteration'>;
	onTransitionEnd?: ElementEventHandler<Target, 'transitionend'>;
	onTransitionEndCapture?: ElementEventHandler<Target, 'transitionend'>;

	children?: any;
	[key: string]: any;
}

// SVG common attributes
interface SVGAttributes<Target extends globalThis.SVGElement = globalThis.SVGElement> {
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
	onClick?: ElementEventHandler<Target, 'click'>;
	onClickCapture?: ElementEventHandler<Target, 'click'>;
	onMouseDown?: ElementEventHandler<Target, 'mousedown'>;
	onMouseDownCapture?: ElementEventHandler<Target, 'mousedown'>;
	onMouseUp?: ElementEventHandler<Target, 'mouseup'>;
	onMouseUpCapture?: ElementEventHandler<Target, 'mouseup'>;
	onMouseMove?: ElementEventHandler<Target, 'mousemove'>;
	onMouseMoveCapture?: ElementEventHandler<Target, 'mousemove'>;
	onMouseEnter?: ElementEventHandler<Target, 'mouseenter'>;
	onMouseEnterCapture?: ElementEventHandler<Target, 'mouseenter'>;
	onMouseLeave?: ElementEventHandler<Target, 'mouseleave'>;
	onMouseLeaveCapture?: ElementEventHandler<Target, 'mouseleave'>;
	onMouseOver?: ElementEventHandler<Target, 'mouseover'>;
	onMouseOverCapture?: ElementEventHandler<Target, 'mouseover'>;
	onMouseOut?: ElementEventHandler<Target, 'mouseout'>;
	onMouseOutCapture?: ElementEventHandler<Target, 'mouseout'>;
	onFocus?: ElementEventHandler<Target, 'focus'>;
	onFocusCapture?: ElementEventHandler<Target, 'focus'>;
	onBlur?: ElementEventHandler<Target, 'blur'>;
	onBlurCapture?: ElementEventHandler<Target, 'blur'>;
	onLoad?: ElementEventHandler<Target, 'load'>;
	onLoadCapture?: ElementEventHandler<Target, 'load'>;
	onError?: ElementEventHandler<Target, 'error'>;
	onErrorCapture?: ElementEventHandler<Target, 'error'>;

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
interface SVGGradientAttributes<
	Target extends globalThis.SVGElement = globalThis.SVGElement,
> extends SVGAttributes<Target> {
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
			head: HTMLAttributes<HTMLHeadElement>;
			title: HTMLAttributes<HTMLTitleElement>;
			base: BaseHTMLAttributes<HTMLBaseElement>;
			link: LinkHTMLAttributes<HTMLLinkElement>;
			meta: MetaHTMLAttributes<HTMLMetaElement>;
			style: StyleHTMLAttributes<HTMLStyleElement>;

			// Sectioning root
			body: HTMLAttributes<HTMLBodyElement>;

			// Content sectioning
			address: HTMLAttributes<HTMLElement>;
			article: HTMLAttributes<HTMLElement>;
			aside: HTMLAttributes<HTMLElement>;
			footer: HTMLAttributes<HTMLElement>;
			header: HTMLAttributes<HTMLElement>;
			h1: HTMLAttributes<HTMLHeadingElement>;
			h2: HTMLAttributes<HTMLHeadingElement>;
			h3: HTMLAttributes<HTMLHeadingElement>;
			h4: HTMLAttributes<HTMLHeadingElement>;
			h5: HTMLAttributes<HTMLHeadingElement>;
			h6: HTMLAttributes<HTMLHeadingElement>;
			hgroup: HTMLAttributes<HTMLElement>;
			main: HTMLAttributes<HTMLElement>;
			nav: HTMLAttributes<HTMLElement>;
			section: HTMLAttributes<HTMLElement>;
			search: HTMLAttributes<HTMLElement>;

			// Text content
			blockquote: BlockquoteHTMLAttributes<HTMLQuoteElement>;
			dd: HTMLAttributes<HTMLElement>;
			div: HTMLAttributes<HTMLDivElement>;
			dl: HTMLAttributes<HTMLDListElement>;
			dt: HTMLAttributes<HTMLElement>;
			figcaption: HTMLAttributes<HTMLElement>;
			figure: HTMLAttributes<HTMLElement>;
			hr: HTMLAttributes<HTMLHRElement>;
			li: LiHTMLAttributes<HTMLLIElement>;
			menu: HTMLAttributes<HTMLMenuElement>;
			ol: OlHTMLAttributes<HTMLOListElement>;
			p: HTMLAttributes<HTMLParagraphElement>;
			pre: HTMLAttributes<HTMLPreElement>;
			ul: HTMLAttributes<HTMLUListElement>;

			// Inline text semantics
			a: AnchorHTMLAttributes<HTMLAnchorElement>;
			abbr: HTMLAttributes<HTMLElement>;
			b: HTMLAttributes<HTMLElement>;
			bdi: HTMLAttributes<HTMLElement>;
			bdo: HTMLAttributes<HTMLElement>;
			br: HTMLAttributes<HTMLBRElement>;
			cite: HTMLAttributes<HTMLElement>;
			code: HTMLAttributes<HTMLElement>;
			data: DataHTMLAttributes<HTMLDataElement>;
			dfn: HTMLAttributes<HTMLElement>;
			em: HTMLAttributes<HTMLElement>;
			i: HTMLAttributes<HTMLElement>;
			kbd: HTMLAttributes<HTMLElement>;
			mark: HTMLAttributes<HTMLElement>;
			q: QuoteHTMLAttributes<HTMLQuoteElement>;
			rp: HTMLAttributes<HTMLElement>;
			rt: HTMLAttributes<HTMLElement>;
			ruby: HTMLAttributes<HTMLElement>;
			s: HTMLAttributes<HTMLElement>;
			samp: HTMLAttributes<HTMLElement>;
			small: HTMLAttributes<HTMLElement>;
			span: HTMLAttributes<HTMLSpanElement>;
			strong: HTMLAttributes<HTMLElement>;
			sub: HTMLAttributes<HTMLElement>;
			sup: HTMLAttributes<HTMLElement>;
			time: TimeHTMLAttributes<HTMLTimeElement>;
			u: HTMLAttributes<HTMLElement>;
			var: HTMLAttributes<HTMLElement>;
			wbr: HTMLAttributes<HTMLElement>;

			// Image and multimedia
			area: AreaHTMLAttributes<HTMLAreaElement>;
			audio: AudioHTMLAttributes<HTMLAudioElement>;
			img: ImgHTMLAttributes<HTMLImageElement>;
			map: MapHTMLAttributes<HTMLMapElement>;
			track: TrackHTMLAttributes<HTMLTrackElement>;
			video: VideoHTMLAttributes<HTMLVideoElement>;

			// Embedded content
			embed: EmbedHTMLAttributes<HTMLEmbedElement>;
			iframe: IframeHTMLAttributes<HTMLIFrameElement>;
			object: ObjectHTMLAttributes<HTMLObjectElement>;
			picture: HTMLAttributes<HTMLPictureElement>;
			portal: PortalHTMLAttributes<HTMLElement>;
			source: SourceHTMLAttributes<HTMLSourceElement>;

			// SVG and MathML
			svg: HTMLAttributes<SVGElementTagNameMap['svg']> & SVGAttributes<SVGElementTagNameMap['svg']>;
			math: HTMLAttributes<MathMLElementTagNameMap['math']>;

			// SVG elements
			animate: HTMLAttributes<SVGElementTagNameMap['animate']> & SVGAnimationAttributes;
			animateMotion: HTMLAttributes<SVGElementTagNameMap['animateMotion']> & SVGAnimationAttributes;
			animateTransform: HTMLAttributes<SVGElementTagNameMap['animateTransform']> &
				SVGAnimationAttributes & {
					type?: 'translate' | 'scale' | 'rotate' | 'skewX' | 'skewY';
				};
			circle: HTMLAttributes<SVGElementTagNameMap['circle']> &
				SVGAttributes<SVGElementTagNameMap['circle']> & {
					cx?: string | number;
					cy?: string | number;
					r?: string | number;
				};
			clipPath: HTMLAttributes<SVGElementTagNameMap['clipPath']> &
				SVGAttributes<SVGElementTagNameMap['clipPath']> & {
					clipPathUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
				};
			defs: HTMLAttributes<SVGElementTagNameMap['defs']> &
				SVGAttributes<SVGElementTagNameMap['defs']>;
			desc: HTMLAttributes<SVGElementTagNameMap['desc']> &
				SVGAttributes<SVGElementTagNameMap['desc']>;
			ellipse: HTMLAttributes<SVGElementTagNameMap['ellipse']> &
				SVGAttributes<SVGElementTagNameMap['ellipse']> & {
					cx?: string | number;
					cy?: string | number;
					rx?: string | number;
					ry?: string | number;
				};
			feBlend: HTMLAttributes<SVGElementTagNameMap['feBlend']> &
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
			feColorMatrix: HTMLAttributes<SVGElementTagNameMap['feColorMatrix']> &
				SVGFilterAttributes & {
					type?: 'matrix' | 'saturate' | 'hueRotate' | 'luminanceToAlpha';
					values?: Nullable<string>;
				};
			feComponentTransfer: HTMLAttributes<SVGElementTagNameMap['feComponentTransfer']> &
				SVGFilterAttributes;
			feComposite: HTMLAttributes<SVGElementTagNameMap['feComposite']> &
				SVGFilterAttributes & {
					operator?: 'over' | 'in' | 'out' | 'atop' | 'xor' | 'lighter' | 'arithmetic';
					in2?: Nullable<string>;
					k1?: Nullable<number>;
					k2?: Nullable<number>;
					k3?: Nullable<number>;
					k4?: Nullable<number>;
				};
			feConvolveMatrix: HTMLAttributes<SVGElementTagNameMap['feConvolveMatrix']> &
				SVGFilterAttributes;
			feDiffuseLighting: HTMLAttributes<SVGElementTagNameMap['feDiffuseLighting']> &
				SVGFilterAttributes;
			feDisplacementMap: HTMLAttributes<SVGElementTagNameMap['feDisplacementMap']> &
				SVGFilterAttributes;
			feDistantLight: HTMLAttributes<SVGElementTagNameMap['feDistantLight']> &
				SVGFilterAttributes & {
					azimuth?: Nullable<number>;
					elevation?: Nullable<number>;
				};
			feDropShadow: HTMLAttributes<SVGElementTagNameMap['feDropShadow']> &
				SVGFilterAttributes & {
					dx?: Nullable<number>;
					dy?: Nullable<number>;
					stdDeviation?: number | string;
				};
			feFlood: HTMLAttributes<SVGElementTagNameMap['feFlood']> &
				SVGFilterAttributes & {
					'flood-color'?: Nullable<string>;
					'flood-opacity'?: number | string;
				};
			feFuncA: HTMLAttributes<SVGElementTagNameMap['feFuncA']> & SVGTransferFunctionAttributes;
			feFuncB: HTMLAttributes<SVGElementTagNameMap['feFuncB']> & SVGTransferFunctionAttributes;
			feFuncG: HTMLAttributes<SVGElementTagNameMap['feFuncG']> & SVGTransferFunctionAttributes;
			feFuncR: HTMLAttributes<SVGElementTagNameMap['feFuncR']> & SVGTransferFunctionAttributes;
			feGaussianBlur: HTMLAttributes<SVGElementTagNameMap['feGaussianBlur']> &
				SVGFilterAttributes & {
					stdDeviation?: number | string;
				};
			feImage: HTMLAttributes<SVGElementTagNameMap['feImage']> & SVGFilterAttributes;
			feMerge: HTMLAttributes<SVGElementTagNameMap['feMerge']> & SVGFilterAttributes;
			feMergeNode: HTMLAttributes<SVGElementTagNameMap['feMergeNode']> & SVGFilterAttributes;
			feMorphology: HTMLAttributes<SVGElementTagNameMap['feMorphology']> &
				SVGFilterAttributes & {
					operator?: 'erode' | 'dilate';
					radius?: number | string;
				};
			feOffset: HTMLAttributes<SVGElementTagNameMap['feOffset']> &
				SVGFilterAttributes & {
					dx?: Nullable<number>;
					dy?: Nullable<number>;
				};
			fePointLight: HTMLAttributes<SVGElementTagNameMap['fePointLight']> &
				SVGFilterAttributes & {
					x?: Nullable<number>;
					y?: Nullable<number>;
					z?: Nullable<number>;
				};
			feSpecularLighting: HTMLAttributes<SVGElementTagNameMap['feSpecularLighting']> &
				SVGFilterAttributes;
			feSpotLight: HTMLAttributes<SVGElementTagNameMap['feSpotLight']> &
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
			feTile: HTMLAttributes<SVGElementTagNameMap['feTile']> & SVGFilterAttributes;
			feTurbulence: HTMLAttributes<SVGElementTagNameMap['feTurbulence']> &
				SVGFilterAttributes & {
					baseFrequency?: number | string;
					numOctaves?: Nullable<number>;
					seed?: Nullable<number>;
					stitchTiles?: 'stitch' | 'noStitch';
					type?: 'fractalNoise' | 'turbulence';
				};
			filter: HTMLAttributes<SVGElementTagNameMap['filter']> &
				SVGAttributes<SVGElementTagNameMap['filter']> & {
					filterUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
					primitiveUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
					x?: string | number;
					y?: string | number;
					width?: string | number;
					height?: string | number;
				};
			foreignObject: HTMLAttributes<SVGElementTagNameMap['foreignObject']> &
				SVGAttributes<SVGElementTagNameMap['foreignObject']> & {
					x?: string | number;
					y?: string | number;
					width?: string | number;
					height?: string | number;
				};
			g: HTMLAttributes<SVGElementTagNameMap['g']> & SVGAttributes<SVGElementTagNameMap['g']>;
			image: HTMLAttributes<SVGElementTagNameMap['image']> &
				SVGAttributes<SVGElementTagNameMap['image']> & {
					href?: Nullable<string>;
					'xlink:href'?: Nullable<string>;
					x?: string | number;
					y?: string | number;
					width?: string | number;
					height?: string | number;
					preserveAspectRatio?: Nullable<string>;
				};
			line: HTMLAttributes<SVGElementTagNameMap['line']> &
				SVGAttributes<SVGElementTagNameMap['line']> & {
					x1?: string | number;
					y1?: string | number;
					x2?: string | number;
					y2?: string | number;
				};
			linearGradient: HTMLAttributes<SVGElementTagNameMap['linearGradient']> &
				SVGGradientAttributes<SVGElementTagNameMap['linearGradient']> & {
					x1?: string | number;
					y1?: string | number;
					x2?: string | number;
					y2?: string | number;
				};
			marker: HTMLAttributes<SVGElementTagNameMap['marker']> &
				SVGAttributes<SVGElementTagNameMap['marker']> & {
					markerHeight?: string | number;
					markerUnits?: 'strokeWidth' | 'userSpaceOnUse';
					markerWidth?: string | number;
					orient?: string | number;
					refX?: string | number;
					refY?: string | number;
				};
			mask: HTMLAttributes<SVGElementTagNameMap['mask']> &
				SVGAttributes<SVGElementTagNameMap['mask']> & {
					maskContentUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
					maskUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
					x?: string | number;
					y?: string | number;
					width?: string | number;
					height?: string | number;
				};
			metadata: HTMLAttributes<SVGElementTagNameMap['metadata']> &
				SVGAttributes<SVGElementTagNameMap['metadata']>;
			mpath: HTMLAttributes<SVGElementTagNameMap['mpath']> &
				SVGAttributes<SVGElementTagNameMap['mpath']> & {
					'xlink:href'?: Nullable<string>;
				};
			path: HTMLAttributes<SVGElementTagNameMap['path']> &
				SVGAttributes<SVGElementTagNameMap['path']> & {
					d?: Nullable<string>;
					pathLength?: Nullable<number>;
				};
			pattern: HTMLAttributes<SVGElementTagNameMap['pattern']> &
				SVGAttributes<SVGElementTagNameMap['pattern']> & {
					patternContentUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
					patternTransform?: Nullable<string>;
					patternUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
					x?: string | number;
					y?: string | number;
					width?: string | number;
					height?: string | number;
				};
			polygon: HTMLAttributes<SVGElementTagNameMap['polygon']> &
				SVGAttributes<SVGElementTagNameMap['polygon']> & {
					points?: Nullable<string>;
				};
			polyline: HTMLAttributes<SVGElementTagNameMap['polyline']> &
				SVGAttributes<SVGElementTagNameMap['polyline']> & {
					points?: Nullable<string>;
				};
			radialGradient: HTMLAttributes<SVGElementTagNameMap['radialGradient']> &
				SVGGradientAttributes<SVGElementTagNameMap['radialGradient']> & {
					cx?: string | number;
					cy?: string | number;
					r?: string | number;
					fx?: string | number;
					fy?: string | number;
					fr?: string | number;
				};
			rect: HTMLAttributes<SVGElementTagNameMap['rect']> &
				SVGAttributes<SVGElementTagNameMap['rect']> & {
					x?: string | number;
					y?: string | number;
					width?: string | number;
					height?: string | number;
					rx?: string | number;
					ry?: string | number;
				};
			set: HTMLAttributes<SVGElementTagNameMap['set']> & SVGAnimationAttributes;
			stop: HTMLAttributes<SVGElementTagNameMap['stop']> &
				SVGAttributes<SVGElementTagNameMap['stop']> & {
					offset?: string | number;
					'stop-color'?: Nullable<string>;
					'stop-opacity'?: number | string;
				};
			switch: HTMLAttributes<SVGElementTagNameMap['switch']> &
				SVGAttributes<SVGElementTagNameMap['switch']>;
			symbol: HTMLAttributes<SVGElementTagNameMap['symbol']> &
				SVGAttributes<SVGElementTagNameMap['symbol']> & {
					viewBox?: Nullable<string>;
					preserveAspectRatio?: Nullable<string>;
					refX?: string | number;
					refY?: string | number;
				};
			text: HTMLAttributes<SVGElementTagNameMap['text']> &
				SVGAttributes<SVGElementTagNameMap['text']> &
				SVGTextAttributes;
			textPath: HTMLAttributes<SVGElementTagNameMap['textPath']> &
				SVGAttributes<SVGElementTagNameMap['textPath']> &
				SVGTextAttributes & {
					href?: Nullable<string>;
					'xlink:href'?: Nullable<string>;
					startOffset?: string | number;
					method?: 'align' | 'stretch';
					spacing?: 'auto' | 'exact';
				};
			tspan: HTMLAttributes<SVGElementTagNameMap['tspan']> &
				SVGAttributes<SVGElementTagNameMap['tspan']> &
				SVGTextAttributes;
			use: HTMLAttributes<SVGElementTagNameMap['use']> &
				SVGAttributes<SVGElementTagNameMap['use']> & {
					href?: Nullable<string>;
					'xlink:href'?: Nullable<string>;
					x?: string | number;
					y?: string | number;
					width?: string | number;
					height?: string | number;
				};
			view: HTMLAttributes<SVGElementTagNameMap['view']> &
				SVGAttributes<SVGElementTagNameMap['view']> & {
					viewBox?: Nullable<string>;
					preserveAspectRatio?: Nullable<string>;
				};

			// Scripting
			canvas: CanvasHTMLAttributes<HTMLCanvasElement>;
			noscript: HTMLAttributes<HTMLElement>;
			script: ScriptHTMLAttributes<HTMLScriptElement>;

			// Demarcating edits
			del: ModHTMLAttributes<HTMLModElement>;
			ins: ModHTMLAttributes<HTMLModElement>;

			// Table content
			caption: HTMLAttributes<HTMLTableCaptionElement>;
			col: ColHTMLAttributes<HTMLTableColElement>;
			colgroup: ColHTMLAttributes<HTMLTableColElement>;
			table: HTMLAttributes<HTMLTableElement>;
			tbody: HTMLAttributes<HTMLTableSectionElement>;
			td: TableCellHTMLAttributes<HTMLTableCellElement>;
			tfoot: HTMLAttributes<HTMLTableSectionElement>;
			th: ThHTMLAttributes<HTMLTableCellElement>;
			thead: HTMLAttributes<HTMLTableSectionElement>;
			tr: HTMLAttributes<HTMLTableRowElement>;

			// Forms
			button: ButtonHTMLAttributes<HTMLButtonElement>;
			datalist: HTMLAttributes<HTMLDataListElement>;
			fieldset: FieldsetHTMLAttributes<HTMLFieldSetElement>;
			form: FormHTMLAttributes<HTMLFormElement>;
			input: InputHTMLAttributes<HTMLInputElement>;
			label: LabelHTMLAttributes<HTMLLabelElement>;
			legend: HTMLAttributes<HTMLLegendElement>;
			meter: MeterHTMLAttributes<HTMLMeterElement>;
			optgroup: OptgroupHTMLAttributes<HTMLOptGroupElement>;
			option: OptionHTMLAttributes<HTMLOptionElement>;
			output: OutputHTMLAttributes<HTMLOutputElement>;
			progress: ProgressHTMLAttributes<HTMLProgressElement>;
			select: SelectHTMLAttributes<HTMLSelectElement>;
			textarea: TextareaHTMLAttributes<HTMLTextAreaElement>;

			// Interactive elements
			details: DetailsHTMLAttributes<HTMLDetailsElement>;
			dialog: DialogHTMLAttributes<HTMLDialogElement>;
			summary: HTMLAttributes<HTMLElement>;

			// Web Components
			slot: SlotHTMLAttributes<HTMLSlotElement>;
			template: HTMLAttributes<HTMLTemplateElement>;

			// Catch-all for any other elements
			[elemName: string]: HTMLAttributes<never>;
		}

		interface ElementChildrenAttribute {
			children: {};
		}
	}
}
