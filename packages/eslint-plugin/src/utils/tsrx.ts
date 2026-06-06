import type * as AST from '@tsrx/core/types/estree';

type AnyNode = AST.Node & Record<string, any>;

const NESTED_BOUNDARY_TYPES = new Set([
	'FunctionDeclaration',
	'FunctionExpression',
	'ArrowFunctionExpression',
	'ClassDeclaration',
	'ClassExpression',
	'MethodDefinition',
	'PropertyDefinition',
	'StaticBlock',
]);

export function isNativeTsrxJsxNode(node: AST.Node | null | undefined): boolean {
	if (!node) return false;

	if (
		node.type === ('JSXCodeBlock' as string) ||
		node.type === ('JSXIfExpression' as string) ||
		node.type === ('JSXForExpression' as string) ||
		node.type === ('JSXSwitchExpression' as string) ||
		node.type === ('JSXTryExpression' as string)
	) {
		return true;
	}

	return (
		(node.type === ('JSXElement' as string) ||
			node.type === ('JSXFragment' as string) ||
			node.type === ('JSXStyleElement' as string)) &&
		!!(node as AnyNode).metadata?.native_tsrx
	);
}

export function functionReturnsNativeTsrx(node: AST.Node): boolean {
	const functionNode = node as AnyNode;
	const body = functionNode.body as AnyNode | undefined;

	if (!body) {
		return false;
	}

	if (isNativeTsrxJsxNode(body)) {
		return true;
	}

	if (body.type !== 'BlockStatement') {
		return false;
	}

	return containsNativeTsrxReturn(body);
}

function containsNativeTsrxReturn(node: AnyNode): boolean {
	if (!node || typeof node !== 'object') {
		return false;
	}

	if (node.type === 'ReturnStatement' && isNativeTsrxJsxNode(node.argument)) {
		return true;
	}

	if (node.type !== 'BlockStatement' && NESTED_BOUNDARY_TYPES.has(node.type)) {
		return false;
	}

	for (const key of Object.keys(node)) {
		if (key === 'parent' || key === 'loc' || key === 'range') {
			continue;
		}

		const value = node[key];
		if (Array.isArray(value)) {
			for (const child of value) {
				if (child?.type && containsNativeTsrxReturn(child)) {
					return true;
				}
			}
		} else if (value?.type && containsNativeTsrxReturn(value)) {
			return true;
		}
	}

	return false;
}
