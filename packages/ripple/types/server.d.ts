import type { Component } from '#public';
import type { Readable } from 'stream';

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

export interface SSRRenderResult {
	head: string;
	body: string;
	css: Set<string>;
}

export interface SSRRenderOptions {
	stream?: boolean;
}

export type SSRStream = Readable;

export type render = (
	component: Component,
	options?: SSRRenderOptions,
) => Promise<SSRRenderResult | SSRStream>;

export const render: render;
