import type { Component } from '#public';

// Re-export runtime types for server-compiled components
export {
	track,
	untrack,
	flushSync,
	effect,
	tick,
	Context,
	RippleArray,
	RippleSet,
	RippleMap,
	RippleDate,
	RippleURL,
	RippleURLSearchParams,
} from './index.js';

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

export interface BaseRenderOptions {
	stream?: StreamSink;
	// defaults to true
	// set to false to add more content
	closeStream?: boolean;
}

export interface StreamingRenderOptions extends BaseRenderOptions {
	stream: StreamSink;
}

export interface RenderOptions extends BaseRenderOptions {
	stream?: undefined;
}

export declare function create_ssr_stream(): Stream;

export declare function render(
	component: Component,
	options?: RenderOptions,
): Promise<RenderResult>;

export declare function render(
	component: Component,
	options: StreamingRenderOptions,
): Promise<RenderStreamResult>;
