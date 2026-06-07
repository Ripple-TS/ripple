#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const package_dir = path.resolve(__dirname, '..');
const repo_root = path.resolve(package_dir, '../..');
const specification_path = path.join(repo_root, 'website-tsrx/src/pages/specification.tsrx');
const features_path = path.join(repo_root, 'website-tsrx/src/pages/features.tsrx');
const getting_started_path = path.join(repo_root, 'website-tsrx/src/pages/getting-started.tsrx');

export const generated_docs_path = path.join(package_dir, 'src/generated/docs.js');

/**
 * @param {string} name
 * @param {string} specification_source
 */
function extract_string_array_constant(name, specification_source) {
	const start_marker = `const ${name} = [`;
	const start = specification_source.indexOf(start_marker);
	if (start === -1) {
		throw new Error(`Could not find ${name} in ${path.relative(repo_root, specification_path)}`);
	}
	const body_start = start + start_marker.length;
	const end = specification_source.indexOf("].join('\\n');", body_start);
	if (end === -1) {
		throw new Error(
			`Could not find end of ${name} in ${path.relative(repo_root, specification_path)}`,
		);
	}
	const body = specification_source.slice(body_start, end);
	const values = [];
	const literal_pattern = /'((?:\\'|[^'])*)'/g;
	let literal_match;
	while ((literal_match = literal_pattern.exec(body))) {
		values.push(literal_match[1].replaceAll("\\'", "'"));
	}
	return values.join('\n');
}

export async function generate_docs_index() {
	const specification_source = fs.readFileSync(specification_path, 'utf8');
	fs.accessSync(features_path);
	fs.accessSync(getting_started_path);

	const expression_value_grammar = extract_string_array_constant(
		'EXPRESSION_VALUE_GRAMMAR',
		specification_source,
	);
	const template_expression_grammar = extract_string_array_constant(
		'TEMPLATE_EXPRESSION_GRAMMAR',
		specification_source,
	);
	const lazy_grammar = extract_string_array_constant('LAZY_GRAMMAR', specification_source);
	const style_grammar = extract_string_array_constant('STYLE_GRAMMAR', specification_source);
	const server_extension_grammar = extract_string_array_constant(
		'SERVER_EXTENSION_GRAMMAR',
		specification_source,
	);

	const docs = [
		{
			slug: 'overview',
			title: 'TSRX Overview',
			use_cases:
				'always, introduction, explain tsrx, compare jsx, language model context, runtime targets',
			content: `# TSRX Overview

TSRX is a TypeScript language extension for authoring declarative UI in .tsrx files. It adds a small set of syntax forms on top of TypeScript, while letting each target compiler define the runtime semantics.

Core ideas:
- Components are ordinary TypeScript functions. Use a JSX statement container, \`@{ ... }\`, when the function body is mostly TSRX setup plus one rendered output.
- JSXElement, JSXFragment, JSXText, JSXExpressionContainer, attributes, and spreads use the standard JSX node family.
- A mixed setup/template scope must finish with exactly one output node: a JSXElement, JSXFragment, or JSX control-flow expression. Wrap plain text, expression containers, or multiple siblings in a fragment.
- Template control flow uses directive expressions: \`@if\`, \`@for\`, \`@switch\`, and \`@try\`; every directive body uses a \`{...}\` template block.
- lazy destructuring uses &[] and &{} for by-reference bindings.

The core language docs should stay target-neutral. After identifying the active runtime target, use target-specific docs, prompts, or skills for runtime imports, bundler setup, and semantics that are not defined by TSRX itself.

Source: website-tsrx/src/pages/specification.tsrx`,
		},
		{
			slug: 'components',
			title: 'Function Components',
			use_cases: 'components, functions, props, authoring .tsrx files, jsx return syntax',
			content: `# Function Components

Author UI as ordinary TypeScript functions. Components can return JSX directly, or use a JSX statement container when setup and output should live together.

\`\`\`tsx
export function Button({ label }: { label: string }) @{
  <button>{label}</button>
}
\`\`\`

Inside \`@{ ... }\`, put any setup statements first and end with one rendered output node. No JavaScript setup can appear after that output.

Source: website-tsrx/src/pages/specification.tsrx#components`,
		},
		{
			slug: 'text-and-template-expressions',
			title: 'Text and Template Expressions',
			use_cases: 'text children, jsx text, comments, string literals, expression containers',
			content: `# Text and Template Expressions

Static text is JSXText and can be written directly between tags. Dynamic values use normal JSX expression containers.

\`\`\`tsx
function Greeting({ name }: { name: string }) @{
  <>
  <h1>Hello</h1>
  <p>{name}</p>
  </>
}
\`\`\`

JavaScript comments are also allowed between template children and are not rendered. Use braces for JavaScript expressions, including string literals that should be evaluated as JavaScript.

Specification grammar:

\`\`\`text
${template_expression_grammar}
\`\`\`

Source: website-tsrx/src/pages/specification.tsrx#templates`,
		},
		{
			slug: 'expression-values',
			title: 'Expression Values',
			use_cases:
				'fragments, pass template as prop, return template from helper, render props, expression position jsx',
			content: `# Expression Values

TSRX uses JSX-shaped expression values. A single JSXElement can be assigned, passed, or returned directly. Use a JSXFragment when the value needs multiple children, or use a JSX statement container when setup needs to produce one final output.

\`\`\`tsx
function App() @{
  const title = <span class="title">Settings</span>;
  const badge = (label: string) => @{
    const normalized = label.trim();

    <span class="badge">{normalized}</span>
  };

  <Card title={title}>{badge('New')}</Card>
}
\`\`\`

\`@{ ... }\` is a JSX statement container. A normal JSX fragment, element body, or control-flow branch can also contain setup before output, but that scope must still end with one output node. Use a fragment when the output is text, an expression container, or multiple siblings.

Specification grammar:

\`\`\`text
${expression_value_grammar}
\`\`\`

Source: website-tsrx/src/pages/specification.tsrx#expression-values`,
		},
		{
			slug: 'control-flow',
			title: 'Control Flow',
			use_cases:
				'if else, for loops, switch, try catch, conditional rendering, lists, guard returns',
			content: `# Control Flow

Template control flow uses directive-prefixed expressions inside JSX children.

\`\`\`tsx
function List({ items }: { items: string[] }) @{
  <>
  @if (items.length === 0) {
    <p>No items</p>
  } @else {
    <ul>
      @for (const item of items.filter(Boolean); index i; key item) {
        <li>{item}</li>
      } @empty {
        <li>No items</li>
      }
    </ul>
  }
  </>
}
\`\`\`

Use normal function returns for guard exits before entering template output. Filter a collection before passing it to \`@for\` when some items should not render, and use \` { ... }\` for the no-items fallback.

\`return\` statements are not template output. Put guard returns before the JSX statement container or return value, or render conditionally with \`@if\`. Inside TSRX \`@if\` branches and \`@for ... of\` loops, direct \`continue\`, \`break\`, and \`return\` statements are invalid. Inside a TSRX \`@switch\` case body, both \`break\` and \`return\` are invalid because cases are isolated template blocks.

TSRX rendering supports \`@for ... of\` list loops. Regular \`for\`, \`for...in\`, \`while\`, and \`do...while\` loops are not rendering constructs. Move imperative loops into setup code, a nested function, event handler, effect, or helper where normal JavaScript control-flow rules apply.

Source: website-tsrx/src/pages/features.tsrx#for`,
		},
		{
			slug: 'lazy-destructuring',
			title: 'Lazy Destructuring',
			use_cases: 'reactivity, lazy binding, ampersand destructuring, &[], &{}',
			content: `# Lazy Destructuring

TSRX supports lazy binding patterns prefixed with \`&\`. They bind by reference rather than by value. The target compiler provides the runtime semantics.

\`\`\`tsx
let &[count] = source;
let &{ name, age } = props;
\`\`\`

The language defines the syntax and AST shape. Target-specific docs should explain what source values are valid and how reads and writes are lowered for the active runtime.

Specification grammar:

\`\`\`text
${lazy_grammar}
\`\`\`

Source: website-tsrx/src/pages/specification.tsrx#lazy`,
		},
		{
			slug: 'style-and-server',
			title: 'Style and Server Extensions',
			use_cases:
				'style expressions, scoped css, module server, submodule imports, compile-time identifiers',
			content: `# Style and Server Extensions

Assign a \`<style>\` expression to expose scoped CSS class names declared in the current module.

\`\`\`tsx
const styles = <style>
  .card { padding: 1rem; }
</style>;

export function ChildCard() @{
  <>
  <Child class={styles.card} />
  </>
}
\`\`\`

\`module server { ... }\` declares a server-oriented submodule in the Ripple host profile. Import exported functions with \`import { load } from server\` before use.

Specification grammar:

\`\`\`text
${style_grammar}

${server_extension_grammar}
\`\`\`

Source: website-tsrx/src/pages/specification.tsrx#style`,
		},
		{
			slug: 'target-integration',
			title: 'Target Integration',
			use_cases:
				'runtime target, compiler package, target-specific setup, skills, runtime semantics',
			content: `# Target Integration

TSRX authoring syntax is shared, but output and runtime semantics are target-defined.

The core MCP server should detect the target, then hand off runtime-specific questions to a target-specific skill, prompt, resource set, or compiler-backed tool.

Target-specific layers should own:
- package installation and bundler setup
- runtime imports and helper APIs
- compiler warnings and semantic restrictions
- examples that depend on a specific rendering runtime

When helping in an existing project, detect the target before generating code. If no target-specific layer is available, stay within target-neutral TSRX syntax and ask for confirmation before assuming runtime APIs.

Source: website-tsrx/src/pages/getting-started.tsrx`,
		},
		{
			slug: 'tooling',
			title: 'Tooling',
			use_cases:
				'typescript plugin, typecheck, prettier, eslint, vscode, editor setup, diagnostics',
			content: `# Tooling

Common TSRX tooling packages:

- \`@tsrx/typescript-plugin\` for TypeScript integration and \`tsrx-tsc\`.
- \`@tsrx/prettier-plugin\` for formatting .tsrx files.
- \`@tsrx/eslint-plugin\` for linting.
- language server and editor integration packages for diagnostics, hover, completion, and definitions.

Use the project package manager and match the active target runtime's compiler and bundler integration.

Source: website-tsrx/src/pages/getting-started.tsrx#tooling-install`,
		},
	];

	const output = `// This file is generated by packages/tsrx-mcp/scripts/generate-docs-index.js.
// Do not edit it directly.

/** @typedef {{ slug: string, title: string, use_cases: string, content: string }} DocumentationSection */

/** @type {DocumentationSection[]} */
export const documentation_sections = ${JSON.stringify(docs, null, '\t')};
`;

	return prettier.format(output, {
		parser: 'babel',
		singleQuote: true,
		useTabs: true,
	});
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	fs.writeFileSync(generated_docs_path, await generate_docs_index());
}
