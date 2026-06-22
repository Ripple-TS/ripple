/**
 * @tsrx/ripple-new compiler — compiles TSRX source into JS that targets
 * the ripple-new runtime.
 *
 * Architecture (mirrors PLAN-TEMPLATE-RUNTIME.md §6 and §7):
 *   1. Parse TSRX via @tsrx/core's parseModule.
 *   2. For each top-level node:
 *        - Component → compile to a function that takes (scope, props, extra).
 *        - Other (imports, regular consts/functions) → emit as-is via esrap.
 *   3. Within a Component body:
 *        - Statements (declarations, hook calls, etc.) are kept and run on
 *          every invocation. Hook calls get a fresh module-scope Symbol
 *          passed as their last argument (conditional-hook-safe, §6.5).
 *        - JSX statements are extracted into a hoisted HTML template + a
 *          plan of dynamic bindings (text holes, attribute holes, event
 *          handlers) and a forBlock call for any for-of inside element
 *          children.
 *
 * Scope of the spike: handles the constructs used by the js-framework-benchmark
 * fixture (Main.tsrx). Sufficient for: components with attributes (static +
 * dynamic), event handlers, only-child text holes, for-of with keyed
 * reconciliation. Out of scope: TSRX `<style>`, scoped CSS, lazy destructure,
 * ifBlock, dynamic components, portals.
 */

import {
	parseModule,
	analyzeCss,
	prepareStylesheetForRender,
	renderStylesheets,
	annotateWithHash,
	createStyleClassMapFromStylesheet,
} from '@tsrx/core';
import { print as esrapPrint } from 'esrap';
import esrapTsx from 'esrap/languages/tsx';

const VOID_ELEMENTS = new Set([
	'area',
	'base',
	'br',
	'col',
	'embed',
	'hr',
	'img',
	'input',
	'link',
	'meta',
	'param',
	'source',
	'track',
	'wbr',
]);

const HOOK_NAMES = new Set([
	'useState',
	'useReducer',
	'useEffect',
	'useLayoutEffect',
	'useInsertionEffect',
	'useMemo',
	'useCallback',
	'useRef',
	'useId',
	'useEffectEvent',
	'useImperativeHandle',
	'useDeferredValue',
	'useTransition',
	'useSyncExternalStore',
	// React 19 Actions bundle.
	'useActionState',
	'useFormStatus',
	'useOptimistic',
]);

// Namespace inheritance — mirrors HTML5 foreign-content rules. The element
// itself and its children may have *different* namespaces: <foreignObject>
// inside SVG is still an SVG element, but its children switch back to HTML.
function nsForSelf(tag, parentNs) {
	if (tag === 'svg') return 'svg';
	if (tag === 'math') return 'mathml';
	return parentNs; // includes <foreignObject> — itself is SVG-ns
}

function nsForChildren(tag, parentNs) {
	if (tag === 'foreignObject') return 'html';
	if (tag === 'svg') return 'svg';
	if (tag === 'math') return 'mathml';
	return parentNs;
}

function nsFlag(ns) {
	return ns === 'svg' ? 1 : ns === 'mathml' ? 2 : 0;
}

function elementTagName(node) {
	if (!node || node.type !== 'Element') return null;
	return node.id?.name || node.openingElement?.name?.name || null;
}

function isNonHtmlRootTag(node) {
	const t = elementTagName(node);
	return t === 'svg' || t === 'math';
}

function nsForRootTag(node, parentNs) {
	const t = elementTagName(node);
	if (t === 'svg') return 'svg';
	if (t === 'math') return 'mathml';
	return parentNs;
}

// All keys + values are string/number/bool literals → safe to serialize at
// compile time into a `style="…"` HTML attribute (no runtime cost). Keys that
// are computed or properties with non-literal values disqualify the whole
// object — fall back to a setStyle binding.
function objectExprIsStaticLiteral(obj) {
	for (const p of obj.properties || []) {
		if (p.type !== 'Property' && p.type !== 'ObjectProperty') return false;
		if (p.computed) return false;
		const k = p.key;
		if (k.type !== 'Identifier' && !(k.type === 'Literal' && typeof k.value === 'string'))
			return false;
		const v = p.value;
		if (v.type !== 'Literal') return false;
		if (
			v.value != null &&
			typeof v.value !== 'string' &&
			typeof v.value !== 'number' &&
			typeof v.value !== 'boolean'
		)
			return false;
	}
	return true;
}

function staticObjectToCssString(obj) {
	const parts = [];
	for (const p of obj.properties || []) {
		const name = p.key.type === 'Identifier' ? p.key.name : p.key.value;
		const value = p.value.value;
		if (value == null || value === false || value === '') continue;
		parts.push(`${name}: ${value === true ? '' : value}`);
	}
	return parts.join('; ');
}

// ===========================================================================
// Purity analysis — for-of body memoisation
// ===========================================================================

/**
 * Collect names bound by a destructuring pattern into `out`. Handles
 * Identifier / ObjectPattern / ArrayPattern / RestElement / AssignmentPattern.
 */
function collectBindings(pattern, out) {
	if (!pattern) return;
	if (pattern.type === 'Identifier') {
		out.add(pattern.name);
		return;
	}
	if (pattern.type === 'ObjectPattern') {
		for (const p of pattern.properties || []) {
			if (p.type === 'RestElement') collectBindings(p.argument, out);
			else collectBindings(p.value || p.key, out);
		}
		return;
	}
	if (pattern.type === 'ArrayPattern') {
		for (const e of pattern.elements || []) collectBindings(e, out);
		return;
	}
	if (pattern.type === 'RestElement') {
		collectBindings(pattern.argument, out);
		return;
	}
	if (pattern.type === 'AssignmentPattern') {
		collectBindings(pattern.left, out);
		return;
	}
}

/**
 * Names directly declared at the outer component body — params + top-level
 * `const`/`let`/`var` + `function` declarations. We DON'T recurse into nested
 * blocks (those are scoped lower). Used as the "did the for-of body reference
 * anything from parent scope?" oracle for memoisation.
 */
function collectComponentLocals(componentNode) {
	const locals = new Set();
	for (const p of componentNode.params || []) collectBindings(p, locals);
	// New shape: body is a JSXCodeBlock with `.body` as the statement list.
	// Legacy/synthetic shape: body IS the statement list directly.
	const stmts =
		componentNode.body && componentNode.body.type === 'JSXCodeBlock'
			? componentNode.body.body || []
			: componentNode.body || [];
	for (const stmt of stmts) {
		if (stmt.type === 'VariableDeclaration') {
			for (const d of stmt.declarations || []) collectBindings(d.id, locals);
		} else if (stmt.type === 'FunctionDeclaration') {
			if (stmt.id) locals.add(stmt.id.name);
		}
	}
	return locals;
}

/**
 * Compute the set of component-local names that are guaranteed STABLE across
 * renders. Used by the auto-callback pass below to decide which `const X =
 * (...) => ...` declarations can be lowered to `useCallback`, and by the
 * for-of dep-snapshot logic to know whether a captured closure is worth
 * memoising on.
 *
 * Stability sources:
 *   - useState / useReducer setters (second destructured slot)
 *   - useRef returns (the ref object itself, not .current)
 *   - useCallback / useEffectEvent returns
 *   - Arrows previously declared in this body whose free vars are themselves
 *     all stable — transitive (auto-callback adds them back into the set)
 *
 * Walked in source order so a later `const` can reference an earlier one's
 * stability. Anything we can't prove stable is left out and re-renders
 * normally.
 */
function computeStableLocals(statements, componentLocals) {
	const stable = new Set();
	for (const stmt of statements) {
		if (stmt.type !== 'VariableDeclaration') continue;
		for (const decl of stmt.declarations || []) {
			const init = decl.init;
			if (!init) continue;
			if (init.type === 'CallExpression' && init.callee && init.callee.type === 'Identifier') {
				const callName = init.callee.name;
				// [_, setX] = useState(...)  — second slot is the stable setter.
				// Same shape for useReducer's dispatch.
				if (
					(callName === 'useState' || callName === 'useReducer') &&
					decl.id.type === 'ArrayPattern' &&
					decl.id.elements &&
					decl.id.elements.length >= 2 &&
					decl.id.elements[1] &&
					decl.id.elements[1].type === 'Identifier'
				) {
					stable.add(decl.id.elements[1].name);
					continue;
				}
				// x = useRef(...) / useCallback(...) / useEffectEvent(...) — the
				// return value is stable for the lifetime of the component.
				if (
					(callName === 'useRef' || callName === 'useCallback' || callName === 'useEffectEvent') &&
					decl.id.type === 'Identifier'
				) {
					stable.add(decl.id.name);
					continue;
				}
			}
			if (init.type === 'ArrowFunctionExpression' && decl.id.type === 'Identifier') {
				if (isArrowStableOver(init, stable, componentLocals)) {
					stable.add(decl.id.name);
				}
			}
		}
	}
	return stable;
}

/**
 * An arrow is "stable" when every free variable it references is either:
 *   - already known stable in this component (state setter / ref / ...)
 *   - not a component local at all (module-level — imports, top-level fns,
 *     literals — assumed stable by the React-convention rule that mutable
 *     state belongs in hooks, not in module scope)
 */
function isArrowStableOver(arrow, stable, componentLocals) {
	const paramScope = new Set();
	for (const p of arrow.params || []) collectBindings(p, paramScope);
	const free = collectFreeIdentifiers(arrow.body, paramScope);
	for (const name of free) {
		if (!componentLocals.has(name)) continue; // module-level
		if (stable.has(name)) continue;
		return false;
	}
	return true;
}

/**
 * Rewrite a VariableDeclaration so that any declarator initialised with an
 * arrow whose name is in `stable` becomes `useCallback(arrow, [deps])`.
 * `deps` is the subset of the arrow's free vars that are component locals
 * (module-level identifiers don't need to be listed — useCallback only cares
 * about reactive deps).
 *
 * Idempotent: a const we already rewrote into `useCallback(...)` won't be
 * re-wrapped (its init is now a CallExpression, not an ArrowFunctionExpression).
 */
function rewriteAutoCallback(stmt, stable, componentLocals, ctx) {
	if (stmt.type !== 'VariableDeclaration' || stmt.kind !== 'const') return stmt;
	let modified = false;
	const newDecls = stmt.declarations.map((decl) => {
		if (!decl.init || decl.init.type !== 'ArrowFunctionExpression') return decl;
		if (decl.id.type !== 'Identifier') return decl;
		if (!stable.has(decl.id.name)) return decl;

		const arrow = decl.init;
		const paramScope = new Set();
		for (const p of arrow.params || []) collectBindings(p, paramScope);
		const free = collectFreeIdentifiers(arrow.body, paramScope);
		const deps = [];
		const seen = new Set();
		for (const name of free) {
			if (!componentLocals.has(name)) continue;
			if (seen.has(name)) continue;
			seen.add(name);
			deps.push(name);
		}
		modified = true;
		ctx.runtimeNeeded.add('useCallback');
		return {
			...decl,
			init: {
				type: 'CallExpression',
				callee: { type: 'Identifier', name: 'useCallback' },
				arguments: [
					arrow,
					{
						type: 'ArrayExpression',
						elements: deps.map((n) => ({ type: 'Identifier', name: n })),
					},
				],
			},
		};
	});
	return modified ? { ...stmt, declarations: newDecls } : stmt;
}

/**
 * Walk an AST subtree collecting Identifier references that are NOT bound
 * locally (inside the subtree). Tracks block/function scopes so inner `const`
 * declarations correctly shadow outer references.
 */
function collectFreeIdentifiers(root, initiallyBound) {
	const free = new Set();
	walk(root, new Set(initiallyBound));
	return free;

	function walk(n, scope) {
		if (!n) return;
		if (Array.isArray(n)) {
			for (const x of n) walk(x, scope);
			return;
		}
		if (typeof n !== 'object') return;

		const t = n.type;
		if (!t) return;

		if (t === 'Identifier') {
			if (!scope.has(n.name)) free.add(n.name);
			return;
		}

		// Member access — `obj.prop`: prop is a static name, not a binding ref.
		if (t === 'MemberExpression' && !n.computed) {
			walk(n.object, scope);
			return;
		}
		// Object literal property keys are static names (when not computed).
		if (t === 'Property' && !n.computed) {
			walk(n.value, scope);
			return;
		}

		// Function-like scopes — params introduce new bindings.
		if (
			t === 'FunctionExpression' ||
			t === 'FunctionDeclaration' ||
			t === 'ArrowFunctionExpression'
		) {
			const newScope = new Set(scope);
			for (const p of n.params || []) collectBindings(p, newScope);
			// `function name(){}` introduces its own name into the body scope too.
			if (n.id) collectBindings(n.id, newScope);
			walk(n.body, newScope);
			return;
		}

		// Block scope — hoist `var`/`function` + pre-collect `let`/`const` so
		// forward references work the same way they do at runtime.
		if (t === 'BlockStatement') {
			const newScope = new Set(scope);
			for (const stmt of n.body || []) {
				if (stmt.type === 'VariableDeclaration') {
					for (const d of stmt.declarations || []) collectBindings(d.id, newScope);
				} else if (stmt.type === 'FunctionDeclaration' && stmt.id) {
					newScope.add(stmt.id.name);
				}
			}
			walk(n.body, newScope);
			return;
		}

		// VariableDeclarator's `id` is a binding, only walk the init.
		if (t === 'VariableDeclarator') {
			walk(n.init, scope);
			return;
		}

		// CatchClause introduces its param.
		if (t === 'CatchClause') {
			const newScope = new Set(scope);
			if (n.param) collectBindings(n.param, newScope);
			walk(n.body, newScope);
			return;
		}

		// for / for-in / for-of — left declarator introduces bindings.
		if (t === 'ForStatement' || t === 'ForInStatement' || t === 'ForOfStatement') {
			const newScope = new Set(scope);
			if (n.left && n.left.type === 'VariableDeclaration') {
				for (const d of n.left.declarations || []) collectBindings(d.id, newScope);
			} else if (n.left) {
				collectBindings(n.left, newScope);
			}
			walk(n.init, newScope);
			walk(n.test, newScope);
			walk(n.update, newScope);
			walk(n.right, newScope);
			walk(n.body, newScope);
			return;
		}

		// Default: walk all child fields.
		for (const key in n) {
			if (
				key === 'type' ||
				key === 'loc' ||
				key === 'start' ||
				key === 'end' ||
				key === 'range' ||
				key === 'metadata'
			)
				continue;
			walk(n[key], scope);
		}
	}
}

/**
 * Walk a for-of body looking for anything whose render is opaque to us —
 * component calls (`<Foo/>`, `<ctx.X/>`) or control-flow that wraps them
 * (`if`/`for`/`try`). Such constructs can read dynamic state (context,
 * setters, descendant hooks) during their own render, so skipping the
 * parent re-render would skip them too. Conservative match: any of those at
 * any depth → not memo-safe.
 */
function containsComponentCallOrControlFlow(stmts) {
	let found = false;
	function walk(n) {
		if (found || !n) return;
		if (Array.isArray(n)) {
			for (const x of n) walk(x);
			return;
		}
		if (typeof n !== 'object') return;
		const t = n.type;
		if (!t) return;
		// Component calls — old `Element` or new `JSXElement` with capitalised tag.
		if ((t === 'Element' || t === 'JSXElement') && isComponentTag(n)) {
			found = true;
			return;
		}
		// Control flow in the body — old statement-position forms.
		if (
			t === 'IfStatement' ||
			t === 'ForOfStatement' ||
			t === 'TryStatement' ||
			t === 'SwitchStatement'
		) {
			found = true;
			return;
		}
		// Control flow in the body — new JSX-expression forms.
		if (
			t === 'JSXIfExpression' ||
			t === 'JSXForExpression' ||
			t === 'JSXTryExpression' ||
			t === 'JSXSwitchExpression'
		) {
			found = true;
			return;
		}
		// Portal at child position — old TSRXExpression wrapper, new JSXExpressionContainer.
		if (t === 'TSRXExpression' && n.expression && isCreatePortalCall(n.expression)) {
			found = true;
			return;
		}
		if (t === 'JSXExpressionContainer' && n.expression && isCreatePortalCall(n.expression)) {
			found = true;
			return;
		}
		for (const key in n) {
			if (
				key === 'type' ||
				key === 'loc' ||
				key === 'start' ||
				key === 'end' ||
				key === 'range' ||
				key === 'metadata'
			)
				continue;
			walk(n[key]);
		}
	}
	for (const s of stmts) walk(s);
	return found;
}

/**
 * `() => fn(a, b, …)` — a zero-param arrow whose body is a single
 * function call. Returns `{ callee, args }` if so, else null. Used to compile
 * event handlers to the runtime's `{ fn, args }` bundle form so the
 * dispatcher gets a stable callee + identity-diffable args, sidestepping a
 * per-render closure allocation on keyed-list survivors.
 *
 * Conservative: we ONLY match arrows with NO params (so the user definitely
 * isn't reading the event arg), and the body must be a single CallExpression
 * (no statements, no side effects beyond the call). Members/index expressions
 * as the callee are fine — JS will resolve `this` correctly when the bundle
 * is invoked because the dispatcher uses `slot.fn.apply(null, ...)` only for
 * the variadic case; small-arity calls invoke the fn directly.
 */
function detectStableEventBundle(node) {
	if (!node || node.type !== 'ArrowFunctionExpression') return null;
	if (node.params.length !== 0) return null;
	// The body may be a BlockStatement with a single `return call()` or just
	// the expression directly (concise-arrow form).
	let body = node.body;
	if (body && body.type === 'BlockStatement') {
		if (body.body.length !== 1) return null;
		const stmt = body.body[0];
		if (stmt.type === 'ExpressionStatement') body = stmt.expression;
		else if (stmt.type === 'ReturnStatement' && stmt.argument) body = stmt.argument;
		else return null;
	}
	if (!body || body.type !== 'CallExpression') return null;
	// Bail if any arg is a spread — bundle args are positional only.
	if (body.arguments.some((a) => a.type === 'SpreadElement')) return null;
	return { callee: body.callee, args: body.arguments };
}

function isJsxLike(node) {
	if (!node) return false;
	const t = node.type;
	return (
		t === 'Element' ||
		t === 'Tsrx' ||
		t === 'Tsx' ||
		t === 'Text' ||
		t === 'JSXElement' ||
		t === 'JSXFragment' ||
		t === 'JSXText'
	);
}

/** A ternary at child position where at least one branch is JSX. */
function isConditionalJsx(node) {
	return (
		node &&
		node.type === 'ConditionalExpression' &&
		(isJsxLike(node.consequent) || isJsxLike(node.alternate))
	);
}

/** Wrap an expression as a BlockStatement body, so makeIfCall can consume it. */
function wrapAsBlockStmt(node) {
	if (!node) return null;
	// null / Literal(null) / Literal(false) → no branch
	if (node.type === 'Literal' && (node.value === null || node.value === false)) return null;
	return { type: 'BlockStatement', body: [node] };
}

/** `xs.map(x => <li/>)` — detect so we can throw a useful "use for-of" error. */
function isJsxReturningMapCall(node) {
	if (!node || node.type !== 'CallExpression') return false;
	const callee = node.callee;
	if (!callee || callee.type !== 'MemberExpression') return false;
	if (callee.property?.name !== 'map') return false;
	const arg = node.arguments?.[0];
	if (!arg || arg.type !== 'ArrowFunctionExpression') return false;
	const body = arg.body;
	if (isJsxLike(body)) return true;
	if (body && body.type === 'BlockStatement') {
		for (const stmt of body.body) {
			if (stmt.type === 'ReturnStatement' && isJsxLike(stmt.argument)) return true;
		}
	}
	return false;
}

// Recognise the dynamic form `{style (expr)}` — TSRX parses that as a
// `CallExpression(style, [expr])` because parenthesised expressions don't take
// the special Style path. We bridge here so both forms behave the same.
function isStyleCall(node) {
	return (
		node &&
		node.type === 'CallExpression' &&
		node.callee &&
		node.callee.type === 'Identifier' &&
		node.callee.name === 'style' &&
		node.arguments.length === 1
	);
}

// Resolve a `{ type: 'Style', value }` AST node — TSRX's `{style 'cls'}`
// expression — into a plain expression that yields a class string. The
// component's scoped css hash is prepended (so `{style 'row'}` in a component
// with hash "tsrx-abc" produces "tsrx-abc row"). Literal values inline; dynamic
// values become a runtime string concat. If the component has no <style> block
// the hash is dropped and the inner value is used as-is.
function resolveStyleExpr(node, cssHash) {
	if (!node) return node;
	let inner;
	if (node.type === 'Style') inner = node.value;
	else if (isStyleCall(node) && cssHash) inner = node.arguments[0];
	else return node;
	if (!cssHash) {
		return inner.type === 'Literal' && typeof inner.value === 'string'
			? { type: 'Literal', value: inner.value, raw: JSON.stringify(inner.value) }
			: inner;
	}
	if (inner.type === 'Literal' && typeof inner.value === 'string') {
		const combined = inner.value ? `${cssHash} ${inner.value}` : cssHash;
		return { type: 'Literal', value: combined, raw: JSON.stringify(combined) };
	}
	// Dynamic: emit `(<hash> + ' ' + (expr))` so absent/null produces "<hash> ".
	return {
		type: 'BinaryExpression',
		operator: '+',
		left: { type: 'Literal', value: cssHash + ' ', raw: JSON.stringify(cssHash + ' ') },
		right: inner,
	};
}

/**
 * The new TSRX (`@tsrx/core@0.1.25`) shape for a component is a plain
 * `FunctionDeclaration` whose `body` is a `JSXCodeBlock` (opened by `@{`),
 * not the old dedicated `Component` AST node. We detect them at the three
 * places they can appear: top-level, under `export`, under `export default`.
 * `compileComponent` / `compileFunctionBody` read `body.body` (setup
 * statements) and `body.render` (single JSX root) off the JSXCodeBlock.
 */
function isComponentFunction(node) {
	return (
		node &&
		(node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') &&
		node.body &&
		node.body.type === 'JSXCodeBlock'
	);
}

// Arrow-function component shape: `const X = (props) => @{…}` (and the `export`
// variant). @tsrx/core parses the `@{…}` arrow body as a JSXCodeBlock, but the
// rest of the compiler keys on FunctionDeclaration. Convert a single-declarator
// `const X = (…) => @{…}` / `= function (…) @{…}` into an equivalent synthetic
// FunctionDeclaration so ALL downstream machinery (detection, hookless
// eligibility, emission, export handling, css scoping) works unchanged. Returns
// null when the var-decl is not an arrow/function component.
/** @param {any} varDecl @returns {any|null} */
function arrowComponentToFunctionDecl(varDecl) {
	if (!varDecl || varDecl.type !== 'VariableDeclaration') return null;
	if (!varDecl.declarations || varDecl.declarations.length !== 1) return null;
	const d = varDecl.declarations[0];
	if (!d || !d.id || d.id.type !== 'Identifier') return null;
	const init = d.init;
	if (
		!init ||
		(init.type !== 'ArrowFunctionExpression' && init.type !== 'FunctionExpression') ||
		!init.body ||
		init.body.type !== 'JSXCodeBlock'
	) {
		return null;
	}
	return {
		type: 'FunctionDeclaration',
		id: d.id,
		params: init.params || [],
		body: init.body,
		async: !!init.async,
		generator: !!init.generator,
		// Preserve source position for hashing / source maps / decl anchors.
		start: varDecl.start,
		end: varDecl.end,
		loc: varDecl.loc,
	};
}

// Rewrite top-level arrow-function components (`const X = () => @{…}`, incl.
// `export const X = …`) to FunctionDeclaration form in place, so the rest of the
// pipeline sees the canonical component shape. Mutates `ast.body`.
/** @param {any} ast @returns {void} */
function normalizeArrowComponents(ast) {
	if (!ast || !Array.isArray(ast.body)) return;
	for (let i = 0; i < ast.body.length; i++) {
		const node = ast.body[i];
		if (node.type === 'VariableDeclaration') {
			const fn = arrowComponentToFunctionDecl(node);
			if (fn) ast.body[i] = fn;
		} else if (node.type === 'ExportNamedDeclaration' && node.declaration) {
			const fn = arrowComponentToFunctionDecl(node.declaration);
			if (fn) node.declaration = fn;
		}
	}
}

// A top-level statement that carries NO runtime value — pure TypeScript type
// surface (`interface`, `type` alias, `declare …` ambients, `import type` /
// `export type`). The runtime compile (client/server) must DROP these: esrap
// would otherwise print them verbatim into the emitted .js (or crash on a
// type-alias whose annotation we null out), and Vite doesn't type-strip a
// `.tsrx` module. This is RUNTIME-ONLY: the Volar/TS-server path (volar.js) is a
// separate pipeline that intentionally PRESERVES all types for the language
// service, so it never calls this. Enums and value namespaces have runtime
// semantics and are deliberately NOT treated as type-only.
function isTypeOnlyStatement(node) {
	if (node == null) return false;
	if (
		node.type === 'TSInterfaceDeclaration' ||
		node.type === 'TSTypeAliasDeclaration' ||
		node.type === 'TSDeclareFunction'
	) {
		return true;
	}
	// `declare const/let/var/function/class/module/namespace …` — ambient, no emit.
	if (node.declare === true) return true;
	// `import type { … } from …`
	if (node.type === 'ImportDeclaration' && node.importKind === 'type') return true;
	// `export type { … }`, `export type X = …`, `export interface I {}`
	if (node.type === 'ExportNamedDeclaration') {
		if (node.exportKind === 'type') return true;
		if (node.declaration && isTypeOnlyStatement(node.declaration)) return true;
	}
	return false;
}

const VLQ_B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Base64-VLQ encode a list of signed integers (source-map v3 segment fields). */
function encodeVlq(values) {
	let out = '';
	for (const value of values) {
		let vlq = value < 0 ? (-value << 1) | 1 : value << 1;
		do {
			let digit = vlq & 31;
			vlq >>>= 5;
			if (vlq > 0) digit |= 32;
			out += VLQ_B64[digit];
		} while (vlq > 0);
	}
	return out;
}

function countNewlines(str) {
	let n = 0;
	for (let i = 0; i < str.length; i++) if (str.charCodeAt(i) === 10) n++;
	return n;
}

/**
 * Build a v3 source map from a flat list of mapping segments. The segments come
 * from esrap itself — we print each user statement/expression via esrap with
 * `sourceMapEncodeMappings: false` (the same machinery the mainline TSRX
 * compilers use) and merge each node's real per-token mappings into module
 * coordinates. Generated runtime plumbing (templates, mount/update DOM ops) is
 * left unmapped — never mapped to a wrong position. `sourcesContent` is inlined
 * so the original `.tsrx` is visible in devtools.
 *
 * @param {string} source original .tsrx text
 * @param {string} sourceName basename used as the map's single source entry
 * @param {Array<{ genLine: number, genCol: number, srcLine0: number, srcCol0: number }>} segments
 *   genLine/genCol are 0-based ABSOLUTE generated coords; src* are 0-based source coords.
 */
function buildSourceMap(source, sourceName, segments) {
	const byLine = new Map();
	let maxLine = -1;
	for (const s of segments) {
		if (s.genLine < 0) continue;
		let arr = byLine.get(s.genLine);
		if (!arr) byLine.set(s.genLine, (arr = []));
		arr.push(s);
		if (s.genLine > maxLine) maxLine = s.genLine;
	}
	let prevSrcLine = 0;
	let prevSrcCol = 0;
	const groups = [];
	for (let line = 0; line <= maxLine; line++) {
		const arr = byLine.get(line);
		if (!arr) {
			groups.push('');
			continue;
		}
		// Sort by generated column and drop duplicates at the same column.
		arr.sort((a, b) => a.genCol - b.genCol);
		let prevGenCol = 0;
		let lastGenCol = -1;
		let group = '';
		for (const s of arr) {
			if (s.genCol === lastGenCol) continue;
			lastGenCol = s.genCol;
			// Fields: [genColumn, sourceIndex, sourceLine, sourceColumn] as deltas.
			// genColumn resets per line; sourceIndex is always 0 (single source).
			group +=
				(group ? ',' : '') +
				encodeVlq([s.genCol - prevGenCol, 0, s.srcLine0 - prevSrcLine, s.srcCol0 - prevSrcCol]);
			prevGenCol = s.genCol;
			prevSrcLine = s.srcLine0;
			prevSrcCol = s.srcCol0;
		}
		groups.push(group);
	}
	return {
		version: 3,
		sources: [sourceName],
		sourcesContent: [source],
		names: [],
		mappings: groups.join(';'),
	};
}

/**
 * Compile a .tsrx source string into JS targeting `ripple-new`.
 * @param {string} source
 * @param {string} filename
 * @param {{ hmr?: boolean, mode?: 'client' | 'server' }} [options] —
 *   `hmr: true` wraps each exported component in `hmr(Component)` and emits an
 *   `import.meta.hot.accept(...)` block that delegates updates to the runtime
 *   HMR wrapper. Dev tooling (e.g. the Vite plugin) should pass `hmr: true` in
 *   serve mode and leave it off for production builds.
 *   `mode` selects the codegen target: `'client'` (default) emits the
 *   template-clone DOM runtime; `'server'` emits HTML-string SSR output (not
 *   implemented yet — see the SSR plan).
 * @returns {{ code: string, map: any }}
 */
export function compile(source, filename, options) {
	const mode = (options && options.mode) || 'client';
	if (mode !== 'client' && mode !== 'server') {
		throw new Error(`Unknown compile mode "${mode}" — expected 'client' or 'server'.`);
	}
	if (mode === 'server') {
		// Server (SSR) codegen — Phase 1: static markup + dynamic text + attributes
		// + nested components, emitted as HTML-string-building bodies importing the
		// server runtime from 'ripple-new/server'. Control flow, portals, Activity
		// and component children are rejected (later phases).
		return compileServer(source, filename, options);
	}
	const ast = parseModule(source, filename);
	// Drop type-only statements (interface / type / declare / import-export type)
	// before emit — they carry no runtime value and would leak invalid TS into
	// the .js (or crash the printer). Runtime-only; Volar keeps them.
	ast.body = ast.body.filter((n) => !isTypeOnlyStatement(n));
	// Normalize arrow-function components (`const X = () => @{…}`) to
	// FunctionDeclaration form so the component pipeline recognizes them.
	normalizeArrowComponents(ast);
	const hmrEnabled = !!(options && options.hmr);

	const ctx = {
		filename,
		mode,
		runtimeNeeded: new Set(),
		hoistedTemplates: [], // { name, html }
		hoistedHelpers: [], // raw JS strings (sub-components, hook Symbols, key fns)
		delegatedEvents: new Set(), // event names seen in JSX — auto-emits delegateEvents(...)
		cssInjections: [], // { hash, css } — one entry per component with a <style> block
		currentComponentLocals: null, // Set<string> while compiling a component body; null otherwise
		nextHookSymId: 0,
		nextTemplateId: 0,
		nextHelperId: 0,
		// Same-module component eligibility for componentSlotLite (Design (c)
		// hookless lite path). Populated by the pre-pass below; read by
		// makeCompCall to branch the call-site emit.
		componentInfo: new Map(),
		// Source-map inputs, read by printNodeWithMap to ask esrap for real
		// per-token mappings against the original .tsrx.
		mapSource: source,
		mapSourceName: (filename || 'module.tsrx').split(/[\\/]/).pop(),
		// Per-component setup-statement maps, populated by compileFunctionBody on
		// the top-level (autoCallback) pass and drained per component below.
		_setupMaps: null,
	};
	// List of exported components needing HMR wrapping. Each entry: { name,
	// exportKind: 'default' | 'named' }. We emit the `Comp = hmr(Comp)` lines
	// and the `import.meta.hot.accept` block after walking the body, so the
	// wrapping sits AFTER each component's `const Comp = …;` declaration.
	const hmrComponents = [];

	// === Design (c) v0 pre-pass: classify same-module components as
	// hookless+eligible for componentSlotLite. Two sweeps:
	//   (1) Register every same-module FunctionDeclaration component so that
	//       inter-component recursive references resolve to a known entry.
	//   (2) For each registered component, run a body walk to decide
	//       eligibility. Conservative rules: NO hooks, NO `use`/`useContext`/
	//       `memo`/`createPortal`, NO @try (TryStatement / JSXTryExpression),
	//       NO `children` destructure param, NO unknown free-function calls
	//       (catches transitive hooks via same-module helpers).
	//
	//   Recursion is OK: the recursive name appears as a free identifier in
	//   the body but is registered in ctx.componentInfo by sweep (1), so the
	//   unknown-call walker doesn't flag it.
	for (const node of ast.body) {
		let compNode = null;
		if (isComponentFunction(node)) compNode = node;
		else if (node.type === 'ExportDefaultDeclaration' && isComponentFunction(node.declaration))
			compNode = node.declaration;
		else if (node.type === 'ExportNamedDeclaration' && isComponentFunction(node.declaration))
			compNode = node.declaration;
		if (compNode && compNode.id) {
			ctx.componentInfo.set(compNode.id.name, { eligible: false, node: compNode });
		}
	}
	for (const [, info] of ctx.componentInfo) {
		const compNode = info.node;
		const locals = collectComponentLocals(compNode);
		// Synthesise a root node combining setup statements + JSX render body so
		// collectFreeIdentifiers sees the same identifier scope the runtime would.
		const stmts = (compNode.body.body || []).slice();
		if (compNode.body.render) stmts.push(compNode.body.render);
		const root = { type: 'BlockStatement', body: stmts };
		const free = collectFreeIdentifiers(root, locals);
		// Hookless check.
		let eligible = true;
		for (const n of free) {
			if (
				HOOK_NAMES.has(n) ||
				n === 'use' ||
				n === 'useContext' ||
				n === 'memo' ||
				n === 'createPortal'
			) {
				eligible = false;
				break;
			}
		}
		// Children-destructure-param rejection.
		if (
			eligible &&
			compNode.params &&
			compNode.params[0] &&
			compNode.params[0].type === 'ObjectPattern'
		) {
			for (const p of compNode.params[0].properties || []) {
				const k = p.key && (p.key.name || p.key.value);
				if (k === 'children') {
					eligible = false;
					break;
				}
			}
		}
		// Body walk: reject @try / TryStatement / unknown free-function calls
		// (catches transitive hooks via same-module helpers and unknown imports).
		if (eligible) {
			// Cycle / shared-subtree guard. Some AST nodes carry back-references
			// (e.g. `parent`, `scope`) and even cycle-free ASTs can have shared
			// subtree pointers; without a WeakSet the `for (k in n)` traversal can
			// re-enter the same subtree N times — observable as a vitest worker
			// hang on the bigger fixture files.
			const seen = new WeakSet();
			const reject = (function walk(n) {
				if (!n) return false;
				if (Array.isArray(n)) {
					for (const x of n) if (walk(x)) return true;
					return false;
				}
				if (typeof n !== 'object' || !n.type) return false;
				if (seen.has(n)) return false;
				seen.add(n);
				const t = n.type;
				if (t === 'TryStatement' || t === 'JSXTryExpression') return true;
				if (t === 'CallExpression' && n.callee && n.callee.type === 'Identifier') {
					const cname = n.callee.name;
					if (!locals.has(cname) && !ctx.componentInfo.has(cname) && !HOOK_NAMES.has(cname)) {
						return true;
					}
				}
				for (const k in n) {
					if (
						k === 'type' ||
						k === 'loc' ||
						k === 'start' ||
						k === 'end' ||
						k === 'range' ||
						k === 'parent'
					)
						continue;
					if (walk(n[k])) return true;
				}
				return false;
			})(root);
			if (reject) eligible = false;
		}
		info.eligible = eligible;
		// Single-ELEMENT-root output: the component's body renders exactly one plain
		// DOM element (not a component tag, fragment, or control-flow). Such a
		// component self-delimits via that element on CLIENT mount — its
		// `componentSlot` needs no `comp`/`/comp` markers (singleRoot path), exactly
		// like a single-root `@for` item. (Output-shape based — independent of which
		// hooks it calls.)
		const render = compNode.body.render;
		info.singleRoot =
			render != null &&
			(render.type === 'JSXElement' || render.type === 'Element') &&
			!isComponentTag(render) &&
			typeof (render.id?.name ?? render.openingElement?.name?.name) === 'string';
	}

	let body = '';
	// Source-map bookkeeping. `bodySegments` collects mapping segments in
	// body-relative coordinates (0-based line within `body`); they're shifted by
	// the prelude line count and encoded at return. Segments come from esrap's
	// real per-token maps (component setup statements, top-level passthrough
	// statements) plus a coarse anchor at each component declaration line.
	let bodyLine = 0;
	const bodySegments = [];
	const pushEsrapSegments = (baseLine, colShift, mappings) => {
		for (let i = 0; i < mappings.length; i++) {
			for (const seg of mappings[i]) {
				bodySegments.push({
					genLine: baseLine + i,
					genCol: seg[0] + colShift,
					srcLine0: seg[2],
					srcCol0: seg[3],
				});
			}
		}
	};
	const pushDeclAnchor = (node, baseLine) => {
		const loc = node && node.loc && node.loc.start;
		if (loc) {
			bodySegments.push({
				genLine: baseLine,
				genCol: 0,
				srcLine0: loc.line - 1,
				srcCol0: loc.column | 0,
			});
		}
	};
	// Drain the setup-statement maps compileFunctionBody captured for the
	// component that starts at body line `base`.
	const drainSetupMaps = (base) => {
		if (ctx._setupMaps) {
			for (const e of ctx._setupMaps) pushEsrapSegments(base + e.fnRelLine, e.colShift, e.mappings);
			ctx._setupMaps = null;
		}
	};
	const compileOpts = { hmrWrap: hmrEnabled };
	for (const node of ast.body) {
		if (isComponentFunction(node)) {
			// `function Foo() @{ ... }` (new TSRX shape) — non-exported helper. HMR
			// doesn't wrap these (they're not user-visible across module boundaries).
			const base = bodyLine;
			ctx._setupMaps = null;
			const chunk = compileComponent(node, ctx) + '\n\n';
			pushDeclAnchor(node, base);
			drainSetupMaps(base);
			body += chunk;
			bodyLine += countNewlines(chunk);
		} else if (node.type === 'ExportDefaultDeclaration' && isComponentFunction(node.declaration)) {
			// `export default function Foo() @{...}` → emit as named const + `export default Foo;`.
			const c = node.declaration;
			const base = bodyLine;
			ctx._setupMaps = null;
			const compiled = compileComponent({ ...c, default: true }, ctx, compileOpts);
			pushDeclAnchor(node, base);
			drainSetupMaps(base);
			body += compiled + '\n\n';
			bodyLine += countNewlines(compiled + '\n\n');
			if (hmrEnabled) hmrComponents.push({ name: c.id.name, exportKind: 'default' });
		} else if (node.type === 'ExportNamedDeclaration' && isComponentFunction(node.declaration)) {
			// `export function Foo() @{...}` → emit as `export const Foo = ...;`.
			const c = node.declaration;
			const base = bodyLine;
			ctx._setupMaps = null;
			const compiled = compileComponent({ ...c, export: true }, ctx, compileOpts);
			pushDeclAnchor(node, base);
			drainSetupMaps(base);
			body += compiled + '\n\n';
			bodyLine += countNewlines(compiled + '\n\n');
			if (hmrEnabled) hmrComponents.push({ name: c.id.name, exportKind: 'named' });
		} else if (node.type === 'ImportDeclaration' && node.source.value === 'ripple-new') {
			// Preserve ALL user-imported names from ripple-new (Portal, createContext,
			// use, custom helpers, etc.) — merged into the single prelude import.
			for (const sp of node.specifiers || []) {
				const name = sp.imported?.name || sp.local?.name;
				if (name) ctx.runtimeNeeded.add(name);
			}
		} else {
			// Style maps: rewrite `const x = <style>…</style>` before printing — the
			// initialiser becomes an ObjectExpression with hashed class names, and
			// the stylesheet flows through the regular cssInjections pipeline.
			applyStyleMap(node, ctx);
			// Also handle `export const x = <style>…</style>` (declaration wrapped
			// in an ExportNamedDeclaration).
			if (node.type === 'ExportNamedDeclaration' && node.declaration) {
				applyStyleMap(node.declaration, ctx);
			}
			// Lower any JSX component value (e.g. `root.render(<App/>)` or
			// `const el = <App/>`) to createElement(...) before printing — esrap
			// can't print raw JSX, and this is what makes root.render(<App/>) match
			// React's shape.
			const lowered = rewriteJsxValues(node, ctx);
			// Top-level passthrough (imports, plain consts/functions): print with
			// esrap's real map — col 0, no re-indent, single line offset.
			const base = bodyLine;
			const { code, mappings } = printNodeWithMap(lowered, ctx);
			pushEsrapSegments(base, 0, mappings);
			body += code + '\n';
			bodyLine += countNewlines(code + '\n');
		}
	}

	// Auto-emit delegateEvents([...]) once at module scope for every event seen.
	if (ctx.delegatedEvents.size > 0) {
		ctx.runtimeNeeded.add('delegateEvents');
	}

	// Build prelude. NOTE: `runtimeImport` is built BELOW (after the HMR block
	// possibly registers more runtime needs); we postpone that so the final
	// import list includes `hmr` / `HMR` when needed.
	const delegateCall =
		ctx.delegatedEvents.size > 0
			? `delegateEvents(${JSON.stringify([...ctx.delegatedEvents].sort())});\n\n`
			: '';
	const styleInjections = ctx.cssInjections
		.map((i) => `injectStyle(${JSON.stringify(i.hash)}, ${JSON.stringify(i.css)});`)
		.join('\n');
	const styleBlock = styleInjections ? styleInjections + '\n\n' : '';
	const templates = ctx.hoistedTemplates
		.map((t) => {
			const args = [JSON.stringify(t.html)];
			if (t.ns || t.frag) args.push(String(t.ns | 0));
			if (t.frag) args.push(String(t.frag | 0));
			return `const ${t.name} = template(${args.join(', ')});`;
		})
		.join('\n');
	const templatesBlock = templates ? templates + '\n\n' : '';
	const helpers = ctx.hoistedHelpers.join('\n');
	const helpersBlock = helpers ? helpers + '\n\n' : '';

	// HMR plumbing — sits AFTER the component bodies so the wrappers can
	// reference the `Comp` const that was just declared. Each exported
	// component gets rewrapped (`Comp = hmr(Comp);`), default exports get
	// re-exported afterwards (we already emitted the `export default Comp;`
	// line earlier — re-exporting again would conflict, so the rewrap mutates
	// the binding in place). Mirrors `tsrx-ripple`'s emit shape.
	let hmrBlock = '';
	if (hmrComponents.length > 0) {
		// `hmr` is already registered as a needed runtime symbol by the
		// inline-wrap pass on each exported component. We still need `HMR` (the
		// Symbol key used to reach the wrapper's meta on `.update(...)`).
		ctx.runtimeNeeded.add('hmr');
		ctx.runtimeNeeded.add('HMR');
		const updates = hmrComponents
			.map((c) => {
				const accessor = c.exportKind === 'default' ? 'module.default' : `module.${c.name}`;
				return `    ${c.name}[HMR].update(${accessor});`;
			})
			.join('\n');
		hmrBlock =
			'if (import.meta.hot) {\n' +
			'  import.meta.hot.accept((module) => {\n' +
			updates +
			'\n' +
			'  });\n' +
			'}\n';
	}

	// `runtimeImport` is built ABOVE this point, BEFORE `ctx.runtimeNeeded` may
	// get `hmr` and `HMR` added — so rebuild it after HMR wiring so the prelude
	// import includes them. Same for `delegateCall` (which already ran above):
	// we re-emit the prelude bits with the now-complete `runtimeNeeded` set.
	const finalRuntimeImport =
		ctx.runtimeNeeded.size > 0
			? `import { ${[...ctx.runtimeNeeded].sort().join(', ')} } from 'ripple-new';\n\n`
			: '';

	// Everything before `body` in the output — shifts every body segment's
	// generated line down by the prelude's line count.
	const prelude = finalRuntimeImport + delegateCall + styleBlock + templatesBlock + helpersBlock;
	const preludeLines = countNewlines(prelude);
	const segments = bodySegments.map((s) => ({
		genLine: s.genLine + preludeLines,
		genCol: s.genCol,
		srcLine0: s.srcLine0,
		srcCol0: s.srcCol0,
	}));

	return {
		code: prelude + body + hmrBlock,
		map: buildSourceMap(source, ctx.mapSourceName, segments),
	};
}

// ===========================================================================
// Server (SSR) codegen — Phase 1
//
// A parallel, self-contained codegen path. Each component compiles to a
// function `(__s, props, __extra) => string` that BUILDS an HTML string by
// interleaving static chunks with `ssr*` runtime helpers for the dynamic holes
// (text/attrs/style/spread) and `ssrComponent` for nested components. The
// client path (template/clone + bindings) is left completely untouched.
//
// Out of Phase 1 scope (rejected with a clear diagnostic): control flow
// (@if/@for/@switch/@try), portals, Activity, fragment refs, component children,
// and JSX-bearing expression holes. They land in later SSR phases.
// ===========================================================================

function ssrUnsupported(what) {
	throw new Error(
		`ripple-new server render (SSR Phase 1) does not support ${what} yet. ` +
			`Phase 1 covers static markup, dynamic text, attributes and nested ` +
			`components; control flow, portals and component children come later.`,
	);
}

function compileServer(source, filename, options) {
	const ast = parseModule(source, filename);
	// Drop type-only statements before emit (see isTypeOnlyStatement) — same as
	// the client path; the server HTML-string output is plain JS too.
	ast.body = ast.body.filter((n) => !isTypeOnlyStatement(n));
	// Normalize arrow-function components (`const X = () => @{…}`) to
	// FunctionDeclaration form so the component pipeline recognizes them.
	normalizeArrowComponents(ast);
	const ctx = {
		filename,
		mode: 'server',
		runtimeNeeded: new Set(),
		hoistedHelpers: [],
		cssInjections: [],
		currentComponentLocals: null,
		nextHookSymId: 0,
		nextHelperId: 0,
		componentInfo: new Map(),
		mapSource: source,
		mapSourceName: (filename || 'module.tsrx').split(/[\\/]/).pop(),
		_setupMaps: null,
	};

	let body = '';
	for (const node of ast.body) {
		if (isComponentFunction(node)) {
			body += compileServerComponent(node, ctx) + '\n\n';
		} else if (node.type === 'ExportDefaultDeclaration' && isComponentFunction(node.declaration)) {
			body += compileServerComponent({ ...node.declaration, default: true }, ctx) + '\n\n';
		} else if (node.type === 'ExportNamedDeclaration' && isComponentFunction(node.declaration)) {
			body += compileServerComponent({ ...node.declaration, export: true }, ctx) + '\n\n';
		} else if (node.type === 'ImportDeclaration' && node.source.value === 'ripple-new') {
			// User imports from 'ripple-new' resolve to the server runtime instead.
			for (const sp of node.specifiers || []) {
				const name = sp.imported?.name || sp.local?.name;
				if (name) ctx.runtimeNeeded.add(name);
			}
		} else {
			applyStyleMap(node, ctx);
			if (node.type === 'ExportNamedDeclaration' && node.declaration) {
				applyStyleMap(node.declaration, ctx);
			}
			body += printNode(rewriteJsxValues(node, ctx)) + '\n';
		}
	}

	const runtimeImport =
		ctx.runtimeNeeded.size > 0
			? `import { ${[...ctx.runtimeNeeded].sort().join(', ')} } from 'ripple-new/server';\n\n`
			: '';
	const helpers = ctx.hoistedHelpers.length ? ctx.hoistedHelpers.join('\n') + '\n\n' : '';
	const code = runtimeImport + helpers + body;
	// Phase 1: minimal (valid, empty-mapping) source map. SSR source maps are a
	// later refinement; the client path keeps its real per-token maps.
	return { code, map: buildSourceMap(source, ctx.mapSourceName, []) };
}

function compileServerComponent(node, ctx) {
	const name = node.id.name;
	if (node.async)
		throw new Error(
			`Component \`${name}\` is declared \`async\`, which ripple-new does not support.`,
		);
	if (node.generator)
		throw new Error(
			`Component \`${name}\` is declared as a generator, which ripple-new does not support.`,
		);

	const isExported = !!(node.export || node.default || node.exported);
	const isDefault = !!node.default;

	// Scoped <style>: applyCssScoping stamps hash classes + registers cssInjections.
	// Capture this component's entries to emit injectStyle INSIDE the body (so the
	// active server render collects CSS only for components it actually renders).
	const beforeCss = ctx.cssInjections.length;
	const cssHash = applyCssScoping(node, ctx);
	const cssEntries = ctx.cssInjections.slice(beforeCss);

	const prevLocals = ctx.currentComponentLocals;
	ctx.currentComponentLocals = collectComponentLocals(node);
	let fn;
	try {
		fn = ssrCompileBody(node, ctx, name, cssHash, cssEntries);
	} finally {
		ctx.currentComponentLocals = prevLocals;
	}

	if (isDefault) return `const ${name} = ${fn};\nexport default ${name};`;
	if (isExported) return `export const ${name} = ${fn};`;
	return `const ${name} = ${fn};`;
}

function ssrCompileBody(node, ctx, name, cssHash, cssEntries, parentNs = 'html') {
	const params = node.params.map((p) => printNode(p)).join(', ');
	const paramsClause = params ? `, ${params}` : '';

	let statements;
	let jsxNodes;
	if (node.body && node.body.type === 'JSXCodeBlock') {
		statements = node.body.body || [];
		jsxNodes = node.body.render ? [node.body.render] : [];
	} else {
		const bodyRewritten = rewriteEarlyExits(node.body);
		statements = [];
		jsxNodes = [];
		for (const child of bodyRewritten) {
			if (isJsxNode(child)) {
				if (child.type === 'Element' && elementTagName(child) === 'style') continue;
				jsxNodes.push(child);
			} else statements.push(child);
		}
	}

	const inlinedSubs = [];
	const rewritten = statements
		.map((s) => rewriteHookCalls(s, ctx, name))
		.map((s) => rewriteJsxValues(s, ctx));
	const setupCode = rewritten.map((s) => '  ' + printNode(s).replace(/\n/g, '\n  ')).join('\n');

	// Partition hoisted `<title>`/`<meta>`/`<link>` out of the body (mirrors the
	// client planJsx): they accumulate into render()'s `head` via `ssrHeadEl`, NOT
	// the body HTML — so the body collapses to its single real root.
	const normalized = normalizeChildren(jsxNodes);
	const headNodes = normalized.filter((n) => n.type === 'HeadHoist');
	const bodyNodes = normalized.filter((n) => n.type !== 'HeadHoist');
	const htmlExpr = ssrEmitNodes(bodyNodes, ctx, name, inlinedSubs, parentNs, cssHash);

	let cssLines = '';
	if (cssEntries && cssEntries.length) {
		ctx.runtimeNeeded.add('injectStyle');
		cssLines =
			cssEntries
				.map((e) => `  injectStyle(${JSON.stringify(e.hash)}, ${JSON.stringify(e.css)});`)
				.join('\n') + '\n';
	}
	// `ssrHeadEl(…)` side-effect statements (one per hoisted head element), like injectStyle.
	const headLines = emitHeadServer(headNodes, ctx);
	const subsBlock = inlinedSubs.length
		? inlinedSubs.map((s) => '  ' + s.replace(/\n/g, '\n  ')).join('\n') + '\n'
		: '';
	const setupBlock = setupCode ? setupCode + '\n' : '';
	return `function ${name}(__s${paramsClause}, __extra) {\n${cssLines}${headLines}${setupBlock}${subsBlock}  return ${htmlExpr};\n}`;
}

// Serialize a list of normalized JSX nodes to a JS expression that evaluates to
// an HTML string (the concatenation of each node's expression).
function ssrEmitNodes(nodes, ctx, name, inlinedSubs, parentNs, cssHash) {
	const parts = [];
	for (const n of nodes) {
		const p = ssrEmitNode(n, ctx, name, inlinedSubs, parentNs, cssHash);
		if (p) parts.push(p);
	}
	return parts.length ? parts.join(' + ') : "''";
}

function ssrEmitNode(node, ctx, name, inlinedSubs, parentNs, cssHash) {
	switch (node.type) {
		case 'Text': {
			const expr = node.expression;
			if (expr && expr.type === 'Literal' && typeof expr.value === 'string') {
				// Static text — escape at compile time, inline as a literal chunk.
				return JSON.stringify(escapeHtml(expr.value));
			}
			// `{x as string}` / literals / templates / `+`-concats → definite TEXT.
			// Everything else (`{children}`, `{<Comp/>}`, possibly-renderable values)
			// → ssrChild, which RENDERS a component/element child (and coerces a
			// primitive to text) — mirrors Ripple's `{expr}` vs `{expr as string}`.
			// rewriteHookCalls: a `use(thenable)` in this hole bypasses the setup
			// rewrite, so key it here too (else it collides with sibling/nested use()).
			if (isKnownStringExpression(expr)) {
				ctx.runtimeNeeded.add('ssrText');
				return `ssrText(${printExpr(resolveStyleExpr(rewriteHookCalls(expr, ctx, name), cssHash))})`;
			}
			ctx.runtimeNeeded.add('ssrChild');
			return `ssrChild(${printExpr(resolveStyleExpr(rewriteHookCalls(expr, ctx, name), cssHash))}, __s)`;
		}
		case 'Element':
			if (isComponentTag(node)) return ssrEmitComponent(node, ctx, name, inlinedSubs, cssHash);
			return ssrEmitElement(node, ctx, name, inlinedSubs, parentNs, cssHash);
		case 'TSRXExpression':
			return ssrEmitTsrxExpression(node, ctx, name, inlinedSubs, cssHash);
		case 'IfStatement':
			return ssrEmitIf(node, ctx, name, inlinedSubs, parentNs, cssHash);
		case 'ForOfStatement':
			return ssrEmitFor(node, ctx, name, inlinedSubs, parentNs, cssHash);
		case 'TryStatement':
			return ssrEmitTry(node, ctx, name, inlinedSubs, parentNs, cssHash);
		case 'SwitchStatement':
			return ssrEmitSwitch(node, ctx, name, inlinedSubs, parentNs, cssHash);
		case 'ActivityStatement':
			return ssrUnsupported('`<Activity>`');
		case 'FragmentStart':
		case 'FragmentEnd':
			return ssrUnsupported('fragment refs (`<Fragment ref={…}>`)');
		default:
			return ssrUnsupported(`node type ${node.type}`);
	}
}

function ssrEmitElement(node, ctx, name, inlinedSubs, parentNs, cssHash) {
	const tag = elementTagName(node);
	const attrs = node.attributes || node.openingElement?.attributes || [];
	const selfNs = nsForSelf(node, parentNs);
	const childNs = nsForChildren(node, selfNs);

	// `parts` are JS expressions concatenated with `+`. `lit` accumulates the
	// current static run so adjacent literals fold into one quoted chunk.
	const parts = [];
	let lit = '<' + tag;
	const flush = () => {
		if (lit) {
			parts.push(JSON.stringify(lit));
			lit = '';
		}
	};

	const firstSpreadIdx = attrs.findIndex(
		(a) => a.type === 'SpreadAttribute' || a.type === 'JSXSpreadAttribute',
	);
	let innerHtmlExpr = null;

	for (let attrI = 0; attrI < attrs.length; attrI++) {
		const attr = attrs[attrI];
		if (attr.type === 'SpreadAttribute' || attr.type === 'JSXSpreadAttribute') {
			flush();
			ctx.runtimeNeeded.add('ssrSpread');
			parts.push(`ssrSpread(${printExprWithTsrx(attr.argument, ctx, name, inlinedSubs)})`);
			continue;
		}
		if (attr.type !== 'Attribute' && attr.type !== 'JSXAttribute') continue;
		// Namespaced attribute names (`xlink:href`) — parser gives us a
		// JSXNamespacedName { namespace, name } pair; concatenate to the literal name.
		let rawAttrName;
		if (
			attr.name &&
			(attr.name.type === 'JSXNamespacedName' || attr.name.type === 'NamespacedName')
		) {
			rawAttrName = `${attr.name.namespace.name}:${attr.name.name.name}`;
		} else {
			rawAttrName = attr.name.name || attr.name;
		}
		if (rawAttrName === 'key') continue;
		// Events and refs have no server semantics — dropped.
		if (rawAttrName === 'ref') continue;
		if (rawAttrName.length > 2 && rawAttrName.startsWith('on') && /^[A-Z]/.test(rawAttrName[2]))
			continue;
		// Function form/button actions are events too; a static string `action`
		// falls through to the normal attribute path below.
		const attrName = rawAttrName === 'className' ? 'class' : rawAttrName;
		const val = attr.value;
		const isAfterSpread = firstSpreadIdx !== -1 && attrI > firstSpreadIdx;

		if (attrName === 'innerHTML' && val) {
			const inner2 = val.type === 'JSXExpressionContainer' ? val.expression : val;
			innerHtmlExpr = printExpr(rewriteHookCalls(inner2, ctx, name));
			continue;
		}

		// Boolean attribute (no value) → present.
		if (val == null) {
			lit += ' ' + attrName;
			continue;
		}

		let inner = val.type === 'JSXExpressionContainer' ? val.expression : val;

		if (attrName === 'style') {
			inner = resolveStyleExpr(inner, cssHash);
			if (!isAfterSpread && inner.type === 'Literal' && typeof inner.value === 'string') {
				lit += ` style="${escapeAttr(inner.value)}"`;
				continue;
			}
			if (!isAfterSpread && inner.type === 'ObjectExpression' && objectExprIsStaticLiteral(inner)) {
				const css = staticObjectToCssString(inner);
				if (css) lit += ` style="${escapeAttr(css)}"`;
				continue;
			}
			flush();
			ctx.runtimeNeeded.add('ssrStyle');
			parts.push(`ssrStyle(${printExprWithTsrx(inner, ctx, name, inlinedSubs)})`);
			continue;
		}

		// Static literal (and not after a spread) → inline into the tag.
		if (!isAfterSpread && inner.type === 'Literal') {
			if (typeof inner.value === 'string') lit += ` ${attrName}="${escapeAttr(inner.value)}"`;
			else if (typeof inner.value === 'number') lit += ` ${attrName}="${inner.value}"`;
			else if (inner.value === true) lit += ` ${attrName}`;
			continue;
		}

		// Dynamic attribute (or literal after a spread).
		flush();
		ctx.runtimeNeeded.add('ssrAttr');
		parts.push(
			`ssrAttr(${JSON.stringify(attrName)}, ${printExprWithTsrx(inner, ctx, name, inlinedSubs)})`,
		);
	}

	// Void elements: `<tag …/>`, no children.
	if (VOID_ELEMENTS.has(tag) && (node.children || []).length === 0) {
		lit += '/>';
		flush();
		return parts.join(' + ');
	}

	lit += '>';
	if (innerHtmlExpr !== null) {
		// innerHTML — raw (unescaped) content, no other children.
		flush();
		parts.push(`(${innerHtmlExpr} == null ? '' : String(${innerHtmlExpr}))`);
	} else {
		const childrenExpr = ssrEmitNodes(
			normalizeChildren(node.children || []),
			ctx,
			name,
			inlinedSubs,
			childNs,
			cssHash,
		);
		if (childrenExpr !== "''") {
			flush();
			parts.push(childrenExpr);
		}
	}
	lit += `</${tag}>`;
	flush();
	return parts.join(' + ');
}

function ssrEmitComponent(node, ctx, name, inlinedSubs, cssHash) {
	const compExpr = tagExpr(node);
	const attrs = node.attributes || node.openingElement?.attributes || [];
	const propParts = [];
	for (const attr of attrs) {
		if (attr.type === 'SpreadAttribute' || attr.type === 'JSXSpreadAttribute') {
			propParts.push(`...(${printExprWithTsrx(attr.argument, ctx, name, inlinedSubs)})`);
			continue;
		}
		if (attr.type !== 'Attribute' && attr.type !== 'JSXAttribute') continue;
		const attrName = attr.name.name || attr.name;
		if (attrName === 'key') continue;
		const val = attr.value;
		if (val == null) {
			propParts.push(`${JSON.stringify(attrName)}: true`);
			continue;
		}
		let inner = val.type === 'JSXExpressionContainer' ? val.expression : val;
		inner = resolveStyleExpr(inner, cssHash);
		if (inner.type === 'Literal') {
			propParts.push(`${JSON.stringify(attrName)}: ${JSON.stringify(inner.value)}`);
		} else {
			propParts.push(
				`${JSON.stringify(attrName)}: (${printExprWithTsrx(inner, ctx, name, inlinedSubs)})`,
			);
		}
	}
	// Children → a server `children` render-fn (returns an HTML string). The
	// component decides whether/where to render them by calling props.children(scope)
	// — e.g. a context Provider does exactly that. Mirrors the client convention
	// where children compile to a render fn passed as the `children` prop.
	if ((node.children || []).length > 0) {
		const sub = ssrCompileSub(node.children, ctx, '__schildren', [], cssHash, 'html');
		inlinedSubs.push(sub.fn + ';');
		propParts.push(`"children": ${sub.fnName}`);
	}
	ctx.runtimeNeeded.add('ssrComponent');
	return `ssrComponent(__s, ${compExpr}, { ${propParts.join(', ')} })`;
}

// ---------------------------------------------------------------------------
// Server control flow — @if/@for/@switch/@try lowered to HTML-string builders.
// Each branch/item/case body is compiled (via ssrCompileSub) into a server
// sub-function returning a string, and the chosen branch's output is wrapped in
// `ssrBlock(…)` (BLOCK_OPEN/BLOCK_CLOSE markers) so a future client hydrate
// cursor can find the boundaries. Expressions (test/items/discriminant) are
// printed and evaluated at render time.
// ---------------------------------------------------------------------------

// Compile a list of body statements into a server sub-function `function NAME(__s,
// …params, __extra) { return <html>; }`. Returns { fnName, fn }; the caller pushes
// `fn` into the enclosing inlinedSubs.
function ssrCompileSub(bodyStmts, ctx, baseName, paramNodes, cssHash, parentNs) {
	const fnName = `${baseName}$${ctx.nextHelperId++}`;
	const synth = { params: paramNodes || [], body: bodyStmts };
	const fn = ssrCompileBody(synth, ctx, fnName, cssHash, [], parentNs || 'html');
	return { fnName, fn };
}

function ssrEmitIf(node, ctx, name, inlinedSubs, parentNs, cssHash) {
	// rewriteHookCalls: key any `use(thenable)` in the @if test (it bypasses the
	// setup rewrite, so without a stable key it collides with sibling/body use()).
	const testExpr = printExpr(rewriteHookCalls(node.test, ctx, name));
	const thenStmts =
		node.consequent.type === 'BlockStatement' ? node.consequent.body : [node.consequent];
	const thenSub = ssrCompileSub(thenStmts, ctx, '__sif', [], cssHash, parentNs);
	inlinedSubs.push(thenSub.fn + ';');
	let elseCall = "''";
	if (node.alternate) {
		// An `else if` arrives as an IfStatement; wrap it so it recurses through
		// ssrEmitNode and gets its own marker.
		const elseStmts =
			node.alternate.type === 'BlockStatement' ? node.alternate.body : [node.alternate];
		const elseSub = ssrCompileSub(elseStmts, ctx, '__selse', [], cssHash, parentNs);
		inlinedSubs.push(elseSub.fn + ';');
		elseCall = `${elseSub.fnName}(__s)`;
	}
	ctx.runtimeNeeded.add('ssrBlock');
	// Nested ranges: the OUTER ssrBlock is the if-slot; the INNER one wraps the
	// taken branch's content. The client adopts BOTH on hydration (slot = outer,
	// branch = inner) so no comment markers are inserted — byte-for-byte, exactly
	// like @for. The not-taken arm emits no inner range (just `''`).
	const thenInner = `ssrBlock(${thenSub.fnName}(__s))`;
	const elseInner = node.alternate ? `ssrBlock(${elseCall})` : "''";
	return `ssrBlock((${testExpr}) ? ${thenInner} : ${elseInner})`;
}

function ssrEmitFor(node, ctx, name, inlinedSubs, parentNs, cssHash) {
	// rewriteHookCalls: key any `use(thenable)` in the @for iterable expression.
	const itemsExpr = printExpr(rewriteHookCalls(node.right, ctx, name));
	const itemId = node.left.declarations[0].id; // Identifier or destructuring Pattern
	const params = [itemId];
	if (node.index) params.push(node.index);
	const itemSub = ssrCompileSub(node.body.body, ctx, '__sitem', params, cssHash, parentNs);
	inlinedSubs.push(itemSub.fn + ';');
	let emptyCall = "''";
	if (node.empty) {
		const emptyStmts = node.empty.type === 'BlockStatement' ? node.empty.body : [node.empty];
		const emptySub = ssrCompileSub(emptyStmts, ctx, '__sempty', [], cssHash, parentNs);
		inlinedSubs.push(emptySub.fn + ';');
		emptyCall = `${emptySub.fnName}(__s)`;
	}
	ctx.runtimeNeeded.add('ssrBlock');
	const mapper = node.index
		? `(__it, __i) => ssrBlock(${itemSub.fnName}(__s, __it, __i))`
		: `(__it) => ssrBlock(${itemSub.fnName}(__s, __it))`;
	// Eager: render every item now and join. No keyed reconciliation server-side;
	// each item gets its own block marker for a future hydrate to match.
	return `ssrBlock((() => { const __items = Array.from((${itemsExpr}) ?? []); return __items.length === 0 ? ${emptyCall} : __items.map(${mapper}).join(''); })())`;
}

function ssrEmitSwitch(node, ctx, name, inlinedSubs, parentNs, cssHash) {
	// rewriteHookCalls: key any `use(thenable)` in the @switch discriminant.
	const discExpr = printExpr(rewriteHookCalls(node.discriminant, ctx, name));
	const arms = [];
	let defaultCall = "''";
	for (const c of node.cases || []) {
		const sub = ssrCompileSub(c.consequent || [], ctx, '__scase', [], cssHash, parentNs);
		inlinedSubs.push(sub.fn + ';');
		// Inner ssrBlock wraps the matched case's content (see ssrEmitIf) so the
		// client adopts it as the branch range during hydration (no inserted markers).
		if (c.test == null) defaultCall = `ssrBlock(${sub.fnName}(__s))`;
		else arms.push(`__d === (${printExpr(c.test)}) ? ssrBlock(${sub.fnName}(__s))`);
	}
	ctx.runtimeNeeded.add('ssrBlock');
	// First case matching by strict-equality wins (no JS fall-through); else default.
	const selector = arms.length ? `${arms.join(' : ')} : ${defaultCall}` : defaultCall;
	return `ssrBlock((() => { const __d = (${discExpr}); return ${selector}; })())`;
}

function ssrEmitTry(node, ctx, name, inlinedSubs, parentNs, cssHash) {
	const trySub = ssrCompileSub(node.block.body, ctx, '__stry', [], cssHash, parentNs);
	inlinedSubs.push(trySub.fn + ';');
	// Each arm's content is wrapped in an INNER ssrBlock (see ssrEmitIf) so the
	// client adopts it as the boundary's branch range during hydration without
	// inserting comment markers (byte-for-byte). The OUTER ssrBlock is the slot.
	let pendingCall = "''";
	if (node.pending && node.pending.body && node.pending.body.length > 0) {
		const pendSub = ssrCompileSub(node.pending.body, ctx, '__spend', [], cssHash, parentNs);
		inlinedSubs.push(pendSub.fn + ';');
		pendingCall = `ssrBlock(${pendSub.fnName}(__s))`;
	}
	let catchExpr = 'throw __e'; // no @catch → rethrow non-suspense errors
	if (node.handler) {
		const params = node.handler.param ? [node.handler.param] : [];
		const catchSub = ssrCompileSub(
			node.handler.body.body,
			ctx,
			'__scatch',
			params,
			cssHash,
			parentNs,
		);
		inlinedSubs.push(catchSub.fn + ';');
		catchExpr = node.handler.param
			? `return ssrBlock(${catchSub.fnName}(__s, __e))`
			: `return ssrBlock(${catchSub.fnName}(__s))`;
	}
	ctx.runtimeNeeded.add('ssrBlock');
	ctx.runtimeNeeded.add('ssrIsSuspense');
	// SSR @try: render the try body; a `use(thenable)` suspension renders the
	// @pending fallback; any other thrown error renders @catch (or rethrows).
	return `ssrBlock((() => { try { return ssrBlock(${trySub.fnName}(__s)); } catch (__e) { if (ssrIsSuspense(__e)) return ${pendingCall}; ${catchExpr}; } })())`;
}

// `{createPortal(...)}` (and other JSX-bearing expression holes) at child
// position arrive as TSRXExpression. A portal leaves a site marker on the
// server (its body renders into a foreign target on the client). Other rich
// holes (JSX ternaries / sub-templates) remain unsupported for now.
function ssrEmitTsrxExpression(node, ctx, name, inlinedSubs, cssHash) {
	const expr = node.expression;
	if (
		expr &&
		expr.type === 'CallExpression' &&
		expr.callee &&
		expr.callee.type === 'Identifier' &&
		expr.callee.name === 'createPortal'
	) {
		ctx.runtimeNeeded.add('ssrPortal');
		return 'ssrPortal()';
	}
	return ssrUnsupported('JSX-bearing expression holes (JSX ternaries / sub-templates)');
}

// ===========================================================================
// Component compilation
// ===========================================================================

/**
 * Walk a new-TSRX component (its `JSXCodeBlock` body) for `JSXStyleElement`
 * nodes. For each one found:
 *   - Pull the pre-parsed `StyleSheet` AST out of its children.
 *   - Run `prepareStylesheetForRender` (rewrites `.foo` → `.foo.<hash>` —
 *     mutates the sheet in place).
 *   - Collect into a list rendered via `renderStylesheets` to a CSS string.
 *   - Register `{hash, css}` on `ctx.cssInjections` so a module-level
 *     `injectStyle(hash, css)` is emitted in the prelude.
 *   - Run `annotateWithHash` over `body.render` to stamp the hash class on
 *     every native JSX element AND remove the JSXStyleElement nodes from
 *     the rendered tree (they don't contribute DOM in the new model).
 *
 * Returns the hash, or `null` when no `<style>` blocks are present.
 *
 * The first `JSXStyleElement` we see contributes the canonical hash for the
 * whole component — multiple `<style>` blocks share it; that matches Ripple's
 * `annotate_component_with_hash`.
 */
/**
 * Style maps: `const styles = <style>...</style>;`
 *
 * Upstream ripple's headline form for "named class lookup": the variable's
 * initialiser — a `<style>` element — is replaced at compile time with an
 * object expression like `{ red: "red tsrx-abc", blue: "blue tsrx-abc" }`,
 * built from the parsed stylesheet. The component then references the
 * hashed class names via `class={styles.red}` instead of relying on the
 * implicit auto-scoping pass.
 *
 * The stylesheet ALSO gets registered for module-level injection via the
 * existing cssInjections pipeline, so the rules are emitted in a
 * `<style data-ripple-new>` tag just like the auto-scoped case.
 *
 * `prepareStylesheetForRender(sheet, true)` switches the selector renderer
 * to "style expression" mode — selectors are emitted with hash classes
 * concatenated (`.red.tsrx-abc`) so the matched element only needs the
 * hash on its `class` attribute.
 */
function applyStyleMap(stmt, ctx) {
	if (stmt.type !== 'VariableDeclaration') return;
	for (const decl of stmt.declarations) {
		if (!decl.init || decl.init.type !== 'JSXStyleElement') continue;
		const styleNode = decl.init;
		const sheet = (styleNode.children || []).find((c) => c && c.type === 'StyleSheet');
		if (!sheet) continue;
		const hash = styleNode.metadata?.styleScopeHash || sheet.hash || null;
		if (!hash) continue;
		// `analyzeCss` marks `:global(...)` selectors (is_global / is_global_block
		// metadata) so the renderer leaves them UNSCOPED. Without this pass
		// `:global(a)` would be scoped to `.<hash>a`. Mirrors tsrx-ripple, which
		// runs analyzeCss(stylesheet) before prepareStylesheetForRender.
		analyzeCss(sheet);
		prepareStylesheetForRender(sheet, true);
		const css = renderStylesheets([sheet]);
		ctx.cssInjections.push({ hash, css });
		ctx.runtimeNeeded.add('injectStyle');
		// Replace the JSXStyleElement init with the class-map ObjectExpression.
		decl.init = createStyleClassMapFromStylesheet(sheet);
	}
}

function applyCssScoping(componentNode, ctx) {
	if (!componentNode.body || componentNode.body.type !== 'JSXCodeBlock') return null;
	let cssHash = null;
	const styleSheets = [];
	function collect(node) {
		if (!node || typeof node !== 'object') return;
		if (Array.isArray(node)) {
			for (const i of node) collect(i);
			return;
		}
		if (node.type === 'JSXStyleElement') {
			const sheet = (node.children || []).find((c) => c && c.type === 'StyleSheet');
			if (sheet) {
				styleSheets.push(sheet);
				if (!cssHash) cssHash = node.metadata?.styleScopeHash || sheet.hash || null;
			}
			return;
		}
		for (const key of Object.keys(node)) {
			if (key === 'loc' || key === 'start' || key === 'end' || key === 'parent') continue;
			const v = node[key];
			if (v && typeof v === 'object') collect(v);
		}
	}
	collect(componentNode.body);
	if (!cssHash || styleSheets.length === 0) return null;
	for (const sheet of styleSheets) {
		// Mark `:global(...)` selectors before scoping so they render unscoped.
		analyzeCss(sheet);
		prepareStylesheetForRender(sheet);
	}
	const css = renderStylesheets(styleSheets);
	ctx.cssInjections.push({ hash: cssHash, css });
	ctx.runtimeNeeded.add('injectStyle');
	// Mutate the render tree: add hash class to every native element AND
	// strip JSXStyleElement nodes (annotateWithHash returns null for them when
	// preserve_style_elements=false, so we filter nulls out of children).
	if (componentNode.body.render) {
		componentNode.body.render = annotateWithHash(
			componentNode.body.render,
			cssHash,
			'class',
			false,
		);
	}
	return cssHash;
}

function compileComponent(node, ctx, options) {
	const name = node.id.name;
	// The ripple-new target has no async/generator component model. Without this
	// guard an `async function` / `function*` component body compiles to broken
	// synchronous code with no diagnostic — the worst failure mode. Fail loudly.
	if (node.async) {
		throw new Error(
			`Component \`${name}\` is declared \`async\`, which the ripple-new target does not support. ` +
				`Load async data with \`use(promise)\` inside a \`@try\` / \`@pending\` boundary instead of ` +
				`awaiting in the component body.`,
		);
	}
	if (node.generator) {
		throw new Error(
			`Component \`${name}\` is declared as a generator (\`function*\`), which the ripple-new ` +
				`target does not support.`,
		);
	}
	const isExported = !!(node.export || node.default || node.exported);
	const isDefault = !!node.default;
	const hmrWrap = !!(options && options.hmrWrap);

	// Scoped `<style>` block. New TSRX surfaces each style block as a
	// `JSXStyleElement` child of the rendered tree (parser pre-computes the
	// content hash + parses CSS into a StyleSheet AST). Collect them, run the
	// @tsrx/core scoping pipeline (rewrites `.foo` → `.foo.<hash>` AND stamps
	// the hash class onto every element under this component), emit a single
	// module-level `injectStyle(hash, css)`, and surface `cssHash` so
	// resolveStyleExpr can also prefix any legacy `{style 'cls'}` usages still
	// present in fixtures.
	let cssHash = applyCssScoping(node, ctx);
	// Backwards-compat: internal callers (legacy synthetic Component shapes)
	// may still attach `.css` directly on the node.
	if (!cssHash && node.css) {
		analyzeCss(node.css);
		prepareStylesheetForRender(node.css);
		const css = renderStylesheets([node.css]);
		cssHash = node.css.hash;
		ctx.cssInjections.push({ hash: cssHash, css });
		ctx.runtimeNeeded.add('injectStyle');
	}

	// Snapshot the component's outer locals so nested for-of bodies can do
	// purity analysis (and auto-memo when the body doesn't reference any of
	// them). Stash on ctx for the duration of this compile so nested makeForCall
	// can reach it; restore on exit so sibling components don't see this one's
	// locals.
	const prevLocals = ctx.currentComponentLocals;
	ctx.currentComponentLocals = collectComponentLocals(node);
	let fn;
	try {
		// autoCallback: only top-level component bodies opt in. Item bodies and
		// other inner compileFunctionBody calls leave their arrows untouched
		// (they rarely declare arrow consts; if they do, the stability oracle
		// would need to be redefined relative to the inner scope).
		fn = compileFunctionBody(node, ctx, name, 'html', cssHash, { autoCallback: true });
	} finally {
		ctx.currentComponentLocals = prevLocals;
	}

	// HMR-wrap exported components inline so the binding stays a `const` (no
	// reassignment dance needed). The wrapper preserves the user-facing
	// function-name identity by NAMING the inner FunctionExpression — `hmr`
	// returns a wrapper that delegates to whatever fn is currently committed,
	// and `module.Foo[HMR].update(...)` swaps it on each accept.
	const valueExpr = hmrWrap && isExported ? `hmr(${fn})` : fn;
	if (isDefault) {
		return `const ${name} = ${valueExpr};\nexport default ${name};`;
	}
	if (isExported) {
		return `export const ${name} = ${valueExpr};`;
	}
	return `const ${name} = ${valueExpr};`;
}

/**
 * Generate just the `function (...) { ... }` text for a component-shaped node.
 * Used both for top-level components and for inlined for-of item bodies.
 *
 * `parentNs` is the namespace this body's JSX is rendered into. For top-level
 * components it's 'html'; for an if/for/try body whose host element is in
 * SVG/MathML context it inherits that ns.
 *
 * `cssHash` is the enclosing component's scoped-style hash (or null) — used to
 * resolve `{style 'cls'}` expressions to "<hash> cls" strings.
 */
function compileFunctionBody(node, ctx, name, parentNs = 'html', cssHash = null, options = null) {
	const params = node.params.map((p) => printNode(p)).join(', ');
	const paramsClause = params ? `, ${params}` : '';

	// Body splitting. Two shapes to handle:
	//   (new TSRX)  node.body is a `JSXCodeBlock { body: Statement[], render: Node|null }`.
	//               Setup statements and the render JSX are already split for us.
	//               Early-return guards are normal JS `if (cond) return;` — the
	//               function's render is its single final expression, reached
	//               only if no return fired, so no early-exit desugaring needed.
	//   (legacy)    node.body is `Statement[]` with JSX nodes interleaved as
	//               statements. Used by internal callers that construct synthetic
	//               Component shapes (rewriteTsrxBlocks for old `<tsrx>` blocks,
	//               makeForCall/makeIfCall/makeTryCall for inlined sub-bodies).
	//               Keep the old split + rewriteEarlyExits path for these.
	let statements;
	let jsxNodes;
	if (node.body && node.body.type === 'JSXCodeBlock') {
		statements = node.body.body || [];
		jsxNodes = node.body.render ? [node.body.render] : [];
	} else {
		const bodyRewritten = rewriteEarlyExits(node.body);
		statements = [];
		jsxNodes = [];
		for (const child of bodyRewritten) {
			if (isJsxNode(child)) {
				if (child.type === 'Element' && elementTagName(child) === 'style') continue;
				jsxNodes.push(child);
			} else statements.push(child);
		}
	}

	// Plan + emit JSX. Records any inline-sub-component code that needs to live
	// INSIDE this function body (so for-of item bodies can capture parent state).
	const inlinedSubs = [];

	// Auto-callback: lower `const X = (...) => ...` to `useCallback(X, [deps])`
	// for arrows whose free vars are all stable. Only runs at the component-body
	// level (caller opts in via options.autoCallback). For-of item bodies and
	// other inner compileFunctionBody calls skip this — they rarely declare
	// arrow consts, and the stability oracle is defined relative to the
	// component's scope, not the item body's.
	let workingStatements = statements;
	if (options && options.autoCallback && ctx.currentComponentLocals) {
		const stableSet = computeStableLocals(statements, ctx.currentComponentLocals);
		workingStatements = statements.map((s) =>
			rewriteAutoCallback(s, stableSet, ctx.currentComponentLocals, ctx),
		);
	}

	// Rewrite hook calls and `<tsrx>` blocks in statements before printing them.
	// A `<tsrx>` block at expression position (e.g. `const f = <tsrx>...</tsrx>`)
	// is hoisted as a render function in inlinedSubs and replaced with an
	// identifier reference. Suitable for top-level render-prop patterns where
	// the block doesn't capture local arrow params.
	const rewrittenStatements = workingStatements
		.map((s) => rewriteHookCalls(s, ctx, name))
		.map((s) => rewriteTsrxBlocks(s, ctx, name, inlinedSubs))
		// JSX component element at VALUE position in setup (e.g. `const el = <App/>`)
		// → createElement(App, props). Output JSX (jsxNodes) was already split off.
		.map((s) => rewriteJsxValues(s, ctx));
	// Capture per-statement source maps for the TOP-LEVEL component body only
	// (the autoCallback pass). Output stays byte-identical — printNodeWithMap
	// prints the same code as printNode, it just also returns esrap's real
	// per-token mappings. Nested for-of / if / try bodies are embedded at
	// variable offsets and are left unmapped. Function-body layout: line 0 is
	// `function X(...) {`, line 1 is the `const __block` header, line 2 is the
	// first setup statement; statements join with '\n' and indent two spaces.
	const collectSetupMaps = !!(options && options.autoCallback && !(options && options.prologue));
	const setupMaps = collectSetupMaps ? [] : null;
	let stmtRelLine = 2;
	const statementCode = rewrittenStatements
		.map((s) => {
			let code;
			if (collectSetupMaps) {
				const r = printNodeWithMap(s, ctx);
				code = r.code;
				setupMaps.push({ fnRelLine: stmtRelLine, colShift: 2, mappings: r.mappings });
				stmtRelLine += 1 + countNewlines(code);
			} else {
				code = printNode(s);
			}
			return '  ' + code.replace(/\n/g, '\n  ');
		})
		.join('\n');
	if (collectSetupMaps) ctx._setupMaps = setupMaps;

	const plan = planJsx(jsxNodes, ctx, name, inlinedSubs, parentNs, cssHash);

	const lines = [];
	// Closure-dep snapshot prologue (raw JS string). Used by impure for-of item
	// bodies that close over parent locals but have no hooks / no component
	// calls / no control flow — they can short-circuit when every captured
	// value (deps + item ref) matches the previous render.
	if (options && options.prologue) lines.push(options.prologue);
	if (statementCode) lines.push(statementCode);
	if (inlinedSubs.length > 0)
		lines.push(inlinedSubs.map((s) => '  ' + s.replace(/\n/g, '\n  ')).join('\n'));
	if (plan.bindingsName) {
		lines.push(`  let _b = __s.${plan.bindingsName};`);
		lines.push(`  if (_b === undefined) {`);
		lines.push(plan.mount);
		lines.push(`  } else {`);
		lines.push(plan.update);
		lines.push(`  }`);
	}
	if (plan.after) lines.push(plan.after);
	// Hoisted `<title>`/`<meta>`/`<link>` → headBlock into document.head
	// (out-of-band; re-applied each render for reactivity, removed on unmount).
	if (plan.head) lines.push(plan.head);

	return `function ${name}(__s${paramsClause}, __extra) {\n  const __block = __s.block;\n${lines.join('\n')}\n}`;
}

// ===========================================================================
// Hook-call rewriting
// ===========================================================================

function rewriteHookCalls(node, ctx, componentName) {
	return mapAst(node, (n) => {
		if (n.type === 'CallExpression' && n.callee.type === 'Identifier') {
			const name = n.callee.name;
			if (HOOK_NAMES.has(name)) {
				ctx.runtimeNeeded.add(name);
				const symVar = allocHookSymbol(ctx, `${componentName}.${name}#${ctx.nextHookSymId}`);
				return {
					...n,
					arguments: [...n.arguments, { type: 'Identifier', name: symVar }],
				};
			}
			// SSR Phase 4: give every server-side `use(thenable)` call site a stable
			// key so render()'s suspense cache matches the same call across re-render
			// passes (and tells sibling/nested boundaries apart). The client keys
			// use() by per-block call order instead, so this is server-mode only;
			// the server's use() ignores the key for `use(Context)` reads.
			if (name === 'use' && ctx.mode === 'server') {
				ctx.runtimeNeeded.add('use');
				const symVar = allocHookSymbol(ctx, `${componentName}.use#${ctx.nextHookSymId}`);
				return {
					...n,
					arguments: [...n.arguments, { type: 'Identifier', name: symVar }],
				};
			}
		}
		return null;
	});
}

/**
 * Hoist sub-template render functions at expression position. Three shapes:
 *   (legacy)  `<tsrx>...</tsrx>` / `<tsx>...</tsx>` JSX block — replaced.
 *   (new)     `() => @{ <jsx/> }` — arrow whose body is a JSXCodeBlock. The
 *             new TSRX way to write what `<tsrx>` used to express. The arrow
 *             takes whatever params the user wrote (typically `()`); we hoist
 *             a function declaration whose signature mirrors the standard
 *             component signature `(__s, …userParams, __extra)` so it slots
 *             into createPortal / Dynamic / render-prop callers uniformly.
 *
 * In both cases the helper is added to `inlinedSubs` (visible in the
 * surrounding component-body scope) so it captures the parent component's
 * locals via closure. It cannot capture params of nested arrows — see
 * compiler README.
 */
function rewriteTsrxBlocks(node, ctx, componentName, inlinedSubs) {
	return mapAst(node, (n) => {
		if (n.type === 'Tsrx' || n.type === 'Tsx') {
			const helperName = `__tsrx$${ctx.nextHelperId++}`;
			const fakeBody = {
				type: 'Component',
				id: { type: 'Identifier', name: helperName },
				params: [],
				body: n.children || [],
			};
			const fn = compileFunctionBody(fakeBody, ctx, helperName);
			inlinedSubs.push(fn + ';');
			return { type: 'Identifier', name: helperName };
		}
		if (n.type === 'ArrowFunctionExpression' && n.body && n.body.type === 'JSXCodeBlock') {
			// `() => @{ … }` — new sub-template form. Hoist as a regular component
			// body so its body.body (setup) + body.render (JSX) feed back through
			// the standard compileFunctionBody path.
			const helperName = `__tsrx$${ctx.nextHelperId++}`;
			const fakeBody = {
				type: 'FunctionDeclaration',
				id: { type: 'Identifier', name: helperName },
				params: n.params || [],
				body: n.body,
			};
			const fn = compileFunctionBody(fakeBody, ctx, helperName);
			inlinedSubs.push(fn + ';');
			return { type: 'Identifier', name: helperName };
		}
		return null;
	});
}

/**
 * Lower a JSX COMPONENT element used at VALUE position (not as a component body's
 * rendered output) into a `createElement(Comp, props)` call, so JSX-as-a-value
 * works — chiefly `root.render(<App foo={x}/>)` matching React's root render.
 *
 * Only component elements (capitalized / member tag) with NO children are
 * supported as values; host elements (`<div/>`), fragments, and children-bearing
 * components throw a clear diagnostic (define a component for that markup). Props
 * (including spreads) are emitted into the object literal verbatim; `key` is
 * dropped (meaningless at value position). Nested JSX in prop values is lowered
 * recursively. This never touches a component body's OUTPUT JSX — that is split
 * out as `jsxNodes` and handled by planJsx before this runs.
 */
function rewriteJsxValues(node, ctx) {
	return mapAst(node, (n) => {
		const t = n && n.type;
		if (t === 'Element' || t === 'JSXElement') {
			if (!isComponentTag(n)) {
				const loc = n.loc && n.loc.start;
				const tag = n.id?.name || n.openingElement?.name?.name || 'element';
				throw new Error(
					`Host element <${tag}/> used as a value` +
						(loc ? ` (line ${loc.line})` : '') +
						` is not supported. Wrap the markup in a component and render that ` +
						`(e.g. \`root.render(<App/>)\`).`,
				);
			}
			const kids = n.children || [];
			if (kids.some((c) => c.type !== 'Comment')) {
				const loc = n.loc && n.loc.start;
				throw new Error(
					`Component element with children used as a value` +
						(loc ? ` (line ${loc.line})` : '') +
						` is not supported. Move the children into the component itself.`,
				);
			}
			return jsxElementToCreateElement(n, ctx);
		}
		if (t === 'Fragment' || t === 'JSXFragment') {
			const loc = n.loc && n.loc.start;
			throw new Error(
				`Fragment used as a value` +
					(loc ? ` (line ${loc.line})` : '') +
					` is not supported. Wrap it in a component and render that.`,
			);
		}
		return null;
	});
}

// Convert a JSX tag name node to a plain expression node esrap can print.
function jsxNameToExpr(name) {
	if (name.type === 'Identifier' || name.type === 'JSXIdentifier') {
		return { type: 'Identifier', name: name.name };
	}
	if (name.type === 'MemberExpression' || name.type === 'JSXMemberExpression') {
		const prop = name.property;
		return {
			type: 'MemberExpression',
			object: jsxNameToExpr(name.object),
			property:
				prop && prop.type ? jsxNameToExpr(prop) : { type: 'Identifier', name: String(prop) },
			computed: false,
			optional: false,
		};
	}
	// `<{expr}/>` — dynamic tag carries the expression directly.
	if (name.type === 'JSXExpressionContainer') return name.expression;
	return { type: 'Identifier', name: String(name.name || name) };
}

// Build a `createElement(Comp, { ...props })` CallExpression AST node from a
// component Element node. Recurses into prop values so nested JSX values lower too.
function jsxElementToCreateElement(node, ctx) {
	ctx.runtimeNeeded.add('createElement');
	const nameNode = node.openingElement?.name || node.id;
	const compNode = jsxNameToExpr(nameNode);
	const attrs = node.attributes || node.openingElement?.attributes || [];
	const properties = [];
	for (const attr of attrs) {
		if (attr.type === 'SpreadAttribute' || attr.type === 'JSXSpreadAttribute') {
			properties.push({ type: 'SpreadElement', argument: rewriteJsxValues(attr.argument, ctx) });
			continue;
		}
		if (attr.type !== 'Attribute' && attr.type !== 'JSXAttribute') continue;
		const attrName = attr.name.name || attr.name;
		if (attrName === 'key') continue; // meaningless at value position (no slot)
		let valNode;
		if (attr.value == null) {
			valNode = { type: 'Literal', value: true };
		} else {
			const inner =
				attr.value.type === 'JSXExpressionContainer' ? attr.value.expression : attr.value;
			valNode = rewriteJsxValues(inner, ctx);
		}
		const keyIsIdent = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(attrName);
		properties.push({
			type: 'Property',
			key: keyIsIdent
				? { type: 'Identifier', name: attrName }
				: { type: 'Literal', value: attrName },
			value: valNode,
			kind: 'init',
			method: false,
			shorthand: false,
			computed: false,
		});
	}
	return {
		type: 'CallExpression',
		callee: { type: 'Identifier', name: 'createElement' },
		arguments: [compNode, { type: 'ObjectExpression', properties }],
		optional: false,
	};
}

function allocHookSymbol(ctx, debugName) {
	const id = ctx.nextHookSymId++;
	const name = `_h$${id}`;
	// Use Symbol.for(stableKey) so re-imports under HMR produce the SAME Symbol
	// identity, which keeps the existing hooks Map keys valid across body
	// swaps. The stable key embeds the source filename so symbols don't
	// collide across modules. `debugName` includes the component name + hook
	// name + call-site index — stable provided the user doesn't reorder hooks
	// between renders (which would violate React's rules anyway).
	const stableKey = `ripple-new:${ctx.filename || '<anon>'}:${debugName}`;
	ctx.hoistedHelpers.push(`const ${name} = Symbol.for(${JSON.stringify(stableKey)});`);
	return name;
}

// ===========================================================================
// JSX planning
// ===========================================================================

/**
 * Normalize a list of JSX child nodes:
 *   - Whitespace-only JSXText → dropped
 *   - JSXText with content → text Literal node
 *   - JSXExpressionContainer → Text hole
 *   - JSXElement → Element (matches our compiler's expected shape)
 *   - Tsx (`<>...</>`) and Tsrx (`<tsrx>...</tsrx>`) → flattened (children inlined)
 *   - Anything else (Element / ForOf / If / etc.) → passed through
 */
// ===========================================================================
// Hoisted document metadata (<title>/<meta>/<link>) — React-19 model
// ===========================================================================
//
// `<title>`, `<meta>`, `<link>` rendered ANYWHERE in a component are NOT body
// DOM: like `<style>` (→ CSS), they are lifted to the document head — emitted as
// a `headBlock(__s, …)` call on the client (creates/adopts/updates/removes the
// element in document.head, reactively, tied to the owning scope's lifecycle)
// and an `ssrHeadEl(…)` call on the server (serializes into render().head,
// prefixed with a `<!--key-->` marker the client headBlock adopts on hydration).
// Lifting them out of the body-root set also collapses the remaining single body
// element to the single-root path (no `<ripple-frag>`).

const HOISTABLE_HEAD_TAGS = new Set(['title', 'meta', 'link']);

/** @param {any} n @returns {string|null} */
function jsxTagName(n) {
	return n && n.openingElement && n.openingElement.name
		? n.openingElement.name.name || n.openingElement.name
		: null;
}

/** @param {any} n @returns {boolean} */
function isHeadElementNode(n) {
	return Boolean(n && n.type === 'JSXElement' && jsxTagName(n) === 'head');
}

/** @param {any} n @returns {boolean} */
function isHoistableHeadElementNode(n) {
	return Boolean(n && n.type === 'JSXElement' && HOISTABLE_HEAD_TAGS.has(jsxTagName(n)));
}

// Deterministic per-element key bridging the client `headBlock` (its scope-state
// key + SSR-marker adoption) and the server `ssrHeadEl` marker. Must be
// byte-identical across the client and server compiles of the SAME source, so it
// is keyed ONLY on the element's SOURCE POSITION (same AST → same offset in both
// modes), NOT the filename. Unique per head element WITHIN a file.
/** @param {any} node @param {number} index @returns {string} */
function headKey(node, index) {
	const pos =
		node && node.openingElement && node.openingElement.start != null
			? node.openingElement.start
			: index;
	const src = `head:${pos}`;
	let h = 5381;
	for (let i = 0; i < src.length; i++) h = (Math.imul(h, 33) + src.charCodeAt(i)) | 0;
	return 'rnh-' + (h >>> 0).toString(36);
}

// Build the shared `"key", "tag", attrsObjExpr, textExpr` argument string for a
// hoisted head element (a `HeadHoist` node) — consumed by both the client
// `headBlock(__s, …)` and the server `ssrHeadEl(…)` emit. Attributes become an
// object-literal expression (dynamic values stay live expressions, so the
// metadata is reactive); a `<title>`'s text becomes a string-concat expression;
// void tags (`<meta>`/`<link>`) pass `null` for text.
/** @param {any} node @param {number} index @returns {string} */
function headElementArgs(node, index) {
	const el = node.element;
	const tag = jsxTagName(el);
	const attrParts = [];
	for (const a of el.openingElement.attributes || []) {
		if (a.type === 'SpreadAttribute' || a.type === 'JSXSpreadAttribute') {
			attrParts.push(`...(${printExpr(a.argument)})`);
			continue;
		}
		if (a.type !== 'Attribute' && a.type !== 'JSXAttribute') continue;
		const attrName = a.name.name || a.name;
		// Events/refs/key have no head semantics; `class` is the CSS-scoping stamp
		// (meaningless on title/meta/link) — drop them all.
		if (attrName === 'key' || attrName === 'ref' || attrName === 'class') continue;
		if (attrName.length > 2 && attrName.startsWith('on') && /^[A-Z]/.test(attrName[2])) continue;
		const val = a.value;
		if (val == null) {
			attrParts.push(`${JSON.stringify(attrName)}: true`);
			continue;
		}
		const inner = val.type === 'JSXExpressionContainer' ? val.expression : val;
		if (inner.type === 'Literal' || inner.type === 'StringLiteral' || inner.type === 'JSXText') {
			attrParts.push(`${JSON.stringify(attrName)}: ${JSON.stringify(inner.value)}`);
		} else {
			attrParts.push(`${JSON.stringify(attrName)}: (${printExpr(inner)})`);
		}
	}
	const attrsExpr = attrParts.length ? `{ ${attrParts.join(', ')} }` : 'null';

	let textExpr = 'null';
	if (!VOID_ELEMENTS.has(tag)) {
		const textParts = [];
		for (const c of el.children || []) {
			if (c.type === 'JSXText') {
				// JSX whitespace rules: a run of whitespace containing a newline is an
				// indentation artifact — collapse interior ones to a single space and
				// drop leading/trailing ones. So a multi-line `<title>\n  Foo\n</title>`
				// serializes to "Foo", not "\n  Foo\n". Whitespace WITHOUT a newline
				// (e.g. the space in `TSRX | {x}`) is significant and preserved.
				const normalized = c.value
					.replace(/[ \t]*\r?\n[ \t\r\n]*/g, '\n')
					.replace(/^\n+/, '')
					.replace(/\n+$/, '')
					.replace(/\n+/g, ' ');
				if (normalized === '') continue;
				textParts.push(JSON.stringify(normalized));
			} else if (c.type === 'JSXExpressionContainer') {
				textParts.push(`(${printExpr(c.expression)})`);
			} else if (c.type === 'Literal' || c.type === 'StringLiteral') {
				textParts.push(JSON.stringify(c.value));
			}
		}
		if (textParts.length) textExpr = textParts.join(' + ');
	}

	return `${JSON.stringify(headKey(el, index))}, ${JSON.stringify(tag)}, ${attrsExpr}, ${textExpr}`;
}

// Build the CLIENT `headBlock(__s, …)` statements for a component's hoisted head
// elements (one per `HeadHoist`). Returns '' when there are none.
/** @param {any[]} headNodes @param {any} ctx @returns {string} */
function emitHeadClient(headNodes, ctx) {
	if (!headNodes.length) return '';
	ctx.runtimeNeeded.add('headBlock');
	return headNodes.map((h, i) => `  headBlock(__s, ${headElementArgs(h, i)});`).join('\n');
}

// Build the SERVER `ssrHeadEl(…)` statements for a component's hoisted head
// elements. Returns '' when there are none.
/** @param {any[]} headNodes @param {any} ctx @returns {string} */
function emitHeadServer(headNodes, ctx) {
	if (!headNodes.length) return '';
	ctx.runtimeNeeded.add('ssrHeadEl');
	return headNodes.map((h, i) => `  ssrHeadEl(${headElementArgs(h, i)});`).join('\n') + '\n';
}

function normalizeChildren(nodes) {
	const out = [];
	if (!nodes) return out;
	for (const n of nodes) {
		if (!n) continue;
		if (n.type === 'JSXText') {
			if (/^\s*$/.test(n.value)) continue;
			out.push({
				type: 'Text',
				expression: { type: 'Literal', value: n.value, raw: JSON.stringify(n.value) },
			});
		} else if (n.type === 'JSXExpressionContainer') {
			// TS-only wrappers (`as string`, `!`, `satisfies T`) on the expression
			// get stripped centrally in printNode at print time — no need to
			// pre-strip here. Pass the raw expression through; downstream emission
			// sees a plain expression once esrap is invoked.
			const expression = n.expression;
			// Route to the RICH dispatcher (`TSRXExpression` branch in emitElementHtml)
			// when the expression is one that needs special handling — createPortal
			// calls, JSX-bearing ternaries, sub-template arrows (`() => @{…}`).
			// Otherwise route to the simpler `Text` branch (text-binding fast-path
			// for string-typed expressions; runtime String() coercion for others).
			out.push({
				type: needsRichDispatch(expression) ? 'TSRXExpression' : 'Text',
				expression,
			});
		} else if (n.type === 'JSXElement') {
			// Long-form `<Fragment>…</Fragment>` (canary `enableFragmentRefs`
			// parity): if it carries a `ref` attribute, expand to a
			// FragmentStart / …children… / FragmentEnd sequence so the parent
			// element template gets `<!--frag-->` markers + a fragmentRef
			// binding pairing them. Without a ref, treat it identically to the
			// `<>` shorthand and just inline the children (no wasted markers).
			// Detection is by source-name only; the runtime `Fragment` export
			// exists as a sentinel for `import { Fragment }` parity, but the
			// compiler matches the identifier here. Routing this BEFORE the
			// generic Element branch is required — `Fragment` would otherwise
			// hit `isComponentTag` and route through `componentSlot`, which
			// has no notion of marker pairs.
			if (isFragmentLongForm(n)) {
				const refAttr = (n.openingElement.attributes || []).find(
					(a) =>
						(a.type === 'Attribute' || a.type === 'JSXAttribute') &&
						a.name &&
						(a.name.name || a.name) === 'ref',
				);
				if (refAttr) {
					const refVal = refAttr.value;
					const refInner =
						refVal && refVal.type === 'JSXExpressionContainer' ? refVal.expression : refVal;
					out.push({ type: 'FragmentStart', refExpr: refInner });
					out.push(...normalizeChildren(n.children || []));
					out.push({ type: 'FragmentEnd' });
				} else {
					out.push(...normalizeChildren(n.children || []));
				}
				continue;
			}
			// `<Activity mode={…}>…</Activity>` (React 19). Matched by name BEFORE
			// the generic Element branch (it would otherwise route through
			// componentSlot). Lower to an ActivityStatement carrying the mode expr
			// and the raw children (compiled into one body by makeActivityCall).
			if (isActivityLongForm(n)) {
				const modeAttr = (n.openingElement.attributes || []).find(
					(a) =>
						(a.type === 'Attribute' || a.type === 'JSXAttribute') &&
						a.name &&
						(a.name.name || a.name) === 'mode',
				);
				let mode = null;
				if (modeAttr) {
					const v = modeAttr.value;
					mode = v && v.type === 'JSXExpressionContainer' ? v.expression : v;
				}
				out.push({ type: 'ActivityStatement', mode, children: n.children || [] });
				continue;
			}
			// `<head>` is no longer a construct (React-19 model): render
			// `<title>`/`<meta>`/`<link>` directly and they hoist to document.head.
			if (isHeadElementNode(n)) {
				throw new Error(
					'`<head>` is not supported in ripple-new. Render `<title>`, `<meta>`, and ' +
						'`<link>` directly (anywhere in the component) — they are hoisted to ' +
						'document.head automatically, React-19-style.',
				);
			}
			// `<title>`/`<meta>`/`<link>` → hoist to the document-head channel (NOT
			// body DOM). Kept in `out` as a synthetic node so planJsx / ssrCompileBody
			// can partition it out and emit it via headBlock (client) / ssrHeadEl
			// (server). Lifted from wherever they appear in the output.
			if (isHoistableHeadElementNode(n)) {
				out.push({ type: 'HeadHoist', element: n });
				continue;
			}
			// Skip JSXStyleElement nested as a child — its CSS gets registered via
			// the @tsrx/core scoping pipeline elsewhere; it contributes no DOM.
			// (Detected separately via JSXStyleElement type but the parser may also
			// surface a regular JSXElement with tag 'style' in some edge cases.)
			out.push({
				type: 'Element',
				id: n.openingElement.name,
				attributes: n.openingElement.attributes || [],
				openingElement: n.openingElement,
				children: n.children || [],
				selfClosing: n.openingElement.selfClosing,
			});
		} else if (n.type === 'Tsx' || n.type === 'Tsrx' || n.type === 'JSXFragment') {
			out.push(...normalizeChildren(n.children || []));
		} else if (n.type === 'JSXStyleElement') {
			// Drop — its CSS gets pulled out of the render tree elsewhere.
			// No DOM contribution at this child position.
			continue;
		} else if (n.type === 'JSXIfExpression') {
			// `@if (cond) { ... } @else { ... }` — lower to the old IfStatement
			// shape so the existing makeIfCall path picks it up. `consequent` and
			// `alternate` are already BlockStatements per the new AST.
			out.push({
				type: 'IfStatement',
				test: n.test,
				consequent: n.consequent,
				alternate: n.alternate || null,
			});
		} else if (n.type === 'JSXForExpression') {
			// `@for (const x of items; index i; key x.id) { ... }` — lower to
			// ForOfStatement plus the `key` and `index` fields the new AST gives
			// us on the directive node. makeForCall reads these off the synthetic
			// ForOfStatement to plan keyed reconciliation.
			out.push({
				type: 'ForOfStatement',
				left: n.left,
				right: n.right,
				body: n.body,
				await: !!n.await,
				key: n.key || null,
				index: n.index || null,
				empty: n.empty || null,
			});
		} else if (n.type === 'JSXTryExpression') {
			// `@try { } @catch (err) { } @pending { }` — lower to TryStatement
			// with the optional `pending` field tagged on (consumed by makeTryCall
			// as the Suspense fallback branch).
			out.push({
				type: 'TryStatement',
				block: n.block,
				handler: n.handler || null,
				finalizer: n.finalizer || null,
				pending: n.pending || null,
			});
		} else if (n.type === 'JSXSwitchExpression') {
			// `@switch (d) { @case 1: { ... } @default: { ... } }` — lower to a
			// synthetic SwitchStatement for makeSwitchCall to consume.
			out.push({
				type: 'SwitchStatement',
				discriminant: n.discriminant,
				cases: n.cases || [],
			});
		} else if (n.type === 'JSXCodeBlock') {
			// `@{ … }` at child position — tsrx 0.1.29 lets `@{}` appear here as
			// well as on function bodies. The node has `.body` (setup statements)
			// and `.render` (the single optional render output).
			//   - Empty: drop (degenerate but legal).
			//   - Render-only: recurse — the wrapped JSX is a sibling.
			//   - Code-only or setup+render: ambiguous at child position (when do
			//     the setup statements run? Per-render? Once per parent mount?
			//     The runtime would need a fresh Scope and a way to thread state
			//     back to siblings — there is no sensible answer in our model).
			//     Throw with a workaround hint pointing at the render-prop arrow
			//     form `{() => @{ … }}`, which IS supported via the existing
			//     ArrowFunctionExpression → JSXCodeBlock path (compile.js:1081).
			const body = n.body || [];
			const render = n.render || null;
			if (body.length === 0 && render === null) continue;
			if (body.length === 0 && render !== null) {
				// Recurse — render is a single JSX node, treat as a sibling child.
				out.push(...normalizeChildren([render]));
			} else {
				throw new Error(
					'`@{ … }` with setup statements is not supported at JSX child position. ' +
						'Wrap it in a render-prop arrow form instead — `{() => @{ … }}` — ' +
						'or extract the setup into its own component.',
				);
			}
		} else {
			out.push(n);
		}
	}
	return out;
}

/**
 * Decide whether a JSX-child expression needs the rich dispatcher
 * (`TSRXExpression` branch in emitElementHtml) rather than the simple text
 * branch. Rich dispatch handles createPortal at child position, ternaries
 * whose branches are JSX, and sub-template arrows `() => @{…}` that the
 * standalone esrap printer can't handle.
 */
function needsRichDispatch(expr) {
	if (!expr || typeof expr !== 'object') return false;
	if (isCreatePortalCall(expr)) return true;
	if (isConditionalJsx(expr)) return true;
	if (isJsxReturningMapCall(expr)) return true;
	// A bare arrow whose body is a JSXCodeBlock — appears as a render-prop pass
	// (e.g. `{(state) => @{ … }}`). esrap will explode on the JSXCodeBlock; route
	// through rich dispatch where rewriteTsrxBlocks normalizes it.
	if (expr.type === 'ArrowFunctionExpression' && expr.body && expr.body.type === 'JSXCodeBlock')
		return true;
	return false;
}

/**
 * Walk through `as string` / `as TSStringKeyword` casts so the inner
 * expression is the one we emit. Other TS-only wrappers (TSNonNullExpression,
 * TSTypeAssertion with TSStringKeyword) are stripped the same way — they're
 * compile-time hints with no runtime semantics in our emit.
 */
// Predicate: is this expression statically known to be a string? Used at
// text-binding creation time to mark the binding so the runtime emit can
// skip the `String(_v)` coercion on the hot path. Recognised shapes:
//   - String Literal:               'foo' / "bar"
//   - TemplateLiteral:               `${x}-${y}` (always coerces to string)
//   - `as string` / `<string>x`:     user-asserted string-typed expression
//   - `satisfies string`:            same intent
//   - Wrappers (`!`, instantiation): peel and check inside
//   - String `+` concat:             at least one operand known-string
// Conservative — returns false for anything we can't prove. Safe to use
// from any text-binding site BEFORE the TS-wrapper strip in printNode.
// A text child that is a plain string literal — `<el>plain text</el>` (JSXText)
// or `<el>{'literal'}</el>` — can be baked directly into the template HTML
// instead of emitting a runtime text binding. Returns the literal string, or
// `null` when the expression is anything dynamic. Mirrors the server's
// `Literal`-string fast path so client and server emit identical markup.
function staticTextLiteral(node) {
	if (node == null || typeof node !== 'object') return null;
	if (
		(node.type === 'Literal' || node.type === 'StringLiteral') &&
		typeof node.value === 'string'
	) {
		return node.value;
	}
	return null;
}

function isKnownStringExpression(node) {
	if (node == null || typeof node !== 'object') return false;
	if (node.type === 'Literal' || node.type === 'StringLiteral') {
		return typeof node.value === 'string';
	}
	if (node.type === 'TemplateLiteral') return true;
	if (
		node.type === 'TSAsExpression' ||
		node.type === 'TSTypeAssertion' ||
		node.type === 'TSSatisfiesExpression'
	) {
		const ann = node.typeAnnotation;
		if (
			ann &&
			(ann.type === 'TSStringKeyword' ||
				(ann.type === 'TSTypeReference' && ann.typeName && ann.typeName.name === 'string'))
		) {
			return true;
		}
		return isKnownStringExpression(node.expression);
	}
	if (node.type === 'TSNonNullExpression' || node.type === 'TSInstantiationExpression') {
		return isKnownStringExpression(node.expression);
	}
	// `a + b` is a string if EITHER operand is a string (JS coerces the other).
	if (node.type === 'BinaryExpression' && node.operator === '+') {
		return isKnownStringExpression(node.left) || isKnownStringExpression(node.right);
	}
	return false;
}

// Walk an AST, replacing every TS-only wrapper node (TSAsExpression,
// TSTypeAssertion, TSNonNullExpression, TSSatisfiesExpression,
// TSInstantiationExpression) with its inner .expression. Called centrally
// from printNode so every print path strips wrappers — esrap's tsx printer
// would otherwise emit `expr as string` / `expr!` / `expr satisfies T`
// verbatim into the compiled JS output, which Vite/rolldown rejects when
// loading the result as a `.js` module ("Type assertion expressions can
// only be used in TypeScript files"). Replaces the old stripStringishCast
// helper that only stripped outer wrappers at JSX-child position — this
// also covers inner wrappers (e.g. `(foo as number).toFixed(2) as string`)
// and statement-position wrappers (`@if` body's `'…' as string`).
// AST properties that hold a TS-only type annotation. esrap's tsx printer
// will emit them verbatim into the .js output (`let x: T`, `(p: T): R =>`,
// `function f<T>(){}`), which Rolldown rejects as it parses the output as
// plain JavaScript ("Type annotations can only be used in TypeScript
// files."). Clearing them lets the printer skip them cleanly. Listed
// explicitly rather than as a generic filter so the strip is auditable.
const TS_TYPE_PROPS = [
	'typeAnnotation', // Identifier `x: T`, VariableDeclarator, RestElement, Pattern
	'returnType', // FunctionDeclaration / Arrow / MethodDefinition return type
	'typeParameters', // Generic `<T>` declaration on function / class / interface
	'typeArguments', // Generic `<T>` ARGS on a call / new / JSX (`new Promise<string>()`, `foo<T>()`)
	'definite', // `let x!: T` definite-assignment assertion
	'accessibility', // class member `public` / `private` / `protected`
	'readonly', // class member `readonly`
	'declare', // `declare` modifier
	'override', // class member `override`
	'implements', // `class X implements I` list
];

function stripTsOnlyWrappers(node) {
	if (node === null || typeof node !== 'object') return node;
	if (Array.isArray(node)) {
		for (let i = 0; i < node.length; i++) node[i] = stripTsOnlyWrappers(node[i]);
		return node;
	}
	if (
		node.type === 'TSAsExpression' ||
		node.type === 'TSTypeAssertion' ||
		node.type === 'TSNonNullExpression' ||
		node.type === 'TSSatisfiesExpression' ||
		node.type === 'TSInstantiationExpression'
	) {
		return stripTsOnlyWrappers(node.expression);
	}
	// Drop type-only properties before descending so esrap never sees them.
	for (let i = 0; i < TS_TYPE_PROPS.length; i++) {
		const prop = TS_TYPE_PROPS[i];
		if (node[prop] !== undefined) node[prop] = null;
	}
	// `optional` on a parameter / Identifier is the `x?: T` marker — esrap
	// emits `x?` even if typeAnnotation is gone, which is also TS-only.
	// NB: `optional: true` ALSO marks optional chaining on MemberExpression /
	// CallExpression (`a?.b`, `a?.()`), which is runtime JavaScript and must be
	// preserved — so only clear it on non-member/call nodes (the TS `x?` marker).
	if (
		node.optional === true &&
		node.type !== 'MemberExpression' &&
		node.type !== 'CallExpression' &&
		node.type !== 'OptionalMemberExpression' &&
		node.type !== 'OptionalCallExpression'
	) {
		node.optional = false;
	}
	for (const key of Object.keys(node)) {
		// Skip `loc`/`range`/`start`/`end` source-position fields and the parent
		// backref (acorn-typescript sometimes attaches one). These never hold
		// wrapper nodes and walking them wastes work.
		if (key === 'loc' || key === 'range' || key === 'start' || key === 'end' || key === 'parent')
			continue;
		const child = node[key];
		if (child === null || typeof child !== 'object') continue;
		node[key] = stripTsOnlyWrappers(child);
	}
	return node;
}

function planJsx(jsxNodesRaw, ctx, componentName, inlinedSubs, parentNs = 'html', cssHash = null) {
	const allNodes = normalizeChildren(jsxNodesRaw);
	// Partition hoisted `<title>`/`<meta>`/`<link>` out of the BODY-root set:
	// `jsxNodes` (the body) drives single/multi-root + the template, while head
	// elements are mounted out-of-band into document.head. Excluding them (like
	// `<style>`) is what collapses a `<title> + <style> + <div>` page to single-root.
	const headNodes = allNodes.filter((n) => n.type === 'HeadHoist');
	const jsxNodes = allNodes.filter((n) => n.type !== 'HeadHoist');
	const headEmit = emitHeadClient(headNodes, ctx);
	if (jsxNodes.length === 0) return { mount: '', update: '', after: '', head: headEmit };

	// Emit ONE template containing all top-level JSX (wrapping multiple roots in
	// a synthetic <ripple-frag>).
	// We walk the tree, building HTML and a list of bindings.
	const elementBindings = []; // ordered list of bindings (per dynamic site)
	const forCalls = []; // forBlock calls — emitted after the mount/append
	const ifCalls = []; // ifBlock calls
	const compCalls = []; // component-as-tag calls (<Provider>, <Foo/>, <ctx.X/>)
	// {createPortal(...)} calls collected by emitElementHtml for THIS plan.
	// Save/restore the previous list across the plan so that nested planJsx
	// calls (triggered by compiling portal bodies via printExprWithTsrx) don't
	// wipe the outer plan's collected portals. Without this, two sibling
	// createPortal calls at the same level lose the first one because the
	// recursive plan for its body resets the array before the second push.
	const _prevPortalCalls = ctx._portalCalls;
	ctx._portalCalls = [];
	// `switchCalls` follows the same save/restore pattern as portals: keep it
	// on `ctx` so we don't thread an extra param through every emit signature.
	const _prevSwitchCalls = ctx._switchCalls;
	ctx._switchCalls = [];
	// Top-level Fragment ref pairing stack — same save/restore reason as
	// portals/switches so nested planJsx invocations (e.g. sub-templates
	// inside components) don't leak FragmentStart bindings into each other.
	const _prevFragRefStack = ctx._fragRefStack;
	ctx._fragRefStack = [];
	const tryCalls = []; // tryBlock calls

	// Track HTML index across top-level nodes — component-call nodes don't
	// contribute HTML, so their indices DON'T advance the frag position. Each
	// HTML-contributing top-level node lives at _root.childNodes[htmlIdx].
	// `single` mode = exactly one non-component Element root, no <ripple-frag>
	// wrapping. Anything else (multi-root, single Text, single comp call) goes
	// through the wrapper path; HTML-contributing nodes are at `_root.childNodes[i]`.
	const single =
		jsxNodes.length === 1 && jsxNodes[0].type === 'Element' && !isComponentTag(jsxNodes[0]);
	const partsHtml = [];
	let htmlIdx = 0;
	for (const node of jsxNodes) {
		const nodeIsComp = node.type === 'Element' && isComponentTag(node);
		// Single non-comp Element: path=[] (lives at _root directly).
		// Otherwise (wrapped in <ripple-frag>): path=[htmlIdx] when HTML-contributing.
		// Component-call: path=[] (no DOM contributed, host is the wrapper).
		const nodePath = !single && !nodeIsComp ? [htmlIdx] : [];
		partsHtml.push(
			emitNodeHtml(
				node,
				nodePath,
				elementBindings,
				forCalls,
				ifCalls,
				compCalls,
				tryCalls,
				ctx,
				componentName,
				inlinedSubs,
				parentNs,
				cssHash,
			),
		);
		if (!nodeIsComp) htmlIdx++;
	}
	const html = partsHtml.join('');
	// Was every emitted JSX node a component-call (or any non-HTML node that
	// contributes no HTML)? Then there's no template to clone — control-flow /
	// component-slot calls render directly into __block.parentNode using
	// __block.endMarker as the anchor.
	const noTemplate = html === '';

	const bindingsName = `b$${ctx.nextHelperId++}`;
	const mountLines = [];
	// Initialize `_b` as a LOCAL only — commit to `__s.${bindingsName}` at the
	// VERY END of the mount path. If anything thrown mid-mount (e.g. a `use()`
	// call suspending or a child render throwing), the scope's binding bag
	// stays `undefined` and the next attempt re-enters the mount branch from
	// scratch instead of mistakenly hitting the update branch with a half-
	// populated bag (which would crash setText / setAttribute on undefined
	// slot references).
	mountLines.push(`    _b = {};`);

	let elementVars;
	let ensureVar;
	if (!noTemplate) {
		ctx.runtimeNeeded.add('template');
		ctx.runtimeNeeded.add('clone');
		// Template namespace strategy:
		//   - HTML single-root: parse the element directly, no flag.
		//   - HTML multi-root: wrap in <ripple-frag> so template() returns the wrap.
		//   - SVG/MathML single-root: pass ns flag; runtime wraps with <svg>/<math>
		//     so the HTML5 parser places children in foreign content, then returns
		//     the inner root.
		//   - SVG/MathML multi-root: pass ns + frag=1; runtime wraps and returns
		//     the wrap itself (caller drains its children — no <ripple-frag>).
		const isHtmlNs =
			parentNs === 'html' &&
			(single
				? !isNonHtmlRootTag(jsxNodes[0]) // <svg>/<math> as the root means non-HTML ns
				: true);
		const tplNs = isHtmlNs ? 'html' : single ? nsForRootTag(jsxNodes[0], parentNs) : parentNs;
		const flag = nsFlag(tplNs);
		const fragArg = !single && flag !== 0 ? 1 : 0;
		const tplHtml = single || flag !== 0 ? html : `<ripple-frag>${html}</ripple-frag>`;
		const tpl = allocTemplate(ctx, tplHtml, flag, fragArg);
		mountLines.push(`    const _root = clone(${tpl});`);
		elementVars = new Map();
		let varCounter = 0;
		// Does this template contain a control-flow / component / portal hole? If so
		// the server DOM expands each hole into a `<!--[-->…<!--]-->` range that
		// shifts raw sibling paths, so we navigate with the hole-aware `child`/
		// `sibling` helpers (which skip a whole block range as one logical sibling)
		// instead of raw `.firstChild`/`.nextSibling`. Hole-free leaf templates keep
		// the raw walk (faster, and they already hydrate since server == template).
		// `child`/`sibling` are identical to raw access when not hydrating, so the
		// client path is unchanged (and the hydration branch DCE-folds away).
		const hasHoles =
			forCalls.length > 0 ||
			ifCalls.length > 0 ||
			compCalls.length > 0 ||
			tryCalls.length > 0 ||
			ctx._switchCalls.length > 0 ||
			ctx._portalCalls.length > 0;
		if (hasHoles) {
			ctx.runtimeNeeded.add('child');
			ctx.runtimeNeeded.add('sibling');
		}
		ensureVar = (path) => {
			// Top-level position in a multi-root template — the synthetic frag we
			// cloned gets drained on mount, so empty-path callers (top-level
			// control-flow / component slots) need to point at the live parent.
			if (path.length === 0 && !single) {
				return '__block.parentNode';
			}
			const key = path.join(',');
			if (elementVars.has(key)) return elementVars.get(key);
			const v = `_el${varCounter++}`;
			elementVars.set(key, v);
			const walk = hasHoles ? walkExprH('_root', path) : walkExpr('_root', path);
			mountLines.push(`    const ${v} = ${walk};`);
			return v;
		};
	} else {
		// No template — host is __block.parentNode. Stash it once.
		mountLines.push(`    _b._compHost = __block.parentNode;`);
		ensureVar = () => `_b._compHost`;
	}

	// Emit per-binding mount code.
	for (const b of elementBindings) {
		// A sibling-position `{x as string}` text hole resolves to its POSITION node
		// (the `<!>` placeholder / server text node) via the full path INCLUDING the
		// childIndex — so the hole-aware child/sibling walk adopts the correct server
		// node during hydration (raw childNodes[childIndex] would land inside an
		// earlier sibling's `<!--[-->…<!--]-->` range). Everything else resolves to
		// its host element.
		const elVar = b.kind === 'text' ? ensureVar([...b.path, b.childIndex]) : ensureVar(b.path);
		if (b.kind === 'text' || b.kind === 'textOnlyChild') ctx.runtimeNeeded.add('setText');
		if (b.kind === 'text') ctx.runtimeNeeded.add('htextSwap');
		if (b.kind === 'textOnlyChild') ctx.runtimeNeeded.add('htext');
		if (b.kind === 'attr') ctx.runtimeNeeded.add('setAttribute');
		if (b.kind === 'class') {
			if (b.ns && b.ns !== 'html') ctx.runtimeNeeded.add('setAttribute');
			else ctx.runtimeNeeded.add('setClassName');
		}
		if (b.kind === 'style') ctx.runtimeNeeded.add('setStyle');
		if (b.kind === 'formAction') ctx.runtimeNeeded.add('setFormAction');
		if (b.kind === 'spread') {
			ctx.runtimeNeeded.add('setSpread');
			ctx.runtimeNeeded.add('attachRef'); // unmount-detach of a spread-supplied ref
		}
		if (b.kind === 'ref') {
			ctx.runtimeNeeded.add('attachRef');
			ctx.runtimeNeeded.add('queueRefAttach'); // deferred mount attach (commit-phase timing)
		}
		if (b.kind === 'fragmentRef') {
			ctx.runtimeNeeded.add('attachRef');
			ctx.runtimeNeeded.add('mountFragmentRef');
			// Fragment refs need a SECOND template-walked node for the end
			// marker; emitBindingMount expects a single elVar so we resolve
			// the end-marker var here and stash it on the binding for the
			// emit branch to pick up.
			b.endElVar = ensureVar(b.endPath);
		}
		mountLines.push(emitBindingMount(b, elVar));
	}
	for (const fc of forCalls) {
		const elVar = ensureVar(fc.hostPath);
		fc.elVar = elVar;
		mountLines.push(`    _b._for$${fc.id} = ${elVar};`);
		if (fc.anchorPath) {
			const anchorVar = ensureVar(fc.anchorPath);
			fc.anchorVar = anchorVar;
			mountLines.push(`    _b._forAnchor$${fc.id} = ${anchorVar};`);
		}
	}
	for (const ic of ifCalls) {
		const elVar = ensureVar(ic.hostPath);
		ic.elVar = elVar;
		mountLines.push(`    _b._ifHost$${ic.id} = ${elVar};`);
		if (ic.anchorPath) {
			const anchorVar = ensureVar(ic.anchorPath);
			ic.anchorVar = anchorVar;
			mountLines.push(`    _b._ifAnchor$${ic.id} = ${anchorVar};`);
		}
	}
	for (const cc of compCalls) {
		const elVar = ensureVar(cc.hostPath);
		cc.elVar = elVar;
		mountLines.push(`    _b._compHost$${cc.id} = ${elVar};`);
		if (cc.anchorPath) {
			const anchorVar = ensureVar(cc.anchorPath);
			cc.anchorVar = anchorVar;
			mountLines.push(`    _b._compAnchor$${cc.id} = ${anchorVar};`);
		}
	}
	// tryBlock targets.
	for (const tc of tryCalls) {
		const elVar = ensureVar(tc.hostPath);
		tc.elVar = elVar;
		mountLines.push(`    _b._tryHost$${tc.id} = ${elVar};`);
		if (tc.anchorPath) {
			const anchorVar = ensureVar(tc.anchorPath);
			tc.anchorVar = anchorVar;
			mountLines.push(`    _b._tryAnchor$${tc.id} = ${anchorVar};`);
		}
	}
	// switchBlock targets.
	for (const sc of ctx._switchCalls) {
		const elVar = ensureVar(sc.hostPath);
		sc.elVar = elVar;
		mountLines.push(`    _b._switchHost$${sc.id} = ${elVar};`);
		if (sc.anchorPath) {
			const anchorVar = ensureVar(sc.anchorPath);
			sc.anchorVar = anchorVar;
			mountLines.push(`    _b._switchAnchor$${sc.id} = ${anchorVar};`);
		}
	}
	// Portal host targets — element containing the createPortal JSX position.
	// Stashed so the runtime can stamp $$portalParent on the portal's mounted
	// children pointing here, giving React-shape bubble-out semantics.
	for (const pc of ctx._portalCalls) {
		const elVar = ensureVar(pc.hostPath || []);
		pc.elVar = elVar;
		mountLines.push(`    _b._portalHost$${pc.id} = ${elVar};`);
	}

	if (!noTemplate) {
		if (single) {
			mountLines.push(`    __block.parentNode.insertBefore(_root, __block.endMarker);`);
		} else {
			mountLines.push(
				`    while (_root.firstChild) __block.parentNode.insertBefore(_root.firstChild, __block.endMarker);`,
			);
		}
	}
	// Commit the binding bag to the scope LAST — see the matching comment at
	// the `_b = {}` initialization above. Reaching here means every binding
	// and the DOM range have been successfully constructed, so future
	// renders can safely take the update branch keyed on `__s.${bindingsName}`.
	mountLines.push(`    __s.${bindingsName} = _b;`);

	// Update.
	const updateLines = [];
	for (const b of elementBindings) {
		updateLines.push(emitBindingUpdate(b));
	}

	// After (forBlock + ifBlock calls run on every render — they reconcile).
	const afterLines = [];
	for (const fc of forCalls) {
		ctx.runtimeNeeded.add('forBlock');
		// flags: bit 0 = pure (auto-memo), bit 1 = singleRoot (skip per-item markers),
		//        bit 2 = depEligible (runtime compares deps array, upgrades to pure
		//        for survivors when deps unchanged this render).
		const flags = (fc.pure ? 1 : 0) | (fc.singleRoot ? 2 : 0) | (fc.depEligible ? 4 : 0);
		// Arg layout: forBlock(__s, slot, host, items, keyFn, body, extra, flags?, deps?, emptyBody?, anchor?).
		// `emptyHelper` ('null' literal when no `@empty` branch) lands as the
		// trailing arg. We backfill `flags` and `deps` placeholders (`0` and
		// `undefined`) when only the empty branch is present so the runtime sees
		// it at the right position. When the @for has a source-order anchor
		// (because it sits before static siblings in mixed children), we backfill
		// all earlier trailing positions and append the anchor expression last so
		// forBlock's optional `anchor` param lines up positionally.
		const hasAnchor = !!fc.anchorVar;
		const hasEmpty = fc.emptyHelper && fc.emptyHelper !== 'null';
		const flagsPart = flags || hasEmpty || hasAnchor ? ', ' + (flags || 0) : '';
		const depsPart = fc.depEligible
			? `, [${fc.depNames.join(', ')}]`
			: hasEmpty || hasAnchor
				? ', undefined'
				: '';
		const emptyPart = hasEmpty ? `, ${fc.emptyHelper}` : hasAnchor ? ', null' : '';
		const anchorPart = hasAnchor ? `, __s.${bindingsName}._forAnchor$${fc.id}` : '';
		afterLines.push(
			`  forBlock(__s, ${JSON.stringify('_for$' + fc.id)}, __s.${bindingsName}._for$${fc.id}, ${fc.itemsExpr}, ${fc.keyHelper}, ${fc.bodyHelper}, ${fc.extraExpr}${flagsPart}${depsPart}${emptyPart}${anchorPart});`,
		);
	}
	for (const ic of ifCalls) {
		// Anchor selection mirrors componentSlot: with `<!>`-anchored source-order
		// siblings, pass the captured anchor var so the start/end markers land
		// BEFORE it (preserving order). When the host is the body's own parentNode
		// (a control-flow-only body, host var is `_b._compHost`, not an `_el`),
		// pass `__block.endMarker` so the markers stay INSIDE the owning block's
		// range. Otherwise (host is a real template element) omit it (append into
		// the element).
		let anchorArg = '';
		if (ic.anchorVar) anchorArg = `, __s.${bindingsName}._ifAnchor$${ic.id}`;
		else if (ic.elVar && !ic.elVar.startsWith('_el')) anchorArg = ', __block.endMarker';
		if (ic.activity) {
			ctx.runtimeNeeded.add('activityBlock');
			afterLines.push(
				`  activityBlock(__s, ${JSON.stringify('_activity$' + ic.id)}, __s.${bindingsName}._ifHost$${ic.id}, (${ic.modeExpr}), ${ic.thenHelper}${anchorArg});`,
			);
			continue;
		}
		ctx.runtimeNeeded.add('ifBlock');
		const elseArg = ic.elseHelper || 'null';
		afterLines.push(
			`  ifBlock(__s, ${JSON.stringify('_if$' + ic.id)}, __s.${bindingsName}._ifHost$${ic.id}, (${ic.condExpr}), ${ic.thenHelper}, ${elseArg}${anchorArg});`,
		);
	}
	for (const cc of compCalls) {
		// Renderable `{expr}` hole — dispatch the value at runtime (component /
		// element → block; primitive → text; nullish/boolean/'' → nothing). Shares
		// the host/`<!>`-anchor resolution + hole-aware hydration walk with real
		// component calls; only the emitted runtime call differs.
		if (cc.isChild) {
			ctx.runtimeNeeded.add('childSlot');
			let anchorArg;
			if (cc.anchorVar) {
				anchorArg = `, __s.${bindingsName}._compAnchor$${cc.id}`;
			} else {
				const isInsideHost = cc.elVar.startsWith('_el');
				anchorArg = isInsideHost ? '' : ', __block.endMarker';
			}
			afterLines.push(
				`  childSlot(__s, ${JSON.stringify('_child$' + cc.id)}, __s.${bindingsName}._compHost$${cc.id}, ${cc.valueExpr}${anchorArg});`,
			);
			continue;
		}
		// Design (c) lite path: hookless same-module callees with no key/spread/
		// children skip the Block/CompSlot/Comment-markers triplet but STILL pass
		// host + anchor so the callee's body inserts content INSIDE the owning
		// element (not at the parent block's range, which would put a child
		// <span> as a sibling of its parent <div>).
		if (cc.liteEligible) {
			ctx.runtimeNeeded.add('componentSlotLite');
			// Anchor: same rules as componentSlot — anchorVar overrides; otherwise
			// omit when the host is a nested in-template element (the body can
			// safely appendChild), or pass __block.endMarker when the host is the
			// block's own parentNode (so the lite range stays inside the block).
			let anchorArg = '';
			if (cc.anchorVar) {
				anchorArg = `, __s.${bindingsName}._compAnchor$${cc.id}`;
			} else if (!cc.elVar.startsWith('_el')) {
				anchorArg = ', __block.endMarker';
			}
			afterLines.push(
				`  componentSlotLite(__s, ${JSON.stringify('_comp$' + cc.id)}, __s.${bindingsName}._compHost$${cc.id}, ${cc.compExpr}, ${cc.propsExpr}${anchorArg});`,
			);
			continue;
		}
		ctx.runtimeNeeded.add('componentSlot');
		// Anchor selection:
		//   - In mixed children with source-order siblings, we emitted a `<!>`
		//     placeholder at the component's index and stored its el var on
		//     `cc.anchorVar` — pass that so componentSlot inserts BEFORE it.
		//   - When the host is the block's own parentNode (multi-root /
		//     noTemplate cases), pass __block.endMarker so the slot's markers
		//     stay inside the block's range (for-of reorder / tryBlock unmount
		//     move the slot DOM along with the block).
		//   - When the host is a nested element with no in-template anchor,
		//     the slot can safely append (insertBefore ignores foreign anchors).
		let anchorArg;
		if (cc.anchorVar) {
			anchorArg = `, __s.${bindingsName}._compAnchor$${cc.id}`;
		} else {
			const isInsideHost = cc.elVar.startsWith('_el');
			anchorArg = isInsideHost ? '' : ', __block.endMarker';
		}
		// key arg is positional AFTER anchor in componentSlot's signature. When a
		// key is present but anchor isn't, supply `undefined` for the anchor slot
		// so the key lands in the right argument position — the runtime's
		// `anchor ?? null` still routes through appendChild as before.
		let keyArg = '';
		if (cc.keyExpr != null) {
			if (anchorArg === '') anchorArg = ', undefined';
			keyArg = `, (${cc.keyExpr})`;
		}
		// singleRoot is the 8th positional arg (after anchor, key). It's gated on
		// no-key, so backfill anchor + key placeholders to land it in the right slot.
		let singleRootArg = '';
		if (cc.singleRoot) {
			if (anchorArg === '') anchorArg = ', undefined';
			singleRootArg = ', undefined, true';
		}
		afterLines.push(
			`  componentSlot(__s, ${JSON.stringify('_comp$' + cc.id)}, __s.${bindingsName}._compHost$${cc.id}, ${cc.compExpr}, ${cc.propsExpr}${anchorArg}${keyArg}${singleRootArg});`,
		);
	}
	for (const pc of ctx._portalCalls) {
		ctx.runtimeNeeded.add('portal');
		afterLines.push(
			`  portal(__s, ${JSON.stringify('_portal$' + pc.id)}, ${pc.targetExpr}, ${pc.bodyExpr}, ${pc.propsExpr}, __s.${bindingsName}._portalHost$${pc.id});`,
		);
	}
	// Restore the outer plan's portal-call list — pairs with the save above.
	ctx._portalCalls = _prevPortalCalls;
	for (const tc of tryCalls) {
		ctx.runtimeNeeded.add('tryBlock');
		// Anchor selection mirrors componentSlot:
		//   - In mixed children with source-order siblings, we emitted a `<!>`
		//     placeholder at the @try's index and stored its el var on
		//     `tc.anchorVar` — pass that so tryBlock inserts BEFORE it.
		//   - Otherwise omit (runtime treats undefined === appendChild).
		const tryAnchorArg = tc.anchorVar ? `, __s.${bindingsName}._tryAnchor$${tc.id}` : '';
		afterLines.push(
			`  tryBlock(__s, ${JSON.stringify('_try$' + tc.id)}, __s.${bindingsName}._tryHost$${tc.id}, ${tc.tryHelper}, ${tc.catchHelper}, ${tc.pendingHelper}${tryAnchorArg});`,
		);
	}
	for (const sc of ctx._switchCalls) {
		ctx.runtimeNeeded.add('switchBlock');
		// Anchor selection mirrors componentSlot:
		//   - When the @switch had source-order siblings (mixed-children loop
		//     emitted a `<!>` placeholder at its index), pass the stashed
		//     anchor node so switchBlock inserts BEFORE it.
		//   - Otherwise omit the arg; the runtime defaults to appendChild.
		const anchorArg = sc.anchorVar ? `, __s.${bindingsName}._switchAnchor$${sc.id}` : '';
		afterLines.push(
			`  switchBlock(__s, ${JSON.stringify('_switch$' + sc.id)}, __s.${bindingsName}._switchHost$${sc.id}, (${sc.discExpr}), ${sc.casesArrayExpr}, ${sc.defaultHelper}${anchorArg});`,
		);
	}
	// Restore the outer plan's switch-call list — pairs with the save above.
	ctx._switchCalls = _prevSwitchCalls;
	// Restore the outer plan's fragment-ref pairing stack.
	if (ctx._fragRefStack && ctx._fragRefStack.length) {
		throw new Error('Unclosed <Fragment ref={…}> — FragmentStart without matching FragmentEnd');
	}
	ctx._fragRefStack = _prevFragRefStack;

	return {
		bindingsName,
		mount: mountLines.join('\n'),
		update: updateLines.join('\n'),
		after: afterLines.join('\n'),
		head: headEmit,
	};
}

// All `expr` strings get wrapped in `(…)` so ternaries / comma exprs / etc.
// don't break operator precedence in the comparisons or assignments.
function emitBindingMount(b, elVar) {
	const E = `(${b.expr})`;
	switch (b.kind) {
		case 'textOnlyChild': {
			// When the binding's expression is statically string-typed
			// (`knownString`), the runtime can skip the `String(_v)` coercion —
			// `_v` is already a string. Saves a global function call on every
			// mount AND every update. Falsy-check still applied so `null` /
			// `undefined` / `false` render as empty rather than literal text.
			const coerce = b.knownString ? '_v' : 'String(_v)';
			// `htext` creates + appends the text node on a fresh mount (identical to
			// the old inline path), but ADOPTS the server text node when hydrating.
			// Seeding `_prev` to the client value makes the first update a no-op when
			// it matches the server text (no hydration mismatch re-render).
			return `    {
      const _v = ${E};
      _b._txt$${b.id} = htext(${elVar}, _v == null || _v === false ? '' : ${coerce});
      _b._prev$${b.id} = _v;
    }`;
		}
		case 'htmlOnlyChild': {
			const coerce = b.knownString ? '_v' : 'String(_v)';
			return `    {
      const _v = ${E};
      ${elVar}.innerHTML = (_v == null ? '' : ${coerce});
      _b._el$${b.id} = ${elVar};
      _b._prev$${b.id} = _v;
    }`;
		}
		case 'text': {
			// `elVar` is the POSITION node for this sibling text hole (resolved with
			// the hole-aware path INCLUDING childIndex — see the binding loop). On a
			// fresh mount it's the cloned template's `<!>` comment (replaced 1-for-1,
			// position-preserving — works for single AND multi-root, since the path
			// walk starts from `_root`/the cloned fragment). While hydrating it's the
			// SERVER's text node at that logical position, which htextSwap ADOPTS.
			const coerce = b.knownString ? '_v' : 'String(_v)';
			return `    {
      const _v = ${E};
      _b._txt$${b.id} = htextSwap(${elVar}, _v == null || _v === false ? '' : ${coerce});
      _b._prev$${b.id} = _v;
    }`;
		}
		case 'attr': {
			return `    {
      const _v = ${E};
      setAttribute(${elVar}, ${JSON.stringify(b.name)}, _v);
      _b._el$${b.id} = ${elVar};
      _b._prev$${b.id} = _v;
    }`;
		}
		case 'class': {
			// On SVG/MathML hosts the `className` property is read-only — fall back
			// to setAttribute. Compile-time choice, zero runtime branching.
			const setter =
				b.ns && b.ns !== 'html'
					? `setAttribute(${elVar}, "class", _v)`
					: `setClassName(${elVar}, _v)`;
			return `    {
      const _v = ${E};
      ${setter};
      _b._el$${b.id} = ${elVar};
      _b._prev$${b.id} = _v;
    }`;
		}
		case 'style': {
			return `    {
      const _v = ${E};
      setStyle(${elVar}, _v, undefined);
      _b._el$${b.id} = ${elVar};
      _b._sty$${b.id} = _v;
    }`;
		}
		case 'spread': {
			// Detach a spread-supplied `ref` on unmount. setSpread attaches/updates
			// the ref during mount/update, but only a scope cleanup can detach it
			// when the element unmounts — read the final spread value's ref and run
			// its React-19 cleanup-return (or null) via attachRef.
			return `    {
      const _v = ${E};
      setSpread(${elVar}, _v, undefined, __s);
      _b._el$${b.id} = ${elVar};
      _b._sp$${b.id} = _v;
      __s.cleanups.push(() => { const _sp = _b._sp$${b.id}; if (_sp != null && _sp.ref != null) attachRef(_sp.ref, null); });
    }`;
		}
		case 'event': {
			return `    _b._el$${b.id} = ${elVar};
    ${elVar}.$$${b.eventName} = (${b.expr});`;
		}
		case 'formAction': {
			// <form action={fn}> / <button formAction={fn}>: wire the submit handler
			// (or fall back to the native attribute for string values). Diffed by
			// function identity on update.
			return `    {
      const _v = ${E};
      setFormAction(${elVar}, ${JSON.stringify(b.name)}, _v, undefined);
      _b._el$${b.id} = ${elVar};
      _b._prev$${b.id} = _v;
    }`;
		}
		case 'event-bundle': {
			// Build a `{ fn, args }` bundle and stash fn + each arg in slots so the
			// update path can identity-diff and skip the reassignment on no-op.
			const argSlots = b.argExprs.map((_e, i) => `_b._a$${b.id}$${i}`);
			const argInit = b.argExprs.map((e, i) => `_b._a$${b.id}$${i} = (${e});`).join(' ');
			return `    {
      _b._el$${b.id} = ${elVar};
      _b._fn$${b.id} = (${b.fnExpr});
      ${argInit}
      ${elVar}.$$${b.eventName} = { fn: _b._fn$${b.id}, args: [${argSlots.join(', ')}] };
    }`;
		}
		case 'ref': {
			// attachRef handles all three supported shapes: callback (function),
			// object (set .current), and array (recursively attach each). Register
			// a scope cleanup so unmount detaches with null (React parity).
			// The attach is DEFERRED via queueRefAttach so it runs at commit, after
			// the subtree is inserted into the document — a callback ref then sees a
			// connected node and ref.current is set before layout effects run
			// (React-19 commit-phase ref timing). Detach stays synchronous on unmount.
			return `    {
      const _r = (${b.expr});
      _b._ref$${b.id} = _r;
      _b._el$${b.id} = ${elVar};
      queueRefAttach(__s, () => attachRef(_r, _b._el$${b.id}));
      __s.cleanups.push(() => attachRef(_b._ref$${b.id}, null));
    }`;
		}
		case 'fragmentRef': {
			// <Fragment ref={r}>…</Fragment> — markers are two Comment nodes
			// emitted directly into the parent template HTML (<!--frag--> /
			// <!--/frag-->), already walked into elVar (start) and b.endElVar
			// (end). mountFragmentRef builds the FragmentInstance, attaches
			// the user's ref, and registers a single cleanup that detaches
			// the ref + destroys the instance on unmount.
			return `    {
      const _r = (${b.expr});
      _b._fi$${b.id} = mountFragmentRef(__s, ${elVar}, ${b.endElVar}, _r);
    }`;
		}
	}
	return '';
}

function emitBindingUpdate(b) {
	const E = `(${b.expr})`;
	switch (b.kind) {
		case 'textOnlyChild':
		case 'text': {
			return `    { const _v = ${E}; if (_b._prev$${b.id} !== _v) { setText(_b._txt$${b.id}, _v); _b._prev$${b.id} = _v; } }`;
		}
		case 'htmlOnlyChild': {
			const coerce = b.knownString ? '_v' : 'String(_v)';
			return `    { const _v = ${E}; if (_b._prev$${b.id} !== _v) { _b._el$${b.id}.innerHTML = (_v == null ? '' : ${coerce}); _b._prev$${b.id} = _v; } }`;
		}
		case 'attr': {
			return `    { const _v = ${E}; if (_b._prev$${b.id} !== _v) { setAttribute(_b._el$${b.id}, ${JSON.stringify(b.name)}, _v); _b._prev$${b.id} = _v; } }`;
		}
		case 'class': {
			const setter =
				b.ns && b.ns !== 'html'
					? `setAttribute(_b._el$${b.id}, "class", _v)`
					: `setClassName(_b._el$${b.id}, _v)`;
			return `    { const _v = ${E}; if (_b._prev$${b.id} !== _v) { ${setter}; _b._prev$${b.id} = _v; } }`;
		}
		case 'style': {
			// Object styles need per-prop diffing — call setStyle even when the
			// reference is unchanged it'd just no-op via the internal diff. We DO
			// skip identity matches to avoid the call overhead.
			return `    { const _v = ${E}; if (_b._sty$${b.id} !== _v) { setStyle(_b._el$${b.id}, _v, _b._sty$${b.id}); _b._sty$${b.id} = _v; } }`;
		}
		case 'spread': {
			// setSpread does its own per-key diffing internally and handles cleanup
			// of keys that vanished — always call it, but skip if the reference is
			// identical (the user opted-in to a stable object).
			return `    { const _v = ${E}; if (_b._sp$${b.id} !== _v) { setSpread(_b._el$${b.id}, _v, _b._sp$${b.id}); _b._sp$${b.id} = _v; } }`;
		}
		case 'event': {
			return `    _b._el$${b.id}.$$${b.eventName} = (${b.expr});`;
		}
		case 'formAction': {
			return `    { const _v = ${E}; if (_b._prev$${b.id} !== _v) { setFormAction(_b._el$${b.id}, ${JSON.stringify(b.name)}, _v, _b._prev$${b.id}); _b._prev$${b.id} = _v; } }`;
		}
		case 'event-bundle': {
			// Diff fn + each arg against the per-slot cache. Only rebuild + assign
			// the bundle when something actually changed — keyed-list survivors with
			// unchanged item refs skip everything.
			const fnVar = `_fn`,
				argVars = b.argExprs.map((_e, i) => `_a${i}`);
			const reads =
				`const ${fnVar} = (${b.fnExpr}); ` +
				b.argExprs.map((e, i) => `const ${argVars[i]} = (${e});`).join(' ');
			const cmps = [`_b._fn$${b.id} !== ${fnVar}`]
				.concat(b.argExprs.map((_e, i) => `_b._a$${b.id}$${i} !== ${argVars[i]}`))
				.join(' || ');
			const writes = [`_b._fn$${b.id} = ${fnVar};`]
				.concat(b.argExprs.map((_e, i) => `_b._a$${b.id}$${i} = ${argVars[i]};`))
				.concat([
					`_b._el$${b.id}.$$${b.eventName} = { fn: ${fnVar}, args: [${argVars.join(', ')}] };`,
				])
				.join(' ');
			return `    { ${reads} if (${cmps}) { ${writes} } }`;
		}
		case 'ref': {
			// Ref expression identity may change across renders. React 19: detach
			// the PRIOR ref fully before attaching the new one — for an object ref
			// that clears `.current`; for a callback ref that runs its returned
			// cleanup (or calls it with null). The old code skipped detaching
			// function refs (`typeof _old !== 'function'`), so a callback ref's
			// identity change (or replacement by null) never ran its cleanup and
			// orphaned it — a React-19 divergence and a leak. Detach old uniformly;
			// attachRef routes functions/objects/arrays to the right detach path.
			// The outer `_r !== _b._ref$` guard already prevents re-firing a stable
			// ref, so this never double-invokes an unchanged callback ref.
			return `    {
      const _r = (${b.expr});
      if (_r !== _b._ref$${b.id}) {
        const _old = _b._ref$${b.id};
        if (_old != null) attachRef(_old, null);
        attachRef(_r, _b._el$${b.id});
        _b._ref$${b.id} = _r;
      }
    }`;
		}
		case 'fragmentRef': {
			// A changing `<Fragment ref={…}>` expression must detach the old ref and
			// re-point the new one at the SAME (persistent) FragmentInstance. The
			// instance is already mounted + connected, so attach inline. _currentRef
			// (read by the mount cleanup) is updated so unmount detaches the new ref.
			return `    {
      const _r = (${b.expr});
      const _fi = _b._fi$${b.id};
      if (_fi && _r !== _fi._currentRef) {
        attachRef(_fi._currentRef, null);
        attachRef(_r, _fi);
        _fi._currentRef = _r;
      }
    }`;
		}
	}
	return '';
}

// ===========================================================================
// HTML emission
// ===========================================================================

function emitNodeHtml(
	node,
	path,
	bindings,
	forCalls,
	ifCalls,
	compCalls,
	tryCalls,
	ctx,
	componentName,
	inlinedSubs,
	parentNs = 'html',
	cssHash = null,
) {
	if (node.type === 'Text') {
		if (isKnownStringExpression(node.expression)) {
			bindings.push({
				id: bindings.length,
				kind: 'text',
				expr: printExpr(resolveStyleExpr(node.expression, cssHash)),
				knownString: true,
				path: path.slice(0, -1),
				childIndex: path[path.length - 1],
			});
			return '<!>';
		}
		// Bare `{expr}` (no string cast) → RENDERABLE hole at a top-level / multi-
		// root position. Host is the parent (the dropped last path segment), anchor
		// is this node's `<!>` slot.
		const ch = makeChildCall(node.expression, ctx, cssHash);
		ch.hostPath = path.slice(0, -1);
		ch.anchorPath = path;
		compCalls.push(ch);
		return '<!>';
	}
	// Top-level <Fragment ref={…}> — the wrapping <ripple-frag> (multi-root)
	// is the parent in this scope, so the marker pair lives at the supplied
	// path. Pairing uses ctx._fragRefStack, saved/restored by planJsx so
	// nested plans never share state.
	if (node.type === 'FragmentStart') {
		const b = {
			id: bindings.length,
			kind: 'fragmentRef',
			expr: printExprWithTsrx(node.refExpr, ctx, componentName, inlinedSubs),
			path,
			endPath: null,
		};
		bindings.push(b);
		(ctx._fragRefStack ??= []).push(b);
		return '<!--frag-->';
	}
	if (node.type === 'FragmentEnd') {
		const b = (ctx._fragRefStack ??= []).pop();
		if (!b) throw new Error('FragmentEnd without matching FragmentStart');
		b.endPath = path;
		return '<!--/frag-->';
	}
	if (node.type === 'Element')
		return emitElementHtml(
			node,
			path,
			bindings,
			forCalls,
			ifCalls,
			compCalls,
			tryCalls,
			ctx,
			componentName,
			inlinedSubs,
			parentNs,
			cssHash,
		);
	if (node.type === 'Literal' && typeof node.value === 'string') return escapeHtml(node.value);
	// Top-level control-flow — register as a call hosted on the body's parent.
	if (node.type === 'IfStatement') {
		const ic = makeIfCall(node, ctx, componentName, inlinedSubs, parentNs, cssHash);
		ic.hostPath = [];
		ifCalls.push(ic);
		return '';
	}
	if (node.type === 'ActivityStatement') {
		const ic = makeActivityCall(node, ctx, componentName, inlinedSubs, parentNs, cssHash);
		ic.hostPath = [];
		ifCalls.push(ic);
		return '';
	}
	if (node.type === 'ForOfStatement') {
		const fc = makeForCall(node, ctx, componentName, inlinedSubs, parentNs, cssHash);
		fc.hostPath = [];
		forCalls.push(fc);
		return '';
	}
	if (node.type === 'TryStatement') {
		const tc = makeTryCall(node, ctx, componentName, inlinedSubs, parentNs, cssHash);
		tc.hostPath = [];
		tryCalls.push(tc);
		return '';
	}
	if (node.type === 'SwitchStatement') {
		const sc = makeSwitchCall(node, ctx, componentName, inlinedSubs, parentNs, cssHash);
		sc.hostPath = [];
		ctx._switchCalls.push(sc);
		return '';
	}
	return '';
}

function emitElementHtml(
	node,
	path,
	bindings,
	forCalls,
	ifCalls,
	compCalls,
	tryCalls,
	ctx,
	componentName,
	inlinedSubs,
	parentNs = 'html',
	cssHash = null,
) {
	// If the tag is a component (uppercase ident or MemberExpression), don't emit
	// HTML — register a componentSlot call instead. Components don't change
	// template namespace context; their bodies are compiled separately.
	if (isComponentTag(node)) {
		const cc = makeCompCall(
			node,
			ctx,
			componentName,
			inlinedSubs,
			bindings,
			forCalls,
			ifCalls,
			compCalls,
			parentNs,
			cssHash,
		);
		cc.hostPath = path;
		compCalls.push(cc);
		return ''; // no HTML
	}

	const tag = node.id?.name || node.openingElement?.name?.name;
	if (!tag) throw new Error('Element without tag');

	// The host element's own namespace (e.g. `<svg>` is in SVG ns even if its
	// parent context is HTML); its descendants' inherited ns may differ
	// (`<foreignObject>` is SVG-ns but its children are HTML).
	const hostNs = nsForSelf(tag, parentNs);
	const childNs = nsForChildren(tag, parentNs);

	// Collect attributes.
	const attrs = node.attributes || node.openingElement?.attributes || [];
	// React convention: later attributes win on collision. If ANY spread is
	// present, attributes that come AFTER the first spread can't be inlined
	// into the template HTML (the spread would clobber them at runtime) —
	// emit them as bindings in source order instead.
	const firstSpreadIdx = attrs.findIndex(
		(a) => a.type === 'SpreadAttribute' || a.type === 'JSXSpreadAttribute',
	);
	let attrHtml = '';
	let sawRef = false;
	for (let attrI = 0; attrI < attrs.length; attrI++) {
		const attr = attrs[attrI];
		// `<div {...props}/>` — runtime spread. Emits one setSpread binding that
		// routes each key (class / style / on… / attr / ref) and diffs against
		// the prior spread object to clear removed keys.
		if (attr.type === 'SpreadAttribute' || attr.type === 'JSXSpreadAttribute') {
			const expr = printExprWithTsrx(attr.argument, ctx, componentName, inlinedSubs);
			bindings.push({ id: bindings.length, kind: 'spread', expr, path, ns: hostNs });
			continue;
		}
		if (attr.type !== 'Attribute' && attr.type !== 'JSXAttribute') continue;
		// Namespaced attribute names (`xlink:href`) — parser gives us a
		// JSXNamespacedName { namespace, name } pair. Concatenate so the runtime
		// sets the literal `xlink:href` attribute (the browser knows the ns).
		let rawAttrName;
		if (
			attr.name &&
			(attr.name.type === 'JSXNamespacedName' || attr.name.type === 'NamespacedName')
		) {
			rawAttrName = `${attr.name.namespace.name}:${attr.name.name.name}`;
		} else {
			rawAttrName = attr.name.name || attr.name;
		}
		// `key` on a regular element:
		//   - inside @for: consumed by the keyFn (keyed reconciliation drives
		//     this).
		//   - on a standalone component: extracted in makeCompCall and threaded
		//     into componentSlot for key-driven remount (React parity).
		//   - on a regular DOM element ELSEWHERE: silent no-op. DOM elements
		//     have no hook state, no scope, and no refs that aren't already
		//     handled by the binding update path. Re-cloning the template would
		//     be strictly more work than the in-place diff. To force a
		//     teardown+remount, wrap the element in a 1-line fn component and
		//     put `key=` on that — the component slot will honour the key.
		if (rawAttrName === 'key') continue;
		// `className` is React-shape JSX; emit `class` in HTML so the browser
		// actually applies it (and dynamic bindings also know which kind to pick).
		const attrName = rawAttrName === 'className' ? 'class' : rawAttrName;

		const val = attr.value;
		// If this attr comes AFTER a spread, we MUST emit as a binding (later wins).
		const isAfterSpread = firstSpreadIdx !== -1 && attrI > firstSpreadIdx;

		// Attribute-level `ref={expr}` (new TSRX) — replaces the removed
		// `{ref expr}` child intrinsic. Routes to the existing `kind: 'ref'`
		// binding emit, which handles both object refs ({ current } pattern)
		// and callback refs ((el) => …). The array form `ref={[a, b]}` is
		// the canonical way to attach multiple refs to the same element —
		// attachRef in the runtime iterates the array. Repeating `ref=` on
		// the same element is rejected here: it's an authoring footgun
		// (which ref wins? do both attach? in what order?) and the array
		// form expresses the same intent unambiguously.
		if (attrName === 'ref' && val) {
			if (sawRef) {
				throw new Error(
					'Element has multiple `ref={…}` attributes; an element may have ' +
						'at most one. Use a single array-valued ref to attach multiple, ' +
						'e.g. `ref={[a, b]}` (attachRef in the runtime iterates the array).',
				);
			}
			sawRef = true;
			const refInner = val.type === 'JSXExpressionContainer' ? val.expression : val;
			bindings.push({
				id: bindings.length,
				kind: 'ref',
				expr: printExpr(refInner),
				path,
			});
			continue;
		}
		// Attribute-level `innerHTML={expr}` (new TSRX) — replaces the removed
		// `{html expr}` child intrinsic. When the element has no other children
		// (and no spread that could clobber it), take the existing htmlOnlyChild
		// fast path. Otherwise fall back to a regular `attr` binding via the
		// property assignment path.
		if (attrName === 'innerHTML' && val) {
			const inner2 = val.type === 'JSXExpressionContainer' ? val.expression : val;
			const noChildren =
				(node.children || []).length === 0 || normalizeChildren(node.children || []).length === 0;
			if (noChildren && !isAfterSpread) {
				bindings.push({
					id: bindings.length,
					kind: 'htmlOnlyChild',
					expr: printExpr(inner2),
					path,
				});
				continue;
			}
			// Element has other children too — emit as plain attr (setAttribute will
			// route through the property fallback at runtime).
			bindings.push({
				id: bindings.length,
				kind: 'attr',
				name: 'innerHTML',
				expr: printExprWithTsrx(inner2, ctx, componentName, inlinedSubs),
				path,
				ns: hostNs,
			});
			continue;
		}

		if (val == null) {
			if (isAfterSpread) {
				// Boolean attr after spread → emit as `true` binding.
				bindings.push({
					id: bindings.length,
					kind: 'attr',
					name: attrName,
					expr: 'true',
					path,
					ns: hostNs,
				});
			} else {
				attrHtml += ` ${attrName}`;
			}
			continue;
		}
		let inner = val.type === 'JSXExpressionContainer' ? val.expression : val;
		// `{style 'cls'}` in attribute position — resolve to a class string
		// (literal or runtime concat) before any further handling.
		inner = resolveStyleExpr(inner, cssHash);

		// `style={...}` — static literal object/string serialises into the HTML
		// template (unless we're after a spread, which would clobber it); dynamic
		// values become a setStyle binding.
		if (attrName === 'style') {
			if (!isAfterSpread && inner.type === 'Literal' && typeof inner.value === 'string') {
				attrHtml += ` style="${escapeAttr(inner.value)}"`;
				continue;
			}
			if (!isAfterSpread && inner.type === 'ObjectExpression' && objectExprIsStaticLiteral(inner)) {
				const css = staticObjectToCssString(inner);
				if (css) attrHtml += ` style="${escapeAttr(css)}"`;
				continue;
			}
			const expr = printExprWithTsrx(inner, ctx, componentName, inlinedSubs);
			bindings.push({ id: bindings.length, kind: 'style', expr, path, ns: hostNs });
			continue;
		}

		// Static literal value? Inline into HTML — UNLESS we're after a spread,
		// in which case we MUST emit as a binding so source order is preserved.
		if (inner.type === 'Literal' && !isAfterSpread) {
			if (typeof inner.value === 'string') {
				attrHtml += ` ${attrName}="${escapeAttr(inner.value)}"`;
			} else if (typeof inner.value === 'number') {
				attrHtml += ` ${attrName}="${inner.value}"`;
			} else if (inner.value === true) {
				attrHtml += ` ${attrName}`;
			}
			continue;
		}

		// Dynamic value — record a binding. (Also reached for literal values that
		// come after a spread, since those need to win over the spread at runtime.)
		const expr = printExprWithTsrx(inner, ctx, componentName, inlinedSubs);
		if (attrName.length > 2 && attrName.startsWith('on') && /^[A-Z]/.test(attrName[2])) {
			const eventName = attrName.slice(2).toLowerCase();
			ctx.delegatedEvents.add(eventName);
			// Hot-path optimisation: `() => fn(arg, …)` arrows with zero params get
			// compiled to a `{ fn, args }` bundle so the runtime can identity-diff
			// fn + each arg and skip the property reassignment when nothing
			// changed. Huge win for keyed-list survivors whose item refs are
			// unchanged (e.g. js-framework-benchmark swap rows).
			const bundleInfo = detectStableEventBundle(inner);
			if (bundleInfo) {
				bindings.push({
					id: bindings.length,
					kind: 'event-bundle',
					path,
					eventName,
					ns: hostNs,
					fnExpr: printExprWithTsrx(bundleInfo.callee, ctx, componentName, inlinedSubs),
					argExprs: bundleInfo.args.map((a) =>
						printExprWithTsrx(a, ctx, componentName, inlinedSubs),
					),
				});
			} else {
				bindings.push({ id: bindings.length, kind: 'event', expr, path, eventName, ns: hostNs });
			}
		} else if (attrName === 'class' || attrName === 'className') {
			bindings.push({ id: bindings.length, kind: 'class', expr, path, ns: hostNs });
		} else if (
			(tag === 'form' && attrName === 'action') ||
			((tag === 'button' || tag === 'input') &&
				(attrName === 'formAction' || attrName === 'formaction'))
		) {
			// React 19 function action: a DYNAMIC `<form action={fn}>` /
			// `<button formAction={fn}>` is routed to setFormAction, which intercepts
			// submit and calls the function with FormData (string values fall back to
			// the native attribute at runtime). Static string actions were already
			// inlined into the HTML above via the literal path.
			bindings.push({
				id: bindings.length,
				kind: 'formAction',
				name: tag === 'form' ? 'action' : 'formaction',
				expr,
				path,
				ns: hostNs,
			});
		} else {
			bindings.push({ id: bindings.length, kind: 'attr', name: attrName, expr, path, ns: hostNs });
		}
	}

	const isVoid = VOID_ELEMENTS.has(tag) && (node.children || []).length === 0;
	if (isVoid) {
		return `<${tag}${attrHtml}/>`;
	}

	let html = `<${tag}${attrHtml}>`;

	const children = normalizeChildren(node.children || []);
	// Special case: a single Text child (only-child text fast path).
	if (children.length === 1 && children[0].type === 'Text') {
		const txtChild = children[0];
		const staticLit = staticTextLiteral(txtChild.expression);
		if (staticLit !== null) {
			// Static string-literal text (JSXText or `{'literal'}`) bakes directly
			// into the template HTML — no `htext` mount, no `setText` binding, and a
			// byte-for-byte match with the server's `<el>text</el>` so hydration
			// adopts it for free. (Sole child → no sibling childIndex / text-node
			// merge concerns; mirrors the server `Literal` fast path.)
			html += escapeHtml(staticLit);
		} else if (isKnownStringExpression(txtChild.expression)) {
			bindings.push({
				id: bindings.length,
				kind: 'textOnlyChild',
				expr: printExpr(resolveStyleExpr(txtChild.expression, cssHash)),
				knownString: true,
				path,
			});
			// The element stays empty in the template — runtime appends a Text node.
		} else {
			// Bare `{expr}` (no string cast) → RENDERABLE hole: render a component /
			// element / children-fn, coerce a primitive to text, render nothing for
			// nullish/boolean. A `<!>` anchor at child index 0 lets childSlot adopt
			// the server's `<!--[-->…<!--]-->` range on hydration.
			const ch = makeChildCall(txtChild.expression, ctx, cssHash);
			ch.hostPath = path;
			ch.anchorPath = [...path, 0];
			compCalls.push(ch);
			html += '<!>';
		}
	} else if (children.length === 1 && children[0].type === 'Html') {
		// `{html expr}` as the only child — set the element's innerHTML directly.
		// Empty template; runtime injects the HTML on mount and diff-replaces on update.
		bindings.push({
			id: bindings.length,
			kind: 'htmlOnlyChild',
			expr: printExpr(children[0].expression),
			path,
		});
	} else {
		// Mixed children — walk them in order.
		let childIdx = 0;
		// Whether the PREVIOUS emitted child was a baked static-text literal. Two
		// adjacent baked text nodes would collapse into a single DOM text node
		// (the HTML parser merges them), throwing off `childIndex` counting for
		// later siblings — so a static text adjacent to another baked text falls
		// back to a `<!>` binding instead. Comments (`<!>`, `<!--frag-->`) and
		// elements between two texts prevent the merge, so this only trips on
		// genuinely consecutive literals (`{'a'}{'b'}`).
		let prevBakedText = false;
		// Stack of in-flight fragmentRef bindings: each FragmentStart pushes a
		// binding (path captured); the matching FragmentEnd pops and patches in
		// the endPath. Stacked so nested <Fragment ref={…}> pairs cleanly.
		const fragRefStack = [];
		// When EVERY child is a component, each can APPEND to the host in source
		// order instead of inserting before its own `<!>` placeholder — there's no
		// static/template sibling to sit in front of, so appending lands them right
		// (componentSlot/Lite with no anchor → appendChild). Restricted to the
		// all-component case so hydration's adopt cursor can simply descend into the
		// host's child stream (host.firstChild); mixed static+component children keep
		// their placeholders, where the cursor would otherwise mis-track.
		let allComponentChildren = children.length > 0;
		for (const c of children) {
			if (!(c.type === 'Element' && isComponentTag(c))) {
				allComponentChildren = false;
				break;
			}
		}
		for (const child of children) {
			const prevBaked = prevBakedText;
			prevBakedText = false;
			if (child.type === 'FragmentStart') {
				const b = {
					id: bindings.length,
					kind: 'fragmentRef',
					expr: printExprWithTsrx(child.refExpr, ctx, componentName, inlinedSubs),
					path: [...path, childIdx],
					endPath: null,
				};
				bindings.push(b);
				fragRefStack.push(b);
				html += '<!--frag-->';
				childIdx++;
				continue;
			}
			if (child.type === 'FragmentEnd') {
				const b = fragRefStack.pop();
				if (!b) throw new Error('FragmentEnd without matching FragmentStart');
				b.endPath = [...path, childIdx];
				html += '<!--/frag-->';
				childIdx++;
				continue;
			}
			if (child.type === 'Text') {
				const staticLit = staticTextLiteral(child.expression);
				if (staticLit !== null && !prevBaked) {
					// Static literal with no baked-text neighbour → bake into the
					// template HTML (no binding), occupying one childNode slot just like
					// the `<!>` it replaces, so sibling `childIndex`es are unchanged.
					html += escapeHtml(staticLit);
					prevBakedText = true;
					childIdx++;
				} else if (isKnownStringExpression(child.expression)) {
					bindings.push({
						id: bindings.length,
						kind: 'text',
						expr: printExpr(resolveStyleExpr(child.expression, cssHash)),
						knownString: true,
						path,
						childIndex: childIdx,
					});
					html += '<!>'; // placeholder we'll replace at mount
					childIdx++;
				} else {
					// Bare `{expr}` (no string cast) → RENDERABLE hole (component /
					// element / children-fn render; primitive → text; nullish/boolean →
					// nothing). Same `<!>` anchor + host as a component child.
					const ch = makeChildCall(child.expression, ctx, cssHash);
					ch.hostPath = path;
					ch.anchorPath = [...path, childIdx];
					compCalls.push(ch);
					html += '<!>';
					childIdx++;
				}
			} else if (child.type === 'Element') {
				if (isComponentTag(child)) {
					const cc = makeCompCall(
						child,
						ctx,
						componentName,
						inlinedSubs,
						bindings,
						forCalls,
						ifCalls,
						compCalls,
						childNs,
						cssHash,
					);
					cc.hostPath = path;
					if (allComponentChildren) {
						// All-component children: append to the host in source order (no
						// `<!>` placeholder, no anchor). Hydration adopts from the cursor
						// descending into the host (see componentSlot/Lite).
						compCalls.push(cc);
					} else {
						// Emit a `<!>` anchor at the component's source-order position so
						// componentSlot inserts BEFORE this anchor — preserving sibling
						// order when a Component appears before static-element/text
						// siblings. Without this, the slot's start/end markers get
						// appended to the parent host AFTER the static template content.
						cc.anchorPath = [...path, childIdx];
						compCalls.push(cc);
						html += '<!>';
						childIdx++;
					}
				} else {
					html += emitElementHtml(
						child,
						[...path, childIdx],
						bindings,
						forCalls,
						ifCalls,
						compCalls,
						tryCalls,
						ctx,
						componentName,
						inlinedSubs,
						childNs,
						cssHash,
					);
					childIdx++;
				}
			} else if (child.type === 'ForOfStatement') {
				const forCall = makeForCall(child, ctx, componentName, inlinedSubs, childNs, cssHash);
				forCall.hostPath = path;
				// Emit a `<!>` anchor at the @for's source-order position so forBlock
				// inserts its start/end markers BEFORE this anchor — preserving sibling
				// order when an @for appears before static-element/text siblings.
				// Without this, the slot's markers get appended to the parent host
				// AFTER the static template content (same bug pattern as componentSlot).
				forCall.anchorPath = [...path, childIdx];
				forCalls.push(forCall);
				html += '<!>';
				childIdx++;
			} else if (child.type === 'IfStatement') {
				const ifCall = makeIfCall(child, ctx, componentName, inlinedSubs, childNs, cssHash);
				ifCall.hostPath = path;
				// Emit a `<!>` anchor at the if-block's source-order position so
				// ifBlock inserts its start/end markers BEFORE this anchor —
				// preserving sibling order when the @if appears before static
				// element/text siblings. Without this, the slot's markers get
				// appended to the parent host AFTER the static template content
				// and the branch content renders in reverse order.
				ifCall.anchorPath = [...path, childIdx];
				ifCalls.push(ifCall);
				html += '<!>';
				childIdx++;
			} else if (child.type === 'ActivityStatement') {
				const ac = makeActivityCall(child, ctx, componentName, inlinedSubs, childNs, cssHash);
				ac.hostPath = path;
				// `<!>` anchor so activityBlock's markers insert before later siblings
				// (same sibling-order reasoning as @if above).
				ac.anchorPath = [...path, childIdx];
				ifCalls.push(ac);
				html += '<!>';
				childIdx++;
			} else if (child.type === 'TryStatement') {
				const tc = makeTryCall(child, ctx, componentName, inlinedSubs, childNs, cssHash);
				tc.hostPath = path;
				// Emit a `<!>` anchor at the tryBlock's source-order position so
				// tryBlock inserts BEFORE this anchor — preserving sibling order
				// when an @try appears before static-element/text siblings. Without
				// this, the slot's start/end markers get appended to the parent
				// host AFTER the static template content. Mirrors componentSlot.
				tc.anchorPath = [...path, childIdx];
				tryCalls.push(tc);
				html += '<!>';
				childIdx++;
			} else if (child.type === 'SwitchStatement') {
				const sc = makeSwitchCall(child, ctx, componentName, inlinedSubs, childNs, cssHash);
				sc.hostPath = path;
				// Emit a `<!>` anchor at the switch's source-order position so
				// switchBlock inserts BEFORE this anchor — preserving sibling
				// order when an @switch appears before static-element/text
				// siblings. Without this, the slot's start/end markers get
				// appended to the parent host AFTER the static template content.
				sc.anchorPath = [...path, childIdx];
				ctx._switchCalls.push(sc);
				html += '<!>';
				childIdx++;
			} else if (child.type === 'Style') {
				// `{style 'cls'}` at child position — resolve to a class-name string
				// and emit as a text hole. Useful for passing scoped class names down
				// through render-prop boundaries.
				bindings.push({
					id: bindings.length,
					kind: 'text',
					expr: printExpr(resolveStyleExpr(child, cssHash)),
					// `{style 'cls'}` resolves to a String class name at compile time.
					knownString: true,
					path,
					childIndex: childIdx,
				});
				html += '<!>';
				childIdx++;
			} else if (child.type === 'Html') {
				// `{html expr}` mixed with sibling children isn't supported — wrap the
				// expression in a dedicated parent (e.g. `<span>{html ...}</span>`)
				// and the only-child fast path will set innerHTML on the wrapper.
				throw new Error(
					'{html expr} must be the ONLY child of its parent element. ' +
						'Wrap it in a dedicated element like <span>{html expr}</span>.',
				);
			} else if (child.type === 'TSRXExpression') {
				// {expr} at JSX child position. Recognised forms:
				//   - `{ref refExpr}` → ref-attach binding on the host element
				//   - `{createPortal(BODY, TARGET, PROPS?)}` → portal() call
				//   - `{cond ? <JSX/> : <JSX/>}` → lowered to ifBlock (so the branches
				//      mount real DOM, not stringified text)
				//   - `{items.map(x => <JSX/>)}` → compile error, point to for-of
				//   - anything else → emit as a text hole (runtime stringifies)
				const expr = child.expression;
				if (expr && expr.type === 'RefExpression') {
					bindings.push({
						id: bindings.length,
						kind: 'ref',
						expr: printExpr(expr.argument),
						path,
					});
				} else if (isCreatePortalCall(expr)) {
					const pc = makePortalCall(expr, ctx, componentName, inlinedSubs);
					// Stash the JSX-tree host (the element containing this createPortal
					// call) so the runtime can stamp $$portalParent on portal children
					// pointing back at it. That makes events bubble OUT of the portal
					// up through this element — matching React's per-fiber portal walk.
					pc.hostPath = path;
					(ctx._portalCalls ??= []).push(pc);
				} else if (isConditionalJsx(expr)) {
					// Lower `{cond ? A : B}` (where A or B is JSX) to an IfStatement so
					// each branch renders real DOM via the existing ifBlock machinery.
					const asIf = {
						type: 'IfStatement',
						test: expr.test,
						consequent: wrapAsBlockStmt(expr.consequent),
						alternate: wrapAsBlockStmt(expr.alternate),
					};
					const ic = makeIfCall(asIf, ctx, componentName, inlinedSubs, childNs, cssHash);
					ic.hostPath = path;
					ifCalls.push(ic);
				} else if (isJsxReturningMapCall(expr)) {
					throw new Error(
						"`.map()` returning JSX at child position isn't supported in TSRX. " +
							'Use a for-of loop instead — it gives you keyed reconciliation:\n\n' +
							'  for (const item of items; key item.id) {\n' +
							'    <li>{text item.name}</li>\n' +
							'  }',
					);
				} else if (isKnownStringExpression(expr)) {
					bindings.push({
						id: bindings.length,
						kind: 'text',
						expr: printExprWithTsrx(
							resolveStyleExpr(expr, cssHash),
							ctx,
							componentName,
							inlinedSubs,
						),
						knownString: true,
						path,
						childIndex: childIdx,
					});
					html += '<!>';
					childIdx++;
				} else {
					// Bare `{expr}` (no string cast) → RENDERABLE hole. Uses the TSRX-aware
					// printer for the value (sub-template arrows etc.), then rides the
					// childSlot path like the simpler Text branch.
					const ch = {
						id: ctx.nextHelperId++,
						isChild: true,
						valueExpr: printExprWithTsrx(
							resolveStyleExpr(expr, cssHash),
							ctx,
							componentName,
							inlinedSubs,
						),
						hostPath: path,
						anchorPath: [...path, childIdx],
					};
					compCalls.push(ch);
					html += '<!>';
					childIdx++;
				}
			}
		}
	}

	html += `</${tag}>`;
	return html;
}

function isCreatePortalCall(node) {
	return (
		node &&
		node.type === 'CallExpression' &&
		node.callee &&
		node.callee.type === 'Identifier' &&
		node.callee.name === 'createPortal'
	);
}

function makePortalCall(callNode, ctx, componentName, inlinedSubs) {
	const [bodyArg, targetArg, propsArg] = callNode.arguments;
	// The body is typically a <tsrx>...</tsrx> block — compile to a render fn.
	// rewriteTsrxBlocks turns Tsrx/Tsx into an Identifier referencing a hoisted fn.
	const bodyExpr = printExprWithTsrx(bodyArg, ctx, componentName, inlinedSubs);
	const targetExpr = printExpr(targetArg);
	const propsExpr = propsArg ? printExpr(propsArg) : 'undefined';
	return {
		id: ctx.nextHelperId++,
		bodyExpr,
		targetExpr,
		propsExpr,
	};
}

// ===========================================================================
// for-of inside element children → forBlock call
// ===========================================================================

// ===========================================================================
// if-statement inside element children → ifBlock call
// ===========================================================================

function makeIfCall(node, ctx, componentName, inlinedSubs, parentNs = 'html', cssHash = null) {
	// node.test, node.consequent (BlockStatement | Element), node.alternate (BlockStatement | IfStatement | null)
	const condExpr = printExpr(node.test);

	const thenStmts =
		node.consequent.type === 'BlockStatement' ? node.consequent.body : [node.consequent];
	const thenHelperName = `__then$${ctx.nextHelperId++}`;
	const thenFake = {
		type: 'Component',
		id: { type: 'Identifier', name: thenHelperName },
		params: [],
		body: thenStmts,
	};
	const thenFn = compileFunctionBody(thenFake, ctx, thenHelperName, parentNs, cssHash);
	inlinedSubs.push(thenFn + ';');

	let elseHelperName = null;
	if (node.alternate) {
		const elseStmts =
			node.alternate.type === 'BlockStatement' ? node.alternate.body : [node.alternate];
		elseHelperName = `__else$${ctx.nextHelperId++}`;
		const elseFake = {
			type: 'Component',
			id: { type: 'Identifier', name: elseHelperName },
			params: [],
			body: elseStmts,
		};
		const elseFn = compileFunctionBody(elseFake, ctx, elseHelperName, parentNs, cssHash);
		inlinedSubs.push(elseFn + ';');
	}

	return {
		id: ctx.nextHelperId++,
		condExpr,
		thenHelper: thenHelperName,
		elseHelper: elseHelperName,
		hostPath: null,
	};
}

// `<Activity mode={…}>…</Activity>` (React 19). Lowers exactly like makeIfCall
// but to a single body helper + an `activity`-flagged ifCalls entry (so it reuses
// the host/anchor mount-loop). The afterLines emit branches on `.activity` to
// call `activityBlock` instead of `ifBlock`. `mode` is inlined and re-evaluated
// every parent render (like ifBlock's cond); a missing mode defaults to visible.
function makeActivityCall(
	node,
	ctx,
	componentName,
	inlinedSubs,
	parentNs = 'html',
	cssHash = null,
) {
	const modeExpr = node.mode ? printExpr(node.mode) : "'visible'";
	const bodyHelperName = `__activity$${ctx.nextHelperId++}`;
	const bodyFake = {
		type: 'Component',
		id: { type: 'Identifier', name: bodyHelperName },
		params: [],
		body: node.children,
	};
	const bodyFn = compileFunctionBody(bodyFake, ctx, bodyHelperName, parentNs, cssHash);
	inlinedSubs.push(bodyFn + ';');
	return {
		id: ctx.nextHelperId++,
		activity: true,
		modeExpr,
		thenHelper: bodyHelperName,
		elseHelper: null,
		hostPath: null,
	};
}

/** Long-form `<Activity>` tag — matched by name, mirroring isFragmentLongForm. */
function isActivityLongForm(node) {
	const name = node.openingElement?.name || node.id;
	if (!name) return false;
	if (name.type !== 'Identifier' && name.type !== 'JSXIdentifier') return false;
	return name.name === 'Activity';
}

// ===========================================================================
// Component-as-tag — `<Foo>...</Foo>`, `<ctx.Provider>...</ctx.Provider>`
// ===========================================================================

// Long-form `<Fragment>…</Fragment>` (capital-F sentinel for fragment refs).
// Matches a JSXElement / Element whose tag identifier is exactly the word
// "Fragment". Used in normalizeChildren to expand into a FragmentStart /
// children / FragmentEnd sequence BEFORE isComponentTag would route the
// element through the componentSlot path.
function isFragmentLongForm(node) {
	const name = node.openingElement?.name || node.id;
	if (!name) return false;
	if (name.type !== 'Identifier' && name.type !== 'JSXIdentifier') return false;
	return name.name === 'Fragment';
}

function isComponentTag(node) {
	const name = node.openingElement?.name || node.id;
	if (!name) return false;
	if (name.type === 'MemberExpression' || name.type === 'JSXMemberExpression') return true;
	// `<{expr}>` — @tsrx/core 0.1.29 emits a JSXExpressionContainer with
	// isDynamic === true at openingElement.name. Always a component (no HTML
	// string tag is possible here); routes through the same componentSlot
	// codegen path as `<Foo>` / `<ctx.Provider>`.
	if (name.type === 'JSXExpressionContainer' && name.isDynamic === true) return true;
	if (name.type === 'Identifier' || name.type === 'JSXIdentifier') {
		return typeof name.name === 'string' && /^[A-Z]/.test(name.name);
	}
	return false;
}

function tagExpr(node) {
	const name = node.openingElement?.name || node.id;
	if (name.type === 'MemberExpression' || name.type === 'JSXMemberExpression') {
		return printExpr(name);
	}
	// `<{expr}>` — unwrap and print the inner expression. The returned string
	// is interpolated verbatim into the emitted componentSlot(...) call as
	// cc.compExpr. Parenthesize for precedence safety.
	if (name.type === 'JSXExpressionContainer' && name.isDynamic === true) {
		return `(${printExpr(name.expression)})`;
	}
	return name.name;
}

// Build a "renderable child" call entry for a bare `{expr}` text hole (no
// string cast). Mirrors Ripple/React: a component / element-descriptor /
// children render-fn RENDERS, a primitive coerces to text, and
// null/undefined/boolean/'' render nothing. It rides the compCall machinery
// (host + `<!>` anchor resolution, hole-aware child/sibling hydration walk) but
// emits `childSlot(...)` instead of `componentSlot(...)`. The caller sets
// `.hostPath` / `.anchorPath` exactly like a component call.
function makeChildCall(expr, ctx, cssHash) {
	return {
		id: ctx.nextHelperId++,
		isChild: true,
		valueExpr: printExpr(resolveStyleExpr(expr, cssHash)),
	};
}

function makeCompCall(
	node,
	ctx,
	componentName,
	inlinedSubs,
	bindings,
	forCalls,
	ifCalls,
	compCalls,
	parentNs = 'html',
	cssHash = null,
) {
	const id = ctx.nextHelperId++;
	const compExpr = tagExpr(node);

	// Build the props object literal from JSX attributes. `<Foo {...rest}/>`
	// becomes a spread element in the object literal — works because component
	// bodies receive the merged object as `props` and only care about field
	// values, not identity.
	const attrs = node.attributes || node.openingElement?.attributes || [];
	const propParts = [];
	// `key={expr}` is consumed by the componentSlot runtime (drives key-driven
	// remount on identity change), NOT passed as a prop — matches React, where
	// `props.key` is undefined inside the component body. When `key` follows a
	// spread, the spread cannot inject `key` either: we filter it out of the
	// emitted propsExpr but keep its expression for the slot arg.
	let keyExpr = null;
	for (const attr of attrs) {
		if (attr.type === 'SpreadAttribute' || attr.type === 'JSXSpreadAttribute') {
			propParts.push(`...(${printExprWithTsrx(attr.argument, ctx, componentName, inlinedSubs)})`);
			continue;
		}
		if (attr.type !== 'Attribute' && attr.type !== 'JSXAttribute') continue;
		const attrName = attr.name.name || attr.name;
		const val = attr.value;
		if (attrName === 'key') {
			// `<Foo key/>` (no value) is meaningless — skip silently.
			if (val == null) continue;
			const keyInner = val.type === 'JSXExpressionContainer' ? val.expression : val;
			keyExpr = printExprWithTsrx(keyInner, ctx, componentName, inlinedSubs);
			continue;
		}
		if (val == null) {
			propParts.push(`${JSON.stringify(attrName)}: true`);
			continue;
		}
		let inner = val.type === 'JSXExpressionContainer' ? val.expression : val;
		inner = resolveStyleExpr(inner, cssHash);
		if (inner.type === 'Literal') {
			propParts.push(`${JSON.stringify(attrName)}: ${JSON.stringify(inner.value)}`);
		} else {
			propParts.push(
				`${JSON.stringify(attrName)}: (${printExprWithTsrx(inner, ctx, componentName, inlinedSubs)})`,
			);
		}
	}

	// Compile children as a render function: (scope) => { renders JSX into scope }.
	// The function is inlined inside the parent component body so its closures
	// capture the parent's locals (props, state, etc.).
	const children = node.children || [];
	if (children.length > 0) {
		const childrenHelperName = `__children$${ctx.nextHelperId++}`;
		const fakeBody = {
			type: 'Component',
			id: { type: 'Identifier', name: childrenHelperName },
			params: [],
			body: children,
		};
		const childrenFn = compileFunctionBody(fakeBody, ctx, childrenHelperName, parentNs, cssHash);
		inlinedSubs.push(childrenFn + ';');
		propParts.push(`"children": ${childrenHelperName}`);
	}

	const propsExpr = `{ ${propParts.join(', ')} }`;

	// Design (c) v0: decide whether the call site can use componentSlotLite
	// (Scope-only, no Block / no Comment markers / no CompSlot wrapper).
	// Requires:
	//   - callee is a bare Identifier (no dynamic <{expr}/> tag)
	//   - callee is registered in ctx.componentInfo as eligible (same-module
	//     hookless component that passed the pre-pass)
	//   - no key=, no spread, no JSX children at the call site
	let liteEligible = false;
	// singleRoot: a NON-lite (hooks/`use`) same-module component whose body output
	// is one plain element. Its componentSlot self-delimits via that element on
	// client mount — no `comp`/`/comp` markers. (Lite components are already
	// markerless, so this only matters for the full path.)
	let singleRoot = false;
	if (ctx.componentInfo && keyExpr == null) {
		const tagName = node.openingElement?.name || node.id || node.name;
		const isBareIdent =
			tagName && (tagName.type === 'Identifier' || tagName.type === 'JSXIdentifier');
		if (isBareIdent) {
			const calleeInfo = ctx.componentInfo.get(compExpr);
			if (calleeInfo) {
				const hasSpread = propParts.some((p) => p.startsWith('...'));
				const hasChildrenProp = propParts.some((p) => p.startsWith('"children":'));
				const callSiteOk = !hasSpread && !hasChildrenProp;
				if (calleeInfo.eligible) liteEligible = callSiteOk;
				else if (calleeInfo.singleRoot) singleRoot = callSiteOk;
			}
		}
	}

	return { id, compExpr, propsExpr, hostPath: null, keyExpr, liteEligible, singleRoot };
}

// ===========================================================================
// try/catch → tryBlock call
// ===========================================================================

function makeTryCall(node, ctx, componentName, inlinedSubs, parentNs = 'html', cssHash = null) {
	// node.block = try BlockStatement, node.handler = CatchClause (param, resetParam, body),
	// node.pending = optional BlockStatement (TSRX `pending { ... }`)
	const tryStmts = node.block.body;
	const tryHelperName = `__try$${ctx.nextHelperId++}`;
	const tryFake = {
		type: 'Component',
		id: { type: 'Identifier', name: tryHelperName },
		params: [],
		body: tryStmts,
	};
	const tryFn = compileFunctionBody(tryFake, ctx, tryHelperName, parentNs, cssHash);
	inlinedSubs.push(tryFn + ';');

	// Optional `pending { ... }` arm — compiled like any sub-body.
	let pendingHelperName = 'null';
	if (node.pending && node.pending.body && node.pending.body.length > 0) {
		const pendingHelper = `__pending$${ctx.nextHelperId++}`;
		const pendingFake = {
			type: 'Component',
			id: { type: 'Identifier', name: pendingHelper },
			params: [],
			body: node.pending.body,
		};
		const pendingFn = compileFunctionBody(pendingFake, ctx, pendingHelper, parentNs, cssHash);
		inlinedSubs.push(pendingFn + ';');
		pendingHelperName = pendingHelper;
	}

	let catchHelperName = 'null';
	if (node.handler) {
		const handler = node.handler;
		const errName = handler.param?.name || '_err';
		const resetName = handler.resetParam?.name || '_reset';
		const catchStmts = handler.body.body;
		const tmpName = `__catch$${ctx.nextHelperId++}`;
		// The catch body sees `err` and `reset` as bindings unpacked from the
		// tryBlock-supplied props object. We synthesize a small destructuring
		// VariableDeclaration at the top of the body so the user's identifiers
		// resolve. The body is otherwise compiled like any component body.
		const destructure = {
			type: 'VariableDeclaration',
			kind: 'const',
			declarations: [
				{
					type: 'VariableDeclarator',
					id: {
						type: 'ObjectPattern',
						properties: [
							{
								type: 'Property',
								key: { type: 'Identifier', name: 'err' },
								value: { type: 'Identifier', name: errName },
								kind: 'init',
								shorthand: errName === 'err',
								computed: false,
								method: false,
							},
							{
								type: 'Property',
								key: { type: 'Identifier', name: 'reset' },
								value: { type: 'Identifier', name: resetName },
								kind: 'init',
								shorthand: resetName === 'reset',
								computed: false,
								method: false,
							},
						],
					},
					init: { type: 'Identifier', name: '__props' },
				},
			],
		};
		const catchFake = {
			type: 'Component',
			id: { type: 'Identifier', name: tmpName },
			params: [{ type: 'Identifier', name: '__props' }],
			body: [destructure, ...catchStmts],
		};
		const catchFn = compileFunctionBody(catchFake, ctx, tmpName, parentNs, cssHash);
		inlinedSubs.push(catchFn + ';');
		catchHelperName = tmpName;
	}
	return {
		id: ctx.nextHelperId++,
		tryHelper: tryHelperName,
		catchHelper: catchHelperName,
		pendingHelper: pendingHelperName,
		hostPath: null,
	};
}

/**
 * `@switch (d) { @case 1: { … } @case 2: { … } @default: { … } }` →
 * `switchBlock(scope, slotKey, host, d, [[1, __case$0], [2, __case$1]], __default$2)`.
 *
 * Each case's `consequent` (Statement[]) is hoisted as its own component body
 * via `compileFunctionBody`, exactly like @if branches. Fall-through is NOT
 * modeled — each case is treated as its own self-contained body. If a user
 * writes a case with no explicit terminator, the case's body still runs to
 * completion (it's just a function call) and only that case's body renders.
 */
function makeSwitchCall(node, ctx, componentName, inlinedSubs, parentNs = 'html', cssHash = null) {
	const discExpr = printExpr(node.discriminant);
	const caseRecords = [];
	let defaultHelper = 'null';
	for (const c of node.cases || []) {
		const stmts = c.consequent || [];
		const isDefault = c.test == null;
		const helperName = `__${isDefault ? 'default' : 'case'}$${ctx.nextHelperId++}`;
		const fake = {
			type: 'Component',
			id: { type: 'Identifier', name: helperName },
			params: [],
			body: stmts,
		};
		const fn = compileFunctionBody(fake, ctx, helperName, parentNs, cssHash);
		inlinedSubs.push(fn + ';');
		if (isDefault) {
			defaultHelper = helperName;
		} else {
			caseRecords.push({ testExpr: printExpr(c.test), helper: helperName });
		}
	}
	const casesArrayExpr =
		'[' + caseRecords.map((r) => `[(${r.testExpr}), ${r.helper}]`).join(', ') + ']';
	return {
		id: ctx.nextHelperId++,
		discExpr,
		casesArrayExpr,
		defaultHelper,
		hostPath: null,
	};
}

function makeForCall(node, ctx, componentName, inlinedSubs, parentNs = 'html', cssHash = null) {
	// `@for await (...)` (async iteration) has no meaning for the runtime's
	// synchronous keyed reconciler. The TSRX parser currently rejects the surface
	// syntax outright, but guard the lowered node too so a future parser change
	// can't make it silently lower to a plain synchronous loop, dropping the
	// `await` with no diagnostic.
	if (node.await) {
		throw new Error(
			'`@for await (...)` (async iteration) is not supported by the ripple-new target. ' +
				'Use a synchronous `@for` over a materialized array, or resolve async data with ' +
				'`use(promise)` first.',
		);
	}
	// node.left = const x  OR  const &{x,y} / const [a,b]  (destructured)
	// node.right = expr, node.body = BlockStatement,
	// node.key = optional `key …` expression, node.index = optional `index <id>`.
	// `@for (...) { ... } @empty { ... }` — hoist the empty branch as its own
	// helper. Passed to the runtime as the trailing `emptyBody` arg. When
	// items.length === 0 the runtime mounts the empty branch in place of the
	// (empty) item list; transitioning items → 0 unmounts the chain and mounts
	// the empty body, and 0 → items does the reverse.
	let emptyHelperName = 'null';
	if (node.empty) {
		const stmts = node.empty.type === 'BlockStatement' ? node.empty.body : [node.empty];
		emptyHelperName = `__empty$${ctx.nextHelperId++}`;
		const fake = {
			type: 'Component',
			id: { type: 'Identifier', name: emptyHelperName },
			params: [],
			body: stmts,
		};
		const fn = compileFunctionBody(fake, ctx, emptyHelperName, parentNs, cssHash);
		inlinedSubs.push(fn + ';');
	}
	const leftDeclId = node.left.declarations[0].id;
	const isDestructured = leftDeclId.type !== 'Identifier';
	// `itemName` is the identifier used in the body signature + keyFn. For a
	// plain `const x of …`, that's `x`. For a destructured `const &{id} of …`,
	// we synthesize a fresh name and emit the destructuring inside the body so
	// the keyFn still gets the whole item and the body still sees the fields.
	const itemName = isDestructured ? '_item' : leftDeclId.name;
	const itemsExpr = printExpr(node.right);
	const subStmts = node.body.body;

	// Key resolution priority (matches @tsrx/core's build_hoisted_for_of_with_hooks):
	//   1. `key={…}` attribute on the first Element child (legacy / explicit).
	//   2. `for (const x of y; key x.id) { ... }` — TSRX for-of header.
	//   3. `for (const x, i of y) { ... }` — second loop param treated as the key.
	//   4. Fallback: `x.id ?? x` (object identity).
	// Builds `(item) => keyExpr` — when the for-of head is destructured we use
	// the same destructure pattern as the arg so the user's `key id` (where
	// `id` is a destructured field) actually resolves.
	function mkKeyFn(keyExpr) {
		const param = isDestructured ? leftDeclId : { type: 'Identifier', name: itemName };
		return printExpr({
			type: 'ArrowFunctionExpression',
			params: [param],
			body: keyExpr,
			expression: true,
		});
	}

	let keyFn = null;
	// New TSRX surfaces `key` on the JSXForExpression itself (read via `node.key`
	// below). Legacy / `<li key={…}>` attribute syntax is also accepted: scan the
	// body for the first Element and pull its `key=` attr if any. Accept both
	// the old `Element` IR and the raw new `JSXElement` shape that's reached
	// here when the body wasn't routed through normalizeChildren.
	const firstEl = subStmts.find((n) => n.type === 'Element' || n.type === 'JSXElement');
	if (firstEl) {
		const keyAttr = (firstEl.attributes || firstEl.openingElement?.attributes || []).find(
			(a) => (a.name?.name || a.name) === 'key',
		);
		if (keyAttr) {
			const inner =
				keyAttr.value.type === 'JSXExpressionContainer' ? keyAttr.value.expression : keyAttr.value;
			keyFn = mkKeyFn(inner);
		}
	}
	if (!keyFn && node.key) {
		keyFn = mkKeyFn(node.key);
	}
	if (!keyFn && node.index) {
		// Index identifier — caller iterates with index, key by index.
		keyFn = `(${itemName}, ${node.index.name}) => ${node.index.name}`;
	}
	if (!keyFn) keyFn = `(${itemName}) => ${itemName}.id != null ? ${itemName}.id : ${itemName}`;

	// Key fn is hoisted (it doesn't typically capture parent state).
	const keyHelper = `_key$${ctx.nextHelperId++}`;
	ctx.hoistedHelpers.push(`const ${keyHelper} = ${keyFn};`);

	// When the for-of header declared `index <name>`, expose it as a `const`
	// at the top of the body — the runtime stamps `block.itemIndex` per item
	// on every mount + re-render so the user identifier always reflects the
	// current position.
	const indexInjection = node.index
		? [
				{
					type: 'VariableDeclaration',
					kind: 'const',
					declarations: [
						{
							type: 'VariableDeclarator',
							id: { type: 'Identifier', name: node.index.name },
							init: {
								type: 'MemberExpression',
								object: { type: 'Identifier', name: '__block' },
								property: { type: 'Identifier', name: 'itemIndex' },
								computed: false,
							},
						},
					],
				},
			]
		: [];

	// Destructured header `const &{x,y} of …` — synthesize a destructure stmt
	// at the top of the body so the user fields bind from the synthetic item.
	const destructureInjection = isDestructured
		? [
				{
					type: 'VariableDeclaration',
					kind: 'const',
					declarations: [
						{
							type: 'VariableDeclarator',
							id: leftDeclId, // ObjectPattern / ArrayPattern (lazy flag dropped by printer)
							init: { type: 'Identifier', name: itemName },
						},
					],
				},
			]
		: [];

	// ─── Body analysis: PURE vs DEP-PURE vs normal.
	//
	// - PURE: body closes over nothing parent-reactive, no hooks, no comps,
	//   no control flow. Reconciler skips renderBlock when item ref + index
	//   unchanged. Identified by `pure = true`.
	// - DEP-PURE: body DOES close over parent locals but is otherwise as
	//   clean as PURE. The compiler emits an explicit deps array at the
	//   forBlock call site so the reconciler can do ONE deps-equality check
	//   per parent render and, if unchanged, treat the body as PURE for the
	//   survivor short-circuit. Saves the body call entirely for
	//   item-ref-and-index-stable survivors — no per-row snapshot work.
	// - NORMAL: anything else → body runs every render.
	let pure = false;
	const depNames = [];
	let depEligible = false;
	if (ctx.currentComponentLocals) {
		const bodyScope = new Set([itemName]);
		if (node.index) bodyScope.add(node.index.name);
		const bodyAst = { type: 'BlockStatement', body: subStmts };
		const free = collectFreeIdentifiers(bodyAst, bodyScope);
		let hasParentClosure = false;
		let hasHook = false;
		const seenDeps = new Set();
		for (const name of free) {
			if (HOOK_NAMES.has(name) || name === 'use' || name === 'useContext') {
				hasHook = true;
			}
			if (ctx.currentComponentLocals.has(name)) {
				hasParentClosure = true;
				if (!seenDeps.has(name)) {
					seenDeps.add(name);
					depNames.push(name);
				}
			}
		}
		const hasNestedComp = containsComponentCallOrControlFlow(subStmts);
		pure = !hasParentClosure && !hasHook && !hasNestedComp;
		depEligible = !pure && hasParentClosure && !hasHook && !hasNestedComp;
		depNames.sort();
	}

	const itemHelperName = `__item$${ctx.nextHelperId++}`;
	const fakeComponent = {
		type: 'Component',
		id: { type: 'Identifier', name: itemHelperName },
		params: [{ type: 'Identifier', name: itemName }],
		body: [...indexInjection, ...destructureInjection, ...subStmts],
	};
	const itemFnSource = compileFunctionBody(fakeComponent, ctx, itemHelperName, parentNs, cssHash);
	inlinedSubs.push(itemFnSource + ';');

	// Single-root detection: when the body emits exactly one Element root and
	// no other JSX siblings (no Fragment, no Component, no top-level if/for/try),
	// the runtime can skip per-item Comment markers and use the row element
	// itself as the block boundary. For a 1000-row keyed list this removes 2000
	// Comment nodes from the parent — meaningful paint-time savings when the
	// parent is laid out per child (e.g. <tbody> in js-framework-benchmark).
	let singleRoot = false;
	{
		const jsxChildren = subStmts.filter((s) => isJsxNode(s));
		if (jsxChildren.length === 1) {
			const c = jsxChildren[0];
			// Old IR uses `Element`; new TSRX AST uses `JSXElement`. Both qualify
			// for the singleRoot fast path so long as the tag is lowercase (so the
			// row itself is the block-boundary host, no Comment markers needed).
			if ((c.type === 'Element' || c.type === 'JSXElement') && !isComponentTag(c))
				singleRoot = true;
		}
	}

	return {
		id: ctx.nextHelperId++,
		itemsExpr,
		keyHelper,
		bodyHelper: itemHelperName,
		extraExpr: 'undefined',
		pure,
		singleRoot,
		// DEP-PURE candidates emit `[dep0, dep1, ...]` as the deps arg in the
		// forBlock call. Reconciler compares to its cached deps; if unchanged
		// this render, treats the body as PURE for the survivor short-circuit.
		depEligible,
		depNames,
		// `@empty` branch helper name (or literal 'null' when none).
		emptyHelper: emptyHelperName,
		hostPath: null,
	};
}

// ===========================================================================
// Helpers
// ===========================================================================

/**
 * Detect short-circuit guards: `if (cond) return;` (at component-body level)
 * AND `if (cond) continue;` (inside a for-of body). Both have identical
 * compile-time semantics: "skip everything after this point" — for a component
 * body that means render nothing more; for a for-of item that means render
 * nothing more for THIS item but the next item still iterates.
 *
 * Accepts both no-braces (`if (x) continue;`) and single-statement-block
 * (`if (x) { continue; }`). Rejects forms with an alternate or a value-return.
 */
function isEarlyExitIf(stmt) {
	if (!stmt || stmt.type !== 'IfStatement' || stmt.alternate) return false;
	const c = stmt.consequent;
	if (isEarlyExitStatement(c)) return true;
	if (c.type === 'BlockStatement' && c.body.length === 1 && isEarlyExitStatement(c.body[0]))
		return true;
	return false;
}

function isEarlyExitStatement(s) {
	if (!s) return false;
	if (s.type === 'ReturnStatement' && s.argument == null) return true;
	if (s.type === 'ContinueStatement' && s.label == null) return true;
	return false;
}

/**
 * Rewrite early-exit guards into nested negated-condition if-blocks:
 *   stmt1; if (X) continue; stmt2; if (Y) return; stmt3;
 *   ⇒
 *   stmt1; if (!X) { stmt2; if (!Y) { stmt3; } }
 *
 * Each synthetic `if (!cond) { ... }` becomes an ifBlock at compile time.
 * Symbol-keyed hooks make it safe to declare hooks after an early exit.
 */
function rewriteEarlyExits(body) {
	const out = [];
	for (let i = 0; i < body.length; i++) {
		const stmt = body[i];
		if (isEarlyExitIf(stmt)) {
			const rest = rewriteEarlyExits(body.slice(i + 1));
			if (rest.length > 0) {
				out.push({
					type: 'IfStatement',
					test: { type: 'UnaryExpression', operator: '!', argument: stmt.test, prefix: true },
					consequent: { type: 'BlockStatement', body: rest },
					alternate: null,
				});
			}
			return out;
		}
		out.push(stmt);
	}
	return out;
}

function isJsxNode(node) {
	if (!node) return false;
	if (node.type === 'Element' || node.type === 'Text') return true;
	if (node.type === 'Tsx' || node.type === 'Tsrx') return true;
	if (node.type === 'JSXElement' || node.type === 'JSXFragment') return true;
	// New TSRX directive nodes — always JSX-position. normalizeChildren will
	// lower them to IfStatement / ForOfStatement / TryStatement / SwitchStatement
	// when planJsx runs over them.
	if (
		node.type === 'JSXIfExpression' ||
		node.type === 'JSXForExpression' ||
		node.type === 'JSXTryExpression' ||
		node.type === 'JSXSwitchExpression' ||
		node.type === 'JSXExpressionContainer' ||
		node.type === 'JSXText' ||
		node.type === 'JSXStyleElement'
	)
		return true;
	if (node.type === 'IfStatement') {
		return (
			bodyContainsJsx(node.consequent) || (!!node.alternate && bodyContainsJsx(node.alternate))
		);
	}
	if (node.type === 'ForOfStatement') {
		return bodyContainsJsx(node.body);
	}
	if (node.type === 'TryStatement') {
		return bodyContainsJsx(node.block) || (!!node.handler && bodyContainsJsx(node.handler.body));
	}
	return false;
}

function bodyContainsJsx(node) {
	if (!node) return false;
	if (node.type === 'BlockStatement') return node.body.some(isJsxNode);
	return isJsxNode(node);
}

function walkExpr(rootVar, path) {
	if (path.length === 0) return rootVar;
	let expr = rootVar;
	for (let i = 0; i < path.length; i++) {
		const idx = path[i];
		expr = `${expr}.firstChild`;
		for (let n = 0; n < idx; n++) expr = `${expr}.nextSibling`;
	}
	return expr;
}

// Hole-aware variant of walkExpr: `child(node)` for `.firstChild`, `sibling(node,
// n)` for n× `.nextSibling`. Identical to walkExpr when not hydrating; while
// hydrating, `sibling` skips each `<!--[-->…<!--]-->` block range as one logical
// step so paths that cross a control-flow / component hole resolve to the right
// server node. Used for templates that contain holes (see `hasHoles`).
function walkExprH(rootVar, path) {
	if (path.length === 0) return rootVar;
	let expr = rootVar;
	for (let i = 0; i < path.length; i++) {
		const idx = path[i];
		expr = `child(${expr})`;
		if (idx > 0) expr = `sibling(${expr}, ${idx})`;
	}
	return expr;
}

function allocTemplate(ctx, html, ns = 0, frag = 0) {
	const id = ctx.nextTemplateId++;
	const name = `_t$${id}`;
	ctx.hoistedTemplates.push({ name, html, ns, frag });
	return name;
}

function escapeHtml(s) {
	return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(s) {
	return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function printNode(node) {
	// Strip TS-only wrappers (TSAsExpression / TSNonNullExpression / etc.)
	// before printing. esrap's tsx printer would otherwise emit
	// `expr as string`, `expr!`, `expr satisfies T` verbatim, which Vite/
	// rolldown rejects when loading the compiled .tsrx output as a `.js`
	// module ("Type assertion expressions can only be used in TypeScript
	// files"). Centralizing here covers every emit path (statement-level
	// rewrittenStatements, planJsx-emitted bindings, attribute / prop
	// values via printExprWithTsrx) — no per-call-site strip needed.
	const { code } = esrapPrint(stripTsOnlyWrappers(node), esrapTsx());
	return code;
}

/**
 * Like printNode, but also returns esrap's real per-token source mappings for
 * this node (decoded, NOT VLQ-encoded). `code` is byte-identical to printNode —
 * source-map options don't change the printed output — so callers can keep
 * emitting the same string while capturing the map. `mappings` is an array
 * indexed by generated line; each entry is a list of `[genCol, srcIdx, srcLine,
 * srcCol]` segments with ABSOLUTE source positions (relative to the original
 * `.tsrx`, via the node's `.loc`).
 */
function printNodeWithMap(node, ctx) {
	const { code, map } = esrapPrint(stripTsOnlyWrappers(node), esrapTsx(), {
		sourceMapSource: ctx.mapSourceName,
		sourceMapContent: ctx.mapSource,
		sourceMapEncodeMappings: false,
	});
	return { code, mappings: map.mappings || [] };
}

function printExpr(node) {
	// Wrap in an ExpressionStatement to get a printable form, then strip trailing `;`.
	const wrapped = { type: 'ExpressionStatement', expression: node };
	return printNode(wrapped).trim().replace(/;$/, '');
}

/**
 * Like printExpr, but first walks the AST and replaces any `<tsrx>...</tsrx>`
 * or `<tsx>...</tsx>` blocks with identifier references to hoisted render fns.
 * Used at attribute-value and prop-value sites where Tsrx is at expression position.
 */
function printExprWithTsrx(node, ctx, componentName, inlinedSubs) {
	// In server mode, JSX expression positions (attribute / prop / spread values)
	// bypass the setup-statement rewrite in ssrCompileBody, so apply the server
	// `use(thenable)` call-site keying here too — without a stable key, sibling and
	// nested `use()` calls collide in render()'s suspense cache (the OCC fallback
	// keys them by render order, which shifts across passes → crossed values).
	// No-op in client mode (use() is keyed by per-block call order there) and for
	// expressions with no hook calls.
	const keyed = ctx.mode === 'server' ? rewriteHookCalls(node, ctx, componentName) : node;
	const rewritten = rewriteTsrxBlocks(keyed, ctx, componentName, inlinedSubs);
	return printExpr(rewritten);
}

function mapAst(node, mutate) {
	if (node == null || typeof node !== 'object') return node;
	if (Array.isArray(node)) return node.map((c) => mapAst(c, mutate));
	const replaced = mutate(node);
	if (replaced != null) return replaced;
	const out = {};
	for (const k in node) {
		if (k === 'loc' || k === 'start' || k === 'end' || k === 'metadata') {
			out[k] = node[k];
			continue;
		}
		out[k] = mapAst(node[k], mutate);
	}
	return out;
}
