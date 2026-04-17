/**
 * @import * as AST from 'estree'
 */

/**
 * Check if a comment is a TypeScript pragma (line comment)
 * @param {AST.CommentWithLocation} comment
 * @returns {boolean}
 */
export function is_ts_pragma(comment) {
	if (comment.type !== 'Line') return false;

	const pragmas = ['@ts-ignore', '@ts-expect-error', '@ts-nocheck', '@ts-check'];
	return pragmas.some((pragma) => comment.value.trimStart().startsWith(pragma));
}

/**
 * Check if a comment is a triple-slash directive
 * /// <reference path="..." />
 * @param {AST.CommentWithLocation} comment
 * @returns {boolean}
 */
export function is_triple_slash_directive(comment) {
	if (comment.type !== 'Line') return false;

	// Triple slash directives start with / after the // is stripped
	// So the value should start with / followed by <reference, <amd-module, or <amd-dependency
	const value = comment.value.trim();
	return /^\/\s*<(reference|amd-module|amd-dependency)/.test(value);
}

/**
 * Check if a comment is a JSDoc comment with TypeScript annotations
 * Examples: block comments containing `@type`, `@typedef`, `@param`, `@returns`, etc.
 * @param {AST.CommentWithLocation} comment
 * @returns {boolean}
 */
export function is_jsdoc_ts_annotation(comment) {
	if (comment.type !== 'Block') return false;

	// JSDoc comments start with /** which means the value starts with * after /* is stripped
	if (!comment.value.startsWith('*')) return false;

	// Check if it contains TypeScript-relevant tags
	const tsAnnotations = [
		'@type',
		'@typedef',
		'@param',
		'@returns',
		'@template',
		'@extends',
		'@implements',
		'@satisfies',
		'@overload',
		'@import',
	];

	return tsAnnotations.some((annotation) => comment.value.includes(annotation));
}

/**
 * Check if a comment should be preserved in to_ts mode
 * @param {AST.CommentWithLocation} comment
 * @returns {boolean}
 */
export function should_preserve_comment(comment) {
	return (
		is_ts_pragma(comment) || is_triple_slash_directive(comment) || is_jsdoc_ts_annotation(comment)
	);
}

/**
 * Format a comment for output
 * @param {AST.CommentWithLocation} comment
 * @returns {string}
 */
export function format_comment(comment) {
	if (comment.type === 'Line') {
		// Check if it's a triple-slash directive (value starts with /)
		if (comment.value.trimStart().startsWith('/')) {
			return `/// ${comment.value.trimStart().slice(1)}`;
		}
		return `// ${comment.value.trim()}`;
	} else {
		// Block comment - check if it's a JSDoc (value starts with *)
		if (comment.value.startsWith('*')) {
			return `/** ${comment.value.trim().slice(1)} */`;
		}
		return `/* ${comment.value.trim()} */`;
	}
}
