import fs from 'node:fs';
import path from 'node:path';

/**
 * Write URL pathnames where the adapters' decoded static-file lookup finds
 * them. Validate every destination before writing any pages.
 * @param {string} out_dir
 * @param {Map<string, string>} pages
 * @returns {void}
 */
export function write_prerendered_pages(out_dir, pages) {
	const root = path.resolve(out_dir);
	/** @type {Map<string, { pathname: string, html: string }>} */
	const files = new Map();
	for (const [pathname, html] of pages) {
		let segments;
		try {
			segments = pathname.split('/').slice(1).map(decodeURIComponent);
		} catch (cause) {
			throw new Error(
				`[ripple] Cannot write prerendered pathname ${pathname}: invalid URL encoding.`,
				{ cause },
			);
		}
		// Both a directory URL and the root are written to index.html.
		if (segments.at(-1) === '') segments.pop();
		if (
			!pathname.startsWith('/') ||
			segments.some(
				(segment) =>
					segment === '' || segment === '.' || segment === '..' || /[/\\\0]/.test(segment),
			)
		) {
			throw new Error(
				`[ripple] Cannot write prerendered pathname ${pathname}: unsafe path segment.`,
			);
		}
		const file = path.resolve(root, ...segments, 'index.html');
		if (!file.startsWith(root + path.sep)) {
			throw new Error(
				`[ripple] Cannot write prerendered pathname ${pathname}: path escapes the client output directory.`,
			);
		}
		const previous = files.get(file);
		if (previous) {
			throw new Error(
				`[ripple] Prerendered pathnames ${previous.pathname} and ${pathname} resolve to the same output file.`,
			);
		}
		files.set(file, { pathname, html });
	}
	for (const [file, { html }] of files) {
		fs.mkdirSync(path.dirname(file), { recursive: true });
		fs.writeFileSync(file, html);
	}
}
