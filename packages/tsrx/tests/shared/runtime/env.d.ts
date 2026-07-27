/**
 * Ambient declarations for the shared runtime fixtures.
 *
 * These files are compiled and executed by each target package's vitest
 * project, which supplies the mount helpers on `globalThis`. The `.tsrx`
 * component fixtures each carry a `.d.tsrx.ts` declaration beside them —
 * a relative import never falls back to an ambient `declare module '*.tsrx'`,
 * so the sidecar is what lets `pnpm typecheck` resolve them.
 */

declare global {
	/** Mounts a component into `container`; installed by the project's setup file. */
	var render: (Component: unknown, props?: Record<string, unknown>) => void | Promise<void>;
	/** The element mounted components render into. */
	var container: HTMLElement;
	/** Flushes pending reactive work, when the target exposes one. */
	var flush: (() => void | Promise<void>) | undefined;
}

export {};
