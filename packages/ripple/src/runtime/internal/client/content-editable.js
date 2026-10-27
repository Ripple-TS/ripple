import { hydrating } from './hydration.js';
import { HYDRATION } from 'ripple/internal/client/hydration-enabled';
import { createTrustedHTML, createTrustedScript } from '../../../csp.js';

/** @type {WeakMap<Element, { source: string, html: string }> | undefined} */
var defaults;
/** @type {Document | undefined} */
var inert_document;

/**
 * Compare against the server body after the browser has normalized its markup.
 * Keep the snapshot attribute in place: nested editors may still need it.
 * @param {Element} element
 * @returns {boolean}
 */
export function content_editable_changed(element) {
	if (element.__ripple_content_edited) return true;
	var source = element.getAttribute('data-ripple-content');
	if (source === null) return false;
	var current = element.innerHTML;
	if (source === '' || source === current) return source !== current;

	var original = defaults?.get(element);
	if (original === undefined || original.source !== source) {
		// An inert document avoids upgrading custom elements or loading resources
		// a second time while normalizing a rich-text snapshot.
		inert_document ??= element.ownerDocument.implementation.createHTMLDocument();
		var template = inert_document.createElementNS(element.namespaceURI, element.localName);
		template.innerHTML = /** @type {string} */ (createTrustedHTML(source, 'content-editable'));
		original = { source, html: template.innerHTML };
		(defaults ??= new WeakMap()).set(element, original);
	}
	return current !== original.html;
}

/**
 * @param {Element} element
 * @param {any} value
 */
export function set_inner_html(element, value) {
	if (HYDRATION && hydrating && content_editable_changed(element)) return;
	var html = value ?? '';
	if (element.innerHTML === String(html)) return;
	if (element.localName === 'script' && element.namespaceURI === 'http://www.w3.org/1999/xhtml') {
		/** @type {HTMLScriptElement} */ (element).text = /** @type {string} */ (
			createTrustedScript(html)
		);
	} else {
		element.innerHTML = /** @type {string} */ (createTrustedHTML(html));
	}
}
