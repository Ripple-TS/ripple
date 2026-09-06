/**
 * Scoped-style conformance fixtures (RFC tsrx-org/RFCs#1) compiled through
 * the Ripple target. The fixtures and their `expected.json` contracts come
 * from the `@tsrx/core` test harness; the schema is described in the README
 * next to them (`SCOPED_STYLES_FIXTURES_DIR/README.md`). Every `.tsrx`
 * compiles on its own in both `client` and `server` mode (imports are never
 * resolved) and the output is checked for:
 *
 * - `cssOrder`: the marker rules `.<label>.<hash>` in emission order, one
 *   hash per scope, and `cssHash` as the distinct hashes in that order;
 * - `elements`: every authored class value rendered with its scope chain
 *   (outer → inner) followed by the applied themes;
 * - `classMaps`: the `$class` composition of assigned blocks and their own
 *   entry;
 * - `pruned`: `(unused)` comments in emission order — standalone blocks prune
 *   what matches nothing among the list's other children, assigned blocks
 *   what their class map does not expose.
 */

import { describe, expect, it } from 'vitest';
import {
	load_scoped_styles_fixtures,
	SCOPED_STYLES_FIXTURES_DIR,
} from '@tsrx/core/test-harness/scoped-styles-fixtures';
import { compile } from '../src/index.js';

const MODES = /** @type {const} */ (['client', 'server']);
const HASH = 'tsrx-[0-9a-f]+';
const RUNTIME_PREFIX = 'import:';

const fixtures = load_scoped_styles_fixtures();

/** @param {string} text */
function escape_regexp(text) {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** @param {string} label */
function is_runtime(label) {
	return label.startsWith(RUNTIME_PREFIX);
}

/** @param {string} label */
function runtime_expression(label) {
	return label.slice(RUNTIME_PREFIX.length);
}

/**
 * Every static label a fixture refers to.
 * @param {import('@tsrx/core/test-harness/scoped-styles-fixtures').ScopedStylesFixture['expected']} expected
 */
function collect_labels(expected) {
	const labels = new Set(expected.cssOrder);
	for (const chain of Object.values(expected.elements)) {
		for (const label of chain) if (!is_runtime(label)) labels.add(label);
	}
	for (const [name, chain] of Object.entries(expected.classMaps)) {
		for (const label of chain) {
			if (is_runtime(label)) continue;
			labels.add(label === 'own' ? name : label);
		}
	}
	return labels;
}

/**
 * Resolve each label to the hash of its marker selector `.label.<hash>`.
 * @param {string} css
 * @param {Set<string>} labels
 */
function resolve_labels(css, labels) {
	/** @type {Map<string, string>} */
	const hashes = new Map();
	for (const label of labels) {
		const matches = [...css.matchAll(new RegExp(`\\.${escape_regexp(label)}\\.(${HASH})`, 'g'))];
		if (matches.length === 0) {
			throw new Error(`no scoped marker selector for label "${label}" in:\n${css}`);
		}
		for (const match of matches) expect(match[1]).toBe(matches[0][1]);
		hashes.set(label, matches[0][1]);
	}
	return hashes;
}

/**
 * @param {string} label
 * @param {Map<string, string>} hashes
 */
function hash_of(label, hashes) {
	const hash = hashes.get(label);
	if (!hash) throw new Error(`label "${label}" was not resolved`);
	return hash;
}

/**
 * The class chain as the compiled code spells it: static hashes folded into
 * one literal, runtime `$class` reads concatenated with `+`.
 * @param {string[]} chain
 * @param {Map<string, string>} hashes
 * @param {string | null} own the block's own label for `own` entries
 */
function chain_text(chain, hashes, own = null) {
	/** @type {string[]} */
	const out = [];
	/** @type {string | null} */
	let literal = null;
	let previous_runtime = false;
	for (const label of chain) {
		if (is_runtime(label)) {
			if (literal !== null) {
				out.push(`'${literal} '`);
				literal = null;
			} else if (previous_runtime) {
				out.push(`' '`);
			}
			out.push(`${runtime_expression(label)}.$class`);
			previous_runtime = true;
		} else {
			const hash = hash_of(label === 'own' && own ? own : label, hashes);
			literal = literal === null ? (previous_runtime ? ` ${hash}` : hash) : `${literal} ${hash}`;
			previous_runtime = false;
		}
	}
	if (literal !== null) out.push(`'${literal}'`);
	return out.join(' + ');
}

/** @param {string} code */
function normalize(code) {
	return code.replace(/\s+/g, ' ');
}

/**
 * The text forms the compiled code may use for an element's class: a static
 * chain on a static value lands in the HTML (`class="…"`) or, for a dynamic
 * `<{tag}>`, in its props (`class: '…'`); anything with a runtime part is set
 * at render time from the authored value and the chain expression, which
 * both the client (`_$_.set_class(el, value, chain)`) and the server
 * (`_$_.attr('class', [value, chain])`) spell as `value, chain`.
 * @param {string} key
 * @param {string[]} chain
 * @param {Map<string, string>} hashes
 */
function class_candidates(key, chain, hashes) {
	const is_expression = key.startsWith('{') && key.endsWith('}');
	const has_runtime = chain.some(is_runtime);
	if (!is_expression) {
		if (!has_runtime) {
			const value = [key, ...chain.map((label) => hash_of(label, hashes))].join(' ');
			return [`class="${value}"`, `class: '${value}'`];
		}
		return [`'${key}', ${chain_text(chain, hashes)}`];
	}
	const expression = key.slice(1, -1);
	if (chain.length === 0) {
		// The authored value is used as is; a call in it may be wrapped
		// (`_$_.with_scope(__block, helper).inFunction`), so its property
		// read is what survives verbatim.
		const property = expression.match(/\.[A-Za-z_$][\w$]*$/)?.[0];
		return property ? [expression, property] : [expression];
	}
	return [`${expression}, ${chain_text(chain, hashes)}`];
}

/** @param {string} css */
function pruned_selectors(css) {
	return [...css.matchAll(/\/\* \(unused\) ([\s\S]*?)\*\//g)].map((match) =>
		match[1].split('{')[0].trim(),
	);
}

describe('scoped-style conformance fixtures', () => {
	expect(fixtures.length).toBeGreaterThan(0);

	for (const fixture of fixtures) {
		describe(fixture.name, () => {
			const labels = collect_labels(fixture.expected);

			for (const mode of MODES) {
				it(`[${mode}] emits the sheets in order and prunes what nothing reaches`, () => {
					const { css, cssHash } = compile(fixture.source, fixture.path, { mode });
					const hashes = resolve_labels(css, labels);

					const markers = [...css.matchAll(new RegExp(`\\.([A-Za-z_][\\w-]*)\\.${HASH}`, 'g'))]
						.map((match) => match[1])
						.filter((label) => labels.has(label));
					expect(markers).toEqual(fixture.expected.cssOrder);

					const distinct = [
						...new Set(fixture.expected.cssOrder.map((label) => hash_of(label, hashes))),
					];
					expect(cssHash).toBe(distinct.join(' '));

					expect(pruned_selectors(css)).toEqual(fixture.expected.pruned);
				});

				it(`[${mode}] stamps every element with its scope chain and applied themes`, () => {
					const { code, css } = compile(fixture.source, fixture.path, { mode });
					const hashes = resolve_labels(css, labels);
					const text = normalize(code);
					for (const [key, chain] of Object.entries(fixture.expected.elements)) {
						const candidates = class_candidates(key, chain, hashes);
						expect(
							candidates.some((candidate) => text.includes(candidate)),
							`${key} → ${JSON.stringify(candidates)} in:\n${code}`,
						).toBe(true);
					}
				});

				it(`[${mode}] composes $class on assigned blocks`, () => {
					const { code, css } = compile(fixture.source, fixture.path, { mode });
					const hashes = resolve_labels(css, labels);
					const text = normalize(code);
					for (const [name, chain] of Object.entries(fixture.expected.classMaps)) {
						const value = chain_text(chain, hashes, name);
						// The client map is a plain object; the server map reads through
						// getters that register the CSS with the request.
						const forms = [`'$class': ${value}`, `return ${value};`];
						expect(
							forms.some((form) => text.includes(form)),
							`${name}.$class → ${value} in:\n${code}`,
						).toBe(true);
						if (chain.includes('own') || chain.includes(name)) {
							const entry = `'${hash_of(name, hashes)} ${name}'`;
							expect(
								text.includes(`'${name}': ${entry}`) || text.includes(`return ${entry};`),
								`${name}.${name} → ${entry} in:\n${code}`,
							).toBe(true);
						}
					}
				});
			}
		});
	}

	it('reads the fixtures shipped with @tsrx/core', () => {
		expect(SCOPED_STYLES_FIXTURES_DIR).toContain('scoped-styles');
	});
});
