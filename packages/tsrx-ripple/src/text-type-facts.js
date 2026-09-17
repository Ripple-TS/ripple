// @ts-check

/** @import * as AST from 'estree' */
/** @import { ScopeInterface, TextTypeFacts } from '../types/index' */
import { strongHash as strong_hash } from '@tsrx/core';

/** @type {WeakMap<object, { strings: Set<string>, primitives: Set<string> }>} */
const facts_by_root = new WeakMap();

/**
 * Volar preserves parentheses for source mappings; ordinary compilation omits
 * them. Only unwrap outer parentheses so both parses identify the same child,
 * without accepting a proof for an arbitrary nested expression.
 * @param {AST.Expression} expression
 * @returns {[number, number] | undefined}
 */
export function get_text_type_range(expression) {
	while (expression.type === 'ParenthesizedExpression') {
		expression = /** @type {AST.Expression} */ (expression.expression);
	}
	if (expression.start === undefined || expression.end === undefined) return undefined;
	return [expression.start, expression.end];
}

/**
 * Validate externally supplied facts before either transform can consume them.
 * @param {Map<string, { expression: AST.Expression }> | undefined} children
 * @param {Map<string, { expression: AST.Expression }> | undefined} attributes
 * @param {string} source
 * @param {string} filename
 * @param {ScopeInterface} scope
 * @param {TextTypeFacts | undefined} facts
 */
export function register_text_type_facts(children, attributes, source, filename, scope, facts) {
	if (facts === undefined) return;
	const invalid = () => {
		throw new Error(`Invalid textTypeFacts for ${JSON.stringify(filename)}`);
	};
	if (
		!facts ||
		facts.version !== 1 ||
		facts.filename !== filename ||
		facts.sourceVersion !== strong_hash(source) ||
		typeof facts.projectVersion !== 'string' ||
		!facts.projectVersion
	)
		invalid();
	/** @param {Map<string, { expression: AST.Expression }> | undefined} expressions */
	const ranges_of = (expressions) => {
		const ranges = new Set();
		for (const { expression } of expressions?.values() ?? []) {
			const range = get_text_type_range(expression);
			if (range) ranges.add(`${range[0]}:${range[1]}`);
		}
		return ranges;
	};
	const child_ranges = ranges_of(children);
	const attribute_ranges = ranges_of(attributes);
	/**
	 * @param {readonly (readonly [number, number])[]} ranges
	 * @param {Set<string>} authored the ranges a proof may name
	 * @param {Set<string>} [into]
	 */
	const validate = (ranges, authored, into = new Set()) => {
		if (!Array.isArray(ranges)) return invalid();
		for (const range of ranges) {
			if (
				!Array.isArray(range) ||
				range.length !== 2 ||
				!range.every(Number.isSafeInteger) ||
				range[0] < 0 ||
				range[1] <= range[0] ||
				range[1] > source.length ||
				!authored.has(`${range[0]}:${range[1]}`)
			)
				invalid();
			into.add(`${range[0]}:${range[1]}`);
		}
		return into;
	};
	// A string attribute value is read like a string child: the compiler asks
	// `has_text_type_fact` for the expression either way. Primitive proofs
	// the same, with attributes and children kept to their own ranges.
	const strings = validate(facts.stringChildRanges, child_ranges);
	validate(facts.stringAttributeRanges ?? [], attribute_ranges, strings);
	const primitives = validate(facts.primitiveTextChildRanges, child_ranges);
	validate(facts.primitiveAttributeRanges ?? [], attribute_ranges, primitives);
	facts_by_root.set(scope.root, { strings, primitives });
}

/**
 * @param {AST.Expression} expression
 * @param {ScopeInterface} scope
 * @param {boolean} strings_only
 */
export function has_text_type_fact(expression, scope, strings_only) {
	const facts = facts_by_root.get(scope.root);
	if (!facts) return false;
	const key = `${expression.start}:${expression.end}`;
	return facts?.strings.has(key) || (!strings_only && facts?.primitives.has(key)) || false;
}
