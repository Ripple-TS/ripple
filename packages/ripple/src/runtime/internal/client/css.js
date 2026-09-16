import { DEV } from 'esm-env';

/**
 * Removes the server's inline styles once the client stylesheets are in.
 * Schedule it with `requestAnimationFrame`: the removal already waits for a
 * frame after the stylesheets load, and starting from a frame keeps mounting
 * and hydrating free of stylesheet queries.
 */
export function remove_styles() {
	if (DEV) {
		const styles = document.querySelector('style[data-vite-dev-id]');
		if (styles) {
			remove();
		} else {
			requestAnimationFrame(remove_styles);
		}
	} else {
		remove_when_css_loaded(() => requestAnimationFrame(remove));
	}
}

function remove() {
	document.querySelectorAll('style[data-ripple-ssr]').forEach((el) => el.remove());
}

/**
 * Calls back once every stylesheet link has loaded (or failed).
 * @param {() => void} callback
 * @returns {void}
 */
function remove_when_css_loaded(callback) {
	var links = /** @type {NodeListOf<HTMLLinkElement>} */ (
		document.querySelectorAll('link[rel="stylesheet"]')
	);
	var remaining = links.length;

	if (remaining === 0) {
		callback();
		return;
	}

	var done = () => {
		if (--remaining === 0) {
			callback();
		}
	};

	for (var link of links) {
		if (link.sheet) {
			// already loaded (possibly cached)
			done();
		} else {
			link.addEventListener('load', done, { once: true });
			link.addEventListener('error', done, { once: true });
		}
	}
}
