// @ts-check

/** @import { TextTypeFacts } from '../types/index' */
import path from 'node:path';
import ts from 'typescript';
import { strongHash as strong_hash } from '@tsrx/core';
import { compile_to_volar_mappings } from './index.js';

let generation = 0;

/**
 * Node-only, Ripple-specific text analysis over the target's existing virtual
 * TypeScript output. No checker is loaded by the ordinary compiler entry point.
 * Each project is a fixed filesystem snapshot; invalidate before reusing it
 * after edits, and use identical facts for both rendering modes.
 * @param {{ tsconfig: string }} options
 */
function create_text_type_project({ tsconfig }) {
	const config_path = path.resolve(tsconfig);
	/** @type {Map<string, string | undefined>} */
	let files;
	/** @type {Map<string, ReturnType<typeof compile_to_volar_mappings>>} */
	let virtuals;
	/** @type {Map<string, TextTypeFacts>} */
	let facts;
	/** @type {ts.ParsedCommandLine} */
	let config;
	/** @type {ts.Program | undefined} */
	let program;
	let project_version = '';
	let disposed = false;

	/** @param {string} filename */
	function read(filename) {
		filename = path.resolve(filename);
		if (!files.has(filename)) files.set(filename, ts.sys.readFile(filename));
		return files.get(filename);
	}

	function invalidate() {
		if (disposed) throw new Error('Text type project has been disposed');
		files = new Map();
		virtuals = new Map();
		facts = new Map();
		program = undefined;
		project_version = String(++generation);
		const loaded = ts.readConfigFile(config_path, read);
		if (loaded.error)
			throw new Error(ts.flattenDiagnosticMessageText(loaded.error.messageText, '\n'));
		config = ts.parseJsonConfigFileContent(
			loaded.config,
			{ ...ts.sys, readFile: read },
			path.dirname(config_path),
			undefined,
			config_path,
			undefined,
			[{ extension: '.tsrx', isMixedContent: true, scriptKind: ts.ScriptKind.TSX }],
		);
		const errors = config.errors.filter((error) => error.code !== 18003);
		if (errors.length)
			throw new Error(
				errors.map((error) => ts.flattenDiagnosticMessageText(error.messageText, '\n')).join('\n'),
			);
		// A non-null string proof is only meaningful with strict null checking.
		if (!(config.options.strictNullChecks ?? config.options.strict)) {
			throw new Error('Ripple textTypes requires strictNullChecks in the TypeScript project');
		}
		config.options = {
			...config.options,
			noEmit: true,
			noUncheckedIndexedAccess: true,
			jsx: ts.JsxEmit.Preserve,
			allowNonTsExtensions: true,
		};
	}

	/** @param {string} filename */
	function virtual(filename) {
		let result = virtuals.get(filename);
		if (!result) {
			const source = read(filename);
			if (source === undefined) return undefined;
			result = compile_to_volar_mappings(source, filename);
			virtuals.set(filename, result);
		}
		return result;
	}

	/** @param {string} filename */
	const virtual_name = (filename) => (filename.endsWith('.tsrx') ? `${filename}.tsx` : filename);
	/** @param {string} filename */
	const source_name = (filename) =>
		filename.endsWith('.tsrx.tsx') ? filename.slice(0, -4) : filename;

	/** @param {string} filename */
	function ensure_program(filename) {
		const name = virtual_name(filename);
		if (program?.getSourceFile(name)) return program;
		const host = ts.createCompilerHost(config.options);
		host.readFile = (file) =>
			file.endsWith('.tsrx.tsx') ? virtual(source_name(file))?.code : read(file);
		host.fileExists = (file) => read(source_name(file)) !== undefined;
		// TypeScript's default getSourceFile closes over the system reader.
		host.getSourceFile = (file, language_version) => {
			const text = host.readFile(file);
			return text === undefined
				? undefined
				: ts.createSourceFile(file, text, language_version, true);
		};
		const roots = new Set(program?.getRootFileNames() ?? config.fileNames.map(virtual_name));
		roots.add(name);
		program = ts.createProgram({ rootNames: [...roots], options: config.options, host });
		return program;
	}

	/**
	 * @param {ts.Type} type
	 * @param {boolean} strings_only
	 * @returns {boolean}
	 */
	function is_primitive(type, strings_only) {
		if (type.isUnion()) return type.types.every((member) => is_primitive(member, strings_only));
		return !!(
			type.flags &
			(strings_only
				? ts.TypeFlags.StringLike
				: ts.TypeFlags.StringLike | ts.TypeFlags.NumberLike | ts.TypeFlags.BigIntLike)
		);
	}

	/**
	 * @param {string} filename
	 * @param {string} [source] Exact source being sent to the compiler.
	 * @returns {TextTypeFacts}
	 */
	function get_text_type_facts(filename, source) {
		if (disposed) throw new Error('Text type project has been disposed');
		filename = path.resolve(filename);
		const disk_source = read(filename);
		if (disk_source === undefined) throw new Error(`Cannot read ${filename}`);
		if (source !== undefined && source !== disk_source) {
			throw new Error(`Text type source differs from project snapshot: ${filename}`);
		}
		const cached = facts.get(filename);
		if (cached) return cached;
		const current = ensure_program(filename);
		const mapped = virtual(filename);
		const file = current.getSourceFile(virtual_name(filename));
		if (!mapped || !file) throw new Error(`Cannot analyze ${filename}`);
		const checker = current.getTypeChecker();
		/** @type {Map<string, ts.Expression[]>} */
		const expressions = new Map();
		// This visits the TypeScript tree, not the TSRX AST. Authored child
		// ranges were collected by Ripple's existing analysis visitors.
		/** @param {ts.Node} node */
		function visit(node) {
			if (
				ts.isJsxExpression(node) &&
				node.expression &&
				(ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))
			) {
				const expression = node.expression;
				const key = `${expression.getStart(file)}:${expression.end}`;
				const entries = expressions.get(key) ?? [];
				entries.push(expression);
				expressions.set(key, entries);
				expressions.set(`${node.getStart(file)}:${node.end}`, entries);
			}
			ts.forEachChild(node, visit);
		}
		visit(file);
		/** @type {TextTypeFacts} */
		const result = {
			version: 1,
			filename,
			sourceVersion: strong_hash(disk_source),
			projectVersion: project_version,
			stringChildRanges: [],
			primitiveTextChildRanges: [],
		};
		/** @type {[number, number][]} */
		const strings = [];
		/** @type {[number, number][]} */
		const primitives = [];
		const diagnostics = current.getSyntacticDiagnostics(file);
		if (!mapped.errors.length && !diagnostics.length) {
			// Only exact expression mappings qualify. Ambiguous/generated mappings
			// must not grant a proof to a different authored expression.
			const candidates = new Map();
			const source_ranges = new Map();
			for (const [key, { container }] of mapped.textChildExpressions) {
				source_ranges.set(key, key);
				if (container?.type === 'JSXExpressionContainer') {
					source_ranges.set(`${container.start}:${container.end}`, key);
				}
			}
			for (const mapping of mapped.mappings) {
				for (let i = 0; i < mapping.sourceOffsets.length; i++) {
					const start = mapping.sourceOffsets[i];
					const end = start + mapping.lengths[i];
					const key = source_ranges.get(`${start}:${end}`);
					if (!key) continue;
					const generated_start = mapping.generatedOffsets[i];
					const generated_end =
						generated_start + (mapping.generatedLengths?.[i] ?? mapping.lengths[i]);
					const nodes = expressions.get(`${generated_start}:${generated_end}`);
					if (!nodes) continue;
					const set = candidates.get(key) ?? new Set();
					for (const node of nodes) set.add(node);
					candidates.set(key, set);
				}
			}
			for (const [key, nodes] of candidates) {
				if (nodes.size !== 1) continue;
				const type = checker.getTypeAtLocation([...nodes][0]);
				const expression = mapped.textChildExpressions.get(key)?.expression;
				if (!expression || expression.start === undefined || expression.end === undefined) continue;
				const range = /** @type {[number, number]} */ ([expression.start, expression.end]);
				if (is_primitive(type, true)) strings.push(range);
				else if (is_primitive(type, false)) primitives.push(range);
			}
		}
		result.stringChildRanges = strings;
		result.primitiveTextChildRanges = primitives;
		facts.set(filename, result);
		return result;
	}

	function assert_unchanged() {
		if (disposed) throw new Error('Text type project has been disposed');
		for (const [filename, source] of files) {
			if (ts.sys.readFile(filename) !== source) {
				throw new Error(`Text type project changed during build: ${filename}`);
			}
		}
	}

	function dispose() {
		program = undefined;
		files.clear();
		virtuals.clear();
		facts.clear();
		disposed = true;
	}

	invalidate();
	return {
		getTextTypeFacts: get_text_type_facts,
		invalidate,
		assertUnchanged: assert_unchanged,
		dispose,
	};
}

export { create_text_type_project as createTextTypeProject };
