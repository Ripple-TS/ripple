import { tsrxReact } from '../src/index.js';

describe('@tsrx/vite-plugin-react basic', () => {
	it('injects and serves a virtual css module for styled components', async () => {
		const plugin = tsrxReact();
		const id = '/virtual/App.tsrx';
		const source = `export function App() @{
			<>
			<div>{'Hello world'}</div>

			<style>
				.div {
					color: red;
				}
			</style>
			</>
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
		const source = `export function App() @{
			<div>{'Hello world'}</div>
		}`;

		const transformed = await plugin.transform(source, id);
		const virtual_id = `${id}?tsrx-css&lang.css`;
		const resolved_id = plugin.resolveId(virtual_id);

		expect(transformed).not.toBeNull();
		expect(transformed.code).not.toContain(virtual_id);
		expect(plugin.load(resolved_id)).toBe('');
	});

	it('maps the JSX transform output back to the original tsrx source', async () => {
		const plugin = tsrxReact();
		const id = '/virtual/App.tsrx';
		const source = `export function App() @{
			const message = 'Hello world';
			<div>{message}</div>
		}`;

		const transformed = await plugin.transform(source, id);

		expect(transformed).not.toBeNull();
		expect(/** @type {any} */ (transformed.map).sources).toEqual([id]);
		expect(/** @type {any} */ (transformed.map).sourcesContent).toEqual([source]);
	});

	it('refreshes virtual css during hot updates', async () => {
		const plugin = tsrxReact();
		const id = '/virtual/App.tsrx';
		const css_module = { id: `\0${id}?tsrx-css&lang.css` };
		/** @type {Array<typeof css_module>} */
		const invalidated = [];
		const source = `export function App() @{
			<>
			<div className="content">{'Hello world'}</div>
			<style>
				.content {
					color: red;
				}
			</style>
			</>
		}`;
		const updated_source = `export function App() @{
			<>
			<div className="content">{'Hello world'}</div>
			<style>
				:where(.content) {
					color: blue;
				}
			</style>
			</>
		}`;

		await plugin.transform(source, id);
		const handle_hot_update = /** @type {(ctx: any) => Promise<any[]>} */ (plugin.handleHotUpdate);
		const modules = await handle_hot_update({
			file: id,
			modules: [{ id }],
			read: async () => updated_source,
			server: {
				moduleGraph: {
					/** @param {string} module_id */
					getModuleById(module_id) {
						return module_id === css_module.id ? css_module : undefined;
					},
					/** @param {typeof css_module} module */
					invalidateModule(module) {
						invalidated.push(module);
					},
				},
			},
		});

		const css = plugin.load(css_module.id);
		expect(css).toContain(':where(.content.');
		expect(css).toContain('color: blue;');
		expect(css).not.toContain('color: red;');
		expect(invalidated).toEqual([css_module]);
		expect(modules).toContain(css_module);
	});
});
