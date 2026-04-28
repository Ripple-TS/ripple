/** @typedef {{ slug: string, title: string, use_cases: string, content: string }} DocumentationSection */

/** @type {DocumentationSection[]} */
export const documentation_sections = [
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

The core language docs should stay target-neutral. After identifying the active runtime target, use target-specific docs, prompts, or skills for runtime imports, bundler setup, and semantics that are not defined by TSRX itself.`,
	},
	{
		slug: 'components',
		title: 'Component Declarations',
		use_cases: 'components, component keyword, props, authoring .tsrx files, no jsx return syntax',
		content: `# Component Declarations

Components are declared with the component keyword, not as functions returning JSX.

\`\`\`tsx
component Button(props: { label: string }) {
  <button>{props.label}</button>
}
\`\`\`

Inside a component body, template elements are statements. Do not generate \`return <div />\` from a component body. Use a bare \`return;\` only as a guard exit after emitting fallback template statements.`,
	},
	{
		slug: 'text-and-template-expressions',
		title: 'Text and Template Expressions',
		use_cases: 'text children, quoted text, raw text errors, html, text directive, string literals',
		content: `# Text and Template Expressions

Raw unquoted text children are not valid TSRX. Static text should be written as a direct double-quoted child, and dynamic values should be wrapped in braces.

\`\`\`tsx
component Greeting({ name }: { name: string }) {
  <h1>"Hello"</h1>
  <p>{name}</p>
}
\`\`\`

Single-quoted strings and template literals remain JavaScript expressions, so they must be inside braces. Use \`{text expression}\` for explicit text and \`{html expression}\` only for trusted HTML.`,
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

Use this for assigning JSX to variables, returning JSX from helper functions, or passing JSX as props. Do not write \`const el = <div />\` directly in TSRX component code.`,
	},
	{
		slug: 'control-flow',
		title: 'Control Flow',
		use_cases: 'if else, for loops, switch, try catch, conditional rendering, lists, guard returns',
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

A bare \`return;\` exits the current render path. A return with a value is invalid inside a TSRX component body.`,
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

The language defines the syntax and AST shape. Target-specific docs should explain what source values are valid and how reads and writes are lowered for the active runtime.`,
	},
	{
		slug: 'style-and-server',
		title: 'Style and Server Extensions',
		use_cases: '#style, scoped css, #server, server blocks, compile-time identifiers',
		content: `# Style and Server Extensions

\`#style\` is a compile-time identifier for scoped CSS class names declared in the current module.

\`\`\`tsx
<div class={#style.card} />
\`\`\`

\`#server { ... }\` marks a lexical region intended for server compile targets. TSRX parses the block; target compilers decide how to emit or strip it.`,
	},
	{
		slug: 'target-integration',
		title: 'Target Integration',
		use_cases: 'runtime target, compiler package, target-specific setup, skills, runtime semantics',
		content: `# Target Integration

TSRX authoring syntax is shared, but output and runtime semantics are target-defined.

The core MCP server should detect the target, then hand off runtime-specific questions to a target-specific skill, prompt, resource set, or compiler-backed tool.

Target-specific layers should own:
- package installation and bundler setup
- runtime imports and helper APIs
- compatibility blocks and escape hatches
- compiler warnings and semantic restrictions
- examples that depend on a specific rendering runtime

When helping in an existing project, detect the target before generating code. If no target-specific layer is available, stay within target-neutral TSRX syntax and ask for confirmation before assuming runtime APIs.`,
	},
	{
		slug: 'tooling',
		title: 'Tooling',
		use_cases: 'typescript plugin, typecheck, prettier, eslint, vscode, editor setup, diagnostics',
		content: `# Tooling

Common TSRX tooling packages:

- \`@tsrx/typescript-plugin\` for TypeScript integration and \`tsrx-tsc\`.
- \`@tsrx/prettier-plugin\` for formatting .tsrx files.
- \`@tsrx/eslint-plugin\` for linting.
- language server and editor integration packages for diagnostics, hover, completion, and definitions.

Use the project package manager and match the active target runtime's compiler and bundler integration.`,
	},
];

/**
 * @param {string} value
 */
function normalize(value) {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

/**
 * @returns {DocumentationSection[]}
 */
export function list_documentation_sections() {
	return documentation_sections;
}

/**
 * @param {string} section
 */
export function find_documentation_section(section) {
	const normalized = normalize(section);
	return (
		documentation_sections.find(
			(candidate) =>
				candidate.slug === normalized ||
				normalize(candidate.title) === normalized ||
				candidate.slug === section,
		) ?? null
	);
}

/**
 * @param {string} section
 */
export function find_similar_documentation_sections(section) {
	const normalized = normalize(section);
	return documentation_sections.filter(
		(candidate) =>
			candidate.slug.includes(normalized) ||
			normalize(candidate.title).includes(normalized) ||
			candidate.use_cases.toLowerCase().includes(section.toLowerCase()),
	);
}
