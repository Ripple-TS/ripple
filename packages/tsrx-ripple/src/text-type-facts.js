// @ts-check

/** @import * as AST from 'estree' */
/** @import { ScopeInterface, TextTypeFacts } from '../types/index' */
import { strongHash as strong_hash } from '@tsrx/core';

/** @type {WeakMap<object, { strings: Set<string>, primitives: Set<string> }>} */
const facts_by_root = new WeakMap();

/**
 * Validate externally supplied facts before either transform can consume them.
 * @param {Map<string, unknown> | undefined} children
 * @param {string} source
 * @param {string} filename
 * @param {ScopeInterface} scope
 * @param {TextTypeFacts | undefined} facts
 */
export function register_text_type_facts(children, source, filename, scope, facts) {
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
	/** @param {readonly (readonly [number, number])[]} ranges */
	const validate = (ranges) => {
		if (!Array.isArray(ranges)) return invalid();
		const keys = new Set();
		for (const range of ranges) {
			if (
				!Array.isArray(range) ||
				range.length !== 2 ||
				!range.every(Number.isSafeInteger) ||
				range[0] < 0 ||
				range[1] <= range[0] ||
				range[1] > source.length ||
				!children?.has(`${range[0]}:${range[1]}`)
			)
				invalid();
			keys.add(`${range[0]}:${range[1]}`);
		}
		return keys;
	};
	facts_by_root.set(scope.root, {
		strings: validate(facts.stringChildRanges),
		primitives: validate(facts.primitiveTextChildRanges),
	});
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
