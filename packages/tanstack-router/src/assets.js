/** @import { RouterManagedTag } from '@tanstack/router-core' */

const marker = 'data-ripple-router-asset';
/** @type {WeakMap<Element, { count: number, owned: boolean }>} */
const owners = new WeakMap();

// MIME essences recognized as JavaScript by browsers, also used by Ripple's
// static script analysis. Dynamic route attributes need the same runtime check.
const javascriptTypes = new Set([
	'application/ecmascript',
	'application/javascript',
	'application/x-ecmascript',
	'application/x-javascript',
	'text/ecmascript',
	'text/javascript',
	'text/javascript1.0',
	'text/javascript1.1',
	'text/javascript1.2',
	'text/javascript1.3',
	'text/javascript1.4',
	'text/javascript1.5',
	'text/jscript',
	'text/livescript',
	'text/x-ecmascript',
	'text/x-javascript',
]);

/** @param {unknown} type */
export function isDataScript(type) {
	if (typeof type !== 'string') return false;
	const essence = type.split(';', 1)[0].trim().toLowerCase();
	return (
		/^[!#$%&'*+.^_`|~0-9a-z-]+\/[!#$%&'*+.^_`|~0-9a-z-]+$/.test(essence) &&
		!javascriptTypes.has(essence)
	);
}

/** @param {RouterManagedTag} asset */
export function assetKey(asset) {
	return JSON.stringify(asset);
}

/** @param {RouterManagedTag[]} assets */
export function uniqueAssets(assets) {
	return [...new Map(assets.map((asset) => [assetKey(asset), asset])).values()];
}

/** Match HTML's case-insensitive names before classifying a dynamic script.
 * @param {Record<string, any> | undefined} attrs
 */
export function scriptAttributes(attrs) {
	/** @type {Record<string, any>} */
	const result = {};
	for (const [key, value] of Object.entries(attrs ?? {})) result[key.toLowerCase()] = value;
	return result;
}

/** @param {unknown} value */
export function escapeAttribute(value) {
	return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/** Serialize trusted route assets and core-owned transport tags outside the hydrated root.
 * @param {RouterManagedTag} asset
 * @param {boolean} [managed]
 */
export function renderAsset(asset, managed = false) {
	const { tag, attrs, children } = asset;
	if (!['title', 'meta', 'link', 'style', 'script'].includes(tag)) return '';
	let attributes = managed ? ` ${marker}` : '';
	for (const [key, value] of Object.entries(attrs ?? {})) {
		if (value === undefined || value === null || value === false || !/^[\w:-]+$/.test(key))
			continue;
		attributes += ` ${key}="${value === true ? '' : escapeAttribute(value)}"`;
	}
	if (tag === 'meta' || tag === 'link') return `<${tag}${attributes}>`;
	const content = tag === 'script' && attrs?.src ? '' : (children ?? '');
	const text = tag === 'title' ? escapeAttribute(content) : content;
	return `<${tag}${attributes}>${text}</${tag}>`;
}

/** @param {RouterManagedTag} asset */
export function acquireAsset(asset) {
	const { tag, attrs = {} } = asset;
	const children = tag === 'script' && attrs.src ? undefined : asset.children;
	const executable = tag === 'script' && !isDataScript(attrs.type);
	let src = attrs.src;
	if (src) {
		try {
			src = new URL(src, document.baseURI).href;
		} catch {
			/* Preserve invalid URLs for matching, as the browser does. */
		}
	}
	const candidates = [...document.getElementsByTagName(tag)];
	let element = candidates.find((el) => {
		const script = /** @type {HTMLScriptElement} */ (el);
		if (executable && attrs.src) {
			return el.getAttribute('src') !== null && /** @type {HTMLScriptElement} */ (el).src === src;
		}
		if (executable && el.hasAttribute('src')) return false;
		if (executable) {
			return (
				el.textContent === (children ?? '') &&
				(el.getAttribute('type') || 'text/javascript') === (attrs.type || 'text/javascript') &&
				(script.nonce || '') === (attrs.nonce || '')
			);
		}
		if (!executable && !el.hasAttribute(marker)) return false;
		if (
			!executable &&
			[...el.attributes].some(
				({ name }) =>
					name !== marker && !Object.keys(attrs).some((key) => key.toLowerCase() === name),
			)
		)
			return false;
		return (
			Object.entries(attrs).every(([key, value]) => {
				if (value === undefined || value === null || value === false) return !el.hasAttribute(key);
				return (
					(key === 'nonce' ? /** @type {HTMLScriptElement} */ (el).nonce : el.getAttribute(key)) ===
					(value === true ? '' : String(value))
				);
			}) &&
			(('inlineCss' in asset && asset.inlineCss && children === undefined) ||
				el.textContent === (children ?? ''))
		);
	});
	if (!element) {
		element = document.createElement(tag);
		element.setAttribute(marker, '');
		for (const [key, value] of Object.entries(attrs)) {
			if (value !== undefined && value !== null && value !== false)
				element.setAttribute(key, value === true ? '' : String(value));
		}
		if (children !== undefined) element.textContent = children;
		if (executable && attrs.src && !attrs.async)
			/** @type {HTMLScriptElement} */ (element).async = false;
		document.head.appendChild(element);
	}
	const entry = owners.get(element) ?? { count: 0, owned: element.hasAttribute(marker) };
	entry.count++;
	owners.set(element, entry);
	return () => {
		if (--entry.count === 0) {
			owners.delete(element);
			if (entry.owned) element.remove();
		}
	};
}
