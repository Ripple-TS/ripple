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
			svg: HTMLAttributes & {
				width?: string | number;
				height?: string | number;
				viewBox?: string;
				xmlns?: string;
				fill?: string;
				stroke?: string;
			};
			math: HTMLAttributes;

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
