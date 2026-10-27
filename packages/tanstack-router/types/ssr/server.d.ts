import type { AnyRouter, ServerManifest } from '@tanstack/router-core';
import type { Component } from 'ripple';
import type { RequestHandler, SsrResponse } from '@tanstack/router-core/ssr/server';
export interface RequestHandlerOptions<TRouter extends AnyRouter = AnyRouter> {
	createRouter: () => TRouter;
	request: Request;
	getRouterManifest?: () => ServerManifest | Promise<ServerManifest>;
}
export interface RenderRouterOptions {
	router: AnyRouter;
	request: Request;
	responseHeaders?: Headers;
	/** A component rendered inside #app, also passed to hydrateRouter on the client. */
	children?: Component;
}
export declare function createRequestHandler<TRouter extends AnyRouter>(
	options: RequestHandlerOptions<TRouter>,
): RequestHandler<TRouter>;
export declare function renderRouterToString(options: RenderRouterOptions): Promise<Response>;
export declare function renderRouterToStream(options: RenderRouterOptions): Promise<SsrResponse>;
export declare const defaultRenderHandler: typeof renderRouterToString;
export declare const defaultStreamHandler: typeof renderRouterToStream;
