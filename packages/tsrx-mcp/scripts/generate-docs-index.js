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

	const expression_island_grammar = extract_string_array_constant(
		'EXPRESSION_ISLAND_GRAMMAR',
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
- Components are ordinary TypeScript functions that return TSRX.
- TSRX opens in expression position, then template children use a template statement list inside the fragment.
- control-flow statements can contain template output.
- native TSRX can be returned directly as \`<div />\` or \`<>...</>\`; JSX-style values can use \`<tsx>...</tsx>\` when needed.
- lazy destructuring uses &[] and &{} for by-reference bindings.

The core language docs should stay target-neutral. After identifying the active runtime target, use target-specific docs, prompts, or skills for runtime imports, bundler setup, and semantics that are not defined by TSRX itself.

Source: website-tsrx/src/pages/specification.tsrx`,
		},
		{
			slug: 'components',
			title: 'Function Components',
			use_cases: 'components, functions, props, authoring .tsrx files, jsx return syntax',
			content: `# Function Components

Author UI as ordinary TypeScript functions that return TSRX.

\`\`\`tsx
function Button(props: { label: string }) {
  return <button>{props.label}</button>;
}
\`\`\`

Inside the returned TSRX fragment, template elements and control flow share the same template statement list.

Source: website-tsrx/src/pages/specification.tsrx#components`,
		},
		{
			slug: 'text-and-template-expressions',
			title: 'Text and Template Expressions',
			use_cases: 'text children, quoted text, raw text errors, string literals',
			content: `# Text and Template Expressions

Raw unquoted text children are not valid TSRX. Static text should be written as a direct double-quoted child, and dynamic values should be wrapped in braces.

\`\`\`tsx
function Greeting({ name }: { name: string }) {
  return <>
  <h1>"Hello"</h1>
  <p>{name}</p>
  </>;
}
\`\`\`

Single-quoted strings and template literals remain JavaScript expressions, so they must be inside braces. When you need explicit string coercion, write it in JavaScript with \`String(value)\`, \`value + ''\`, or a typed string value.

Specification grammar:

\`\`\`text
${template_expression_grammar}
\`\`\`

Source: website-tsrx/src/pages/specification.tsrx#templates`,
		},
		{
			slug: 'tsx-expression-values',
			title: 'Expression Values',
			use_cases:
				'fragments, tsrx tag, tsx tag, pass template as prop, return template from helper, render props, expression position jsx',
			content: `# Expression Values

Returned TSRX opens in expression position. Inside the TSRX fragment, template elements are statements and control flow can emit UI.

\`\`\`tsx
function App() {
  const title = <>"Settings"</>;

  return <Card title={title} />;
}
\`\`\`

Native TSRX expression fragments can contain setup statements and template control flow:

\`\`\`tsx
function badge(label: string) {
  return <>
    const normalized = label.trim();
    <span class="badge">{normalized}</span>
  </>;
}
\`\`\`

Use fragments for assigning UI to variables, returning UI from helper functions, or passing UI as props.

Specification grammar:

\`\`\`text
${expression_island_grammar}
\`\`\`

Source: website-tsrx/src/pages/specification.tsrx#tsx-islands`,
		},
		{
			slug: 'control-flow',
			title: 'Control Flow',
			use_cases:
				'if else, for loops, switch, try catch, conditional rendering, lists, guard returns',
			content: `# Control Flow

Standard JavaScript control flow can contain template statements inside returned TSRX fragments and nested element children.

\`\`\`tsx
function List({ items }: { items: string[] }) {
  return <>
  if (items.length === 0) {
    <p>"No items"</p>
  } else {
    <ul>
      for (const item of items; index i; key item) {
        if (!item) continue;
        <li>{item}</li>
      }
    </ul>
  }
  </>;
}
\`\`\`

Use normal function returns for guard exits before TSRX opens. Inside a nested TSRX loop body, \`continue\` skips the current rendered iteration.

\`return\` statements are invalid anywhere inside returned TSRX element or fragment bodies. Inside a TSRX \`for...of\` loop, \`continue\` skips the current rendered iteration and is the only supported top-level loop control-flow statement. \`break\` is invalid inside TSRX \`for...of\` loops; use \`continue\` for item skips and \`break\` only for \`switch\` cases.

TSRX rendering supports \`for...of\` list loops. Regular \`for\`, \`for...in\`, \`while\`, and \`do...while\` loops are not supported in TSRX template scope. Move imperative loops into a nested function, event handler, effect, or helper where normal JavaScript control flow rules apply.

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
				'style refs, scoped css, module server, submodule imports, compile-time identifiers',
			content: `# Style and Server Extensions

Use \`<style ref>\` to expose scoped CSS class names declared in the current module.

\`\`\`tsx
let styles;
return <>
  <Child className={styles.card} />
  <style ref={(s) => styles = s}>
    .card { padding: 1rem; }
  </style>
</>;
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
