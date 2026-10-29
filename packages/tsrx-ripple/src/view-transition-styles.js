// @ts-check
/** @import * as AST from 'estree' */
import {
	builders as b,
	parseStyle,
	createStyleClassMapFromStylesheet,
	renderCssResult as render_core_css,
	renderStylesheets as render_core_sheets,
} from '@tsrx/core';
import { walk } from 'zimmerframe';

/** @typedef {{ at: number, text: string }} Insertion */
/** @typedef {{ edits: Insertion[], selectors: AST.CSS.ComplexSelector[], classes: Map<string, any>, local: boolean }} TransitionStyles */
/** @type {WeakMap<AST.CSS.StyleSheet, TransitionStyles>} */
const styles = new WeakMap();
/** @param {AST.Node} node @param {AST.Expression} scope */
export function set_transition_scope(node, scope) {
	if (node.metadata) node.metadata.tsrx_view_transition_scope = scope;
}

/** Recognize the imported component, including aliases and namespace imports.
 * @param {AST.Expression} id @param {import('../types/index').ScopeInterface} scope
 */
function is_transition(id, scope) {
	const name =
		id.type === 'Identifier'
			? id.name
			: id.type === 'MemberExpression' && id.object.type === 'Identifier'
				? id.object.name
				: null;
	if (name === null) return false;
	const binding = scope.get(name);
	const declaration = binding?.initial;
	if (
		binding?.declaration_kind !== 'import' ||
		declaration?.type !== 'ImportDeclaration' ||
		declaration.source.type !== 'Literal' ||
		declaration.source.value !== 'ripple'
	)
		return false;
	return declaration.specifiers.some(
		(specifier) =>
			specifier.local.name === name &&
			(id.type === 'Identifier'
				? specifier.type === 'ImportSpecifier' &&
					(specifier.imported.type === 'Identifier'
						? specifier.imported.name
						: specifier.imported.value) === 'ViewTransition'
				: specifier.type === 'ImportNamespaceSpecifier' &&
					id.type === 'MemberExpression' &&
					!id.computed &&
					id.property.type === 'Identifier' &&
					id.property.name === 'ViewTransition'),
	);
}

/** @param {AST.Node} node @param {AST.Expression} id @param {import('../types/index').ScopeInterface} scope */
export function get_transition_scope(node, id, scope) {
	return is_transition(id, scope) ? node.metadata?.tsrx_view_transition_scope : undefined;
}

/** The shared parser already understands CSS identifiers/escapes. Parse the
 * native argument as a compound selector rather than implementing another lexer.
 * @param {string} argument
 */
function parse_argument(argument) {
	const sheet = parseStyle(
		argument + '{}',
		{ filename: 'view-transition.css', line: 1, column: 0 },
		{},
	);
	const rule = sheet.children[0];
	if (rule?.type !== 'Rule' || rule.prelude.children.length !== 1) return null;
	const complex = rule.prelude.children[0];
	if (complex.children.length !== 1) return null;
	const relative = complex.children[0];
	const selectors = relative.selectors;
	if (
		!selectors.length ||
		!selectors.every(
			(node, i) => node.type === 'ClassSelector' || (i === 0 && node.type === 'TypeSelector'),
		)
	)
		return null;
	/** @type {Map<string, any>} */
	const classes = new Map();
	for (const selector of selectors) {
		if (selector.type !== 'ClassSelector') continue;
		relative.selectors = [selector];
		const property = createStyleClassMapFromStylesheet(sheet).properties[1];
		if (property?.type === 'Property' && property.key.type === 'Literal')
			classes.set(String(property.key.value), {
				start: selector.start,
				end: selector.end,
				selector,
			});
	}
	relative.selectors = selectors;
	return {
		classes,
		end: selectors[selectors.length - 1].end,
		root: selectors[0].type === 'TypeSelector' && selectors[0].name === 'root',
	};
}

/** Analyze only Ripple's document-transition selectors; ordinary CSS remains
 * owned by the published core compiler. Keep source positions intact until emit.
 * @param {AST.CSS.StyleSheet} sheet
 * @param {(message: string) => void} report
 */
export function analyze_transition_styles(sheet, report) {
	/** @type {TransitionStyles} */
	const info = { edits: [], selectors: [], classes: new Map(), local: false };
	styles.set(sheet, info);
	walk(sheet, null, {
		PseudoElementSelector(node, { path }) {
			if (!/^view-transition(?:-(?:group|image-pair|old|new))?$/.test(node.name)) return;
			const global = path.some(
				(parent) =>
					(parent.type === 'PseudoClassSelector' && parent.name === 'global') ||
					(parent.type === 'Rule' && parent.metadata.is_global_block),
			);
			const complex = /** @type {AST.CSS.ComplexSelector | undefined} */ (
				path.findLast((parent) => parent.type === 'ComplexSelector')
			);
			if (!complex) return;
			const start = node.start + 2 + node.name.length;
			if (sheet.source[start] !== '(') {
				if (!global) report('The document-wide ::view-transition overlay requires :global(...).');
				return;
			}
			let end = start + 1;
			for (; end < sheet.source.length && sheet.source[end] !== ')'; end++)
				if (sheet.source[end] === '\\') end++;
			let argument;
			try {
				argument = parse_argument(sheet.source.slice(start + 1, end));
			} catch {
				argument = null;
			}
			if (!argument) {
				if (!global)
					report(
						'Invalid view-transition argument. Use a name, *, or compound transition classes without combinators.',
					);
				return;
			}
			for (const [name, entry] of argument.classes) {
				if (!info.classes.has(name))
					info.classes.set(name, {
						...entry,
						start: start + 1 + entry.start,
						end: start + 1 + entry.end,
					});
			}
			// Class-map preparation uses this flag to retain reachable rules.
			if (argument.classes.size) {
				const enclosing = /** @type {AST.CSS.ComplexSelector} */ (
					path.find((parent) => parent.type === 'ComplexSelector')
				);
				enclosing.metadata.class_map_selector = true;
			}
			if (global) return;
			if (argument.root) {
				report('The document-wide root transition requires :global(...).');
				return;
			}
			const relative = complex.children[0];
			const valid_prefix = relative.selectors.every(
				(selector) =>
					selector === node ||
					(selector.type === 'PseudoClassSelector' &&
						['root', 'active-view-transition', 'active-view-transition-type', 'global'].includes(
							selector.name,
						)),
			);
			if (
				complex.children.length !== 1 ||
				!valid_prefix ||
				path.some(
					(parent) =>
						parent.type === 'Rule' &&
						parent.metadata.parent_rule !== null &&
						!parent.metadata.parent_rule.metadata.is_global_block,
				)
			) {
				report(
					'Scoped view-transition selectors cannot be nested under a DOM selector. Put the transition rule directly in the style scope.',
				);
				return;
			}
			info.local = true;
			info.selectors.push(complex);
			info.edits.push({ at: start + 1 + argument.end, text: '.' + sheet.hash });
		},
	});
	return info;
}

/** Finalize after core pruning/preparation so it cannot stamp a DOM scope on
 * document pseudo-elements. Class-map rules keep their core reachability flags.
 * @param {AST.CSS.StyleSheet} sheet @param {boolean | undefined} used
 */
export function finish_transition_styles(sheet, used) {
	const info = styles.get(sheet);
	if (!info) return;
	for (const selector of info.selectors) {
		if (used !== undefined) selector.metadata.used = used;
		for (const relative of selector.children) relative.metadata.scoped = false;
	}
}

/** Add portable transition classes using the existing "hash class" map format.
 * @param {AST.ObjectExpression} map @param {AST.CSS.StyleSheet | null} sheet
 */
export function transition_class_map(map, sheet) {
	const info = sheet && styles.get(sheet);
	if (!info) return map;
	for (const name of info.classes.keys()) {
		if (
			map.properties.some(
				(property) =>
					property.type === 'Property' &&
					property.key.type === 'Literal' &&
					property.key.value === name,
			)
		)
			continue;
		map.properties.push(
			b.prop('init', b.literal(name), b.literal(sheet.hash + ' ' + name), name === '__proto__'),
		);
	}
	return map;
}

/** Render a copy with scoped native arguments. Rebase CSS offsets only in this
 * copy: diagnostics, class-map source locations, and the analyzed AST stay original.
 * @param {AST.CSS.StyleSheet} sheet
 */
function emission_sheet(sheet) {
	const edits = styles.get(sheet)?.edits;
	if (!edits?.length) return sheet;
	const ordered = [...edits].sort((a, b) => a.at - b.at);
	/** @param {number} position */
	const offset = (position) =>
		position +
		ordered.reduce((length, edit) => length + (edit.at <= position ? edit.text.length : 0), 0);
	/** @param {any} value @returns {any} */
	function copy(value) {
		if (Array.isArray(value)) return value.map(copy);
		if (value === null || typeof value !== 'object' || !value.type) return value;
		const result = { ...value };
		for (const key of Object.keys(value)) {
			if (key === 'metadata' || key === 'loc') continue;
			result[key] = key === 'start' || key === 'end' ? offset(value[key]) : copy(value[key]);
		}
		return result;
	}
	const result = /** @type {AST.CSS.StyleSheet} */ (copy(sheet));
	let source = sheet.source;
	for (const edit of ordered.reverse())
		source = source.slice(0, edit.at) + edit.text + source.slice(edit.at);
	result.source = source;
	return result;
}

/** @param {AST.CSS.StyleSheet[]} sheets @param {boolean} [minify] */
export function renderCssResult(sheets, minify) {
	return render_core_css(sheets.map(emission_sheet), minify);
}
/** @param {AST.CSS.StyleSheet[]} sheets @param {boolean} [minify] */
export function renderStylesheets(sheets, minify) {
	return render_core_sheets(sheets.map(emission_sheet), minify);
}
