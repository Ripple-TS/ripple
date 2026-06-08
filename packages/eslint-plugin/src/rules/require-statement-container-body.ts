import type { Rule } from 'eslint';
import type * as AST from '@tsrx/core/types/estree';

type AnyNode = AST.Node & Record<string, any>;

const MESSAGE =
	"This function body contains TSRX template output, but it is a normal JavaScript block. Add '@' before the opening brace to use a TSRX statement container.";

function is_template_output_statement(node: AnyNode | null | undefined): boolean {
	if (!node) return false;

	if (
		node.type === ('JSXElement' as string) ||
		node.type === ('JSXFragment' as string) ||
		node.type === ('JSXStyleElement' as string) ||
		node.type === ('JSXIfExpression' as string) ||
		node.type === ('JSXForExpression' as string) ||
		node.type === ('JSXSwitchExpression' as string) ||
		node.type === ('JSXTryExpression' as string)
	) {
		return true;
	}

	return (
		node.type === 'ExpressionStatement' &&
		is_template_output_statement((node as AnyNode).expression)
	);
}

function is_ignored_statement(node: AnyNode | null | undefined): boolean {
	return !node || node.type === 'EmptyStatement';
}

function get_forgotten_output_statement(node: AST.Node): AnyNode | null {
	const body = (node as AnyNode).body;
	if (!body || body.type !== 'BlockStatement') {
		return null;
	}

	let target: AnyNode | null = null;
	let target_index = -1;
	const statements = body.body || [];
	for (let index = 0; index < statements.length; index++) {
		const statement = statements[index] as AnyNode;
		if (is_template_output_statement(statement)) {
			if (target_index !== -1) {
				return null;
			}
			target = statement;
			target_index = index;
		}
	}

	if (!target) {
		return null;
	}

	for (const statement of statements.slice(target_index + 1)) {
		if (!is_ignored_statement(statement as AnyNode)) {
			return null;
		}
	}

	return target;
}

const rule: Rule.RuleModule = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Require @{...} for TSRX component bodies with setup and template output.',
		},
		fixable: 'code',
		messages: {
			requireStatementContainerBody: MESSAGE,
		},
		schema: [],
	},
	create(context) {
		function check_function(node: AST.Node) {
			if (!(node as AnyNode).returnType) {
				return;
			}

			const forgotten_output = get_forgotten_output_statement(node);
			if (!forgotten_output) {
				return;
			}

			const body = (node as AnyNode).body;
			context.report({
				node: forgotten_output,
				messageId: 'requireStatementContainerBody',
				fix(fixer) {
					return fixer.insertTextBefore(body, '@');
				},
			});
		}

		return {
			FunctionDeclaration: check_function,
			FunctionExpression: check_function,
			ArrowFunctionExpression: check_function,
		};
	},
};

export default rule;
