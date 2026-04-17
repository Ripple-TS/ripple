import { describe, expect, it } from 'vitest';
import { tsrxReact } from '../src/index.js';

describe('@tsrx/vite-plugin-react basic', () => {
	it('injects and serves a virtual css module for styled components', async () => {
		const plugin = tsrxReact();
		const id = '/virtual/App.tsrx';
		const source = `export component App() {
			<div>{'Hello world'}</div>

			<style>
				.div {
					color: red;
				}
			</style>
		}`;

		const transformed = await plugin.transform(source, id);
		const virtual_id = `${id}?tsrx-css&lang.css`;
		const resolved_id = plugin.resolveId(virtual_id);

		expect(transformed).not.toBeNull();
		expect(transformed.code).toContain(virtual_id);
		expect(resolved_id).toBe(`\0${virtual_id}`);
		expect(plugin.load(resolved_id)).toContain('.div.');
		expect(plugin.load(resolved_id)).toContain('color: red;');
	});

	it('does not inject a virtual css module when no style block exists', async () => {
		const plugin = tsrxReact();
		const id = '/virtual/App.tsrx';
		const source = `export component App() {
			<div>{'Hello world'}</div>
		}`;

		const transformed = await plugin.transform(source, id);
		const virtual_id = `${id}?tsrx-css&lang.css`;
		const resolved_id = plugin.resolveId(virtual_id);

		expect(transformed).not.toBeNull();
		expect(transformed.code).not.toContain(virtual_id);
		expect(plugin.load(resolved_id)).toBe('');
	});
});
