/** @import * as AST from 'estree' */
/** @import { JsxPlatform } from '@tsrx/core/types' */

/**
 * Type-only lowering of a platform's `module <name> { … }` server-module
 * dialect (opt-in via `platform.serverModule`).
 *
 * The platform's runtime compiler owns the real semantics of a server
 * block: it validates isolation, emits the server namespace for SSR, and
 * replaces `import { fn } from '<specifier>'` with RPC stubs for the
 * browser. The type-only path never runs that codegen — it prints the
 * parsed AST as virtual TSX, which used to render the block verbatim.
 * Verbatim `module server { import … }` can NEVER typecheck: a static
 * import inside a namespace body is TS1147, and the companion
 * `import { fn } from 'server'` is TS2307 (no such module). So the dialect
 * was un-typecheckable in editors.
 *
 * This module rewrites the PARSED ast (before the type-only transform
 * prints it) into plain, checkable TypeScript with identical types:
 *
 *   module server {                      import { db } from './db.ts';
 *     import { db } from './db.ts';      namespace server {
 *     export function f() { … }     →      export function f() { … }
 *   }                                    }
 *   import { f } from 'server';          import f = server.f;
 *
 * The lowered namespace keeps the AUTHORED name and identifier location, so
 * hovering the block's name resolves, and the aliases' namespace
 * references mark the namespace as used (a server block nobody imports from
 * is the ONE case `noUnusedLocals` still flags — on the authored name, which
 * is the correct signal). A `declare module '<specifier>'` bridge (which
 * would have let the authored import statement survive verbatim) is NOT
 * possible: the virtual TSX is a module, where `declare module 'server'` is
 * a module AUGMENTATION — TS2664 when no module 'server' exists, and TS2666
 * for the `export =` even when a global stub supplies one; augmentations
 * also merge program-wide, which would break the dialect's file-local
 * semantics. Each lowered alias keeps the import's specifier locations, so
 * hover/rename on the imported names and on the `'<specifier>'` source
 * still resolve.
 *
 * Block imports hoist to module top level (namespaces close over module
 * scope, so the body still resolves them — `noUnusedLocals` counts those
 * uses), and each boundary import becomes `import x = server.x` aliases
 * that keep every meaning of the export — an authored named import binds
 * value AND type, so a class or enum stays usable as a type (type-only
 * specifiers become `type x = server.x` aliases; a string-named import
 * falls back to a value-only destructure). When a
 * hoisted import's local name is also used anywhere in the client module
 * (the compiler's isolation rule stops the server block from referencing
 * client bindings, but nothing stops both sides from importing — or
 * referencing a global named — `db`), hoisting it verbatim would collide or
 * shadow. Those imports hoist as a mangled namespace import instead —
 * always a VALUE import keeping the authored `with { … }` attributes,
 * because an import-equals alias cannot reference a type-only import
 * (TS1380) — and each original binding is rebuilt inside the namespace:
 * `import db = __tsrx_server_import$0.db;` for value specifiers (the one
 * alias form that keeps EVERY meaning, so a colliding class import stays
 * usable as a type) and `type T = __tsrx_server_import$0.T;` for type-only
 * ones. Three corners cannot use import-equals: a string-named import
 * (`'x y' as db`) keeps a value-only destructure even when type-only — a
 * string can never appear in an entity name OR a qualified type
 * reference, so the destructure is the one parseable fallback; a value
 * DEFAULT import hoists an extra
 * mangled DEFAULT specifier rebound with `const` (no entity name reaches
 * a default — `import db = ns.default` is TS1359 and the default binding
 * itself has no namespace meaning — so a colliding default CLASS import
 * keeps only its value meaning, while a type-only default becomes
 * `type x = ns.default`); and a type-only NAMESPACE import rebinds as a
 * plain import-equals, which adds a value meaning the authored form
 * lacked. Each is an acceptable corner — a collision already requires the
 * client half to use the same name.
 *
 * The rewrite is copy-on-write: every replacement node is built with
 * spreads/builders and carries the ORIGINAL node's start/end/loc wherever it
 * corresponds to authored code, so the transform's esrap print emits real
 * source-mapped segments and hover / go-to-def / diagnostics keep mapping
 * back to the source. The original parse is never mutated.
 */

import * as b from '../../utils/builders.js';

const HOISTED_IMPORT_PREFIX = '__tsrx_server_import$';

/** Object keys that never contain child AST nodes. */
const WALK_SKIP_KEYS = new Set([
	'loc',
	'start',
	'end',
	'range',
	'parent',
	'metadata',
	'leadingComments',
	'trailingComments',
	'comments',
]);

/**
 * A non-ambient `TSModuleDeclaration` authored with the `module` keyword,
 * narrowed to the one name the platform's dialect supports. Blocks with any
 * other name are a hard compile error in the runtime compiler, so leaving
 * them verbatim (where TS flags them) mirrors the build failure instead of
 * hiding it.
 *
 * @param {any} node
 * @param {string} block_name
 */
function is_server_module_declaration(node, block_name) {
	return (
		node?.type === 'TSModuleDeclaration' &&
		node.declare !== true &&
		node.metadata?.module_keyword === 'module' &&
		identifier_name(node.id) === block_name
	);
}

/**
 * @param {any} node
 * @returns {string | null}
 */
function identifier_name(node) {
	if (node?.type === 'Identifier') return node.name;
	if (node?.type === 'Literal' && typeof node.value === 'string') return node.value;
	return null;
}

/**
 * @param {any} node
 * @param {string} import_specifier
 */
function is_server_import(node, import_specifier) {
	return node?.type === 'ImportDeclaration' && node.source?.value === import_specifier;
}

/**
 * Copy `node`'s authored location onto a replacement node.
 * @param {any} node
 * @param {any} source
 * @returns {any}
 */
function with_location(node, source) {
	if (source?.start != null) node.start = source.start;
	if (source?.end != null) node.end = source.end;
	if (source?.loc != null) node.loc = source.loc;
	node.metadata ??= { path: [] };
	return node;
}

/**
 * A namespace reference standing in for an authored STRING-LITERAL span (the
 * `'server'` import source, or a string-named block id). It carries the
 * literal's INNER span — the text between the quotes — as its source
 * mapping: `source_length` pins the mapped length to that inner text, since
 * the GENERATED identifier is the block name, whose length the authored
 * specifier need not share (`blockName` and `importSpecifier` may differ).
 * The `string_literal_source_span` metadata flag makes the mapping
 * collector serve hover/navigation WITHOUT semantic tokens: repainting part
 * of an authored string literal as a namespace token breaks the editor's
 * string coloring (the quotes stay outside the mapping for the same
 * reason). A literal without usable positions gets NO loc at all — the
 * collector then skips the mapping entirely rather than deriving a span
 * from the wrong length.
 *
 * @param {string} name
 * @param {any} literal
 * @returns {AST.Identifier}
 */
function string_span_namespace_ref(name, literal) {
	const node = b.id(name);
	node.metadata.string_literal_source_span = true;
	if (
		typeof literal?.start === 'number' &&
		typeof literal?.end === 'number' &&
		literal.end - literal.start >= 2
	) {
		node.start = literal.start + 1;
		node.end = literal.end - 1;
		node.metadata.source_length = literal.end - literal.start - 2;
		if (literal.loc != null) {
			// Fresh position objects: the authored literal's own loc must survive
			// the transform untouched (copy-on-write), and a module specifier is
			// always single-line, so shifting columns inside it is safe.
			node.loc = {
				start: { line: literal.loc.start.line, column: literal.loc.start.column + 1 },
				end: { line: literal.loc.end.line, column: literal.loc.end.column - 1 },
			};
		}
	}
	return node;
}

/**
 * Every identifier name that appears OUTSIDE the server block. This
 * deliberately over-approximates "top-level client bindings": a hoisted
 * server import may not only collide with a client import of the same name
 * (a TS2300 duplicate we would introduce) but also shadow a GLOBAL the
 * client code references (e.g. a server-side `import { crypto } from …`
 * changing what client `crypto` resolves to). Treating any outside use of
 * the name as a conflict costs nothing but an alias, and keeps the lowering
 * from ever changing what the client half of the file typechecks against.
 *
 * @param {any} ast
 * @param {any} declaration
 * @returns {Set<string>}
 */
function collect_outside_identifier_names(ast, declaration) {
	/** @type {Set<string>} */
	const names = new Set();
	const seen = new WeakSet();
	/** @param {any} node */
	function walk(node) {
		if (node === null || typeof node !== 'object' || seen.has(node) || node === declaration) {
			return;
		}
		seen.add(node);
		if (Array.isArray(node)) {
			for (const child of node) walk(child);
			return;
		}
		if (typeof node.type !== 'string') return;
		if (node.type === 'Identifier' || node.type === 'JSXIdentifier') {
			names.add(node.name);
		}
		for (const [key, value] of Object.entries(node)) {
			if (WALK_SKIP_KEYS.has(key)) continue;
			if (value !== null && typeof value === 'object') walk(value);
		}
	}
	walk(ast);
	return names;
}

/**
 * `const { a, b: c } = <init>;` rebinding each specifier's imported
 * name to its local name. Property nodes keep the authored specifier
 * locations so hover / rename still target the source. `make_init`
 * builds a fresh init expression per call (nodes are never shared).
 *
 * @param {any[]} specifiers
 * @param {() => AST.Expression} make_init
 * @param {any} loc_node
 */
function build_destructure(specifiers, make_init, loc_node) {
	const pattern = with_location(
		b.object_pattern(
			/** @type {any} */ (
				specifiers.map((specifier) =>
					with_location(
						b.prop(
							'init',
							{ ...specifier.imported },
							{ ...specifier.local },
							false,
							specifier.imported?.type === 'Identifier' &&
								specifier.imported.name === specifier.local?.name,
						),
						specifier,
					),
				)
			),
		),
		loc_node,
	);
	const declarator = with_location(b.declarator(pattern, make_init()), loc_node);
	return with_location(b.declaration('const', [declarator]), loc_node);
}

/**
 * `<left>.<right>` qualified name. Callers pass a `right` that carries the
 * authored specifier span, so hover / rename on the imported name resolve.
 *
 * @param {AST.Identifier} left
 * @param {any} right
 */
function qualified_name(left, right) {
	return {
		type: 'TSQualifiedName',
		left,
		right,
		metadata: { path: [] },
	};
}

/**
 * `type <local> = <left>.<right>;` for a type-only import specifier.
 * `right` defaults to the specifier's imported name; a DEFAULT import
 * passes `default` (which has no authored span of its own).
 *
 * @param {any} specifier
 * @param {() => AST.Identifier} make_left
 * @param {any} [right]
 */
function build_type_alias(specifier, make_left, right = { ...specifier.imported }) {
	return with_location(
		b.ts_type_alias(
			{ ...specifier.local },
			/** @type {any} */ ({
				type: 'TSTypeReference',
				typeName: qualified_name(make_left(), right),
				metadata: { path: [] },
			}),
		),
		specifier,
	);
}

/**
 * `import <local> = <reference>;` — an import-equals alias, the one form
 * that preserves every meaning (value, type, namespace) of the referenced
 * binding, where a `const` keeps only the value and a `type` alias only
 * the type.
 *
 * @param {any} specifier
 * @param {any} module_reference
 */
function build_import_equals(specifier, module_reference) {
	return with_location(
		/** @type {any} */ ({
			type: 'TSImportEqualsDeclaration',
			id: { ...specifier.local },
			moduleReference: module_reference,
			importKind: 'value',
			metadata: { path: [] },
		}),
		specifier,
	);
}

/**
 * Lower one block import whose local name(s) collide with outside code:
 * hoist under mangled names as a VALUE import (an import-equals alias
 * cannot reference a type-only import — TS1380) and rebuild each original
 * binding inside the namespace body. Named value specifiers and namespace
 * specifiers become `import x = …` aliases keeping every meaning of the
 * mangled namespace specifier; type-only specifiers become `type` aliases
 * (`<ns>.default` for a type-only default); string-named imports — even
 * type-only ones — destructure the namespace object (a string cannot
 * appear in an entity name or qualified type reference). A value DEFAULT import has no entity-name path at all
 * (`import x = <ns>.default` is TS1359, and a default-import binding has
 * no namespace meaning), so it hoists an extra mangled DEFAULT specifier
 * and rebinds it with `const` — exact default-import semantics, which
 * `<ns>.default` is not (a JSON module's namespace has no `default`
 * member under bundler resolution).
 *
 * @param {any} statement
 * @param {string} hoisted_name
 */
function lower_colliding_import(statement, hoisted_name) {
	const default_name = hoisted_name + '_default';
	const aliases = [];
	const destructured_specifiers = [];
	let needs_default_hoist = false;
	let needs_namespace_hoist = false;
	for (const specifier of statement.specifiers) {
		const type_only = statement.importKind === 'type' || specifier.importKind === 'type';
		if (specifier.type === 'ImportNamespaceSpecifier') {
			needs_namespace_hoist = true;
			aliases.push(build_import_equals(specifier, b.id(hoisted_name)));
		} else if (specifier.type === 'ImportDefaultSpecifier') {
			if (type_only) {
				needs_namespace_hoist = true;
				aliases.push(build_type_alias(specifier, () => b.id(hoisted_name), b.id('default')));
			} else {
				needs_default_hoist = true;
				const declarator = with_location(
					b.declarator({ ...specifier.local }, b.id(default_name)),
					specifier,
				);
				aliases.push(with_location(b.declaration('const', [declarator]), specifier));
			}
		} else if (specifier.imported?.type !== 'Identifier') {
			// String-named — neither an entity name nor a qualified type
			// reference can hold a string, so type-only ones land here too:
			// the destructure is the one PARSEABLE fallback, at the cost of
			// binding only a value.
			needs_namespace_hoist = true;
			destructured_specifiers.push(specifier);
		} else if (type_only) {
			needs_namespace_hoist = true;
			aliases.push(build_type_alias(specifier, () => b.id(hoisted_name)));
		} else {
			needs_namespace_hoist = true;
			aliases.push(
				build_import_equals(
					specifier,
					qualified_name(b.id(hoisted_name), { ...specifier.imported }),
				),
			);
		}
	}
	if (destructured_specifiers.length > 0) {
		aliases.push(build_destructure(destructured_specifiers, () => b.id(hoisted_name), statement));
	}

	// Only the specifiers the aliases reference — an unreferenced mangled
	// specifier would draw a spurious `noUnusedLocals` diagnostic.
	const hoist_specifiers = [];
	if (needs_default_hoist) {
		hoist_specifiers.push({
			type: 'ImportDefaultSpecifier',
			local: b.id(default_name),
			metadata: { path: [] },
		});
	}
	if (needs_namespace_hoist) {
		hoist_specifiers.push({
			type: 'ImportNamespaceSpecifier',
			local: b.id(hoisted_name),
			metadata: { path: [] },
		});
	}
	const hoisted = with_location(
		{
			type: 'ImportDeclaration',
			specifiers: hoist_specifiers,
			source: with_location({ ...statement.source }, statement.source),
			importKind: 'value',
			attributes: statement.attributes,
		},
		statement,
	);
	return { hoisted, aliases };
}

/**
 * Replace the server block with hoisted imports plus a namespace-valued
 * binding the checker can see through.
 *
 * @param {any} declaration
 * @param {Set<string>} outside_names
 * @param {string} block_name
 */
function lower_declaration(declaration, outside_names, block_name) {
	const hoisted_imports = [];
	const aliases = [];
	const rest = [];
	let hoisted_index = 0;

	for (const statement of declaration.body?.body ?? []) {
		if (statement.type !== 'ImportDeclaration') {
			rest.push(statement);
			continue;
		}
		const collides = (statement.specifiers ?? []).some((/** @type {any} */ specifier) =>
			outside_names.has(specifier.local?.name),
		);
		if (!collides) {
			// Authored node, hoisted as-is — its locations map 1:1.
			hoisted_imports.push(statement);
			continue;
		}
		const lowered = lower_colliding_import(statement, HOISTED_IMPORT_PREFIX + hoisted_index++);
		hoisted_imports.push(lowered.hoisted);
		aliases.push(...lowered.aliases);
	}

	// The lowered namespace deliberately keeps the authored block name: the
	// authored `module <name>` id already claims that name in the file (the
	// runtime compiler declares it as a module binding), so reusing it cannot
	// introduce a new collision, and it is what makes hover on the block's
	// name — and on the boundary import's source, whose span the destructure's
	// init identifier carries — resolve to the block. The id is always an
	// Identifier (the authored id could be a string Literal, whose span then
	// gets the same string-literal mapping treatment as the import source).
	const id =
		declaration.id?.type === 'Literal'
			? string_span_namespace_ref(block_name, declaration.id)
			: with_location(b.id(block_name), declaration.id);
	const namespace = {
		...declaration,
		id,
		metadata: { ...declaration.metadata, module_keyword: 'namespace' },
		body: { ...declaration.body, body: [...aliases, ...rest] },
	};
	return [...hoisted_imports, namespace];
}

/**
 * Rewrite one `import { x, type T } from '<specifier>'` statement into
 * bindings on the lowered namespace. Value specifiers become
 * `import x = <ns>.x;` aliases — the authored import carries EVERY
 * meaning of the export, so a `const { x } = <ns>;` destructure would
 * strip the type meaning of a class or enum. Type-only specifiers become
 * `type T = <ns>.T;` aliases; a string-named import — even a type-only
 * one, since neither an entity name nor a qualified type reference can
 * express it — falls back to a value-only destructure. A specifier-less
 * boundary import binds nothing and is dropped (the runtime compiler
 * accepts and elides it), while non-named specifiers (default / namespace
 * imports) are a hard compile error in the dialect — those statements
 * stay verbatim so the editor's TS2307 mirrors the build error.
 *
 * @param {any} statement
 * @param {string} block_name
 */
function lower_server_import(statement, block_name) {
	const specifiers = statement.specifiers ?? [];
	if (specifiers.length === 0) return [];
	if (specifiers.some((/** @type {any} */ s) => s.type !== 'ImportSpecifier')) {
		return [statement];
	}

	// Each reference to the namespace carries the authored import source's
	// inner span, so hover / go-to-def on the module name resolves to the
	// lowered block while the literal keeps its string coloring.
	const namespace_ref = () => string_span_namespace_ref(block_name, statement.source);
	const lowered = [];
	const destructured_specifiers = [];
	for (const specifier of specifiers) {
		if (specifier.imported?.type !== 'Identifier') {
			// String-named — inexpressible in an entity name or qualified type
			// reference alike, so type-only ones fall back here too.
			destructured_specifiers.push(specifier);
		} else if (statement.importKind === 'type' || specifier.importKind === 'type') {
			lowered.push(build_type_alias(specifier, namespace_ref));
		} else {
			lowered.push(
				build_import_equals(specifier, qualified_name(namespace_ref(), { ...specifier.imported })),
			);
		}
	}
	if (destructured_specifiers.length > 0) {
		lowered.push(build_destructure(destructured_specifiers, namespace_ref, statement));
	}
	return lowered;
}

/**
 * Lower the server-module dialect in a parsed program to plain TS the type
 * checker accepts. Returns the ORIGINAL ast unchanged (same object) when
 * the file has no server block; otherwise returns a new Program that shares
 * every untouched statement with the original parse.
 *
 * Only the FIRST server declaration is lowered — a second one is a hard
 * compile error in the runtime compiler, and leaving it verbatim surfaces a
 * TS error in the same place. Likewise a boundary import without any server
 * block stays verbatim (TS2307), mirroring the build error.
 *
 * @param {AST.Program} ast
 * @param {NonNullable<JsxPlatform['serverModule']>} server_module
 * @returns {AST.Program}
 */
export function lower_server_module_for_types(ast, server_module) {
	const { blockName: block_name, importSpecifier: import_specifier } = server_module;
	const body = /** @type {any[] | undefined} */ (ast?.body);
	if (!Array.isArray(body)) return ast;
	const declaration = body.find((node) => is_server_module_declaration(node, block_name));
	// A body-less `module server;` only occurs mid-edit / in loose parses;
	// leave it for TS to flag rather than fabricating an empty namespace.
	if (declaration === undefined || !Array.isArray(declaration.body?.body)) return ast;

	const outside_names = collect_outside_identifier_names(ast, declaration);
	// The lowered namespace claims the authored block name at module scope; a
	// block import local with the same name must be aliased out of its way.
	outside_names.add(block_name);
	const new_body = [];
	for (const statement of body) {
		if (statement === declaration) {
			new_body.push(...lower_declaration(declaration, outside_names, block_name));
		} else if (is_server_import(statement, import_specifier)) {
			new_body.push(...lower_server_import(statement, block_name));
		} else {
			new_body.push(statement);
		}
	}
	return { ...ast, body: new_body };
}
