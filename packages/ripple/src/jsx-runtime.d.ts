import type {
	AddEventObject,
	Component,
	FragmentProps,
	RefKey,
	RefValue,
	TSRXElement,
} from '#public';
import type { Nullable } from '@tsrx/core/types/helpers';
export type { RefValue } from '#public';

/**
 * Ripple JSX Runtime Type Definitions
 * Ripple components are imperative, but JSX expressions still represent
 * renderable TSRX values when used in expression positions.
 */

// JSX accepts the same component return values as the public runtime APIs.
export type ComponentType<P = {}> = Component<P>;

/**
 * Create a JSX element (for elements with children)
 * In Ripple, this doesn't return anything - components are imperative
 */
export function jsx(
	type: string | ComponentType<any>,
	props?: any,
	key?: string | number | null,
): TSRXElement;

export function rsx(
	type: string | ComponentType<any>,
	props?: any,
	key?: string | number | null,
): TSRXElement;

/**
 * Create a JSX element with static children (optimization for multiple children)
 * In Ripple, this doesn't return anything - components are imperative
 */
export function jsxs(
	type: string | ComponentType<any>,
	props?: any,
	key?: string | number | null,
): TSRXElement;

/**
 * JSX Fragment component
 * Ripple fragments are renderable expression values.
 */
export function Fragment(props: FragmentProps): TSRXElement;

/** JSX attributes live under Ripple so editor hovers identify their framework. */
declare namespace Ripple {
	type ClassValue = string | import('clsx').ClassArray | import('clsx').ClassDictionary;

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

	type EventHandlerValue<
		Target extends globalThis.EventTarget,
		EventType extends globalThis.Event,
	> = EventHandler<Target, EventType> | EventHandlerObject<Target, EventType>;

	type RefAttribute<Target extends globalThis.Element> = {
		[Key in RefKey]?: RefValue<Target>;
	};

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

	type MapHTMLAttributes<Target extends HTMLMapElement = HTMLMapElement> =
		HTMLAttributes<Target> & {
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

	type ModHTMLAttributes<Target extends HTMLModElement = HTMLModElement> =
		HTMLAttributes<Target> & {
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

	/** Ripple's named and symbol-keyed DOM refs. */
	interface RefAttributes<Target extends globalThis.Element> extends RefAttribute<Target> {
		ref?: RefValue<Target>;
	}

	/** Combine an element's attributes with Ripple's DOM ref props. */
	type DetailedHTMLProps<
		E extends HTMLAttributes<Target>,
		Target extends globalThis.Element,
	> = RefAttributes<Target> & E;

	// Base HTML attributes
	interface HTMLAttributes<
		Target extends globalThis.Element = globalThis.HTMLElement,
	> extends RefAttributes<Target> {
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
			'auto' | 'optimizeSpeed' | 'optimizeLegibility' | 'geometricPrecision' | 'inherit';
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
			'none' | 'non-scaling-stroke' | 'non-scaling-size' | 'non-rotation' | 'fixed-position';
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

	namespace JSX {
		type Element = TSRXElement;
		type ElementType = keyof IntrinsicElements | ComponentType<any>;

		interface IntrinsicElements {
			// Document metadata
			head: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLHeadElement>, HTMLHeadElement>;
			title: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLTitleElement>, HTMLTitleElement>;
			base: Ripple.DetailedHTMLProps<Ripple.BaseHTMLAttributes<HTMLBaseElement>, HTMLBaseElement>;
			link: Ripple.DetailedHTMLProps<Ripple.LinkHTMLAttributes<HTMLLinkElement>, HTMLLinkElement>;
			meta: Ripple.DetailedHTMLProps<Ripple.MetaHTMLAttributes<HTMLMetaElement>, HTMLMetaElement>;
			style: Ripple.DetailedHTMLProps<
				Ripple.StyleHTMLAttributes<HTMLStyleElement>,
				HTMLStyleElement
			>;

			// Sectioning root
			body: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLBodyElement>, HTMLBodyElement>;

			// Content sectioning
			address: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			article: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			aside: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			footer: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			header: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			h1: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
			h2: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
			h3: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
			h4: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
			h5: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
			h6: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
			hgroup: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			main: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			nav: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			section: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			search: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;

			// Text content
			blockquote: Ripple.DetailedHTMLProps<
				Ripple.BlockquoteHTMLAttributes<HTMLQuoteElement>,
				HTMLQuoteElement
			>;
			dd: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			div: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
			dl: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLDListElement>, HTMLDListElement>;
			dt: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			figcaption: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			figure: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			hr: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLHRElement>, HTMLHRElement>;
			li: Ripple.DetailedHTMLProps<Ripple.LiHTMLAttributes<HTMLLIElement>, HTMLLIElement>;
			menu: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLMenuElement>, HTMLMenuElement>;
			ol: Ripple.DetailedHTMLProps<Ripple.OlHTMLAttributes<HTMLOListElement>, HTMLOListElement>;
			p: Ripple.DetailedHTMLProps<
				Ripple.HTMLAttributes<HTMLParagraphElement>,
				HTMLParagraphElement
			>;
			pre: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLPreElement>, HTMLPreElement>;
			ul: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLUListElement>, HTMLUListElement>;

			// Inline text semantics
			a: Ripple.DetailedHTMLProps<
				Ripple.AnchorHTMLAttributes<HTMLAnchorElement>,
				HTMLAnchorElement
			>;
			abbr: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			b: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			bdi: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			bdo: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			br: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLBRElement>, HTMLBRElement>;
			cite: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			code: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			data: Ripple.DetailedHTMLProps<Ripple.DataHTMLAttributes<HTMLDataElement>, HTMLDataElement>;
			dfn: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			em: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			i: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			kbd: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			mark: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			q: Ripple.DetailedHTMLProps<Ripple.QuoteHTMLAttributes<HTMLQuoteElement>, HTMLQuoteElement>;
			rp: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			rt: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			ruby: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			s: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			samp: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			small: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			span: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;
			strong: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			sub: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			sup: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			time: Ripple.DetailedHTMLProps<Ripple.TimeHTMLAttributes<HTMLTimeElement>, HTMLTimeElement>;
			u: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			var: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			wbr: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;

			// Image and multimedia
			area: Ripple.DetailedHTMLProps<Ripple.AreaHTMLAttributes<HTMLAreaElement>, HTMLAreaElement>;
			audio: Ripple.DetailedHTMLProps<
				Ripple.AudioHTMLAttributes<HTMLAudioElement>,
				HTMLAudioElement
			>;
			img: Ripple.DetailedHTMLProps<Ripple.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>;
			map: Ripple.DetailedHTMLProps<Ripple.MapHTMLAttributes<HTMLMapElement>, HTMLMapElement>;
			track: Ripple.DetailedHTMLProps<
				Ripple.TrackHTMLAttributes<HTMLTrackElement>,
				HTMLTrackElement
			>;
			video: Ripple.DetailedHTMLProps<
				Ripple.VideoHTMLAttributes<HTMLVideoElement>,
				HTMLVideoElement
			>;

			// Embedded content
			embed: Ripple.DetailedHTMLProps<
				Ripple.EmbedHTMLAttributes<HTMLEmbedElement>,
				HTMLEmbedElement
			>;
			iframe: Ripple.DetailedHTMLProps<
				Ripple.IframeHTMLAttributes<HTMLIFrameElement>,
				HTMLIFrameElement
			>;
			object: Ripple.DetailedHTMLProps<
				Ripple.ObjectHTMLAttributes<HTMLObjectElement>,
				HTMLObjectElement
			>;
			picture: Ripple.DetailedHTMLProps<
				Ripple.HTMLAttributes<HTMLPictureElement>,
				HTMLPictureElement
			>;
			portal: Ripple.DetailedHTMLProps<Ripple.PortalHTMLAttributes<HTMLElement>, HTMLElement>;
			source: Ripple.DetailedHTMLProps<
				Ripple.SourceHTMLAttributes<HTMLSourceElement>,
				HTMLSourceElement
			>;

			// SVG and MathML
			svg: Ripple.HTMLAttributes<SVGElementTagNameMap['svg']> &
				Ripple.SVGAttributes<SVGElementTagNameMap['svg']>;
			math: Ripple.HTMLAttributes<MathMLElementTagNameMap['math']>;

			// SVG elements
			animate: Ripple.HTMLAttributes<SVGElementTagNameMap['animate']> &
				Ripple.SVGAnimationAttributes;
			animateMotion: Ripple.HTMLAttributes<SVGElementTagNameMap['animateMotion']> &
				Ripple.SVGAnimationAttributes;
			animateTransform: Ripple.HTMLAttributes<SVGElementTagNameMap['animateTransform']> &
				Ripple.SVGAnimationAttributes & {
					type?: 'translate' | 'scale' | 'rotate' | 'skewX' | 'skewY';
				};
			circle: Ripple.HTMLAttributes<SVGElementTagNameMap['circle']> &
				Ripple.SVGAttributes<SVGElementTagNameMap['circle']> & {
					cx?: string | number;
					cy?: string | number;
					r?: string | number;
				};
			clipPath: Ripple.HTMLAttributes<SVGElementTagNameMap['clipPath']> &
				Ripple.SVGAttributes<SVGElementTagNameMap['clipPath']> & {
					clipPathUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
				};
			defs: Ripple.HTMLAttributes<SVGElementTagNameMap['defs']> &
				Ripple.SVGAttributes<SVGElementTagNameMap['defs']>;
			desc: Ripple.HTMLAttributes<SVGElementTagNameMap['desc']> &
				Ripple.SVGAttributes<SVGElementTagNameMap['desc']>;
			ellipse: Ripple.HTMLAttributes<SVGElementTagNameMap['ellipse']> &
				Ripple.SVGAttributes<SVGElementTagNameMap['ellipse']> & {
					cx?: string | number;
					cy?: string | number;
					rx?: string | number;
					ry?: string | number;
				};
			feBlend: Ripple.HTMLAttributes<SVGElementTagNameMap['feBlend']> &
				Ripple.SVGFilterAttributes & {
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
			feColorMatrix: Ripple.HTMLAttributes<SVGElementTagNameMap['feColorMatrix']> &
				Ripple.SVGFilterAttributes & {
					type?: 'matrix' | 'saturate' | 'hueRotate' | 'luminanceToAlpha';
					values?: Nullable<string>;
				};
			feComponentTransfer: Ripple.HTMLAttributes<SVGElementTagNameMap['feComponentTransfer']> &
				Ripple.SVGFilterAttributes;
			feComposite: Ripple.HTMLAttributes<SVGElementTagNameMap['feComposite']> &
				Ripple.SVGFilterAttributes & {
					operator?: 'over' | 'in' | 'out' | 'atop' | 'xor' | 'lighter' | 'arithmetic';
					in2?: Nullable<string>;
					k1?: Nullable<number>;
					k2?: Nullable<number>;
					k3?: Nullable<number>;
					k4?: Nullable<number>;
				};
			feConvolveMatrix: Ripple.HTMLAttributes<SVGElementTagNameMap['feConvolveMatrix']> &
				Ripple.SVGFilterAttributes;
			feDiffuseLighting: Ripple.HTMLAttributes<SVGElementTagNameMap['feDiffuseLighting']> &
				Ripple.SVGFilterAttributes;
			feDisplacementMap: Ripple.HTMLAttributes<SVGElementTagNameMap['feDisplacementMap']> &
				Ripple.SVGFilterAttributes;
			feDistantLight: Ripple.HTMLAttributes<SVGElementTagNameMap['feDistantLight']> &
				Ripple.SVGFilterAttributes & {
					azimuth?: Nullable<number>;
					elevation?: Nullable<number>;
				};
			feDropShadow: Ripple.HTMLAttributes<SVGElementTagNameMap['feDropShadow']> &
				Ripple.SVGFilterAttributes & {
					dx?: Nullable<number>;
					dy?: Nullable<number>;
					stdDeviation?: number | string;
				};
			feFlood: Ripple.HTMLAttributes<SVGElementTagNameMap['feFlood']> &
				Ripple.SVGFilterAttributes & {
					'flood-color'?: Nullable<string>;
					'flood-opacity'?: number | string;
				};
			feFuncA: Ripple.HTMLAttributes<SVGElementTagNameMap['feFuncA']> &
				Ripple.SVGTransferFunctionAttributes;
			feFuncB: Ripple.HTMLAttributes<SVGElementTagNameMap['feFuncB']> &
				Ripple.SVGTransferFunctionAttributes;
			feFuncG: Ripple.HTMLAttributes<SVGElementTagNameMap['feFuncG']> &
				Ripple.SVGTransferFunctionAttributes;
			feFuncR: Ripple.HTMLAttributes<SVGElementTagNameMap['feFuncR']> &
				Ripple.SVGTransferFunctionAttributes;
			feGaussianBlur: Ripple.HTMLAttributes<SVGElementTagNameMap['feGaussianBlur']> &
				Ripple.SVGFilterAttributes & {
					stdDeviation?: number | string;
				};
			feImage: Ripple.HTMLAttributes<SVGElementTagNameMap['feImage']> & Ripple.SVGFilterAttributes;
			feMerge: Ripple.HTMLAttributes<SVGElementTagNameMap['feMerge']> & Ripple.SVGFilterAttributes;
			feMergeNode: Ripple.HTMLAttributes<SVGElementTagNameMap['feMergeNode']> &
				Ripple.SVGFilterAttributes;
			feMorphology: Ripple.HTMLAttributes<SVGElementTagNameMap['feMorphology']> &
				Ripple.SVGFilterAttributes & {
					operator?: 'erode' | 'dilate';
					radius?: number | string;
				};
			feOffset: Ripple.HTMLAttributes<SVGElementTagNameMap['feOffset']> &
				Ripple.SVGFilterAttributes & {
					dx?: Nullable<number>;
					dy?: Nullable<number>;
				};
			fePointLight: Ripple.HTMLAttributes<SVGElementTagNameMap['fePointLight']> &
				Ripple.SVGFilterAttributes & {
					x?: Nullable<number>;
					y?: Nullable<number>;
					z?: Nullable<number>;
				};
			feSpecularLighting: Ripple.HTMLAttributes<SVGElementTagNameMap['feSpecularLighting']> &
				Ripple.SVGFilterAttributes;
			feSpotLight: Ripple.HTMLAttributes<SVGElementTagNameMap['feSpotLight']> &
				Ripple.SVGFilterAttributes & {
					x?: Nullable<number>;
					y?: Nullable<number>;
					z?: Nullable<number>;
					pointsAtX?: Nullable<number>;
					pointsAtY?: Nullable<number>;
					pointsAtZ?: Nullable<number>;
					specularExponent?: Nullable<number>;
					limitingConeAngle?: Nullable<number>;
				};
			feTile: Ripple.HTMLAttributes<SVGElementTagNameMap['feTile']> & Ripple.SVGFilterAttributes;
			feTurbulence: Ripple.HTMLAttributes<SVGElementTagNameMap['feTurbulence']> &
				Ripple.SVGFilterAttributes & {
					baseFrequency?: number | string;
					numOctaves?: Nullable<number>;
					seed?: Nullable<number>;
					stitchTiles?: 'stitch' | 'noStitch';
					type?: 'fractalNoise' | 'turbulence';
				};
			filter: Ripple.HTMLAttributes<SVGElementTagNameMap['filter']> &
				Ripple.SVGAttributes<SVGElementTagNameMap['filter']> & {
					filterUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
					primitiveUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
					x?: string | number;
					y?: string | number;
					width?: string | number;
					height?: string | number;
				};
			foreignObject: Ripple.HTMLAttributes<SVGElementTagNameMap['foreignObject']> &
				Ripple.SVGAttributes<SVGElementTagNameMap['foreignObject']> & {
					x?: string | number;
					y?: string | number;
					width?: string | number;
					height?: string | number;
				};
			g: Ripple.HTMLAttributes<SVGElementTagNameMap['g']> &
				Ripple.SVGAttributes<SVGElementTagNameMap['g']>;
			image: Ripple.HTMLAttributes<SVGElementTagNameMap['image']> &
				Ripple.SVGAttributes<SVGElementTagNameMap['image']> & {
					href?: Nullable<string>;
					'xlink:href'?: Nullable<string>;
					x?: string | number;
					y?: string | number;
					width?: string | number;
					height?: string | number;
					preserveAspectRatio?: Nullable<string>;
				};
			line: Ripple.HTMLAttributes<SVGElementTagNameMap['line']> &
				Ripple.SVGAttributes<SVGElementTagNameMap['line']> & {
					x1?: string | number;
					y1?: string | number;
					x2?: string | number;
					y2?: string | number;
				};
			linearGradient: Ripple.HTMLAttributes<SVGElementTagNameMap['linearGradient']> &
				Ripple.SVGGradientAttributes<SVGElementTagNameMap['linearGradient']> & {
					x1?: string | number;
					y1?: string | number;
					x2?: string | number;
					y2?: string | number;
				};
			marker: Ripple.HTMLAttributes<SVGElementTagNameMap['marker']> &
				Ripple.SVGAttributes<SVGElementTagNameMap['marker']> & {
					markerHeight?: string | number;
					markerUnits?: 'strokeWidth' | 'userSpaceOnUse';
					markerWidth?: string | number;
					orient?: string | number;
					refX?: string | number;
					refY?: string | number;
				};
			mask: Ripple.HTMLAttributes<SVGElementTagNameMap['mask']> &
				Ripple.SVGAttributes<SVGElementTagNameMap['mask']> & {
					maskContentUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
					maskUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
					x?: string | number;
					y?: string | number;
					width?: string | number;
					height?: string | number;
				};
			metadata: Ripple.HTMLAttributes<SVGElementTagNameMap['metadata']> &
				Ripple.SVGAttributes<SVGElementTagNameMap['metadata']>;
			mpath: Ripple.HTMLAttributes<SVGElementTagNameMap['mpath']> &
				Ripple.SVGAttributes<SVGElementTagNameMap['mpath']> & {
					'xlink:href'?: Nullable<string>;
				};
			path: Ripple.HTMLAttributes<SVGElementTagNameMap['path']> &
				Ripple.SVGAttributes<SVGElementTagNameMap['path']> & {
					d?: Nullable<string>;
					pathLength?: Nullable<number>;
				};
			pattern: Ripple.HTMLAttributes<SVGElementTagNameMap['pattern']> &
				Ripple.SVGAttributes<SVGElementTagNameMap['pattern']> & {
					patternContentUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
					patternTransform?: Nullable<string>;
					patternUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
					x?: string | number;
					y?: string | number;
					width?: string | number;
					height?: string | number;
				};
			polygon: Ripple.HTMLAttributes<SVGElementTagNameMap['polygon']> &
				Ripple.SVGAttributes<SVGElementTagNameMap['polygon']> & {
					points?: Nullable<string>;
				};
			polyline: Ripple.HTMLAttributes<SVGElementTagNameMap['polyline']> &
				Ripple.SVGAttributes<SVGElementTagNameMap['polyline']> & {
					points?: Nullable<string>;
				};
			radialGradient: Ripple.HTMLAttributes<SVGElementTagNameMap['radialGradient']> &
				Ripple.SVGGradientAttributes<SVGElementTagNameMap['radialGradient']> & {
					cx?: string | number;
					cy?: string | number;
					r?: string | number;
					fx?: string | number;
					fy?: string | number;
					fr?: string | number;
				};
			rect: Ripple.HTMLAttributes<SVGElementTagNameMap['rect']> &
				Ripple.SVGAttributes<SVGElementTagNameMap['rect']> & {
					x?: string | number;
					y?: string | number;
					width?: string | number;
					height?: string | number;
					rx?: string | number;
					ry?: string | number;
				};
			set: Ripple.HTMLAttributes<SVGElementTagNameMap['set']> & Ripple.SVGAnimationAttributes;
			stop: Ripple.HTMLAttributes<SVGElementTagNameMap['stop']> &
				Ripple.SVGAttributes<SVGElementTagNameMap['stop']> & {
					offset?: string | number;
					'stop-color'?: Nullable<string>;
					'stop-opacity'?: number | string;
				};
			switch: Ripple.HTMLAttributes<SVGElementTagNameMap['switch']> &
				Ripple.SVGAttributes<SVGElementTagNameMap['switch']>;
			symbol: Ripple.HTMLAttributes<SVGElementTagNameMap['symbol']> &
				Ripple.SVGAttributes<SVGElementTagNameMap['symbol']> & {
					viewBox?: Nullable<string>;
					preserveAspectRatio?: Nullable<string>;
					refX?: string | number;
					refY?: string | number;
				};
			text: Ripple.HTMLAttributes<SVGElementTagNameMap['text']> &
				Ripple.SVGAttributes<SVGElementTagNameMap['text']> &
				Ripple.SVGTextAttributes;
			textPath: Ripple.HTMLAttributes<SVGElementTagNameMap['textPath']> &
				Ripple.SVGAttributes<SVGElementTagNameMap['textPath']> &
				Ripple.SVGTextAttributes & {
					href?: Nullable<string>;
					'xlink:href'?: Nullable<string>;
					startOffset?: string | number;
					method?: 'align' | 'stretch';
					spacing?: 'auto' | 'exact';
				};
			tspan: Ripple.HTMLAttributes<SVGElementTagNameMap['tspan']> &
				Ripple.SVGAttributes<SVGElementTagNameMap['tspan']> &
				Ripple.SVGTextAttributes;
			use: Ripple.HTMLAttributes<SVGElementTagNameMap['use']> &
				Ripple.SVGAttributes<SVGElementTagNameMap['use']> & {
					href?: Nullable<string>;
					'xlink:href'?: Nullable<string>;
					x?: string | number;
					y?: string | number;
					width?: string | number;
					height?: string | number;
				};
			view: Ripple.HTMLAttributes<SVGElementTagNameMap['view']> &
				Ripple.SVGAttributes<SVGElementTagNameMap['view']> & {
					viewBox?: Nullable<string>;
					preserveAspectRatio?: Nullable<string>;
				};

			// Scripting
			canvas: Ripple.DetailedHTMLProps<
				Ripple.CanvasHTMLAttributes<HTMLCanvasElement>,
				HTMLCanvasElement
			>;
			noscript: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;
			script: Ripple.DetailedHTMLProps<
				Ripple.ScriptHTMLAttributes<HTMLScriptElement>,
				HTMLScriptElement
			>;

			// Demarcating edits
			del: Ripple.DetailedHTMLProps<Ripple.ModHTMLAttributes<HTMLModElement>, HTMLModElement>;
			ins: Ripple.DetailedHTMLProps<Ripple.ModHTMLAttributes<HTMLModElement>, HTMLModElement>;

			// Table content
			caption: Ripple.DetailedHTMLProps<
				Ripple.HTMLAttributes<HTMLTableCaptionElement>,
				HTMLTableCaptionElement
			>;
			col: Ripple.DetailedHTMLProps<
				Ripple.ColHTMLAttributes<HTMLTableColElement>,
				HTMLTableColElement
			>;
			colgroup: Ripple.DetailedHTMLProps<
				Ripple.ColHTMLAttributes<HTMLTableColElement>,
				HTMLTableColElement
			>;
			table: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLTableElement>, HTMLTableElement>;
			tbody: Ripple.DetailedHTMLProps<
				Ripple.HTMLAttributes<HTMLTableSectionElement>,
				HTMLTableSectionElement
			>;
			td: Ripple.DetailedHTMLProps<
				Ripple.TableCellHTMLAttributes<HTMLTableCellElement>,
				HTMLTableCellElement
			>;
			tfoot: Ripple.DetailedHTMLProps<
				Ripple.HTMLAttributes<HTMLTableSectionElement>,
				HTMLTableSectionElement
			>;
			th: Ripple.DetailedHTMLProps<
				Ripple.ThHTMLAttributes<HTMLTableCellElement>,
				HTMLTableCellElement
			>;
			thead: Ripple.DetailedHTMLProps<
				Ripple.HTMLAttributes<HTMLTableSectionElement>,
				HTMLTableSectionElement
			>;
			tr: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLTableRowElement>, HTMLTableRowElement>;

			// Forms
			button: Ripple.DetailedHTMLProps<
				Ripple.ButtonHTMLAttributes<HTMLButtonElement>,
				HTMLButtonElement
			>;
			datalist: Ripple.DetailedHTMLProps<
				Ripple.HTMLAttributes<HTMLDataListElement>,
				HTMLDataListElement
			>;
			fieldset: Ripple.DetailedHTMLProps<
				Ripple.FieldsetHTMLAttributes<HTMLFieldSetElement>,
				HTMLFieldSetElement
			>;
			form: Ripple.DetailedHTMLProps<Ripple.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>;
			input: Ripple.DetailedHTMLProps<
				Ripple.InputHTMLAttributes<HTMLInputElement>,
				HTMLInputElement
			>;
			label: Ripple.DetailedHTMLProps<
				Ripple.LabelHTMLAttributes<HTMLLabelElement>,
				HTMLLabelElement
			>;
			legend: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLLegendElement>, HTMLLegendElement>;
			meter: Ripple.DetailedHTMLProps<
				Ripple.MeterHTMLAttributes<HTMLMeterElement>,
				HTMLMeterElement
			>;
			optgroup: Ripple.DetailedHTMLProps<
				Ripple.OptgroupHTMLAttributes<HTMLOptGroupElement>,
				HTMLOptGroupElement
			>;
			option: Ripple.DetailedHTMLProps<
				Ripple.OptionHTMLAttributes<HTMLOptionElement>,
				HTMLOptionElement
			>;
			output: Ripple.DetailedHTMLProps<
				Ripple.OutputHTMLAttributes<HTMLOutputElement>,
				HTMLOutputElement
			>;
			progress: Ripple.DetailedHTMLProps<
				Ripple.ProgressHTMLAttributes<HTMLProgressElement>,
				HTMLProgressElement
			>;
			select: Ripple.DetailedHTMLProps<
				Ripple.SelectHTMLAttributes<HTMLSelectElement>,
				HTMLSelectElement
			>;
			textarea: Ripple.DetailedHTMLProps<
				Ripple.TextareaHTMLAttributes<HTMLTextAreaElement>,
				HTMLTextAreaElement
			>;

			// Interactive elements
			details: Ripple.DetailedHTMLProps<
				Ripple.DetailsHTMLAttributes<HTMLDetailsElement>,
				HTMLDetailsElement
			>;
			dialog: Ripple.DetailedHTMLProps<
				Ripple.DialogHTMLAttributes<HTMLDialogElement>,
				HTMLDialogElement
			>;
			summary: Ripple.DetailedHTMLProps<Ripple.HTMLAttributes<HTMLElement>, HTMLElement>;

			// Web Components
			slot: Ripple.DetailedHTMLProps<Ripple.SlotHTMLAttributes<HTMLSlotElement>, HTMLSlotElement>;
			template: Ripple.DetailedHTMLProps<
				Ripple.HTMLAttributes<HTMLTemplateElement>,
				HTMLTemplateElement
			>;

			// Catch-all for any other elements
			[elemName: string]: Ripple.HTMLAttributes<any>;
		}

		interface ElementChildrenAttribute {
			children: {};
		}
	}
}

export import ClassValue = Ripple.ClassValue;
export import JSX = Ripple.JSX;
export { Ripple };

// Preserve the global JSX surface for existing consumers and compiler output.
declare global {
	namespace JSX {
		type Element = Ripple.JSX.Element;
		type ElementType = keyof IntrinsicElements | ComponentType<any>;
		interface IntrinsicElements extends Ripple.JSX.IntrinsicElements {}
		interface ElementChildrenAttribute extends Ripple.JSX.ElementChildrenAttribute {}
	}
}
