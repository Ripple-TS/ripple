/**
@import * as AST from 'estree';
@import { CompileError } from '../types/index';
*/

/**
 *
 * @param {string} message
 * @param {string | null} filename
 * @param {AST.Node | AST.NodeWithLocation} node
 * @param {CompileError[]} [errors]
 * @param {AST.CommentWithLocation[]} [comments]
 * @param {string} [code]
 * @returns {void}
 */
export function error(message, filename, node, errors, comments, code) {
	if (errors && comments && is_error_suppressed(node, comments)) {
		return;
	}

	const error = /** @type {CompileError} */ (new Error(message));

	// same as the acorn compiler error
	error.pos = node.start ?? undefined;
	error.raisedAt = node.end ?? undefined;

	// custom properties
	error.fileName = filename;
	error.code = code;
	error.end = node.end ?? undefined;
	error.loc = !node.loc
		? undefined
		: {
				start: {
					line: node.loc.start.line,
					column: node.loc.start.column,
				},
				end: {
					line: node.loc.end.line,
					column: node.loc.end.column,
				},
			};

	if (errors) {
		error.type = 'usage';
		errors.push(error);
		return;
	}

	error.type = 'fatal';
	throw error;
}

/**
 * @param {AST.CommentWithLocation} comment
 * @return {boolean}
 */
function is_error_suppress_comment(comment) {
	const text = comment.value.trim();
	return (
		text.startsWith('@tsrx-ignore') ||
		text.startsWith('@tsrx-expect-error') ||
		text.startsWith('@ripple-ignore') ||
		text.startsWith('@ripple-expect-error')
	);
}

/**
 * @param {AST.Node | AST.NodeWithLocation} node
 * @param {AST.CommentWithLocation[]} comments
 */
function is_error_suppressed(node, comments) {
	if (node.loc) {
		const node_start_line = node.loc.start.line;
		for (const comment of comments) {
			if (comment.type === 'Line' && comment.loc.start.line === node_start_line - 1) {
				if (is_error_suppress_comment(comment)) {
					return true;
				}
			}
		}
	}
	return false;
}
