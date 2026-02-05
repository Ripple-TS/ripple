import type { Props } from '#public';
import type { Readable } from 'node:stream';

export interface SSRRenderOutput {
	head: string;
	body: string;
	css: Set<string>;
	push(chunk: string): void;
	register_css(hash: string): void;
}

export interface SSRComponent {
	(output: SSRRenderOutput, props?: Props): void | Promise<void>;
	async?: boolean;
}

export interface SSRRenderResult {
	head: string;
	body: string;
	css: Set<string>;
}

export type SSRRender = (component: SSRComponent) => Promise<SSRRenderResult>;
export type render = (component: SSRComponent) => Promise<SSRRenderResult>;
export type renderToStream = (component: SSRComponent) => Readable;

export const render: render;
export const renderToStream: renderToStream;
