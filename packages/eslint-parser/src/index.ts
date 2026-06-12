import type { Program } from 'estree';
import type { Linter } from 'eslint';
import { DIAGNOSTIC_CODES, parseModule as parse_module } from '@tsrx/core';

interface ParseResult {
	ast: Program;
	services?: Record<string, any>;
	scopeManager?: any;
	visitorKeys?: Record<string, string[]>;
}

const visitorKeys: Record<string, string[]> = {
	Program: ['body'],
	JSXElement: ['openingElement', 'children', 'closingElement'],
	JSXOpeningElement: ['name', 'attributes'],
	JSXClosingElement: ['name'],
	JSXFragment: ['openingFragment', 'children', 'closingFragment'],
	JSXOpeningFragment: [],
	JSXClosingFragment: [],
	JSXExpressionContainer: ['expression'],
	JSXAttribute: ['name', 'value'],
	JSXSpreadAttribute: ['argument'],
	JSXIdentifier: [],
	JSXMemberExpression: ['object', 'property'],
	JSXNamespacedName: ['namespace', 'name'],
	JSXText: [],
	JSXStyleElement: ['openingElement', 'children', 'closingElement'],
	JSXIfExpression: ['test', 'consequent', 'alternate'],
	JSXForExpression: ['init', 'test', 'update', 'left', 'right', 'body', 'index', 'key', 'empty'],
	JSXSwitchExpression: ['discriminant', 'cases'],
	JSXTryExpression: ['block', 'handler', 'finalizer', 'pending'],
	JSXCodeBlock: ['body', 'render'],
	StyleSheet: [],
	ForOfStatement: ['left', 'right', 'body'],
};

/**
 * Keep this hook for small ESLint-only AST normalizations.
 */
function normalize_tsrx_ast_for_eslint(ast: any): void {
	const seen = new Set<any>();
	const visit = (node: any) => {
		if (!node || typeof node !== 'object') return;
		if (seen.has(node)) return;
		seen.add(node);

		for (const key of Object.keys(node)) {
			if (key === 'parent' || key === 'loc' || key === 'range') continue;
			const value = node[key];
			if (Array.isArray(value)) {
				for (const child of value) visit(child);
			} else if (value && typeof value === 'object') {
				visit(value);
			}
		}
	};

	visit(ast);
}

/**
 * Recursively walks the AST and ensures all nodes have range and loc properties
 * ESLint's scope analyzer requires these properties on ALL nodes
 */
function ensure_node_properties(node: any, code: string): void {
	if (!node || typeof node !== 'object') {
		return;
	}

	// Ensure range property exists
	if (node.start !== undefined && node.end !== undefined && !node.range) {
		node.range = [node.start, node.end];
	}

	// Ensure loc property exists
	if (!node.loc && node.start !== undefined && node.end !== undefined) {
		const lines = code.split('\n');
		let current_pos = 0;
		let start_line = 1;
		let start_column = 0;
		let end_line = 1;
		let end_column = 0;

		for (let i = 0; i < lines.length; i++) {
			const line_length = lines[i].length + 1;
			if (current_pos + line_length > node.start) {
				start_line = i + 1;
				start_column = node.start - current_pos;
				break;
			}
			current_pos += line_length;
		}

		current_pos = 0;
		for (let i = 0; i < lines.length; i++) {
			const line_length = lines[i].length + 1;
			if (current_pos + line_length > node.end) {
				end_line = i + 1;
				end_column = node.end - current_pos;
				break;
			}
			current_pos += line_length;
		}

		node.loc = {
			start: { line: start_line, column: start_column },
			end: { line: end_line, column: end_column },
		};
	}

	for (const key in node) {
		if (key === 'parent' || key === 'loc' || key === 'range') {
			continue; // Skip these to avoid infinite loops
		}

		const value = node[key];
		if (Array.isArray(value)) {
			value.forEach((child) => ensure_node_properties(child, code));
		} else if (value && typeof value === 'object' && value.type) {
			ensure_node_properties(value, code);
		}
	}
}

function is_fatal_parser_diagnostic(error: any): boolean {
	return (
		error?.code === DIAGNOSTIC_CODES.UNCLOSED_TAG ||
		error?.code === DIAGNOSTIC_CODES.MISMATCHED_CLOSING_TAG
	);
}

function to_eslint_parse_error(error: any): SyntaxError {
	const parse_error: any = new SyntaxError(error?.message || String(error));
	const loc = error?.loc?.start;
	if (loc) {
		parse_error.lineNumber = loc.line;
		parse_error.column = loc.column + 1;
	}
	if (typeof error?.start === 'number') {
		parse_error.index = error.start;
	}
	return parse_error;
}

/**
 * ESLint parser for TSRX (.tsrx) files
 *
 * This parser uses the shared TSRX parser to parse .tsrx files
 * and returns an ESTree-compatible AST for ESLint to analyze.
 */
export function parseForESLint(code: string, options?: Linter.ParserOptions): ParseResult {
	try {
		const errors: any[] = [];
		// Parse the TSRX source code using the shared TSRX parser. ESLint passes
		// `<input>` for in-memory sources (e.g. RuleTester), so a real filename is
		// only missing when the parser is invoked directly.
		const ast = parse_module(code, options?.filePath || 'ESLintParser.tsrx', {
			collect: true,
			errors,
		}) as any;
		if (!ast) throw new Error('Parser returned null or undefined AST');

		const fatal_error = errors.find(is_fatal_parser_diagnostic);
		if (fatal_error) {
			throw to_eslint_parse_error(fatal_error);
		}

		// Normalize for ESLint traversal (avoid duplicate node visits)
		normalize_tsrx_ast_for_eslint(ast);

		// Recursively ensure all nodes have range and loc properties
		ensure_node_properties(ast, code);

		// Create a properly structured AST object ensuring all required properties exist
		const result: any = {
			type: ast.type || 'Program',
			start: ast.start !== undefined ? ast.start : 0,
			end: ast.end !== undefined ? ast.end : code.length,
			loc: ast.loc || {
				start: { line: 1, column: 0 },
				end: { line: code.split('\n').length, column: 0 },
			},
			range: ast.range || [0, code.length],
			body: ast.body || [],
			sourceType: ast.sourceType || 'module',
			comments: ast.comments || [],
			tokens: ast.tokens || [],
		};

		return {
			ast: result,
			services: {
				tsrxDiagnostics: errors,
			},
			visitorKeys,
		};
	} catch (error: any) {
		if (error instanceof SyntaxError && (error as any).lineNumber != null) {
			throw error;
		}
		// Transform TSRX parse errors to ESLint-compatible format
		throw new SyntaxError(`Failed to parse TSRX file: ${error.message || error}`);
	}
}

/**
 * Legacy parse function for older ESLint versions
 */
export function parse(code: string, options?: Linter.ParserOptions): Program {
	const result = parseForESLint(code, options);
	return result.ast;
}

export default {
	parseForESLint,
	parse,
};
