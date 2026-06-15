import { describe, it, expect } from 'vitest';
import { rippleNew } from '../src/vite.js';

// The rippleNew() Vite plugin picks the compile target per module: server mode
// for SSR (HTML-string output), client mode otherwise (template-clone runtime).
// The target is driven by Vite's per-module SSR signal, with an explicit
// `{ ssr }` option to force one target for the whole plugin.

const SRC = `export function G(props) @{ <p class={props.c}>{props.name as string}</p> }`;

// Invoke the plugin's transform hook with a fake Vite plugin `this` context
// (the hook reads `this.environment?.config?.consumer`).
function transform(plugin, code, id, { ssr, consumer } = {}) {
	const ctx = { environment: consumer ? { config: { consumer } } : undefined };
	return plugin.transform.call(ctx, code, id, ssr === undefined ? undefined : { ssr });
}

const isServer = (out) =>
	out.code.includes("from 'ripple-new/server'") && out.code.includes('ssrText(');
const isClient = (out) => out.code.includes("from 'ripple-new'") && out.code.includes('template(');

describe('rippleNew() — compile target selection', () => {
	it('ignores non-.tsrx files', () => {
		expect(transform(rippleNew(), SRC, '/x/foo.ts')).toBeNull();
	});

	it('auto-detects: client by default, server under Vite’s SSR transform flag', () => {
		const plugin = rippleNew();
		expect(isClient(transform(plugin, SRC, '/x/G.tsrx'))).toBe(true);
		expect(isServer(transform(plugin, SRC, '/x/G.tsrx', { ssr: true }))).toBe(true);
	});

	it('auto-detects server from the environment consumer (Vite 6+ environment API)', () => {
		const plugin = rippleNew();
		expect(isServer(transform(plugin, SRC, '/x/G.tsrx', { consumer: 'server' }))).toBe(true);
		expect(isClient(transform(plugin, SRC, '/x/G.tsrx', { consumer: 'client' }))).toBe(true);
	});

	it('opts.ssr:true forces server mode for every module (overrides auto-detection)', () => {
		const plugin = rippleNew({ ssr: true });
		expect(isServer(transform(plugin, SRC, '/x/G.tsrx'))).toBe(true);
		// Even when Vite says client, the override wins.
		expect(isServer(transform(plugin, SRC, '/x/G.tsrx', { consumer: 'client' }))).toBe(true);
	});

	it('opts.ssr:false forces client mode even when Vite signals SSR', () => {
		const plugin = rippleNew({ ssr: false });
		expect(isClient(transform(plugin, SRC, '/x/G.tsrx', { ssr: true }))).toBe(true);
		expect(isClient(transform(plugin, SRC, '/x/G.tsrx', { consumer: 'server' }))).toBe(true);
	});
});
