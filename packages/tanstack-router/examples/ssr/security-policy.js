// These exact strings are example-owned content, not a general-purpose sanitizer.
export const inlineScript = 'window.exampleInlineRuns = (window.exampleInlineRuns || 0) + 1;';
export const allowedHTML = [
	'<b>Approved HTML</b>',
	'<i>Updated HTML</i>',
	'<circle cx="5" cy="5" r="4"></circle>',
	'<mi>x</mi>',
];

// Self-contained so the server can emit a blocking bootstrap before streamed
// rich-text snapshots arrive. Applications may serve this as an external script.
export function installPolicy(inline, html) {
	if (!window.trustedTypes) return;
	window.__RIPPLE_TRUSTED_TYPES__ = window.trustedTypes.createPolicy('ripple-example', {
		createHTML(value, sink) {
			if (sink === 'template' || sink === 'content-editable') return value;
			throw new TypeError('Application HTML must be explicitly approved');
		},
		createScript(value, sink) {
			if (
				value === inline ||
				(sink === 'template' &&
					value.trim() === 'window.lazyTemplateRuns = (window.lazyTemplateRuns || 0) + 1;') ||
				(sink === 'route' &&
					/^window\.lazy(Head|Body)Runs = \(window\.lazy(Head|Body)Runs \|\| 0\) \+ 1$/.test(value))
			)
				return value;
			throw new TypeError('Script is not in the example allowlist');
		},
		createScriptURL(value) {
			const url = new URL(value, location.href);
			if (
				url.origin === location.origin &&
				['/app/security/vendor.js', '/app/security/compiled.js'].includes(url.pathname) &&
				!url.search &&
				!url.hash
			)
				return url.href;
			throw new TypeError('Script URL is not in the example allowlist');
		},
	});
	window.exampleContentPolicy = window.trustedTypes.createPolicy('ripple-example-content', {
		createHTML(value) {
			if (html.includes(value)) return value;
			throw new TypeError('HTML is not in the example allowlist');
		},
	});
}

export function approvedHTML(value) {
	return typeof window === 'undefined'
		? value
		: (window.exampleContentPolicy?.createHTML(value) ?? value);
}

export const policyScript = `(${installPolicy.toString()})(${JSON.stringify(inlineScript)},${JSON.stringify(allowedHTML)})`;

export const vendorScript = `window.vendorLoads = (window.vendorLoads || 0) + 1;
window.exampleVendor = { mount() {
 document.documentElement.dataset.vendor = 'mounted';
 return () => { delete document.documentElement.dataset.vendor; };
} };`;
