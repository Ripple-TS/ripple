const SNIPPET_HTML = [
	'<span class="ln"> 1</span> <span class="kw-export">export</span> <span class="kw">component</span> <span class="fn">Greeting</span><span class="br">(</span><span class="br">{</span> <span class="prop">name</span> <span class="br">}</span>: <span class="br">{</span> <span class="prop">name</span>?: <span class="type">string</span> <span class="br">}</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln"> 2</span>   <span class="tag">&lt;</span><span class="el">div</span> <span class="attr">class</span>=<span class="str">"card"</span><span class="tag">&gt;</span>',
	'<span class="ln"> 3</span>     <span class="kw">if</span> <span class="br">(</span><span class="prop">name</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln"> 4</span>       <span class="tag">&lt;</span><span class="el">p</span><span class="tag">&gt;</span><span class="str">"Hello, "</span><span class="tbr">{</span><span class="prop">name</span><span class="tbr">}</span><span class="tag">&lt;/</span><span class="el">p</span><span class="tag">&gt;</span>',
	'<span class="ln"> 5</span>     <span class="br">}</span> <span class="kw">else</span> <span class="br">{</span>',
	'<span class="ln"> 6</span>       <span class="tag">&lt;</span><span class="el">p</span><span class="tag">&gt;</span><span class="str">"Hello, stranger"</span><span class="tag">&lt;/</span><span class="el">p</span><span class="tag">&gt;</span>',
	'<span class="ln"> 7</span>     <span class="br">}</span>',
	'<span class="ln"> 8</span>   <span class="tag">&lt;/</span><span class="el">div</span><span class="tag">&gt;</span>',
	'<span class="ln"> 9</span>',
	'<span class="ln">10</span>   <span class="tag">&lt;</span><span class="el">style</span><span class="tag">&gt;</span>',
	'<span class="ln">11</span>     <span class="css-sel">.card</span> <span class="css-br">{</span> <span class="attr">padding</span>: <span class="val">1rem</span>; <span class="css-br">}</span>',
	'<span class="ln">12</span>   <span class="tag">&lt;/</span><span class="el">style</span><span class="tag">&gt;</span>',
	'<span class="ln">13</span> <span class="br">}</span>',
].join('\n');

const REACT_HOOKS_HTML = [
	'<span class="ln"> 1</span> <span class="kw">component</span> <span class="fn">Profile</span><span class="br">(</span><span class="br">{</span> <span class="prop">userId</span> <span class="br">}</span>: <span class="br">{</span> <span class="prop">userId</span>: <span class="type">string</span> | <span class="type">null</span> <span class="br">}</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln"> 2</span>   <span class="kw">if</span> <span class="br">(</span><span class="prop">userId</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln"> 3</span>     <span class="kw">const</span> <span class="prop">user</span> = <span class="fn">useUser</span><span class="br">(</span><span class="prop">userId</span><span class="br">)</span>;',
	'<span class="ln"> 4</span>     <span class="tag">&lt;</span><span class="el">h1</span><span class="tag">&gt;</span><span class="tbr">{</span><span class="prop">user</span>.<span class="prop">name</span><span class="tbr">}</span><span class="tag">&lt;/</span><span class="el">h1</span><span class="tag">&gt;</span>',
	'<span class="ln"> 5</span>   <span class="br">}</span> <span class="kw">else</span> <span class="br">{</span>',
	'<span class="ln"> 6</span>     <span class="tag">&lt;</span><span class="el">a</span> <span class="attr">href</span>=<span class="str">"/login"</span><span class="tag">&gt;</span><span class="str">"Sign in"</span><span class="tag">&lt;/</span><span class="el">a</span><span class="tag">&gt;</span>',
	'<span class="ln"> 7</span>   <span class="br">}</span>',
	'<span class="ln"> 8</span> <span class="br">}</span>',
].join('\n');

const SOLID_LAZY_HTML = [
	'<span class="ln"> 1</span> <span class="kw">component</span> <span class="fn">Counter</span><span class="br">(</span><span class="br">&amp;{</span> <span class="prop">count</span>, <span class="prop">label</span> <span class="br">}</span>: <span class="type">Props</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln"> 2</span>   <span class="tag">&lt;</span><span class="el">section</span><span class="tag">&gt;</span>',
	'<span class="ln"> 3</span>     <span class="tag">&lt;</span><span class="el">h2</span><span class="tag">&gt;</span><span class="tbr">{</span><span class="prop">label</span><span class="tbr">}</span><span class="tag">&lt;/</span><span class="el">h2</span><span class="tag">&gt;</span>',
	'<span class="ln"> 4</span>     <span class="tag">&lt;</span><span class="el">p</span><span class="tag">&gt;</span><span class="str">"Count: "</span><span class="tbr">{</span><span class="prop">count</span><span class="tbr">}</span><span class="tag">&lt;/</span><span class="el">p</span><span class="tag">&gt;</span>',
	'<span class="ln"> 5</span>   <span class="tag">&lt;/</span><span class="el">section</span><span class="tag">&gt;</span>',
	'<span class="ln"> 6</span> <span class="br">}</span>',
].join('\n');

const INLINE_LOCALS_HTML = [
	'<span class="ln"> 1</span> <span class="kw">component</span> <span class="fn">Cart</span><span class="br">(</span><span class="br">{</span> <span class="prop">items</span> <span class="br">}</span>: <span class="br">{</span> <span class="prop">items</span>: <span class="type">Item</span><span class="br">[]</span> <span class="br">}</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln"> 2</span>   <span class="tag">&lt;</span><span class="el">div</span><span class="tag">&gt;</span>',
	'<span class="ln"> 3</span>     <span class="tag">&lt;</span><span class="el">h2</span><span class="tag">&gt;</span><span class="str">"Your cart"</span><span class="tag">&lt;/</span><span class="el">h2</span><span class="tag">&gt;</span>',
	'<span class="ln"> 4</span>',
	'<span class="ln"> 5</span>     <span class="kw">const</span> <span class="prop">subtotal</span> = <span class="prop">items</span>.<span class="fn">reduce</span><span class="br">(</span><span class="br">(</span><span class="prop">sum</span>, <span class="prop">item</span><span class="br">)</span> =&gt; <span class="prop">sum</span> + <span class="prop">item</span>.<span class="prop">price</span>, <span class="val">0</span><span class="br">)</span>;',
	'<span class="ln"> 6</span>     <span class="kw">const</span> <span class="prop">discount</span> = <span class="prop">subtotal</span> &gt; <span class="val">100</span> ? <span class="val">0.1</span> : <span class="val">0</span>;',
	'<span class="ln"> 7</span>',
	'<span class="ln"> 8</span>     <span class="tag">&lt;</span><span class="el">p</span><span class="tag">&gt;</span><span class="str">"Subtotal: $"</span><span class="tbr">{</span><span class="prop">subtotal</span><span class="tbr">}</span><span class="tag">&lt;/</span><span class="el">p</span><span class="tag">&gt;</span>',
	'<span class="ln"> 9</span>     <span class="tag">&lt;</span><span class="el">p</span><span class="tag">&gt;</span><span class="str">"Save: $"</span><span class="tbr">{</span><span class="br">(</span><span class="prop">subtotal</span> * <span class="prop">discount</span><span class="br">)</span>.<span class="fn">toFixed</span><span class="br">(</span><span class="val">2</span><span class="br">)</span><span class="tbr">}</span><span class="tag">&lt;/</span><span class="el">p</span><span class="tag">&gt;</span>',
	'<span class="ln">10</span>   <span class="tag">&lt;/</span><span class="el">div</span><span class="tag">&gt;</span>',
	'<span class="ln">11</span> <span class="br">}</span>',
].join('\n');

const COLOCATION_HTML = [
	'<span class="ln"> 1</span> <span class="kw">component</span> <span class="fn">UserList</span><span class="br">(</span><span class="br">{</span> <span class="prop">users</span>, <span class="prop">showBio</span> <span class="br">}</span>: <span class="type">Props</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln"> 2</span>   <span class="kw">for</span> <span class="br">(</span><span class="kw">const</span> <span class="prop">user</span> <span class="kw">of</span> <span class="prop">users</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln"> 3</span>     <span class="kw">const</span> <span class="prop">initials</span> = <span class="prop">user</span>.<span class="prop">name</span>.<span class="fn">slice</span><span class="br">(</span><span class="val">0</span>, <span class="val">2</span><span class="br">)</span>.<span class="fn">toUpperCase</span><span class="br">(</span><span class="br">)</span>;',
	'<span class="ln"> 4</span>     <span class="kw">const</span> <span class="prop">role</span> = <span class="prop">user</span>.<span class="prop">admin</span> ? <span class="str">\'Admin\'</span> : <span class="str">\'Member\'</span>;',
	'<span class="ln"> 5</span>',
	'<span class="ln"> 6</span>     <span class="tag">&lt;</span><span class="el">div</span> <span class="attr">class</span>=<span class="str">"user-row"</span><span class="tag">&gt;</span>',
	'<span class="ln"> 7</span>       <span class="tag">&lt;</span><span class="el">span</span> <span class="attr">class</span>=<span class="str">"avatar"</span><span class="tag">&gt;</span><span class="tbr">{</span><span class="prop">initials</span><span class="tbr">}</span><span class="tag">&lt;/</span><span class="el">span</span><span class="tag">&gt;</span>',
	'<span class="ln"> 8</span>       <span class="tag">&lt;</span><span class="el">strong</span><span class="tag">&gt;</span><span class="tbr">{</span><span class="prop">user</span>.<span class="prop">name</span><span class="tbr">}</span><span class="tag">&lt;/</span><span class="el">strong</span><span class="tag">&gt;</span>',
	'<span class="ln"> 9</span>       <span class="tag">&lt;</span><span class="el">span</span> <span class="attr">class</span>=<span class="str">"badge"</span><span class="tag">&gt;</span><span class="tbr">{</span><span class="prop">role</span><span class="tbr">}</span><span class="tag">&lt;/</span><span class="el">span</span><span class="tag">&gt;</span>',
	'<span class="ln">10</span>',
	'<span class="ln">11</span>       <span class="kw">if</span> <span class="br">(</span><span class="prop">showBio</span> &amp;&amp; <span class="prop">user</span>.<span class="prop">bio</span><span class="br">)</span> <span class="br">{</span>',
	'<span class="ln">12</span>         <span class="kw">const</span> <span class="prop">short_bio</span> = <span class="prop">user</span>.<span class="prop">bio</span>.<span class="fn">slice</span><span class="br">(</span><span class="val">0</span>, <span class="val">140</span><span class="br">)</span>;',
	'<span class="ln">13</span>         <span class="kw">const</span> <span class="fn">report</span> = <span class="br">(</span><span class="br">)</span> =&gt; <span class="fn">console</span>.<span class="fn">log</span><span class="br">(</span><span class="str">`viewed ${</span><span class="prop">user</span>.<span class="prop">name</span><span class="str">}`</span><span class="br">)</span>;',
	'<span class="ln">14</span>',
	'<span class="ln">15</span>         <span class="tag">&lt;</span><span class="el">p</span> <span class="attr">class</span>=<span class="str">"bio"</span><span class="tag">&gt;</span><span class="tbr">{</span><span class="prop">short_bio</span><span class="tbr">}</span><span class="tag">&lt;/</span><span class="el">p</span><span class="tag">&gt;</span>',
	'<span class="ln">16</span>         <span class="tag">&lt;</span><span class="el">button</span> <span class="attr">onClick</span>=<span class="tbr">{</span><span class="prop">report</span><span class="tbr">}</span><span class="tag">&gt;</span><span class="str">"Viewed"</span><span class="tag">&lt;/</span><span class="el">button</span><span class="tag">&gt;</span>',
	'<span class="ln">17</span>       <span class="br">}</span>',
	'<span class="ln">18</span>     <span class="tag">&lt;/</span><span class="el">div</span><span class="tag">&gt;</span>',
	'<span class="ln">19</span>   <span class="br">}</span>',
	'<span class="ln">20</span> <span class="br">}</span>',
].join('\n');

export component IndexPage() {
	<head>
		<title>
			{'TSRX | A TypeScript language extension for building declarative UIs in an agentic era.'}
		</title>
		<meta
			name="description"
			content="TSRX is a TypeScript language extension for building declarative UIs in an agentic era."
		/>
	</head>

	<div class="app-shell">
		<div class="page-shell">
			<header class="masthead">
				<a class="brand-lockup" href="#top" aria-label="TSRX home">
					<img class="header-logo" src="/images/tsrx-mark.svg?v=4" alt="TSRX logo" />
				</a>
				<nav class="masthead-nav">
					<a href="/getting-started">{'Getting Started'}</a>
					<a href="/features">{'Features'}</a>
					<a href="/specification">{'Specification'}</a>
					<a href="/playground">{'Playground'}</a>
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

			<section class="hero" id="top">
				<div class="hero-copy">
					<h1>
						{'TSRX is a TypeScript language extension for building declarative UIs in an agentic era.'}
					</h1>
				</div>
			</section>

			<section class="readable-section section-shell what-is-section" aria-label="What is TSRX">
				<p class="section-body what-is-copy">
					{'TSRX (TypeScript Render Extensions) is a way to write UI component code that stays readable and co-located. Structure, styling, and control flow live together, and the result stays fully backwards compatible with TypeScript.'}
				</p>
				<pre class="code-block">
					<code>{html SNIPPET_HTML}</code>
				</pre>
				<p class="section-body what-is-copy">
					{'You can think of TSRX as a spiritual successor to JSX — the same mental model of embedding UI directly inside TypeScript, but with its own flavor. Control flow, scoped styles, and locals sit in the template as first-class syntax instead of being squeezed through expression slots, and the language stays aware of them through to the compiled output.'}
				</p>
				<p class="section-body what-is-copy">
					{'TSRX is framework-agnostic and interoperable. Today it compiles to React, Preact, Ripple, and Solid, with room for more targets over time. You can import '}
					<code class="inline-code">{'.tsrx'}</code>
					{' modules from JS, TS, and TSX files and it just works.'}
				</p>
				<div class="hero-actions">
					<a class="cta-link" href="/getting-started">{'Get started →'}</a>
					<a
						class="secondary-cta-link"
						href="https://github.com/Ripple-TS/ripple/tree/main/packages/tsrx"
						target="_blank"
						rel="noopener noreferrer"
					>
						{'View Source'}
					</a>
				</div>
				<p class="section-body what-is-copy compact-link-copy">
					{'Looking for the formal grammar and AST shape? Read the '}
					<a class="supporting-link" href="/specification">{'specification →'}</a>
				</p>

				<aside class="alpha-notice" role="note" aria-label="Alpha release notice">
					<span class="alpha-badge">{'Alpha'}</span>
					<p class="alpha-notice-body">
						{'TSRX is in active alpha development. Feedback on the '}
						<a
							class="alpha-notice-link"
							href="https://github.com/Ripple-TS/ripple/issues"
							target="_blank"
							rel="noopener noreferrer"
						>
							{'issue tracker'}
						</a>
						{' is very welcome.'}
					</p>
				</aside>
			</section>

			<section class="readable-section section-shell">
				<p class="eyebrow">{'Benefits of TSRX'}</p>
				<h2 class="section-heading">{'Co-location helps engineers and AI systems alike.'}</h2>
				<p class="section-body">
					{'When structure, control flow, styling, and component shape live in the same file, the source reads closer to the interface it describes. That cuts down on ternaries, map chains, and render helpers. It also makes refactors and onboarding less brittle.'}
				</p>
				<pre class="code-block">
					<code>{html COLOCATION_HTML}</code>
				</pre>
				<p class="section-body">
					{'Code is increasingly written, reviewed, and transformed with machine assistance. When UI structure is more explicit, editors, compilers, and code generation tools have a better surface to work with without changing the framework semantics underneath.'}
				</p>
				<p class="section-body">
					{'This is consistent with findings that language models attend unevenly to long contexts, performing best when relevant information sits close together rather than scattered across a window.'}
				</p>
				<p class="section-body">
					<a
						class="cta-link"
						href="https://arxiv.org/abs/2307.03172"
						target="_blank"
						rel="noopener noreferrer"
					>
						{'Lost in the Middle (Liu et al., TACL 2024) →'}
					</a>
				</p>
			</section>

			<section class="readable-section section-shell">
				<p class="eyebrow">{'Ergonomics'}</p>
				<h2 class="section-heading">{'Better ergonomics for today\'s frameworks.'}</h2>
				<p class="section-body">
					{'TSRX takes care of the awkward parts each framework asks you to work around. Patterns that are natural to write — but fragile or illegal in the target runtime — get rewritten at compile time into the exact shape React, Preact, Solid, or Ripple expects. The source stays readable for humans and predictable for language models; the compiler handles the footguns.'}
				</p>

				<p class="section-body">
					{'React hooks can be called conditionally. The compiler lifts the conditional branch into its own component so the rules of hooks are satisfied by construction — no more manually splitting components just to gate a '}
					<code class="inline-code">{'useUser(...)'}</code>
					{' call behind an '}
					<code class="inline-code">{'if'}</code>
					{'.'}
				</p>
				<pre class="code-block">
					<code>{html REACT_HOOKS_HTML}</code>
				</pre>

				<p class="section-body">
					{'Solid props can be destructured eagerly. The '}
					<code class="inline-code">{'&{ ... }'}</code>
					{' pattern compiles to lazy getters, so reads stay reactive without forcing '}
					<code class="inline-code">{'props.count'}</code>
					{' everywhere and without losing type inference on the destructured names.'}
				</p>
				<pre class="code-block">
					<code>{html SOLID_LAZY_HTML}</code>
				</pre>

				<p class="section-body">
					{'Locals can live next to the JSX that uses them. Variables declared mid-template stay scoped to their surrounding block, so derived values sit beside the markup they feed instead of piling up at the top of the component. Concerns stay together; readers (and LLMs) do less bookkeeping to follow the data flow.'}
				</p>
				<pre class="code-block">
					<code>{html INLINE_LOCALS_HTML}</code>
				</pre>
			</section>

			<section class="readable-section section-shell" id="tooling">
				<p class="eyebrow">{'Tooling and adoption'}</p>
				<h2 class="section-heading">{'Rich integration with existing tooling.'}</h2>
				<p class="section-body">
					{'TSRX ships with a language server for editor diagnostics, navigation, and completion. Prettier and ESLint plugins keep formatting and linting consistent inside existing repositories, so the language can be adopted seriously instead of treated like a compiler experiment. Plus support for many IDEs and editors including VS Code, Zed, Neovim, IntelliJ and Sublime.'}
				</p>
				<p class="section-body">
					{'It interoperates with existing TypeScript and TSX codebases rather than demanding a full rewrite. Teams can adopt it where ergonomics matter most while keeping the surrounding code familiar. '}
				</p>
			</section>

			<section class="readable-section section-shell">
				<p class="eyebrow">{'Smart compilation'}</p>
				<h2 class="section-heading">{'TSRX compiles to multiple framework runtime outputs.'}</h2>
				<p class="section-body">
					{'The TSRX compiler parses component source into an AST and hands it off to framework-specific plugins for code generation. Plugins such as '}
					<code class="inline-code">{'@tsrx/react'}</code>
					{', '}
					<code class="inline-code">{'@tsrx/preact'}</code>
					{', '}
					<code class="inline-code">{'@tsrx/ripple'}</code>
					{', and '}
					<code class="inline-code">{'@tsrx/solid'}</code>
					{' transform the same AST into idiomatic output for their target runtimes, including scoped CSS. New targets can be added as standalone compiler plugins without changing the language itself.'}
				</p>
				<p class="section-body">
					<a class="cta-link" href="/playground">{'Try it in the playground →'}</a>
				</p>
			</section>

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
			min-height: 100vh;
			overflow-x: hidden;
		}

		:global(a) {
			color: inherit;
			text-decoration: none;
		}

		:global(button),
		:global(input),
		:global(textarea),
		:global(select) {
			font: inherit;
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
			padding: 1rem 0 6rem;
		}

		.section-shell {
			margin-top: 3.25rem;
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
			justify-content: center;
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

		.masthead-nav a:hover,
		.resource-list a:hover {
			color: #5e2cff;
		}

		.alpha-notice {
			display: flex;
			align-items: center;
			gap: 0.9rem;
			padding: 0.9rem 1.15rem;
			margin: 1.75rem 0 0;
			border-radius: 0.75rem;
			background: linear-gradient(90deg, rgba(111, 0, 255, 0.08) 0%, rgba(146, 92, 255, 0.08) 100%);
			border: 1px solid rgba(111, 0, 255, 0.22);
			color: #2b1b6d;
			font-size: 0.95rem;
			line-height: 1.5;
		}

		.alpha-badge {
			flex-shrink: 0;
			padding: 0.18rem 0.6rem;
			border-radius: 999px;
			background: linear-gradient(90deg, #5521dd 0%, #8741ff 100%);
			color: #fff;
			font-size: 0.72rem;
			font-weight: 600;
			letter-spacing: 0.14em;
			text-transform: uppercase;
		}

		.alpha-notice-body {
			margin: 0;
		}

		.alpha-notice-link {
			color: #5e2cff;
			text-decoration: underline;
			text-underline-offset: 2px;
		}

		.alpha-notice-link:hover {
			color: #6f00ff;
		}

		.supporting-link {
			color: #5e2cff;
			font-weight: 500;
			text-decoration: underline;
			text-underline-offset: 2px;
		}

		.supporting-link:hover {
			color: #6f00ff;
		}

		.hero {
			display: grid;
			grid-template-columns: minmax(0, 1fr);
			gap: 2rem;
			align-items: center;
			padding: 3.5rem 0 2.5rem;
			min-height: auto;
		}

		.eyebrow,
		.mini-label {
			margin: 0 0 0.75rem;
			font-size: 0.76rem;
			letter-spacing: 0.18em;
			text-transform: uppercase;
			color: #6e44df;
		}

		.hero h1,
		.section-copy h2,
		.page-footer h2,
		.content-card h2 {
			margin: 0;
			letter-spacing: -0.04em;
		}

		.hero h1 {
			font-size: clamp(2.15rem, 5.5vw, 4.95rem);
			line-height: 1.125;
			background: linear-gradient(90deg, #5521dd 0%, #6f00ff 42%, #8741ff 100%);
			-webkit-background-clip: text;
			background-clip: text;
			color: transparent;
		}

		.section-copy h2,
		.page-footer h2 {
			font-size: clamp(2rem, 3vw, 3.3rem);
			line-height: 1.03;
		}

		.content-card h2 {
			font-size: clamp(1.5rem, 2.3vw, 2.3rem);
			line-height: 1.05;
		}

		.what-is-section {
			gap: 1rem;
		}

		.what-is-copy {
			max-width: 56rem;
		}

		.compact-link-copy {
			margin-top: -0.15rem;
			font-size: 0.98rem;
			color: rgba(26, 22, 64, 0.68);
		}

		.code-block {
			margin: 0.5rem 0 0;
			padding: 1.25rem 1.4rem;
			overflow-x: auto;
			background: #0e1528;
			color: #e7ecff;
			font-size: 0.88rem;
			line-height: 1.65;
			white-space: pre;
			-webkit-font-smoothing: antialiased;
		}

		:global(.code-block .ln) {
			color: rgba(255, 255, 255, 0.25);
			display: inline-block;
			width: 1.4rem;
			text-align: right;
			margin-right: 0.85rem;
			user-select: none;
		}

		:global(.code-block .kw) {
			color: #569cd6;
		}
		:global(.code-block .kw-export) {
			color: #c586c0;
		}
		:global(.code-block .kw-ctrl) {
			color: #c586c0;
		}
		:global(.code-block .kw-ctrl-br) {
			color: #c586c0;
		}
		:global(.code-block .fn) {
			color: #dcdcaa;
		}
		:global(.code-block .type) {
			color: #4ec9b0;
		}
		:global(.code-block .prop) {
			color: #9cdcfe;
		}
		:global(.code-block .str) {
			color: #ce9178;
		}
		:global(.code-block .val) {
			color: #b5cea8;
		}
		:global(.code-block .el) {
			color: #569cd6;
		}
		:global(.code-block .tag) {
			color: #808080;
		}
		:global(.code-block .attr) {
			color: #92c5f8;
		}
		:global(.code-block .br) {
			color: #ffd700;
		}
		:global(.code-block .tbr) {
			color: #ffd700;
		}
		:global(.code-block .css-sel) {
			color: #d7ba7d;
		}
		:global(.code-block .css-br) {
			color: #d4d4d4;
		}
		:global(.code-block .reactive) {
			color: #4fc1ff;
		}

		.what-is-list {
			max-width: 62rem;
		}

		.lede,
		.section-body,
		.resource-list span {
			margin: 0;
			font-size: 1.05rem;
			line-height: 1.7;
			color: rgba(26, 22, 64, 0.76);
		}

		.hero-copy,
		.section-copy,
		.footer-copy,
		.content-card {
			display: grid;
			gap: 1rem;
		}

		.inline-code {
			background: rgba(94, 44, 255, 0.1);
			color: #5e2cff;
			padding: 0.12em 0.4em;
			border-radius: 4px;
			font-size: 0.92em;
		}

		.hero-list,
		.editorial-list,
		.detail-list,
		.resource-list {
			margin: 0;
			padding-left: 1.2rem;
			display: grid;
			gap: 0.65rem;
			color: rgba(26, 22, 64, 0.8);
		}

		.hero-list li,
		.editorial-list li,
		.detail-list li,
		.resource-list li {
			line-height: 1.6;
		}

		.hero-list {
			max-width: none;
		}

		.comparison-grid,
		.stacked-cards {
			display: grid;
			gap: 1.25rem;
		}

		.comparison-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.content-card,
		.page-footer {
			position: relative;
			padding: 1.7rem;
			background: transparent;
			box-shadow: none;
			backdrop-filter: none;
		}

		.readable-section {
			display: grid;
			gap: 1rem;
			max-width: 52rem;
		}

		.hero-actions {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 0.85rem;
		}

		.cta-link {
			display: inline-block;
			justify-self: start;
			padding: 0.75rem 1.5rem;
			background: linear-gradient(90deg, #5521dd 0%, #6f00ff 100%);
			color: #fff;
			font-weight: 500;
			font-size: 1rem;
			border-radius: 6px;
			transition: opacity 0.15s;
		}

		.cta-link:hover {
			opacity: 0.88;
			color: #fff;
		}

		.secondary-cta-link {
			display: inline-block;
			padding: 0.75rem 1.5rem;
			border: 1px solid rgba(94, 44, 255, 0.22);
			border-radius: 6px;
			background: rgba(94, 44, 255, 0.06);
			color: #4e22c8;
			font-weight: 500;
			font-size: 1rem;
			transition:
				background 0.15s,
				border-color 0.15s,
				color 0.15s;
		}

		.secondary-cta-link:hover {
			background: rgba(94, 44, 255, 0.12);
			border-color: rgba(94, 44, 255, 0.28);
			color: #3f19ad;
		}

		.section-heading {
			margin: 0;
			font-size: clamp(2rem, 3vw, 3.3rem);
			line-height: 1.03;
			letter-spacing: -0.04em;
		}

		.narrative-card,
		.slim-card,
		.stacked-cards {
			align-content: start;
		}

		.page-footer {
			display: grid;
			grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
			gap: 1.5rem;
		}

		.resource-list {
			list-style: disc;
		}

		.resource-list li {
			display: grid;
			gap: 0.2rem;
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

		@media (max-width: 1100px) {
			.hero,
			.page-footer,
			.comparison-grid {
				grid-template-columns: 1fr;
			}

			.hero {
				padding-top: 2rem;
				min-height: auto;
			}
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

			.hero {
				padding: 1.5rem 0 1.5rem;
			}

			.hero h1 {
				font-size: clamp(1.75rem, 8vw, 2.5rem);
				line-height: 1.04;
			}

			.section-shell {
				margin-top: 2rem;
			}

			.section-heading {
				font-size: clamp(1.5rem, 6vw, 2rem);
			}

			.section-body,
			.lede {
				font-size: 0.95rem;
			}

			.code-block {
				padding: 1rem 0.75rem;
				font-size: 0.75rem;
				line-height: 1.55;
			}

			.cta-link {
				padding: 0.65rem 1.25rem;
				font-size: 0.92rem;
			}

			.secondary-cta-link {
				padding: 0.65rem 1.25rem;
				font-size: 0.92rem;
			}

			.site-footer {
				margin-top: 2rem;
				padding: 1.5rem 0;
			}

			.hero h1,
			.section-copy h2,
			.page-footer h2,
			.content-card h2 {
				line-height: 1.04;
			}
		}
	</style>
}
