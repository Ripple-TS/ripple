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

	const component_grammar = extract_string_array_constant(
		'COMPONENT_GRAMMAR',
		specification_source,
	);
	const tsx_grammar = extract_string_array_constant('TSX_GRAMMAR', specification_source);
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
- component declarations use the component keyword.
- JSX-like elements can be written as statements inside component bodies.
- control-flow statements can contain template output.
- expression-position JSX must use <>...</> or <tsx>...</tsx>.
- lazy destructuring uses &[] and &{} for by-reference bindings.

The core language docs should stay target-neutral. After identifying the active runtime target, use target-specific docs, prompts, or skills for runtime imports, bundler setup, and semantics that are not defined by TSRX itself.

Source: website-tsrx/src/pages/specification.tsrx`,
		},
		{
			slug: 'components',
			title: 'Component Declarations',
			use_cases:
				'components, component keyword, props, authoring .tsrx files, no jsx return syntax',
			content: `# Component Declarations

Components are declared with the component keyword, not as functions returning JSX.

\`\`\`tsx
component Button(props: { label: string }) {
  <button>{props.label}</button>
}
\`\`\`

Inside a component body, template elements are statements. Do not generate \`return <div />\` from a component body. Use a bare \`return;\` only as a guard exit after emitting fallback template statements.

Specification grammar:

\`\`\`text
${component_grammar}
\`\`\`

Source: website-tsrx/src/pages/specification.tsrx#components`,
		},
		{
			slug: 'text-and-template-expressions',
			title: 'Text and Template Expressions',
			use_cases:
				'text children, quoted text, raw text errors, html, text directive, string literals',
			content: `# Text and Template Expressions

Raw unquoted text children are not valid TSRX. Static text should be written as a direct double-quoted child, and dynamic values should be wrapped in braces.

\`\`\`tsx
component Greeting({ name }: { name: string }) {
  <h1>"Hello"</h1>
  <p>{name}</p>
}
\`\`\`

Single-quoted strings and template literals remain JavaScript expressions, so they must be inside braces. Use \`{text expression}\` for explicit text and \`{html expression}\` only for trusted HTML.

Specification grammar:

\`\`\`text
${template_expression_grammar}
\`\`\`

Source: website-tsrx/src/pages/specification.tsrx#templates`,
		},
		{
			slug: 'tsx-expression-values',
			title: 'TSX Expression Values',
			use_cases:
				'fragments, tsx tag, pass jsx as prop, return jsx from helper, expression position jsx',
			content: `# TSX Expression Values

Regular template elements in component bodies are statements and have no value. When JSX must be used in expression position, wrap it in \`<>...</>\` or \`<tsx>...</tsx>\`.

\`\`\`tsx
component App() {
  const title = <><span>"Settings"</span></>;

  <Card title={title} />
}
\`\`\`

Use this for assigning JSX to variables, returning JSX from helper functions, or passing JSX as props. Do not write \`const el = <div />\` directly in TSRX component code.

Specification grammar:

\`\`\`text
${tsx_grammar}
\`\`\`

Source: website-tsrx/src/pages/specification.tsrx#tsx-islands`,
		},
		{
			slug: 'control-flow',
			title: 'Control Flow',
			use_cases:
				'if else, for loops, switch, try catch, conditional rendering, lists, guard returns',
			content: `# Control Flow

Standard JavaScript control flow can contain template statements inside component bodies and nested element children.

\`\`\`tsx
component List({ items }: { items: string[] }) {
  if (items.length === 0) {
    <p>"No items"</p>
    return;
  }

  <ul>
    for (const item of items) {
      <li>{item}</li>
    }
  </ul>
}
\`\`\`

A bare \`return;\` exits the current render path. A return with a value is invalid inside a TSRX component body.

Source: website-tsrx/src/pages/features.tsrx#if`,
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
			use_cases: 'style directive, scoped css, #server, server blocks, compile-time identifiers',
			content: `# Style and Server Extensions

\`{style "className"}\` is an attribute-value directive for scoped CSS class names declared in the current module.

\`\`\`tsx
<Child className={style "card"} />
\`\`\`

\`#server { ... }\` marks a lexical region intended for server compile targets. TSRX parses the block; target compilers decide how to emit or strip it.

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
- compatibility blocks and escape hatches
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
