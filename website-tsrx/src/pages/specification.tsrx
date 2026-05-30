const MODIFIED_PRODUCTIONS = [
	'PrimaryExpression :',
	'  TsrxExpression',
	'  TsxCompatExpression',
	'',
	'TemplateStatementListItem :',
	'  ElementStatement',
	'  LazyAssignmentStatement',
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
	'TsrxExpression :',
	'  Element',
	'  <> TemplateChildrenopt </>',
	'',
	'TsxCompatExpression :',
	'  <tsx: IdentifierName> TsxChildrenopt </tsx: IdentifierName>',
].join('\n');

const FUNCTION_ENTRY_GRAMMAR = [
	'FunctionDeclaration :',
	'  function BindingIdentifier ( FormalParametersopt ) { FunctionBody }',
	'',
	'ReturnStatement :',
	'  return TsrxExpression ;',
	'  return Expression ;',
].join('\n');

const EXPRESSION_ISLAND_GRAMMAR = [
	'TsrxExpression :',
	'  Element',
	'  <> TemplateChildrenopt </>',
	'',
	'TsxCompatElement :',
	'  <tsx: IdentifierName> TsxChildrenopt </tsx: IdentifierName>',
].join('\n');

const TEMPLATE_EXPRESSION_GRAMMAR = [
	'DoubleQuotedTextChild :',
	'  " JSXStringCharactersopt "',
	'',
	'TemplateExpression :',
	'  { AssignmentExpression }',
].join('\n');

const LAZY_GRAMMAR = [
	'LazyAssignmentStatement :',
	'  LazyObjectBindingPattern = AssignmentExpression ;',
	'  LazyArrayBindingPattern = AssignmentExpression ;',
].join('\n');

const STYLE_GRAMMAR = [
	'StyleElement :',
	'  <style JSXAttributesopt> CSSSource </style>',
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
	'return TsrxExpression -> ReturnStatement(argument: TsrxFragment)',
	'ElementStatement -> Element',
	'{ AssignmentExpression } in template position -> TSRXExpression',
	'DoubleQuotedTextChild -> Text',
	'JSXAttributeName JSXAttributeInitializeropt -> Attribute',
	'{ ... AssignmentExpression } in attribute position -> SpreadAttribute',
	'<> TemplateChildrenopt </> -> TsrxFragment',
	'<tsx: IdentifierName> TsxChildrenopt </tsx: IdentifierName> -> TsxCompat',
	'module Identifier { ModuleItemListopt } -> TSModuleDeclaration',
	'import ImportClause from Identifier -> ImportDeclaration with Identifier source',
].join('\n');

const FUNCTION_AST_SHAPE = [
	'interface FunctionDeclaration {',
	'  type: \'FunctionDeclaration\';',
	'  id: Identifier | null;',
	'  params: Pattern[];',
	'  body: BlockStatement;',
	'  typeParameters?: TSTypeParameterDeclaration;',
	'}',
	'',
	'interface ReturnStatement {',
	'  type: \'ReturnStatement\';',
	'  argument: Expression | TsrxFragment | TsxCompat | null;',
	'}',
].join('\n');

const TEMPLATE_AST_SHAPE = [
	'interface Element {',
	'  type: \'Element\';',
	'  id: Identifier | MemberExpression;',
	'  attributes: Array<Attribute | SpreadAttribute>;',
	'  children: Node[];',
	'  openingElement: JSXOpeningElement;',
	'  closingElement: JSXClosingElement;',
	'  selfClosing?: boolean;',
	'  unclosed?: boolean;',
	'}',
	'',
	'interface TSRXExpression {',
	'  type: \'TSRXExpression\';',
	'  expression: Expression;',
	'}',
	'',
	'interface Text {',
	'  type: \'Text\';',
	'  expression: Expression;',
	'}',
	'interface Attribute {',
	'  type: \'Attribute\';',
	'  name: Identifier;',
	'  value: Expression | null;',
	'  shorthand?: boolean;',
	'}',
	'',
	'interface SpreadAttribute {',
	'  type: \'SpreadAttribute\';',
	'  argument: Expression;',
	'}',
].join('\n');

const TSX_AST_SHAPE = [
	'interface TsrxFragment {',
	'  type: \'TsrxFragment\';',
	'  attributes: Array<any>;',
	'  children: Node[];',
	'  openingElement: JSXOpeningElement;',
	'  closingElement: JSXClosingElement;',
	'  selfClosing?: boolean;',
	'  unclosed?: boolean;',
	'}',
	'',
	'interface TsxCompat {',
	'  type: \'TsxCompat\';',
	'  kind: string;',
	'  attributes: Array<any>;',
	'  children: JSXChild[];',
	'  openingElement: JSXOpeningElement;',
	'  closingElement: JSXClosingElement;',
	'  selfClosing?: boolean;',
	'  unclosed?: boolean;',
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
	{ id: 'components', label: 'Function Returns' },
	{ id: 'templates', label: 'Template Elements' },
	{ id: 'tsx-islands', label: 'Expression Islands' },
	{ id: 'lazy', label: 'Lazy Destructuring' },
	{ id: 'style', label: 'Style Elements' },
	{ id: 'server-profile', label: 'Server Extensions' },
	{ id: 'early-errors', label: 'Early Errors' },
	{ id: 'host-defined', label: 'Host-defined Semantics' },
	{ id: 'appendices', label: 'Appendices' },
];

export function SpecificationPage() {
	return <>
		<head>
			<title>{'TSRX | Specification'}</title>
			<meta
				name="description"
				content="Draft TSRX language specification: TypeScript-compatible grammar extensions, TSRX return expressions, expression islands, lazy destructuring, style identifiers, and host-defined server extensions."
			/>
		</head>
		<div class="app-shell">
			<div class="page-shell">
				<header class="masthead">
					<a class="brand-lockup" href="/" aria-label="TSRX home">
						<img class="header-logo" src="/images/tsrx-mark.svg?v=4" alt="TSRX logo" />
					</a>
					<nav class="masthead-nav">
						<a href="/getting-started">{'Getting Started'}</a>
						<a href="/features">{'Features'}</a>
						<a href="/specification" aria-current="page">{'Specification'}</a>
						<a href="/playground">{'Playground'}</a>
						<a href="/blog">{'Blog'}</a>
						<a href="https://discord.gg/HCYpT5QHQR" target="_blank" rel="noopener noreferrer">
							{'Discord'}
						</a>
						<a
							href="https://github.com/Ripple-TS/ripple/tree/main/packages/tsrx"
							target="_blank"
							rel="noopener noreferrer"
						>
							{'GitHub'}
						</a>
						<a href="/llms.txt" target="_blank" rel="noopener noreferrer">{'llms.txt'}</a>
					</nav>
				</header>

				<div class="docs-layout">
					<aside class="side-nav">
						<label class="side-nav-dropdown">
							<span class="side-nav-dropdown-label">{'Jump to section'}</span>
							<select
								class="side-nav-select"
								onChange={(event) => {
									const select = event.currentTarget as HTMLSelectElement;
									if (typeof window !== 'undefined' && select.value) {
										window.location.hash = select.value;
									}
								}}
							>
								<option value="">{'Jump to section'}</option>
								for (const item of NAV_ITEMS) {
									<option value={item.id}>{item.label}</option>
								}
							</select>
						</label>
						<nav>
							<p class="side-nav-heading">{'Draft Spec'}</p>
							for (const item of NAV_ITEMS) {
								<a class="side-nav-link" href={`#${item.id}`}>{item.label}</a>
							}
						</nav>
					</aside>

					<main class="docs-content">
						<section class="doc-section" id="status">
							<p class="section-kicker">{'Draft / April 22, 2026'}</p>
							<h1 class="page-heading">{'TSRX'}</h1>
							<p class="section-body lead">
								{'This page is the working language specification for TSRX. It is written for implementors of parsers, language tooling, compilers, and hosts that need a precise account of the syntax and static constraints of the language.'}
							</p>
							<div class="status-panel">
								<p class="status-chip">{'First-edition scope'}</p>
								<p class="section-body compact">
									{'The current draft fixes the syntax and early-error surface for TSRX return expressions, statement-oriented template elements, expression islands, lazy destructuring, raw style elements, and proposal-aligned submodule declarations.'}
								</p>
							</div>
						</section>

						<section class="doc-section" id="introduction">
							<h2 class="section-heading">{'Introduction'}</h2>
							<p class="section-body">
								{'TSRX is a TypeScript-compatible syntax extension to ECMAScript for authoring component-oriented user interface programs. It extends the TypeScript source language with native TSRX return expressions, statement-oriented template elements, explicit TSX expression islands, lazy destructuring patterns, raw style elements, and style identifiers.'}
							</p>
							<p class="section-body">
								{'This specification defines the syntax of TSRX and the static constraints that a conforming implementation is expected to enforce. It does not propose incorporation of TSRX into the ECMAScript standard, and it does not require JavaScript engines or browsers to parse TSRX directly. Instead, it defines a source language intended for compilers, preprocessors, editors, formatters, and other tooling.'}
							</p>
							<p class="section-body">
								{'Unless this document explicitly states otherwise, a construct that is valid in the TypeScript baseline grammar remains valid in TSRX source text. The grammar additions in this document are therefore additive and TypeScript-compatible.'}
							</p>
						</section>

						<section class="doc-section" id="rationale">
							<h2 class="section-heading">{'Rationale'}</h2>
							<p class="section-body">
								{'TSRX exists to define a predictable syntax for component-oriented source code without forcing all tree-shaped UI through JSX expression containers. In TSRX, a JSX expression opens a statement-oriented template, while expression-position UI values inside that template remain explicit through native TSRX fragments or host compatibility islands.'}
							</p>
							<ul class="spec-list">
								<li>{'Returned TSRX templates may contain element statements directly.'}</li>
								<li>
									{'JSX-compatible values remain available, but only through explicit island syntax.'}
								</li>
								<li>
									{'Lazy destructuring is represented as source syntax rather than a host-specific library convention.'}
								</li>
								<li>
									{'Host features such as server execution and stylesheet composition can be specified cleanly on top of a shared grammar.'}
								</li>
							</ul>
						</section>

						<section class="doc-section" id="conformance">
							<h2 class="section-heading">{'1 Conformance'}</h2>
							<p class="section-body">
								{'An implementation of core TSRX conforms to this specification if it accepts TypeScript source text together with the additional TSRX constructs defined here, rejects source texts that violate the listed early-error rules, and documents any host-defined or profile-defined semantics that are not fixed by the core language.'}
							</p>
							<p class="section-body">
								{'This specification distinguishes between core TSRX and host profiles. Core TSRX defines the syntax and static rules common to all conforming implementations. A host profile may add profile-specific constructs or strengthen restrictions on core constructs.'}
							</p>
						</section>

						<section class="doc-section" id="notation">
							<h2 class="section-heading">{'2 Notational Conventions'}</h2>
							<p class="section-body">
								{'The syntactic and lexical grammar of ECMAScript are incorporated by reference as already extended by a TypeScript-compatible baseline grammar. When this document presents a modified production, it should be read as a delta against that baseline rather than as a complete restatement of the surrounding grammar.'}
							</p>
						</section>

						<section class="doc-section" id="lexical">
							<h2 class="section-heading">{'3 Modified Lexical Conventions'}</h2>
							<p class="section-body">
								{'TSRX introduces the whitespace-sensitive lazy-pattern introducers &{ and &[, and module declarations that can be imported by identifier source.'}
							</p>
							<p class="section-body">
								{'The ampersand introducer is part of the syntax of the lazy pattern itself. Implementations must not treat & { or & [ as lazy pattern forms.'}
							</p>
						</section>

						<section class="doc-section" id="productions">
							<h2 class="section-heading">{'4.1 Modified Productions'}</h2>
							<p class="section-body">
								{'The following productions define the normative core additions for the first edition. They are additive over the TypeScript-compatible baseline grammar used by TSRX implementations.'}
							</p>
							<pre class="code-block plain">
								<code>{MODIFIED_PRODUCTIONS}</code>
							</pre>
						</section>

						<section class="doc-section" id="components">
							<h2 class="section-heading">{'4.2 Function Returns'}</h2>
							<p class="section-body">
								{'TSRX does not define a component declaration form. Components are ordinary functions, and a function becomes a framework component by returning a TSRX expression from a normal return statement.'}
							</p>
							<pre class="code-block plain">
								<code>{FUNCTION_ENTRY_GRAMMAR}</code>
							</pre>
							<p class="section-body muted">
								{'Class methods, object methods, arrow functions, and function expressions all remain ordinary TypeScript constructs. Hosts may choose which returned TSRX functions are considered components.'}
							</p>
						</section>

						<section class="doc-section" id="templates">
							<h2 class="section-heading">{'4.3 Template Elements'}</h2>
							<p class="section-body">
								{'Within a returned TSRX template, element forms are admitted as template statements rather than as generic expressions. This statement-oriented model is normative. A tree that contributes directly to a template body is not interchangeable with an ordinary expression value.'}
							</p>
							<p class="section-body">
								{'Template position also admits direct double-quoted static text children and braced expression forms. The ordinary form '}
								<code class="inline-code">{'{ AssignmentExpression }'}</code>
								{' contributes a generic template-expression node.'}
							</p>
							<pre class="code-block plain">
								<code>{TEMPLATE_EXPRESSION_GRAMMAR}</code>
							</pre>
							<ul class="spec-list">
								<li>
									{'A direct double-quoted text child is represented by '}
									<code class="inline-code">{'Text'}</code>
									{' with a string literal expression and contributes escaped static text. Its quoted contents use the same lexical rules as a quoted JSX attribute value: character references such as '}
									<code class="inline-code">{'&quot;'}</code>
									{' are decoded, and backslashes do not escape the closing quote.'}
								</li>
								<li>
									<code class="inline-code">{'{ AssignmentExpression }'}</code>
									{' is the generic template-expression form and is represented by '}
									<code class="inline-code">{'TSRXExpression'}</code>
									{' in the current parser.'}
								</li>
								<li>
									{'Identifiers named '}
									<code class="inline-code">{'text'}</code>
									{' are ordinary identifiers in braced template expressions.'}
								</li>
							</ul>
							<h3 class="appendix-heading">{'4.3.1 Whitespace'}</h3>
							<p class="section-body">
								{'Whitespace in template syntax follows ordinary ECMAScript token-separation rules except at a small number of JSX-like boundaries where the delimiter itself is whitespace-sensitive.'}
							</p>
							<ul class="spec-list">
								<li>
									{'Within '}
									<code class="inline-code">{'{ AssignmentExpression }'}</code>
									{', whitespace and line terminators are admitted wherever the embedded ECMAScript grammar permits them. Thus forms such as '}
									<code class="inline-code">{'{ expr }'}</code>
									{' are well-formed.'}
								</li>
								<li>
									{'A tag or fragment introducer must be written as a contiguous delimiter sequence. Implementations must not treat '}
									<code class="inline-code">{'< div>'}</code>
									{', '}
									<code class="inline-code">{'< /div>'}</code>
									{', '}
									<code class="inline-code">{'</ div>'}</code>
									{', '}
									<code class="inline-code">{'< tsx>'}</code>
									{', '}
									<code class="inline-code">{'< tsx:react>'}</code>
									{', '}
									<code class="inline-code">{'< >'}</code>
									{', or '}
									<code class="inline-code">{'< / >'}</code>
									{' as TSRX template delimiters.'}
								</li>
								<li>
									{'Whitespace and comments are not admitted within a single tag name or compatibility discriminator. Source texts such as '}
									<code class="inline-code">{'<Foo . Bar>'}</code>
									{' or '}
									<code class="inline-code">{'<tsx: react>'}</code>
									{' do not form a single TSRX tag name.'}
								</li>
								<li>
									{'Indentation and line breaks between adjacent template statements are permitted as layout. They do not require explicit expression containers merely to separate one element statement from the next.'}
								</li>
							</ul>
							<p class="section-body">
								{'The raw style element is also part of this syntax. A style body is captured as raw text for host-defined stylesheet processing rather than being parsed as nested template children.'}
							</p>
						</section>

						<section class="doc-section" id="tsx-islands">
							<h2 class="section-heading">{'4.4 Expression Islands'}</h2>
							<p class="section-body">
								{'TSRX elements and fragments are expression values by default. Native fragments keep TSRX template children, while compatibility islands use JSX-compatible children.'}
							</p>
							<pre class="code-block plain">
								<code>{EXPRESSION_ISLAND_GRAMMAR}</code>
							</pre>
							<p class="section-body">
								{'The fragment shorthand form uses native TSRX template children. Compatibility islands through '}
								<code class="inline-code">{'<tsx:kind>'}</code>
								{' use JSX-compatible children instead and are part of core TSRX syntax, although the meaning of '}
								<code class="inline-code">{'kind'}</code>
								{' is host-defined.'}
							</p>
						</section>

						<section class="doc-section" id="lazy">
							<h2 class="section-heading">{'4.5 Lazy Destructuring'}</h2>
							<p class="section-body">
								{'TSRX extends the baseline binding grammar with lazy array and object forms. The syntax is fixed by the language. The runtime observation model is not. Hosts may implement lazy bindings as deferred property reads, reactive accessors, or another equivalent mechanism, provided the syntactic and static constraints remain satisfied.'}
							</p>
							<pre class="code-block plain">
								<code>{LAZY_GRAMMAR}</code>
							</pre>
						</section>

						<section class="doc-section" id="style">
							<h2 class="section-heading">{'4.6 Style Elements and Style Identifiers'}</h2>
							<p class="section-body">
								{'The syntax of raw style elements is part of core TSRX. The host is responsible for the meaning of selector scoping, generated class names, selector eligibility, style expression class maps, and stylesheet registration.'}
							</p>
							<pre class="code-block plain">
								<code>{STYLE_GRAMMAR}</code>
							</pre>
						</section>

						<section class="doc-section" id="server-profile">
							<h2 class="section-heading">{'4.7 Host-defined Server Extensions'}</h2>
							<p class="section-body">
								{'Submodule declarations are documented in the first edition as a generic extension surface aligned with the TC39 module declarations proposal. Ripple currently defines one host profile for this surface: module server declarations and imports from server.'}
							</p>
							<pre class="code-block plain">
								<code>{SERVER_EXTENSION_GRAMMAR}</code>
							</pre>
						</section>

						<section class="doc-section" id="early-errors">
							<h2 class="section-heading">{'5 Static Semantics: Early Errors'}</h2>
							<ul class="spec-list">
								<li>
									{'A template or JSX element other than an expression island must not appear as a generic ECMAScript expression.'}
								</li>
								<li>
									{'A JSX fragment must not appear in template position outside a compatibility island context.'}
								</li>
								<li>
									{'A tag or fragment delimiter must not be split by intervening whitespace at the points described in 4.3.1.'}
								</li>
								<li>
									<code class="inline-code">{'<tsx:kind />'}</code>
									{' is not well-formed and must be rejected.'}
								</li>
								<li>{'Opening and closing tags for expression islands must match.'}</li>
								<li>
									{'In hosts that enable server-oriented submodules, server exports must be imported before use, for example import { load } from server.'}
								</li>
								<li>
									{'Host profiles may restrict which submodule names are supported and may impose additional restrictions on referenced bindings.'}
								</li>
								<li>{'Element statements must not appear outside a TSRX template body.'}</li>
							</ul>
						</section>

						<section class="doc-section" id="host-defined">
							<h2 class="section-heading">{'6 Host-defined Semantics'}</h2>
							<p class="section-body">
								{'The purpose of the core specification is to make parsers, tooling, and language consumers agree on what TSRX source text means as syntax. The purpose of host documentation is to explain how that syntax is executed, lowered, or bound to runtime facilities.'}
							</p>
							<ul class="spec-list">
								<li>{'How functions returning TSRX lower into executable host code.'}</li>
								<li>{'How lazy destructuring is realized at runtime.'}</li>
								<li>{'How style expressions expose generated or scoped class names.'}</li>
								<li>
									{'How compatibility kinds are configured for '}
									<code class="inline-code">{'<tsx:kind>'}</code>
									{' forms.'}
								</li>
								<li>
									{'How submodule declarations and imports from identifier sources are compiled or executed by a host profile that enables them.'}
								</li>
							</ul>
						</section>

						<section class="doc-section" id="appendices">
							<h2 class="section-heading">{'Appendices'}</h2>
							<p class="section-body">
								{'The current reference implementation exposes ESTree-compatible function nodes plus TSRX-specific nodes such as TsrxFragment, TsxCompat, Element, TSRXExpression, Text, TSModuleDeclaration, TSModuleBlock, Attribute, and SpreadAttribute. The grammar in sections 4.1 through 4.7 is normative; the node shapes in this appendix are informative and describe the parser contract currently exposed to tooling.'}
							</p>
							<h3 class="appendix-heading">{'A.1 Grammar-to-node correspondence'}</h3>
							<p class="section-body">
								{'The reference parser follows the same broad editorial pattern used by the JSX specification: grammar productions define the accepted source forms, and a separate AST layer records those forms in a stable shape for downstream tools. The following correspondence summarizes the first-edition mappings.'}
							</p>
							<pre class="code-block plain">
								<code>{AST_NODE_MAPPING}</code>
							</pre>
							<h3 class="appendix-heading">{'A.2 Function return nodes'}</h3>
							<p class="section-body">
								{'Functions remain ordinary ESTree function nodes. TSRX-specific structure begins at the ReturnStatement argument when that argument is a TsrxFragment or TsxCompat node.'}
							</p>
							<pre class="code-block plain">
								<code>{FUNCTION_AST_SHAPE}</code>
							</pre>
							<ul class="spec-list">
								<li>
									{'The function id and params fields preserve the ordinary TypeScript function surface, including type annotations and lazy patterns after parsing.'}
								</li>
								<li>
									{'The function body remains a BlockStatement; TSRX content is represented where it appears, typically as a ReturnStatement argument.'}
								</li>
								<li>
									{'A returned native fragment is represented by a TsrxFragment node whose children store template statements in source order.'}
								</li>
								<li>
									{'Raw style elements inside a returned TSRX template carry parsed stylesheet metadata for downstream analysis and target-specific style emission.'}
								</li>
								<li>
									{'Default exports are represented through the ordinary ESTree ExportDefaultDeclaration wrapping the function declaration or expression.'}
								</li>
								<li>
									{'Implementation metadata may additionally record topScopedClasses for downstream style-ref analysis.'}
								</li>
							</ul>
							<h3 class="appendix-heading">{'A.3 Template and attribute nodes'}</h3>
							<p class="section-body">
								{'Template statements are represented directly in the AST rather than through a JSX element wrapper. This appendix distinguishes the element node itself from the attribute nodes that refine its opening tag.'}
							</p>
							<pre class="code-block plain">
								<code>{TEMPLATE_AST_SHAPE}</code>
							</pre>
							<ul class="spec-list">
								<li>
									{'Element.id is an Identifier for ordinary tag names and a MemberExpression when the source used a namespaced or dotted element form.'}
								</li>
								<li>
									{'openingElement and closingElement preserve the original tag delimiters so formatters and source-mapping tools can recover the authored shape.'}
								</li>
								<li>
									{'selfClosing and unclosed record parser state for self-closing syntax and loose-mode recovery.'}
								</li>
								<li>
									{'TSRXExpression wraps the embedded ECMAScript expression from the ordinary {expr} template form.'}
								</li>
								<li>
									{'Text wraps a direct double-quoted static text child and marks it for escaped text handling. Static text children decode JSX character references before the literal expression is stored.'}
								</li>
								<li>
									{'Attribute.value is null for boolean-style attributes with no initializer, while shorthand marks parser-recognized shorthand cases.'}
								</li>
								<li>
									{'SpreadAttribute.argument preserves the original ECMAScript expression payload carried by the attribute form.'}
								</li>
								<li>
									{'Current implementations may additionally attach style-element-specific details such as captured stylesheet source text or styleScopeHash when the element is a raw '}
									<code class="inline-code">{'<style>'}</code>
									{' tag, but those details are not part of the general Element shape described here.'}
								</li>
							</ul>
							<h3 class="appendix-heading">{'A.4 Expression island nodes'}</h3>
							<p class="section-body">
								{'Expression-position islands use distinct node kinds so tools can distinguish ordinary template elements, native TSRX fragments, and JSX-compatible subtrees. The native fragment shorthand is represented as TsrxFragment, and compatibility islands with an explicit kind are represented as TsxCompat.'}
							</p>
							<pre class="code-block plain">
								<code>{TSX_AST_SHAPE}</code>
							</pre>
							<ul class="spec-list">
								<li>
									{'TsrxFragment corresponds to <> ... </> when that form appears in expression position. Its children array follows the native TSRX template-child model.'}
								</li>
								<li>
									{'TsxCompat corresponds to <tsx:kind> ... </tsx:kind>, and the kind field stores the compatibility discriminator exactly as parsed.'}
								</li>
								<li>
									{'TsxCompat children arrays follow the JSX child model inherited from the ESTree JSX node family rather than TSRX template-child normalization.'}
								</li>
								<li>
									{'openingElement, closingElement, selfClosing, and unclosed serve the same recovery and source-preservation role as on Element nodes.'}
								</li>
							</ul>
							<h3 class="appendix-heading">
								{'A.5 Submodules, special identifiers, and stylesheets'}
							</h3>
							<p class="section-body">
								{'TSRX reuses TypeScript-compatible module declaration node shapes for submodules and extends ImportDeclaration sources so a source may be an Identifier. These nodes are intentionally narrow: most of their semantics come from surrounding grammar or from host-defined analysis, not from a wide intrinsic property surface.'}
							</p>
							<pre class="code-block plain">
								<code>{SPECIAL_AST_SHAPE}</code>
							</pre>
							<ul class="spec-list">
								<li>{'TSModuleDeclaration represents module Identifier { ... } submodules.'}</li>
								<li>
									{'ImportDeclaration.source may be an Identifier for imports from a declared submodule.'}
								</li>
								<li>
									{'Ripple records exported names from module server declarations for downstream RPC analysis.'}
								</li>
								<li>
									{'CSSStyleSheet metadata is attached to raw style elements in returned TSRX templates and stores both the original stylesheet source text and the stable hash used by current host implementations for scoping.'}
								</li>
							</ul>
							<p class="section-body">
								{'The reference parser is built on Acorn with @sveltejs/acorn-typescript and extended by a custom TSRXPlugin. This is why the grammar in this draft is framed as additive over a TypeScript-compatible baseline rather than as a language unrelated to TypeScript source syntax.'}
							</p>
						</section>
					</main>
				</div>

				<footer class="site-footer">
					<p>{'Released under the MIT License.'}</p>
					<p>{'Copyright © 2025-present Dominic Gannaway'}</p>
				</footer>
			</div>
		</div>
		<style>
			:global(*) {
				box-sizing: border-box;
			}

			:global(html) {
				scroll-behavior: smooth;
				overflow-x: hidden;
				scrollbar-gutter: stable;
			}

			:global(body) {
				margin: 0;
				font-family:
					system-ui,
					-apple-system,
					BlinkMacSystemFont,
					'Segoe UI',
					Roboto,
					sans-serif;
				color: #1a1640;
				background:
					radial-gradient(circle at top, rgba(146, 92, 255, 0.14), transparent 15%),
					radial-gradient(circle at 80% 10%, rgba(111, 0, 255, 0.1), transparent 15%),
					linear-gradient(180deg, #ffffff 0%, #f6f3ff 46%, #f2f4fb 100%);
				background-repeat: no-repeat;
				background-size:
					100% 100vh,
					100% 100vh,
					100% 100%;
				min-height: 100vh;
				overflow-x: hidden;
			}

			:global(a) {
				color: inherit;
				text-decoration: none;
			}

			:global(code),
			:global(pre) {
				font-family: 'Spline Sans Mono', 'SFMono-Regular', monospace;
			}

			.app-shell {
				position: relative;
				z-index: 1;
				width: 100%;
			}

			.page-shell {
				width: min(1180px, calc(100vw - 2rem));
				margin: 0 auto;
				padding: 1rem 0 4rem;
			}

			.masthead {
				display: flex;
				justify-content: space-between;
				align-items: center;
				gap: 1rem;
				padding: 1rem 0 2rem;
				flex-wrap: wrap;
			}

			.brand-lockup {
				display: inline-flex;
				align-items: center;
			}

			.header-logo {
				display: block;
				width: 3.2rem;
				height: 3.2rem;
			}

			.masthead-nav {
				display: inline-flex;
				gap: 1rem;
				font-size: 0.95rem;
				color: rgba(26, 22, 64, 0.7);
			}

			.masthead-nav a {
				white-space: nowrap;
			}

			.masthead-nav a:hover {
				color: #5e2cff;
			}

			.masthead-nav a[aria-current='page'] {
				color: #5e2cff;
				font-weight: 500;
			}

			.docs-layout {
				display: grid;
				grid-template-columns: 220px 1fr;
				gap: 3rem;
				align-items: start;
			}

			.side-nav {
				position: sticky;
				top: 1.5rem;
				padding-top: 0.5rem;
			}

			.side-nav-dropdown {
				display: none;
			}

			.side-nav-dropdown-label {
				display: block;
				margin: 0 0 0.45rem;
				font-size: 0.72rem;
				font-weight: 600;
				text-transform: uppercase;
				letter-spacing: 0.06em;
				color: rgba(26, 22, 64, 0.45);
			}

			.side-nav-select {
				width: 100%;
				padding: 0.75rem 3rem 0.75rem 1.2rem;
				border: 1px solid rgba(94, 44, 255, 0.12);
				border-radius: 0.9rem;
				background-color: rgba(255, 255, 255, 0.92);
				color: #1a1640;
				appearance: none;
				-webkit-appearance: none;
				-moz-appearance: none;
				background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M6 8l4 4 4-4' stroke='%231a1640' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
				background-repeat: no-repeat;
				background-size: 0.95rem;
				background-position: right 1.2rem center;
			}

			.side-nav-heading {
				margin: 0 0 0.75rem;
				font-size: 0.78rem;
				font-weight: 600;
				text-transform: uppercase;
				letter-spacing: 0.06em;
				color: rgba(26, 22, 64, 0.45);
			}

			.side-nav-link {
				display: block;
				padding: 0.3rem 0;
				font-size: 0.9rem;
				color: rgba(26, 22, 64, 0.6);
				transition: color 0.15s;
			}

			.side-nav-link:hover {
				color: #5e2cff;
			}

			.docs-content {
				min-width: 0;
			}

			.doc-section {
				margin-top: 3rem;
			}

			.doc-section:first-child {
				margin-top: 0.5rem;
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

			.section-body {
				margin: 0.5rem 0 0;
				font-size: 1.05rem;
				line-height: 1.7;
				color: rgba(26, 22, 64, 0.76);
			}

			.section-body.lead {
				font-size: 1.15rem;
			}

			.section-body.compact {
				font-size: 0.98rem;
			}

			.section-body.muted {
				color: rgba(26, 22, 64, 0.55);
				font-style: italic;
			}

			.inline-code {
				background: rgba(94, 44, 255, 0.1);
				color: #5e2cff;
				padding: 0.12em 0.4em;
				border-radius: 4px;
				font-size: 0.92em;
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
				margin: 0.75rem 0 0;
				padding: 1.25rem 1.4rem;
				overflow-x: auto;
				background: #0e1528;
				color: #e7ecff;
				font-size: 0.88rem;
				line-height: 1.65;
				white-space: pre;
				-webkit-font-smoothing: antialiased;
				border-radius: 18px;
			}

			.code-block.plain {
				color: #dbe6ff;
			}

			.site-footer {
				margin-top: 4rem;
				padding: 2rem 0;
				border-top: 1px solid rgba(26, 22, 64, 0.1);
				text-align: center;
			}

			.site-footer p {
				margin: 0;
				font-size: 0.88rem;
				line-height: 1.6;
				color: rgba(26, 22, 64, 0.5);
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

				.code-block {
					padding: 1rem 0.75rem;
					font-size: 0.75rem;
					line-height: 1.55;
				}

				.site-footer {
					margin-top: 2rem;
					padding: 1.5rem 0;
				}
			}
		</style>
	</>;
}
