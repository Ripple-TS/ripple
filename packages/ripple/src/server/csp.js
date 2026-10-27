/**
 * Hash final inline script/style text, excluding the surrounding tags. Call
 * after prerendering and all HTML transforms, before publishing a document.
 * Normalizes HTML line endings and NULs as the browser's tokenizer does.
 * This does not discover assets, generate a policy, or authorize streaming.
 * @param {{ scripts?: Iterable<string>, styles?: Iterable<string> }} sources
 * @returns {Promise<{ scripts: string[], styles: string[] }>}
 */
export async function getCspHashes({ scripts = [], styles = [] }) {
	/** @param {Iterable<string>} values */
	async function hashes(values) {
		const normalized = [...values].map((value) =>
			value.replace(/\r\n?/g, '\n').replace(/\0/g, '\uFFFD'),
		);
		return Promise.all(
			[...new Set(normalized)].map(async (value) => {
				const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
				return "'sha256-" + btoa(String.fromCharCode(...new Uint8Array(digest))) + "'";
			}),
		);
	}
	return { scripts: await hashes(scripts), styles: await hashes(styles) };
}
