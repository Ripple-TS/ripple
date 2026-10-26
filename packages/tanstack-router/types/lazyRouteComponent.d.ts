import type { Component } from 'ripple';
export type AsyncRouteComponent<TProps = {}> = Component<TProps> & {
	preload?: () => Promise<void>;
};
export declare function lazyRouteComponent<
	T extends Record<string, any>,
	TKey extends keyof T = 'default',
>(
	importer: () => Promise<T>,
	exportName?: TKey,
): T[TKey] extends Component<infer TProps> ? AsyncRouteComponent<TProps> : never;
