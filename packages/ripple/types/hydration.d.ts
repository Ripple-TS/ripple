/** Intent events supported by deferred hydration. */
export type HydrationInteractionEvent =
	| 'auxclick'
	| 'click'
	| 'contextmenu'
	| 'dblclick'
	| 'focusin'
	| 'keydown'
	| 'keyup'
	| 'mousedown'
	| 'mouseenter'
	| 'mouseover'
	| 'mouseup'
	| 'pointerdown'
	| 'pointerenter'
	| 'pointerover'
	| 'pointerup';
export type HydrationInteractionEvents =
	HydrationInteractionEvent | readonly HydrationInteractionEvent[];
export interface IdleHydrationOptions {
	timeout?: number;
}
export interface VisibleHydrationOptions {
	rootMargin?: string;
	threshold?: number | readonly number[];
}
export interface InteractionHydrationOptions {
	events?: HydrationInteractionEvents;
}
/**
 * Construct strategies with the helpers; their compact fields are internal.
 * `t` is the strategy type, `v` is its primary value, and `o` holds additional options.
 */
export type HydrationStrategy =
	| {
			/** type: load */
			readonly t: 'l';
	  }
	| {
			/** type: never */
			readonly t: 'n';
	  }
	| {
			/** type: idle */
			readonly t: 'i';
			/** value: idle timeout in milliseconds */
			readonly v: number;
	  }
	| {
			/** type: visible */
			readonly t: 'v';
			/** value: intersection observer root margin */
			readonly v: string;
			/** options: intersection threshold or thresholds */
			readonly o: number | readonly number[];
	  }
	| {
			/** type: interaction events */
			readonly t: 'e';
			/** value: normalized event names separated by spaces */
			readonly v: string;
	  }
	| {
			/** type: media */
			readonly t: 'm';
			/** value: media query */
			readonly v: string;
	  }
	| {
			/** type: condition */
			readonly t: 'c';
			/** value: boolean condition or reactive getter */
			readonly v: boolean | (() => boolean);
	  };
export type HydrationWhen = HydrationStrategy | (() => HydrationStrategy);
export function load(): HydrationStrategy;
export function idle(options?: IdleHydrationOptions): HydrationStrategy;
export function visible(options?: VisibleHydrationOptions): HydrationStrategy;
export function interaction(options?: InteractionHydrationOptions): HydrationStrategy;
export function media(query: string): HydrationStrategy;
export function condition(value: boolean | (() => boolean)): HydrationStrategy;
export function never(): HydrationStrategy;
