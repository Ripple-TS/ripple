import { afterEach, describe, expect, it } from 'vitest';
import { build, createServer } from 'vite';
import {
	mkdtempSync,
	mkdirSync,
	readFileSync,
	realpathSync,
	rmSync,
	symlinkSync,
	writeFileSync,
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
	writeFileSync(
		path.join(root, 'ripple.config.ts'),
		`import { defineConfig, RenderRoute } from '@ripple-ts/vite-plugin';
import * as adapter from '@ripple-ts/adapter-node';
import { transport } from './money';
export default defineConfig({
  adapter,
  transport,
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
  let &[count] = track(6);
  let &[money] = trackAsync(() => doubleMoney(new Money(count, 'USD')));
  <>
    <p class="result">{money.format()}</p>
    <button onClick={() => { count++; }}>increment</button>
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
	expect(devalue.parse(envelope.payload, revivers)).toEqual({
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
	it('registers in the dev SSR graph and refreshes config for RPC requests', async () => {
		const root = fixture();
		const server = await createServer({ root });
		cleanups.push(() => server.close());
		await server.listen();
		const url = server.resolvedUrls.local[0];
		const request = (pathname, init) => fetch(new URL(pathname, url), init);
		await verify_requests(request);
		const config_helpers =
			await server.environments.client.pluginContainer.resolveId('@ripple-ts/vite-plugin');
		expect(config_helpers.id).toMatch(/\/src\/config\.js$/);

		// A changed config must be picked up even when the next request is RPC.
		const configPath = path.join(root, 'ripple.config.ts');
		writeFileSync(
			configPath,
			readFileSync(configPath, 'utf8').replace('  transport,', '  transport: {},'),
		);
		server.moduleGraph.invalidateAll();
		const response = await request(rpc_path, { method: 'POST', body: args });
		expect(response.status).toBe(500);
		expect(await response.text()).toContain('Unknown type Money');
	}, 30_000);

	it('registers in the generated production entry before SSR and adapter RPC', async () => {
		const root = fixture();
		await build({ root });
		const { handler } = await import(pathToFileURL(path.join(root, 'dist/server/entry.js')).href);
		await verify_requests((pathname, init) =>
			handler(new Request('http://localhost' + pathname, init)),
		);
	}, 30_000);
});
