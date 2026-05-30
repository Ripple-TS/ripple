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

export function isNativeTsrxNode(node: AST.Node | null | undefined): boolean {
	return node?.type === 'Element' || node?.type === 'TsrxFragment';
}

export function functionReturnsNativeTsrx(node: AST.Node): boolean {
	const functionNode = node as AnyNode;
	const body = functionNode.body as AnyNode | undefined;

	if (!body) {
		return false;
	}

	if (isNativeTsrxNode(body)) {
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

	if (node.type === 'ReturnStatement' && isNativeTsrxNode(node.argument)) {
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
