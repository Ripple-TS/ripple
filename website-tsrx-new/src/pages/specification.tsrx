const MODIFIED_PRODUCTIONS = [
	'PrimaryExpression :',
	'  JSXElement',
	'  JSXFragment',
	'  JSXStyleElement',
	'  JSXCodeBlock',
	'  JSXIfExpression',
	'  JSXForExpression',
	'  JSXSwitchExpression',
	'  JSXTryExpression',
	'',
	'TemplateChild :',
	'  JSXText',
	'  JSXElement',
	'  JSXFragment',
	'  JSXStyleElement',
	'  JSXExpressionContainer',
	'  JSXCodeBlock',
	'  JSXIfExpression',
	'  JSXForExpression',
	'  JSXSwitchExpression',
	'  JSXTryExpression',
	'',
	'TemplateChildren :',
	'  TemplateChildList',
	'',
	'TemplateChildList :',
	'  TemplateChild',
	'  TemplateChildList TemplateChild',
	'',
	'TemplateOutput :',
	'  JSXElement',
	'  JSXFragment',
	'  JSXIfExpression',
	'  JSXForExpression',
	'  JSXSwitchExpression',
	'  JSXTryExpression',
	'',
	'BindingAtom :',
	'  LazyObjectBindingPattern',
	'  LazyArrayBindingPattern',
	'',
	'LazyObjectBindingPattern :',
	'  &{ BindingPropertyListopt }',
	'',
	'LazyArrayBindingPattern :',
	'  &[ BindingElementListopt ]',
	'',
	'JSXFragment :',
	'  <> TemplateChildrenopt </>',
].join('\n');

const FUNCTION_ENTRY_GRAMMAR = [
	'FunctionDeclaration :',
	'  function BindingIdentifier ( FormalParametersopt ) { FunctionBody }',
	'  function BindingIdentifier ( FormalParametersopt ) JSXCodeBlock',
	'',
	'FunctionExpression :',
	'  function BindingIdentifieropt ( FormalParametersopt ) { FunctionBody }',
	'  function BindingIdentifieropt ( FormalParametersopt ) JSXCodeBlock',
	'',
	'ReturnStatement :',
	'  return JSXElement ;',
	'  return JSXFragment ;',
	'  return JSXCodeBlock ;',
	'  return Expression ;',
].join('\n');

const EXPRESSION_VALUE_GRAMMAR = [
	'PrimaryExpression :',
	'  JSXElement',
	'  JSXFragment',
	'  JSXStyleElement',
	'  JSXCodeBlock',
	'  JSXIfExpression',
	'  JSXForExpression',
	'  JSXSwitchExpression',
	'  JSXTryExpression',
].join('\n');

const TEMPLATE_EXPRESSION_GRAMMAR = [
	'JSXTextChild :',
	'  JSXTextCharacters',
	'',
	'JSXExpressionContainer :',
	'  { AssignmentExpression }',
	'',
	'JSXCodeBlock :',
	'  @{ StatementListItemListopt TemplateOutput }',
	'',
	'TemplateBlock :',
	'  { TemplateChildrenopt }',
	'  { StatementListItemList TemplateOutput }',
	'',
	'JSXIfExpression :',
	'  @if ( Expression ) TemplateBlock',
	'  @if ( Expression ) TemplateBlock @else TemplateBlock',
	'  @if ( Expression ) TemplateBlock @else JSXIfExpression',
	'',
	'JSXForExpression :',
	'  @for ( ForHeader TemplateForOptionsopt ) TemplateBlock',
	'  @for ( ForHeader TemplateForOptionsopt ) TemplateBlock @empty TemplateBlock',
	'',
	'JSXSwitchExpression :',
	'  @switch ( Expression ) { JSXSwitchCaseListopt }',
	'',
	'JSXSwitchCase :',
	'  @case Expression : TemplateBlock',
	'  @default : TemplateBlock',
	'',
	'JSXTryExpression :',
	'  @try TemplateBlock @pending TemplateBlock',
	'  @try TemplateBlock @catch ( CatchParameteropt ) TemplateBlock',
].join('\n');

const LAZY_GRAMMAR = [
	'LazyAssignmentStatement :',
	'  LazyObjectBindingPattern = AssignmentExpression ;',
	'  LazyArrayBindingPattern = AssignmentExpression ;',
].join('\n');

const STYLE_GRAMMAR = [
	'JSXStyleElement :',
	'  <style JSXAttributesopt> CSSSource </style>',
].join('\n');

const DYNAMIC_TAG_GRAMMAR = [
	'JSXElementName :',
	'  JSXIdentifier',
	'  JSXMemberExpression',
	'  JSXNamespacedName',
	'  JSXExpressionContainer',
	'',
	'JSXExpressionContainer :',
	'  { AssignmentExpression }',
].join('\n');

const DYNAMIC_TAG_EXAMPLE = [
	'type Tag = \'section\' | \'article\';',
	'',
	'export function Panel({ as = \'section\', title }: { as?: Tag; title: string }) @{',
	'  <{as} className="panel">',
	'    <h2>{title}</h2>',
	'  </{as}>',
	'}',
].join('\n');

const SERVER_EXTENSION_GRAMMAR = [
	'SubmoduleDeclaration :',
	'  module Identifier { ModuleItemListopt }',
	'',
	'SubmoduleImportDeclaration :',
	'  import ImportClause from Identifier ;',
	'',
].join('\n');

const AST_NODE_MAPPING = [
	'Informative grammar-to-node correspondence',
	'',
	'FunctionDeclaration, FunctionExpression, ArrowFunctionExpression -> ESTree function nodes',
	'function ... @{ ... } -> ESTree function node with body: JSXCodeBlock',
	'return JSXElement -> ReturnStatement(argument: JSXElement)',
	'return JSXFragment -> ReturnStatement(argument: JSXFragment)',
	'return JSXCodeBlock -> ReturnStatement(argument: JSXCodeBlock)',
	'JSXElement -> ESTree JSXElement',
	'JSXFragment -> ESTree JSXFragment',
	'JSXText -> ESTree JSXText',
	'{ AssignmentExpression } in template position -> JSXExpressionContainer',
	'@{ StatementListItemListopt TemplateOutput } -> JSXCodeBlock',
	'JSXAttributeName JSXAttributeInitializeropt -> JSXAttribute',
	'{ ... AssignmentExpression } in attribute position -> JSXSpreadAttribute',
	'<style> CSSSource </style> -> JSXStyleElement',
	'@if -> JSXIfExpression',
	'@for -> JSXForExpression',
	'@switch -> JSXSwitchExpression',
	'@try -> JSXTryExpression',
	'module Identifier { ModuleItemListopt } -> TSModuleDeclaration',
	'import ImportClause from Identifier -> ImportDeclaration with Identifier source',
].join('\n');

const FUNCTION_AST_SHAPE = [
	'interface FunctionDeclaration {',
	'  type: \'FunctionDeclaration\';',
	'  id: Identifier | null;',
	'  params: Pattern[];',
	'  body: BlockStatement | JSXCodeBlock;',
	'  typeParameters?: TSTypeParameterDeclaration;',
	'}',
	'',
	'interface ReturnStatement {',
	'  type: \'ReturnStatement\';',
	'  argument: Expression | null;',
	'}',
].join('\n');

const TEMPLATE_AST_SHAPE = [
	'interface JSXElement {',
	'  type: \'JSXElement\';',
	'  openingElement: JSXOpeningElement;',
	'  closingElement: JSXClosingElement | null;',
	'  children: TemplateChild[];',
	'  metadata?: { native_tsrx?: true };',
	'}',
	'',
	'interface JSXOpeningElement {',
	'  type: \'JSXOpeningElement\';',
	'  name: JSXIdentifier | JSXMemberExpression | JSXNamespacedName | JSXExpressionContainer;',
	'  attributes: Array<JSXAttribute | JSXSpreadAttribute>;',
	'  selfClosing: boolean;',
	'}',
	'',
	'interface JSXExpressionContainer {',
	'  type: \'JSXExpressionContainer\';',
	'  expression: Expression | JSXEmptyExpression;',
	'}',
	'',
	'interface JSXText {',
	'  type: \'JSXText\';',
	'  value: string;',
	'}',
].join('\n');

const EXPRESSION_AST_SHAPE = [
	'interface JSXFragment {',
	'  type: \'JSXFragment\';',
	'  openingFragment: JSXOpeningFragment;',
	'  closingFragment: JSXClosingFragment;',
	'  children: TemplateChild[];',
	'  metadata?: { native_tsrx?: true };',
	'}',
	'',
	'type TSRXExpressionValue =',
	'  | JSXElement',
	'  | JSXFragment',
	'  | JSXStyleElement',
	'  | JSXCodeBlock',
	'  | JSXIfExpression',
	'  | JSXForExpression',
	'  | JSXSwitchExpression',
	'  | JSXTryExpression;',
	'',
	'type TemplateOutput =',
	'  | JSXElement',
	'  | JSXFragment',
	'  | JSXIfExpression',
	'  | JSXForExpression',
	'  | JSXSwitchExpression',
	'  | JSXTryExpression;',
	'',
	'type TemplateChild =',
	'  | JSXText',
	'  | JSXExpressionContainer',
	'  | JSXCodeBlock',
	'  | TemplateOutput',
	'  | JSXStyleElement;',
].join('\n');

const TSRX_EXTENSION_AST_SHAPE = [
	'interface JSXCodeBlock {',
	'  type: \'JSXCodeBlock\';',
	'  body: StatementListItem[];',
	'  render: TemplateOutput;',
	'}',
	'',
	'interface JSXStyleElement {',
	'  type: \'JSXStyleElement\';',
	'  openingElement: JSXOpeningElement;',
	'  closingElement: JSXClosingElement | null;',
	'  children: StyleSheet[];',
	'  css?: string;',
	'}',
	'',
	'interface JSXIfExpression {',
	'  type: \'JSXIfExpression\';',
	'  statementType: \'IfStatement\';',
	'  test: Expression;',
	'  consequent: Statement;',
	'  alternate: Statement | null;',
	'}',
	'',
	'interface JSXForExpression {',
	'  type: \'JSXForExpression\';',
	'  statementType: \'ForStatement\' | \'ForInStatement\' | \'ForOfStatement\';',
	'  body: Statement;',
	'  init?: VariableDeclaration | Expression | null;',
	'  test?: Expression | null;',
	'  update?: Expression | null;',
	'  left?: VariableDeclaration | Pattern;',
	'  right?: Expression;',
	'  await?: boolean;',
	'  index?: Identifier | null;',
	'  key?: Expression | null;',
	'  empty?: BlockStatement | null;',
	'}',
	'',
	'interface JSXSwitchExpression {',
	'  type: \'JSXSwitchExpression\';',
	'  statementType: \'SwitchStatement\';',
	'  discriminant: Expression;',
	'  cases: SwitchCase[];',
	'}',
	'',
	'interface JSXTryExpression {',
	'  type: \'JSXTryExpression\';',
	'  statementType: \'TryStatement\';',
	'  block: BlockStatement;',
	'  handler: CatchClause | null;',
	'  finalizer: BlockStatement | null;',
	'  pending?: BlockStatement | null;',
	'}',
].join('\n');

const SPECIAL_AST_SHAPE = [
	'interface TSModuleDeclaration {',
	'  type: \'TSModuleDeclaration\';',
	'  id: Identifier;',
	'  body: TSModuleBlock;',
	'}',
	'',
	'interface TSModuleBlock {',
	'  type: \'TSModuleBlock\';',
	'  body: Array<Statement | ImportDeclaration | ExportNamedDeclaration>;',
	'}',
	'',
	'interface CSSStyleSheet {',
	'  type: \'StyleSheet\';',
	'  children: Array<Atrule | Rule>;',
	'  source: string;',
	'  hash: string;',
	'}',
].join('\n');

const NAV_ITEMS = [
	{ id: 'status', label: 'Status' },
	{ id: 'introduction', label: 'Introduction' },
	{ id: 'rationale', label: 'Rationale' },
	{ id: 'conformance', label: 'Conformance' },
	{ id: 'notation', label: 'Notational Conventions' },
	{ id: 'lexical', label: 'Lexical Conventions' },
	{ id: 'productions', label: 'Modified Productions' },
	{ id: 'components', label: 'Function Bodies' },
	{ id: 'templates', label: 'Template Elements' },
	{ id: 'expression-values', label: 'Expression Values' },
	{ id: 'lazy', label: 'Lazy Destructuring' },
	{ id: 'style', label: 'Style Elements' },
	{ id: 'server-profile', label: 'Server Extensions' },
	{ id: 'early-errors', label: 'Early Errors' },
	{ id: 'host-defined', label: 'Host-defined Semantics' },
	{ id: 'appendices', label: 'Appendices' },
];

export function SpecificationPage() @{
	<>
		<title>TSRX | Specification</title>
		<meta
			name="description"
			content="Draft TSRX language specification: TypeScript-compatible JSX extensions, statement containers, control-flow expressions, lazy destructuring, style identifiers, and host-defined server extensions."
		/>
		<div class="app-shell">
			<div class="page-shell">
				<header class="masthead">
					<a class="brand-lockup" href="/" aria-label="TSRX home">
						<img class="header-logo" src="/images/tsrx-mark.svg?v=4" alt="TSRX logo" />
					</a>
					<nav class="masthead-nav">
						<a href="/getting-started">Getting Started</a>
						<a href="/features">Features</a>
						<a href="/specification" aria-current="page">Specification</a>
						<a href="/playground">Playground</a>
						<a href="/blog">Blog</a>
						<a href="https://discord.gg/HCYpT5QHQR" target="_blank" rel="noopener noreferrer">
							Discord
						</a>
						<a
							href="https://github.com/Ripple-TS/ripple/tree/main/packages/tsrx"
							target="_blank"
							rel="noopener noreferrer"
						>GitHub</a>
						<a href="/llms.txt" target="_blank" rel="noopener noreferrer">llms.txt</a>
					</nav>
				</header>

				<div class="docs-layout">
					<aside class="side-nav">
						<label class="side-nav-dropdown">
							<span class="side-nav-dropdown-label">Jump to section</span>
							<select
								class="side-nav-select"
								onChange={(event) => {
									const select = event.currentTarget as HTMLSelectElement;
									if (typeof window !== 'undefined' && select.value) {
										window.location.hash = select.value;
									}
								}}
							>
								<option value="">Jump to section</option>
								@for (const item of NAV_ITEMS) {
									<option value={item.id}>{item.label}</option>
								}
							</select>
						</label>
						<nav>
							<p class="side-nav-heading">Draft Spec</p>
							@for (const item of NAV_ITEMS) {
								<a class="side-nav-link" href={`#${item.id}`}>{item.label}</a>
							}
						</nav>
					</aside>

					<main class="docs-content">
						<section class="doc-section" id="status">
							<p class="section-kicker">Draft / June 7, 2026</p>
							<h1 class="page-heading">TSRX</h1>
							<p class="section-body lead">
								This page is the working language specification for TSRX. It is written for
								implementors of parsers, language tooling, compilers, and hosts that need a precise
								account of the syntax and static constraints of the language.
							</p>
							<div class="status-panel">
								<p class="status-chip">First-edition scope</p>
								<p class="section-body compact">
									The current draft fixes the syntax and early-error surface for JSX-shaped TSRX
									values, JSX statement containers, template control flow, lazy destructuring, raw
									style elements, and proposal-aligned submodule declarations.
								</p>
							</div>
						</section>

						<section class="doc-section" id="introduction">
							<h2 class="section-heading">Introduction</h2>
							<p class="section-body">
								TSRX is a TypeScript-compatible syntax extension to ECMAScript for authoring
								component-oriented user interface programs. It extends the TypeScript source
								language with JSX-shaped template values, JSX statement containers, template
								control-flow directives, lazy destructuring patterns, raw style elements, and style
								identifiers.
							</p>
							<p class="section-body">
								This specification defines the syntax of TSRX and the static constraints that a
								conforming implementation is expected to enforce. It does not propose incorporation
								of TSRX into the ECMAScript standard, and it does not require JavaScript engines or
								browsers to parse TSRX directly. Instead, it defines a source language intended for
								compilers, preprocessors, editors, formatters, and other tooling.
							</p>
							<p class="section-body">
								Unless this document explicitly states otherwise, a construct that is valid in the
								TypeScript baseline grammar remains valid in TSRX source text. The grammar additions
								in this document are therefore additive and TypeScript-compatible.
							</p>
						</section>

						<section class="doc-section" id="rationale">
							<h2 class="section-heading">Rationale</h2>
							<p class="section-body">
								TSRX exists to define a predictable syntax for component-oriented source code while
								preserving the familiar JSX AST shape. Elements, fragments, text, expression
								containers, attributes, and spread attributes use the standard JSX node family; TSRX
								adds only the nodes needed for statement containers, style blocks, and template
								control flow.
							</p>
							<ul class="spec-list">
								<li>
									Returned TSRX templates are represented with JSXElement and JSXFragment nodes.
								</li>
								<li>
									Native TSRX values can be assigned, returned, or passed as props using ordinary
									JSX-shaped nodes.
								</li>
								<li>
									Lazy destructuring is represented as source syntax rather than a host-specific
									library convention.
								</li>
								<li>
									Host features such as server execution and stylesheet composition can be specified
									cleanly on top of a shared grammar.
								</li>
							</ul>
						</section>

						<section class="doc-section" id="conformance">
							<h2 class="section-heading">1 Conformance</h2>
							<p class="section-body">
								An implementation of core TSRX conforms to this specification if it accepts
								TypeScript source text together with the additional TSRX constructs defined here,
								rejects source texts that violate the listed early-error rules, and documents any
								host-defined or profile-defined semantics that are not fixed by the core language.
							</p>
							<p class="section-body">
								This specification distinguishes between core TSRX and host profiles. Core TSRX
								defines the syntax and static rules common to all conforming implementations. A host
								profile may add profile-specific constructs or strengthen restrictions on core
								constructs.
							</p>
						</section>

						<section class="doc-section" id="notation">
							<h2 class="section-heading">2 Notational Conventions</h2>
							<p class="section-body">
								The syntactic and lexical grammar of ECMAScript are incorporated by reference as
								already extended by a TypeScript-compatible baseline grammar. When this document
								presents a modified production, it should be read as a delta against that baseline
								rather than as a complete restatement of the surrounding grammar.
							</p>
						</section>

						<section class="doc-section" id="lexical">
							<h2 class="section-heading">3 Modified Lexical Conventions</h2>
							<p class="section-body">
								TSRX introduces the whitespace-sensitive lazy-pattern introducers &amp;&#123; and
								&amp;[, and module declarations that can be imported by identifier source.
							</p>
							<p class="section-body">
								The ampersand introducer is part of the syntax of the lazy pattern itself.
								Implementations must not treat &amp; &#123; or &amp; [ as lazy pattern forms.
							</p>
						</section>

						<section class="doc-section" id="productions">
							<h2 class="section-heading">4.1 Modified Productions</h2>
							<p class="section-body">
								The following productions define the normative core additions for the first edition.
								They are additive over the TypeScript-compatible baseline grammar used by TSRX
								implementations.
							</p>
							<pre class="code-block plain">
								<code>{MODIFIED_PRODUCTIONS}</code>
							</pre>
						</section>

						<section class="doc-section" id="components">
							<h2 class="section-heading">4.2 Function Bodies and Returns</h2>
							<p class="section-body">
								TSRX does not define a component declaration form. Components are ordinary
								functions. A function can return a TSRX expression from a normal return statement,
								or use the statement-container body shorthand when the whole body is TypeScript
								setup followed by one rendered output.
							</p>
							<pre class="code-block plain">
								<code>{FUNCTION_ENTRY_GRAMMAR}</code>
							</pre>
							<p class="section-body muted">
								Class methods, object methods, arrow functions, and function expressions all remain
								ordinary TypeScript constructs. Hosts may choose which TSRX-producing functions are
								considered components.
							</p>
						</section>

						<section class="doc-section" id="templates">
							<h2 class="section-heading">4.3 Template Elements</h2>
							<p class="section-body">
								Within a returned TSRX template, direct element, fragment, style, text, and
								expression-container children use the standard JSX node family. JavaScript line and
								block comments are permitted between template children and do not render. Template
								control flow uses directive-prefixed
								<code class="inline-code">@if</code>
								,
								<code class="inline-code">@for</code>
								,
								<code class="inline-code">@switch</code>
								, and
								<code class="inline-code">@try</code>
								blocks whose bodies render template children.
							</p>
							<p class="section-body">
								Every JSX control-flow body is an implicit statement container and must use a
								<code class="inline-code">{'{}'}</code>
								template block after the directive header.
							</p>
							<p class="section-body">
								Each
								<code class="inline-code">@switch</code>
								<code class="inline-code">@case</code>
								and
								<code class="inline-code">@default</code>
								must use a
								<code class="inline-code">{'{}'}</code>
								template block. Cases are isolated: they do not fall through to later cases, and
								<code class="inline-code">break</code>
								and
								<code class="inline-code">return</code>
								are syntax errors inside a JSX switch case.
							</p>
							<p class="section-body">
								Plain JSX children are the default. When an expression position, function body,
								element child, or fragment child needs local TypeScript statements before rendering,
								those statements must be contained in a JSX statement container written as
								<code class="inline-code">{'@{...}'}</code>
								. A statement container places setup statements first and then exactly one output
								node: a JSX element, JSX fragment, or JSX control-flow expression. If the output
								needs text, expression containers, or multiple siblings after setup, wrap them in a
								JSX fragment.
							</p>
							<p class="section-body">
								Control-flow block bodies follow the same structural rule as statement containers:
								TypeScript first (although optional), then an optional rendered template output. The
								ordinary JSX form
								<code class="inline-code">{'{ AssignmentExpression }'}</code>
								contributes a JSXExpressionContainer node and is not itself a statement container. A
								function exit remains an ordinary
								<code class="inline-code">return</code>
								statement.
							</p>
							<pre class="code-block plain">
								<code>{TEMPLATE_EXPRESSION_GRAMMAR}</code>
							</pre>
							<p class="section-body">
								Runtime dynamic element and component selection uses the dynamic tag syntax: a JSX
								expression container in element-name position, written
								<code class="inline-code">{'<{expression}>'}</code>
								. The expression can evaluate to a string tag name or a component constructor, and a
								non-self-closing element repeats the same expression in its closing tag:
								<code class="inline-code">{'</{expression}>'}</code>
								. No runtime import is required; each target compiler lowers the form to its own
								runtime helper.
							</p>
							<pre class="code-block plain">
								<code>{DYNAMIC_TAG_GRAMMAR}</code>
							</pre>
							<pre class="code-block plain">
								<code>{DYNAMIC_TAG_EXAMPLE}</code>
							</pre>
							<p class="section-body">
								The tag expression must be able to resolve to an element name: an identifier, member
								access, static string, or a runtime expression composed of those. Calls, spreads,
								string concatenation, string interpolation, and static non-string literals are not
								valid dynamic tag expressions. Forms such as
								<code class="inline-code">{'<@tag />'}</code>
								and
								<code class="inline-code">{'<@Component />'}</code>
								are not dynamic tag syntax in current TSRX.
							</p>
							<ul class="spec-list">
								<li>
									A JSX text child is represented by
									<code class="inline-code">JSXText</code>
									and contributes escaped static text. Character references such as
									<code class="inline-code">{'&quot;'}</code>
									are decoded before the text value is stored.
								</li>
								<li>
									<code class="inline-code">{'{ AssignmentExpression }'}</code>
									is the generic template-expression form and is represented by
									<code class="inline-code">JSXExpressionContainer</code>
									.
								</li>
								<li>
									<code class="inline-code">{'@{...}'}</code>
									is the template statement form and is represented by
									<code class="inline-code">JSXCodeBlock</code>
									.
								</li>
								<li>
									Identifiers named
									<code class="inline-code">text</code>
									are ordinary identifiers in braced template expressions.
								</li>
							</ul>
							<h3 class="appendix-heading">4.3.1 Whitespace</h3>
							<p class="section-body">
								Whitespace in template syntax follows ordinary ECMAScript token-separation rules
								except at a small number of JSX-like boundaries where the delimiter itself is
								whitespace-sensitive.
							</p>
							<ul class="spec-list">
								<li>
									Within
									<code class="inline-code">{'{ AssignmentExpression }'}</code>
									, whitespace and line terminators are admitted wherever the embedded ECMAScript
									grammar permits them. Thus forms such as
									<code class="inline-code">{'{ expr }'}</code>
									are well-formed.
								</li>
								<li>
									The statement-container introducer must be written as the contiguous sequence
									<code class="inline-code">{'@{'}</code>
									. Whitespace between
									<code class="inline-code">@</code>
									and
									<code class="inline-code">{'{'}</code>
									does not form a JSXCodeBlock.
								</li>
								<li>
									A tag or fragment introducer must be written as a contiguous delimiter sequence.
									Implementations must not treat
									<code class="inline-code">{'< div>'}</code>
									,
									<code class="inline-code">{'< /div>'}</code>
									,
									<code class="inline-code">{'</ div>'}</code>
									,
									<code class="inline-code">{'< >'}</code>
									, or
									<code class="inline-code">{'< / >'}</code>
									as TSRX template delimiters.
								</li>
								<li>
									Whitespace and comments are not admitted within a single tag name. Source texts
									such as
									<code class="inline-code">{'<Foo . Bar>'}</code>
									do not form a single TSRX tag name.
								</li>
								<li>
									Indentation and line breaks between adjacent template children are permitted as
									layout. They do not require explicit expression containers merely to separate one
									element child from the next.
								</li>
							</ul>
							<p class="section-body">
								The raw style element is also part of this syntax. A style body is captured as raw
								text for host-defined stylesheet processing rather than being parsed as nested
								template children.
							</p>
						</section>

						<section class="doc-section" id="expression-values">
							<h2 class="section-heading">4.4 Expression Values</h2>
							<p class="section-body">
								TSRX elements, fragments, style elements, and JSX control-flow expressions are
								expression values by default. A single element can be returned or assigned directly,
								and JSX control flow can be assigned directly when the branch or loop itself is the
								value.
							</p>
							<pre class="code-block plain">
								<code>{EXPRESSION_VALUE_GRAMMAR}</code>
							</pre>
							<p class="section-body">
								Use a fragment when an expression value needs text, dynamic expression children, or
								multiple emitted elements. Use a JSX statement container when local declarations
								must precede that output, including in arrow expression bodies and
								statement-container function bodies. Use a single element when the value is already
								compact.
							</p>
						</section>

						<section class="doc-section" id="lazy">
							<h2 class="section-heading">4.5 Lazy Destructuring</h2>
							<p class="section-body">
								TSRX extends the baseline binding grammar with lazy array and object forms. The
								syntax is fixed by the language. The runtime observation model is not. Hosts may
								implement lazy bindings as deferred property reads, reactive accessors, or another
								equivalent mechanism, provided the syntactic and static constraints remain
								satisfied.
							</p>
							<pre class="code-block plain">
								<code>{LAZY_GRAMMAR}</code>
							</pre>
						</section>

						<section class="doc-section" id="style">
							<h2 class="section-heading">4.6 Style Elements and Style Identifiers</h2>
							<p class="section-body">
								The syntax of raw style elements is part of core TSRX. The host is responsible for
								the meaning of selector scoping, generated class names, selector eligibility, style
								expression class maps, and stylesheet registration.
							</p>
							<pre class="code-block plain">
								<code>{STYLE_GRAMMAR}</code>
							</pre>
						</section>

						<section class="doc-section" id="server-profile">
							<h2 class="section-heading">4.7 Host-defined Server Extensions</h2>
							<p class="section-body">
								Submodule declarations are documented in the first edition as a generic extension
								surface aligned with the TC39 module declarations proposal. Ripple currently defines
								one host profile for this surface: module server declarations and imports from
								server.
							</p>
							<pre class="code-block plain">
								<code>{SERVER_EXTENSION_GRAMMAR}</code>
							</pre>
						</section>

						<section class="doc-section" id="early-errors">
							<h2 class="section-heading">5 Static Semantics: Early Errors</h2>
							<ul class="spec-list">
								<li>
									A tag or fragment delimiter must not be split by intervening whitespace at the
									points described in 4.3.1.
								</li>
								<li>Opening and closing tags for TSRX elements and fragments must match.</li>
								<li>
									A JSXCodeBlock or template control-flow block that contains TypeScript setup
									statements and rendered output must place those statements before the output node
									and must have exactly one output node.
								</li>
								<li>
									A statement-container function body follows the same structural rule as any other
									JSXCodeBlock.
								</li>
								<li>
									A standalone
									<code class="inline-code">JSXExpressionContainer</code>
									is not a template output node. Use a JSX fragment when a statement container or
									control-flow block needs to render text, expression containers, or multiple
									siblings.
								</li>
								<li>
									In hosts that enable server-oriented submodules, server exports must be imported
									before use, for example import &#123; load &#125; from server.
								</li>
								<li>
									Host profiles may restrict which submodule names are supported and may impose
									additional restrictions on referenced bindings.
								</li>
								<li>
									TSRX template children must not appear outside a JSXElement or JSXFragment body.
								</li>
							</ul>
						</section>

						<section class="doc-section" id="host-defined">
							<h2 class="section-heading">6 Host-defined Semantics</h2>
							<p class="section-body">
								The purpose of the core specification is to make parsers, tooling, and language
								consumers agree on what TSRX source text means as syntax. The purpose of host
								documentation is to explain how that syntax is executed, lowered, or bound to
								runtime facilities.
							</p>
							<ul class="spec-list">
								<li>How functions returning TSRX lower into executable host code.</li>
								<li>How lazy destructuring is realized at runtime.</li>
								<li>How style expressions expose generated or scoped class names.</li>
								<li>
									How the dynamic tag syntax
									<code class="inline-code">{'<{expression}>'}</code>
									is lowered, and how the resolved value selects between string tags and component
									constructors at runtime.
								</li>
								<li>
									How submodule declarations and imports from identifier sources are compiled or
									executed by a host profile that enables them.
								</li>
							</ul>
						</section>

						<section class="doc-section" id="appendices">
							<h2 class="section-heading">Appendices</h2>
							<p class="section-body">
								The TSRX AST contract exposes ESTree-compatible function nodes and standard
								JSX-shaped nodes such as JSXElement, JSXFragment, JSXExpressionContainer, JSXText,
								JSXAttribute, and JSXSpreadAttribute. TSRX-specific additions are limited to
								JSXCodeBlock, JSXStyleElement, JSXIfExpression, JSXForExpression,
								JSXSwitchExpression, JSXTryExpression, TSModuleDeclaration, and TSModuleBlock. The
								grammar in sections 4.1 through 4.7 is normative; the node shapes in this appendix
								are informative and describe the parser contract exposed to tooling.
							</p>
							<h3 class="appendix-heading">A.1 Grammar-to-node correspondence</h3>
							<p class="section-body">
								The reference parser follows the same broad editorial pattern used by the JSX
								specification: grammar productions define the accepted source forms, and a separate
								AST layer records those forms in a stable shape for downstream tools. The following
								correspondence summarizes the first-edition mappings.
							</p>
							<pre class="code-block plain">
								<code>{AST_NODE_MAPPING}</code>
							</pre>
							<h3 class="appendix-heading">A.2 Function body and return nodes</h3>
							<p class="section-body">
								Functions remain ordinary ESTree function nodes. TSRX structure begins where a
								JSXElement, JSXFragment, JSXStyleElement, JSXCodeBlock, or JSX control-flow
								expression appears as an expression value, most commonly as a ReturnStatement
								argument. The statement-container function body shorthand stores a JSXCodeBlock
								directly in the function node's body field without introducing a separate component
								node kind.
							</p>
							<pre class="code-block plain">
								<code>{FUNCTION_AST_SHAPE}</code>
							</pre>
							<ul class="spec-list">
								<li>
									The function id and params fields preserve the ordinary TypeScript function
									surface, including type annotations and lazy patterns after parsing.
								</li>
								<li>
									Ordinary function bodies remain BlockStatement nodes. A statement-container
									function body is represented as a JSXCodeBlock in the function body's place.
								</li>
								<li>
									A returned or expression-position statement container is represented as a
									JSXCodeBlock expression.
								</li>
								<li>
									A returned native fragment is represented by a JSXFragment node whose children
									store template children in source order.
								</li>
								<li>
									Local template setup is represented by JSXCodeBlock nodes rather than by placing
									ordinary statement nodes directly in JSXElement or JSXFragment children.
								</li>
								<li>
									Raw style elements inside a returned TSRX template carry parsed stylesheet
									metadata for downstream analysis and target-specific style emission.
								</li>
								<li>
									Default exports are represented through the ordinary ESTree
									ExportDefaultDeclaration wrapping the function declaration or expression.
								</li>
								<li>
									Implementation metadata may additionally record topScopedClasses for downstream
									style-ref analysis.
								</li>
							</ul>
							<h3 class="appendix-heading">A.3 Template and attribute nodes</h3>
							<p class="section-body">
								Template children reuse the JSX AST shape. This appendix distinguishes the element
								node itself from the JSX opening-tag and attribute nodes that refine it.
							</p>
							<pre class="code-block plain">
								<code>{TEMPLATE_AST_SHAPE}</code>
							</pre>
							<ul class="spec-list">
								<li>
									JSXOpeningElement.name is a JSXIdentifier for ordinary tag names, a
									JSXMemberExpression for dotted names, a JSXNamespacedName for namespaced names,
									and a JSXExpressionContainer for dynamic tags written as
									<code class="inline-code">{'<{expression}>'}</code>
									. Dynamic tags additionally mark the element, its opening element, and the name
									container with an
									<code class="inline-code">isDynamic</code>
									flag for downstream tooling.
								</li>
								<li>
									openingElement and closingElement preserve the original tag delimiters so
									formatters and source-mapping tools can recover the authored shape.
								</li>
								<li>
									JSXOpeningElement.selfClosing records self-closing syntax, while unclosed recovery
									metadata may be attached by the parser in loose scenarios.
								</li>
								<li>
									JSXExpressionContainer wraps the embedded ECMAScript expression from the ordinary
									&#123;expr&#125; template form.
								</li>
								<li>
									JSXText records a raw text child. Static text children decode JSX character
									references before the text value is stored.
								</li>
								<li>
									JSXAttribute.value is null for boolean-style attributes with no initializer.
									Shorthand attributes are represented as JSXAttribute nodes with parser metadata.
								</li>
								<li>
									JSXSpreadAttribute.argument preserves the original ECMAScript expression payload
									carried by the attribute form.
								</li>
								<li>
									Current implementations may additionally attach style-element-specific details
									such as captured stylesheet source text or styleScopeHash when the element is a
									raw
									<code class="inline-code">{'<style>'}</code>
									tag, but those details are not part of the general JSXElement shape described
									here.
								</li>
							</ul>
							<h3 class="appendix-heading">A.4 Expression value nodes</h3>
							<p class="section-body">
								Expression-position TSRX values use JSXElement, JSXFragment, JSXStyleElement,
								JSXCodeBlock, JSXIfExpression, JSXForExpression, JSXSwitchExpression, and
								JSXTryExpression nodes. Native fragments use the standard JSXFragment shape.
							</p>
							<pre class="code-block plain">
								<code>{EXPRESSION_AST_SHAPE}</code>
							</pre>
							<ul class="spec-list">
								<li>
									JSXFragment corresponds to &lt;&gt; ... &lt;/&gt; when that form appears in
									expression position. Its children array follows the TSRX template-child model.
								</li>
								<li>
									openingFragment and closingFragment preserve fragment delimiters for formatter and
									source-mapping tools.
								</li>
							</ul>
							<h3 class="appendix-heading">A.5 TSRX extension nodes</h3>
							<p class="section-body">
								The following nodes are the TSRX-specific additions. Statement containers are
								represented by JSXCodeBlock nodes in expression, child, and function-body positions.
								Style blocks are represented as JSXStyleElement nodes. Control-flow directives are
								represented directly by JSXIfExpression, JSXForExpression, JSXSwitchExpression, and
								JSXTryExpression nodes.
							</p>
							<pre class="code-block plain">
								<code>{TSRX_EXTENSION_AST_SHAPE}</code>
							</pre>
							<ul class="spec-list">
								<li>
									The AST contract emits
									<code class="inline-code">JSXIfExpression</code>
									,
									<code class="inline-code">JSXForExpression</code>
									,
									<code class="inline-code">JSXSwitchExpression</code>
									, and
									<code class="inline-code">JSXTryExpression</code>
									for template control flow.
								</li>
								<li>
									<code class="inline-code">JSXCodeBlock</code>
									is a template child and expression value, not a general ECMAScript statement node.
									Its render field is the one node produced by the container after setup.
								</li>
							</ul>
							<h3 class="appendix-heading">A.6 Submodules, special identifiers, and stylesheets</h3>
							<p class="section-body">
								TSRX reuses TypeScript-compatible module declaration node shapes for submodules and
								extends ImportDeclaration sources so a source may be an Identifier. These nodes are
								intentionally narrow: most of their semantics come from surrounding grammar or from
								host-defined analysis, not from a wide intrinsic property surface.
							</p>
							<pre class="code-block plain">
								<code>{SPECIAL_AST_SHAPE}</code>
							</pre>
							<ul class="spec-list">
								<li>
									TSModuleDeclaration represents module Identifier &#123; ... &#125; submodules.
								</li>
								<li>
									ImportDeclaration.source may be an Identifier for imports from a declared
									submodule.
								</li>
								<li>
									Ripple records exported names from module server declarations for downstream RPC
									analysis.
								</li>
								<li>
									CSSStyleSheet metadata is attached to raw style elements in returned TSRX
									templates and stores both the original stylesheet source text and the stable hash
									used by current host implementations for scoping.
								</li>
							</ul>
							<p class="section-body">
								The reference parser is built on Acorn with @sveltejs/acorn-typescript and extended
								by a custom TSRXPlugin. This is why the grammar in this draft is framed as additive
								over a TypeScript-compatible baseline rather than as a language unrelated to
								TypeScript source syntax.
							</p>
						</section>
					</main>
				</div>

				<footer class="site-footer">
					<p>Released under the MIT License.</p>
					<p>Copyright © 2025-present Dominic Gannaway</p>
				</footer>
			</div>
		</div>
		<style>
			.page-shell {
				width: min(1180px, calc(100vw - 2rem));
				margin: 0 auto;
				padding: 1rem 0 4rem;
			}

			.docs-layout {
				display: grid;
				grid-template-columns: 220px 1fr;
				gap: 3rem;
				align-items: start;
			}

			.doc-section {
				margin-top: 3rem;
			}

			.page-heading {
				margin: 0;
				font-size: clamp(2.4rem, 5vw, 4rem);
				line-height: 1;
				letter-spacing: -0.05em;
			}

			.section-kicker {
				margin: 0 0 0.75rem;
				font-size: 0.82rem;
				font-weight: 700;
				text-transform: uppercase;
				letter-spacing: 0.12em;
				color: #5e2cff;
			}

			.section-heading {
				margin: 0 0 0.75rem;
				font-size: clamp(1.5rem, 3vw, 2rem);
				line-height: 1.1;
				letter-spacing: -0.03em;
			}

			.appendix-heading {
				margin: 1.75rem 0 0.65rem;
				font-size: clamp(1.1rem, 2vw, 1.35rem);
				line-height: 1.2;
				letter-spacing: -0.02em;
			}

			.section-body.lead {
				font-size: 1.15rem;
			}

			.section-body.compact {
				font-size: 0.98rem;
			}

			.status-panel {
				margin-top: 1rem;
				padding: 1rem 1.1rem;
				border: 1px solid rgba(94, 44, 255, 0.14);
				border-radius: 16px;
				background: rgba(94, 44, 255, 0.04);
			}

			.status-chip {
				margin: 0;
				font-size: 0.78rem;
				font-weight: 700;
				text-transform: uppercase;
				letter-spacing: 0.1em;
				color: #5e2cff;
			}

			.spec-list {
				margin: 0.9rem 0 0;
				padding-left: 1.2rem;
				color: rgba(26, 22, 64, 0.76);
			}

			.spec-list li {
				margin-top: 0.5rem;
				font-size: 1rem;
				line-height: 1.7;
			}

			.code-block {
				border-radius: 18px;
			}

			.code-block.plain {
				color: #dbe6ff;
			}

			.section-body {
				margin: 0.5rem 0 0;
				font-size: 1.05rem;
				line-height: 1.7;
				color: rgba(26, 22, 64, 0.76);
			}
			.section-body.muted {
				color: rgba(26, 22, 64, 0.55);
				font-style: italic;
			}
			.section-body a:not(.cta-link) {
				display: inline-block;
				margin: 0 0.18em;
			}
			.doc-section:first-child {
				margin-top: 0.5rem;
			}
			@media (max-width: 720px) {
				.page-shell {
					width: calc(100vw - 1.5rem);
					padding: 0.5rem 0 2rem;
				}

				.masthead {
					padding: 0.75rem 0 1rem;
					align-items: flex-start;
					gap: 0.85rem;
				}

				.brand-lockup {
					width: 100%;
					justify-content: center;
				}

				.masthead-nav {
					display: flex;
					width: 100%;
					flex-wrap: wrap;
					justify-content: center;
					gap: 0.5rem;
					font-size: 0.82rem;
				}

				.masthead-nav a {
					display: inline-flex;
					align-items: center;
					min-height: 2rem;
					padding: 0.35rem 0.7rem;
					border: 1px solid rgba(94, 44, 255, 0.1);
					border-radius: 999px;
					background: rgba(94, 44, 255, 0.06);
					line-height: 1.1;
				}

				.masthead-nav a[aria-current='page'] {
					background: rgba(94, 44, 255, 0.12);
					border-color: rgba(94, 44, 255, 0.18);
				}

				.header-logo {
					width: 3.6rem;
					height: 3.6rem;
				}

				.docs-layout {
					display: block;
				}

				.side-nav {
					position: sticky;
					top: 0;
					z-index: 5;
					padding: 0.6rem 0;
					border-bottom: 1px solid rgba(26, 22, 64, 0.1);
					margin-bottom: 1rem;
				}

				.side-nav-dropdown {
					display: block;
				}

				.side-nav nav {
					display: none;
				}

				.side-nav-dropdown-label {
					margin-bottom: 0.35rem;
				}

				.side-nav-select {
					font-size: 0.95rem;
				}

				.side-nav-link {
					display: inline-block;
					padding: 0.25rem 0.6rem;
					font-size: 0.82rem;
				}

				.doc-section {
					margin-top: 2rem;
				}

				.section-heading {
					font-size: clamp(1.3rem, 5vw, 1.65rem);
				}

				.section-body,
				.spec-list li {
					font-size: 0.95rem;
				}

				.site-footer {
					margin-top: 2rem;
					padding: 1.5rem 0;
				}
			}
		</style>
	</>
}
