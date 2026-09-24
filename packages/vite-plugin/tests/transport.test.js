import { afterEach, describe, expect, it, vi } from 'vitest';
import { build, createServer } from 'vite';
import { ripple } from '@ripple-ts/vite-plugin';
import {
	mkdtempSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	realpathSync,
	rmSync,
	symlinkSync,
	writeFileSync,
	unlinkSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import * as devalue from 'devalue';

const packages = fileURLToPath(new URL('../../', import.meta.url));
const cleanups = [];
afterEach(async () => {
	for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
	vi.unstubAllGlobals();
});

function fixture() {
	const root = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'ripple-transport-')));
	cleanups.push(() => rmSync(root, { recursive: true, force: true }));
	mkdirSync(path.join(root, 'node_modules', '@ripple-ts'), { recursive: true });
	for (const [name, source] of [
		['ripple', 'ripple'],
		['@ripple-ts/vite-plugin', 'vite-plugin'],
		['@ripple-ts/adapter', 'adapter'],
		['@ripple-ts/adapter-node', 'adapter-node'],
	]) {
		symlinkSync(path.join(packages, source), path.join(root, 'node_modules', name), 'dir');
	}
	writeFileSync(path.join(root, 'package.json'), '{"type":"module"}');
	writeFileSync(
		path.join(root, 'vite.config.ts'),
		`import { ripple } from '@ripple-ts/vite-plugin';
export default { plugins: [ripple()], server: { host: '127.0.0.1', port: 0 }, logLevel: 'silent' };`,
	);
	writeFileSync(
		path.join(root, 'money.ts'),
		`export class Money {
  constructor(public amount: number, public currency: string) {}
  format() { return this.amount + ' ' + this.currency; }
}
export const transport = {
  Money: {
    encode: (value: unknown) => value instanceof Money && [value.amount, value.currency],
    decode: ([amount, currency]: [number, string]) => new Money(amount, currency),
  },
};`,
	);
	// Server-only: the browser would fail at load on the externalized node:crypto.
	writeFileSync(
		path.join(root, 'auth.ts'),
		`import { createHash } from 'node:crypto';
const secret = createHash('sha256').update('server-only-auth').digest('hex');
export async function auth(context: { state: Map<string, unknown> }, next: () => Promise<Response>) {
  context.state.set('secret', secret);
  return next();
}`,
	);
	writeFileSync(
		path.join(root, 'screens.tsrx'),
		`export function ErrorScreen() {
  return <p>{'root-catch-screen'}</p>;
}`,
	);
	writeFileSync(
		path.join(root, 'ripple.config.ts'),
		`import { defineConfig, RenderRoute } from '@ripple-ts/vite-plugin';
import * as adapter from '@ripple-ts/adapter-node';
import { auth } from './auth';
export default defineConfig({
  adapter,
  middlewares: [auth],
  transport: ['transport', '/money.ts'],
  rootBoundary: { catch: ['ErrorScreen', '/screens.tsrx'] },
  router: { routes: [new RenderRoute({ path: '/', entry: '/App.tsrx' })] },
});`,
	);
	writeFileSync(
		path.join(root, 'App.tsrx'),
		`import { track, trackAsync } from 'ripple';
import { Money } from './money';
module server {
  import { Money } from './money';
  export async function doubleMoney(value: Money) {
    if (!(value instanceof Money)) throw new Error('Argument not revived');
    return new Money(value.amount * 2, value.currency);
  }
}
import { doubleMoney } from server;
export function App() @{
  const count = track(6);
  const money = trackAsync(() => doubleMoney(new Money(count.value, 'USD')));
  <>
    <p class="result">{money.value.format()}</p>
    <button onClick={() => { count.value++; }}>increment</button>
  </>
}`,
	);
	writeFileSync(
		path.join(root, 'index.html'),
		'<html><head><!--ssr-head--></head><body><div id="root"><!--ssr-body--></div></body></html>',
	);
	return root;
}

const rpc_hash = createHash('sha256').update('/App.tsrx#doubleMoney').digest('hex').slice(0, 8);
const rpc_path = '/_$_ripple_rpc_$_/' + rpc_hash;
const args = '[ [1], ["Money",2], [3,4], 7, "USD" ]';
const revivers = { Money: ([amount, currency]) => ({ amount, currency, revived: true }) };

async function verify_requests(request) {
	const response = await request('/');
	expect(response.status).toBe(200);
	const html = await response.text();
	const envelope = JSON.parse(
		html.match(/<script id="__ripple_ta_[^"]+" type="application\/json">(.*?)<\/script>/s)[1],
	);
	expect(envelope.value).toBeUndefined();
	expect(devalue.unflatten(envelope.payload, revivers)).toEqual({
		amount: 12,
		currency: 'USD',
		revived: true,
	});
	const rpc = await request(rpc_path, { method: 'POST', body: args });
	expect(rpc.status).toBe(200);
	expect(devalue.parse(await rpc.text(), revivers).value).toEqual({
		amount: 14,
		currency: 'USD',
		revived: true,
	});
}

describe('transport config integration', () => {
	it.each(['manual', 'dynamic namespace'])(
		'keeps %s registration in standalone client builds',
		async (mode) => {
			const root = fixture();
			unlinkSync(path.join(root, 'ripple.config.ts'));
			writeFileSync(
				path.join(root, 'register.js'),
				`import * as Ripple from 'ripple';
export function register(name, value) { Ripple[name](value); }`,
			);
			writeFileSync(
				path.join(root, 'main.js'),
				`import { rpc } from 'ripple/internal/client';
${mode === 'manual' ? "import { setTransport } from 'ripple';" : ''}
class Money {
  constructor(amount) { this.amount = amount; }
  format() { return this.amount + ' USD'; }
}
export async function run() {
  const transport = { Money: {
    encode: value => value instanceof Money && [value.amount],
    decode: ([amount]) => new Money(amount),
  }};
  ${mode === 'manual' ? 'setTransport(transport);' : "const { register } = await import('./register.js'); register('setTransport', transport);"}
  return (await rpc('12345678', [new Money(7)])).format();
}`,
			);
			await build({
				root,
				configFile: false,
				plugins: ripple({ excludeRippleExternalModules: true }),
				logLevel: 'silent',
				build: {
					minify: 'esbuild',
					modulePreload: false,
					rollupOptions: {
						input: path.join(root, 'main.js'),
						preserveEntrySignatures: 'strict',
						output: { entryFileNames: 'main.js' },
					},
				},
			});
			vi.stubGlobal('fetch', async (_url, init) => {
				const [value] = devalue.parse(init.body, { Money: ([amount]) => ({ amount }) });
				expect(value.amount).toBe(7);
				return new Response(
					devalue.stringify(
						{ value: { amount: 14 } },
						{
							Money: (value) => value?.amount && [value.amount],
						},
					),
				);
			});
			const { run } = await import(pathToFileURL(path.join(root, 'dist/main.js')).href);
			expect(await run()).toBe('14 USD');
		},
		30_000,
	);

	it('registers in the dev SSR graph and refreshes config for RPC requests', async () => {
		const root = fixture();
		const server = await createServer({ root });
		cleanups.push(() => server.close());
		await server.listen();
		const url = server.resolvedUrls.local[0];
		const request = (pathname, init) => fetch(new URL(pathname, url), init);
		await verify_requests(request);

		// The browser imports the modules the config names, never the config.
		const client_entry = async () => (await request('/@id/virtual:ripple-hydrate')).text();
		const source = await client_entry();
		expect(source).not.toContain('ripple.config');
		expect(source).toContain('import * as transportModule from "/money.ts";');
		expect(source).toContain('import * as catchModule from "/screens.tsrx');

		// Editing the config regenerates the client entry, and a changed config
		// must be picked up even when the next request is RPC.
		const configPath = path.join(root, 'ripple.config.ts');
		writeFileSync(
			configPath,
			readFileSync(configPath, 'utf8').replace("  transport: ['transport', '/money.ts'],\n", ''),
		);
		await vi.waitFor(async () => expect(await client_entry()).not.toContain('setTransport'), {
			timeout: 10_000,
		});
		const response = await request(rpc_path, { method: 'POST', body: args });
		expect(response.status).toBe(500);
		expect(await response.text()).toContain('Unknown type Money');
	}, 30_000);

	it('registers in the generated production entry before SSR and adapter RPC', async () => {
		const root = fixture();
		await build({ root });
		const assets = path.join(root, 'dist/client/assets');
		const client = readdirSync(assets)
			.map((file) => readFileSync(path.join(assets, file), 'utf8'))
			.join('\n');
		expect(client).toContain('root-catch-screen');
		expect(client).not.toContain('server-only-auth');
		const { handler } = await import(pathToFileURL(path.join(root, 'dist/server/entry.js')).href);
		await verify_requests((pathname, init) =>
			handler(new Request('http://localhost' + pathname, init)),
		);
	}, 30_000);
});
