import type { Component, RootBoundaryOptions } from '#public';

// Re-export runtime types for server-compiled components
export {
	setTransport,
	track,
	trackAsync,
	getTrackedStatus,
	untrack,
	flushSync,
	effect,
	tick,
	Context,
	createRenderObserver,
	RippleArray,
	RippleSet,
	RippleMap,
	RippleDate,
	RippleURL,
	RippleURLSearchParams,
} from './index.js';

export type { Transport, Transporter, AsyncSource, AsyncResult, TrackedStatus } from './index.js';

export interface RenderResult {
	head: string;
	body: string;
	css: Set<string>;
	topLevelError?: Error | null;
}

export interface RenderStreamResult {
	stream: StreamSink;
	topLevelError?: Error | null;
}

export interface StreamSink {
	push(chunk: string): void;
	close(): void;
	error(reason: unknown): void;
}

export type WebStream = ReadableStream<Uint8Array>;

export interface Stream {
	controller: ReadableStreamDefaultController<Uint8Array>;
	textEncoder: TextEncoder;
	stream: WebStream;
	sink: StreamSink;
}

export interface StreamTemplate {
	/** Document prefix, up to (and excluding) where SSR head content belongs. */
	before: string;
	/** From after the SSR head content to where the SSR body belongs. */
	between: string;
	/** Document suffix, pushed right before the stream closes. */
	after: string;
}

export interface BaseRenderOptions {
	/**
	 * Per-response CSP nonce shared by renderer-generated executable scripts and
	 * scoped styles. Does not authorize application HTML or inert JSON records.
	 * Buffered CSS is returned as text; add this nonce to the style tag you emit.
	 */
	nonce?: string;
	/** Abort pending rendering, cancel owned trackAsync work, and reject with the signal's reason. */
	signal?: AbortSignal;
	stream?: StreamSink;
	// defaults to true
	// set to false to add more content
	closeStream?: boolean;
	rootBoundary?: RootBoundaryOptions;
	/**
	 * Streaming only: document scaffold emitted around the shell — `before` +
	 * head content + `between` + body precede the streamed chunks, `after` is
	 * pushed when the stream closes.
	 */
	streamTemplate?: StreamTemplate;
}

export interface StreamingRenderOptions extends BaseRenderOptions {
	stream: StreamSink;
}

export interface RenderOptions extends BaseRenderOptions {
	stream?: undefined;
}

export declare function createStream(): Stream;

/**
 * Returns the CSS text for a set of scoped style hashes collected by
 * `render()` — emit it in a `<style data-ripple-ssr>` tag.
 */
export declare function getCss(css: Set<string>): string;

/** Hash final inline contents (without tags) after all transforms. Does not generate a policy. */
export declare function getCspHashes(sources: {
	scripts?: Iterable<string>;
	styles?: Iterable<string>;
}): Promise<{ scripts: string[]; styles: string[] }>;

export declare function render(
	component: Component,
	options?: RenderOptions,
): Promise<RenderResult>;

export declare function render(
	component: Component,
	options: StreamingRenderOptions,
): Promise<RenderStreamResult>;

export interface PrerenderResult {
	head: string;
	body: string;
	/** the scoped CSS text — emit it in a `<style data-ripple-ssr>` tag */
	css: string;
	topLevelError: Error | null;
}

/**
 * Renders a component to static HTML: buffered, every boundary settled, the
 * scoped CSS as text. The static-generation counterpart of `render()`.
 */
export declare function prerender(
	component: Component,
	options?: { rootBoundary?: RootBoundaryOptions },
): Promise<PrerenderResult>;

/** Execute a server function as an ordinary serialized result or an incremental response. */
export declare function executeServerFunction(
	fn: (...args: any[]) => unknown,
	args: string,
	signal?: AbortSignal,
	run?: <T>(fn: () => T, signal?: AbortSignal) => T,
): Promise<string | Response>;
