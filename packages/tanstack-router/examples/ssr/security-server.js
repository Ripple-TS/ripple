import { randomBytes } from 'node:crypto';
import { render, prerender, getCss, getCspHashes, createStream } from 'ripple/server';
import { SecurityApp } from './security-app.tsrx';
import { policyScript, inlineScript } from './security-policy.js';

export { vendorScript } from './security-policy.js';

const basePolicy = "default-src 'self'; object-src 'none'; base-uri 'none'; style-src-attr 'none'";
const trustedTypesPolicy =
	"; require-trusted-types-for 'script'; trusted-types ripple-example ripple-example-content";

export async function staticDocument(assets) {
	// prerender waits for every deferred value; no executable stream patches.
	const result = await prerender(SecurityApp);
	if (result.topLevelError) throw result.topLevelError;
	const bootstrap = `var s=document.createElement('script');s.type='module';s.src=${JSON.stringify(assets.entry)};document.head.append(s);`;
	const hashes = await getCspHashes({ scripts: [bootstrap, inlineScript], styles: [result.css] });
	const policy = `${basePolicy}; script-src ${hashes.scripts.join(' ')} 'strict-dynamic'; style-src 'self' ${hashes.styles.join(' ')}`;
	const html = `<!doctype html><html><head>${result.head}<style data-ripple-ssr>${result.css}</style>${assets.css.map((href) => `<link rel="stylesheet" href="${href}">`).join('')}</head><body><div id="app">${result.body}</div><script>${bootstrap}</script></body></html>`;
	return { html, policy };
}

export async function securityResponse(request, assets) {
	const nonce = randomBytes(18).toString('base64');
	const policy = `${basePolicy}; script-src 'nonce-${nonce}' 'strict-dynamic'; style-src 'self' 'nonce-${nonce}'${trustedTypesPolicy}`;
	const headers = {
		'Content-Type': 'text/html',
		'Content-Security-Policy': policy,
		'Cache-Control': 'private, no-store',
	};
	const before = `<!doctype html><html><head><meta property="csp-nonce" nonce="${nonce}"><script nonce="${nonce}">${policyScript}</script>${assets.css.map((href) => `<link rel="stylesheet" href="${href}">`).join('')}`;
	const between = '</head><body><div id="app">';
	const after = `</div><script nonce="${nonce}" type="module" src="${assets.entry}"></script></body></html>`;
	if (new URL(request.url).searchParams.has('stream')) {
		const { stream, sink } = createStream();
		void render(SecurityApp, {
			nonce,
			signal: request.signal,
			stream: sink,
			streamTemplate: { before, between, after },
		}).catch((error) => sink.error(error));
		return new Response(stream, { headers });
	}
	const result = await render(SecurityApp, { signal: request.signal });
	if (result.topLevelError) throw result.topLevelError;
	return new Response(
		`${before}${result.head}<style data-ripple-ssr nonce="${nonce}">${getCss(result.css)}</style>${between}${result.body}${after}`,
		{ headers },
	);
}
