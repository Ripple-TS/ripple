import type { Program } from 'estree';
import type { Linter } from 'eslint';
import { parseModule as parse_module } from '@tsrx/core';

interface ParseResult {
	ast: Program;
	services?: Record<string, any>;
	scopeManager?: any;
	visitorKeys?: Record<string, string[]>;
}

const visitorKeys: Record<string, string[]> = {
	Program: ['body'],
	TsrxFragment: ['children'],
	Element: ['id', 'attributes', 'children'],
	Attribute: ['name', 'value'],
	Text: ['expression'],
	TSRXExpression: ['expression'],
	StyleSheet: [],
	ForOfStatement: ['left', 'right', 'body'],
};

/**
 * The TSRX parser's AST contains some redundant references (e.g. `Element.attributes`
 * and `Element.openingElement.attributes`) that are useful for formatters/source-maps.
 * ESLint's traverser will visit both paths and can trigger duplicate rule reports.
 *
 * For ESLint, we prune JSX wrapper nodes to keep a single traversal path.
 */
function normalize_tsrx_ast_for_eslint(ast: any): void {
	const seen = new Set<any>();
	const visit = (node: any) => {
		if (!node || typeof node !== 'object') return;
		if (seen.has(node)) return;
		seen.add(node);

		if (node.type === 'Element') {
			// Avoid duplicate traversal of attributes/children through openingElement/closingElement.
			// The Element node itself carries the data ESLint rules care about.
			delete node.openingElement;
			delete node.closingElement;
		}

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

/**
 * ESLint parser for TSRX (.tsrx) files
 *
 * This parser uses the shared TSRX parser to parse .tsrx files
 * and returns an ESTree-compatible AST for ESLint to analyze.
 */
export function parseForESLint(code: string, options?: Linter.ParserOptions): ParseResult {
	try {
		// Parse the TSRX source code using the shared TSRX parser
		const ast = parse_module(code, options?.filePath) as any;
		if (!ast) throw new Error('Parser returned null or undefined AST');

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
			services: {},
			visitorKeys,
		};
	} catch (error: any) {
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
