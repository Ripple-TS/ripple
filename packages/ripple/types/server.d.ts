import type { Component } from '#public';
// import type { Readable } from 'node:stream';

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

export type render = (component: Component) => Promise<SSRRenderResult>;
// export type renderToStream = (component: Component) => Readable;

export const render: render;
// export const renderToStream: renderToStream;
