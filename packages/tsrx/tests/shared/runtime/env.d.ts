/**
 * Ambient declarations for the shared runtime fixtures.
 *
 * These files are compiled and executed by each target package's vitest
 * project, which supplies the mount helpers on `globalThis` and compiles the
 * `.tsrx` component fixtures through its own bundler plugin.
 */

/** A `.tsrx` fixture module: every export is a compiled component. */
declare module '*.tsrx' {
	const components: { [name: string]: unknown };
	export = components;
}

declare global {
	/** Mounts a component into `container`; installed by the project's setup file. */
	var render: (Component: unknown, props?: Record<string, unknown>) => void | Promise<void>;
	/** The element mounted components render into. */
	var container: HTMLElement;
	/** Flushes pending reactive work, when the target exposes one. */
	var flush: (() => void | Promise<void>) | undefined;
}

export {};
