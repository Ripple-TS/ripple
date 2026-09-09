import { afterEach as after_each, describe, expect, it, vi } from 'vitest';
import {
	mkdtempSync as mkdtemp_sync,
	rmSync as rm_sync,
	writeFileSync as write_file_sync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { build } from 'vite';
import { ripple } from '@ripple-ts/vite-plugin';

const cleanups = [];
after_each(async () => {
	for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
});
const source = `import type { Props } from './types';
export function App(props: Props) @{ <p>{props.value}</p> }`;

function fixture() {
	const root = mkdtemp_sync(path.join(os.tmpdir(), 'ripple-vite-text-'));
	cleanups.push(() => rm_sync(root, { recursive: true, force: true }));
	write_file_sync(
		path.join(root, 'tsconfig.json'),
		JSON.stringify({
			compilerOptions: {
				strict: true,
				target: 'ESNext',
				module: 'ESNext',
				moduleResolution: 'Bundler',
			},
		}),
	);
	write_file_sync(path.join(root, 'App.tsrx'), source);
	write_file_sync(path.join(root, 'types.ts'), 'export interface Props { value: number }');
	return root;
}

function hook(plugin, name) {
	const entry = plugin[name];
	return typeof entry === 'function' ? entry : entry.handler;
}

async function plugin(root, extra = {}, text_types = { tsconfig: 'tsconfig.json' }) {
	const [plugin] = ripple({ excludeRippleExternalModules: true, textTypes: text_types });
	await hook(plugin, 'configResolved').call(
		{},
		{
			root,
			command: 'build',
			isProduction: true,
			build: {},
			...extra,
		},
	);
	await hook(plugin, 'buildStart').call({ meta: { watchMode: !!extra.build?.watch } });
	cleanups.push(() => hook(plugin, 'closeBundle').call({}));
	return plugin;
}

async function transform(plugin, root, ssr = false) {
	return hook(plugin, 'transform').call(
		{ environment: { config: { consumer: ssr ? 'server' : 'client' } } },
		source,
		path.join(root, 'App.tsrx'),
		{ ssr },
	);
}

describe('Vite textTypes', () => {
	it.each([true, {}, { tsconfig: '' }, { tsconfig: 42 }])(
		'rejects invalid options %j',
		(text_types) => {
			expect(() => ripple({ textTypes: text_types })).toThrow('textTypes must be');
		},
	);

	it.each([{ command: 'serve' }, { isProduction: false }, { build: { watch: {} } }])(
		'keeps %j syntax-only without opening the checker project',
		async (config) => {
			const root = fixture();
			const current = await plugin(root, config, { tsconfig: 'missing.json' });
			const result = await transform(current, root, true);
			expect(result.code).toContain('_$_.render_expression(props.value');
		},
	);

	it('is opt-in and skips cached transforms only when enabled', async () => {
		const root = fixture();
		const current = await plugin(root, {}, false);
		expect((await transform(current, root, true)).code).toContain(
			'_$_.render_expression(props.value',
		);
		expect(
			hook(current, 'shouldTransformCachedModule')({ id: path.join(root, 'App.tsrx') }),
		).toBeUndefined();
	});

	it('passes matching client/server facts while preserving source maps', async () => {
		const root = fixture();
		const current = await plugin(root);
		const client = await transform(current, root);
		const server = await transform(current, root, true);
		expect(client.code).not.toContain('_$_.expression_children(');
		expect(server.code).toContain('_$_.escape(props.value)');
		expect(client.map.sourcesContent).toEqual([source]);
		expect(hook(current, 'shouldTransformCachedModule')({ id: path.join(root, 'App.tsrx') })).toBe(
			true,
		);
		await hook(current, 'buildEnd').call({});
	});

	it('shares a snapshot with the automatic server build and detects type drift', async () => {
		const root = fixture();
		const client = await plugin(root);
		await transform(client, root);
		const server = await plugin(root);
		server.api.textTypes.share(client.api.textTypes);
		write_file_sync(path.join(root, 'types.ts'), 'export interface Props { value: object }');
		// The borrowed snapshot still produces the client's layout, and the
		// build fails instead of emitting inconsistent hydration output.
		expect((await transform(server, root, true)).code).toContain('_$_.escape(props.value)');
		await expect(hook(server, 'buildEnd').call({})).rejects.toThrow('changed during build');
	});

	it('rejects different client/server checker configurations', async () => {
		const root = fixture();
		const client = await plugin(root);
		const server = await plugin(root, {}, false);
		expect(() => server.api.textTypes.share(client.api.textTypes)).toThrow(
			'same textTypes configuration',
		);
	});

	it('rechecks imported types in fresh real Vite builds', async () => {
		const root = fixture();
		vi.stubEnv('NODE_ENV', 'production');
		cleanups.push(() => vi.unstubAllEnvs());
		async function run() {
			const result = await build({
				root,
				configFile: false,
				logLevel: 'silent',
				plugins: ripple({
					excludeRippleExternalModules: true,
					textTypes: { tsconfig: 'tsconfig.json' },
				}),
				build: {
					ssr: path.join(root, 'App.tsrx'),
					write: false,
					minify: false,
					rollupOptions: { external: ['ripple/internal/server'] },
				},
			});
			return result.output.find((entry) => entry.type === 'chunk').code;
		}
		expect(await run()).toContain('.escape(props.value)');
		write_file_sync(path.join(root, 'types.ts'), 'export interface Props { value: object }');
		expect(await run()).toContain('.render_expression(props.value');
	});
});
