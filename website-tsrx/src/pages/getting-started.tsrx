// --- Code snippets (hand-highlighted, matching homepage code-block style) ---

const INSTALL_HTML = [
	'<span class="ln">1</span> <span class="fn">npm</span> <span class="prop">install</span> <span class="str">@tsrx/react</span> <span class="str">@tsrx/vite-plugin-react</span>',
].join('\n');

const VITE_CONFIG_HTML = [
	'<span class="ln">1</span> <span class="kw-export">import</span> <span class="br">{</span> <span class="prop">defineConfig</span> <span class="br">}</span> <span class="kw-export">from</span> <span class="str">\'vite\'</span>;',
	'<span class="ln">2</span> <span class="kw-export">import</span> <span class="prop">tsrxReact</span> <span class="kw-export">from</span> <span class="str">\'@tsrx/vite-plugin-react\'</span>;',
	'<span class="ln">3</span>',
	'<span class="ln">4</span> <span class="kw-export">export default</span> <span class="fn">defineConfig</span><span class="br">(</span><span class="br">{</span>',
	'<span class="ln">5</span>   <span class="prop">plugins</span>: <span class="br">[</span><span class="fn">tsrxReact</span><span class="br">(</span><span class="br">)</span><span class="br">]</span>,',
	'<span class="ln">6</span> <span class="br">}</span><span class="br">)</span>;',
].join('\n');

const SOLID_INSTALL_HTML = [
	'<span class="ln">1</span> <span class="fn">npm</span> <span class="prop">install</span> <span class="str">@tsrx/solid</span> <span class="str">@tsrx/vite-plugin-solid</span> <span class="str">vite-plugin-solid</span>',
].join('\n');

const SOLID_VITE_CONFIG_HTML = [
	'<span class="ln">1</span> <span class="kw-export">import</span> <span class="br">{</span> <span class="prop">defineConfig</span> <span class="br">}</span> <span class="kw-export">from</span> <span class="str">\'vite\'</span>;',
	'<span class="ln">2</span> <span class="kw-export">import</span> <span class="prop">tsrxSolid</span> <span class="kw-export">from</span> <span class="str">\'@tsrx/vite-plugin-solid\'</span>;',
	'<span class="ln">3</span> <span class="kw-export">import</span> <span class="prop">solid</span> <span class="kw-export">from</span> <span class="str">\'vite-plugin-solid\'</span>;',
	'<span class="ln">4</span>',
	'<span class="ln">5</span> <span class="kw-export">export default</span> <span class="fn">defineConfig</span><span class="br">(</span><span class="br">{</span>',
	'<span class="ln">6</span>   <span class="prop">plugins</span>: <span class="br">[</span><span class="fn">tsrxSolid</span><span class="br">(</span><span class="br">)</span>, <span class="fn">solid</span><span class="br">(</span><span class="br">)</span><span class="br">]</span>,',
	'<span class="ln">7</span> <span class="br">}</span><span class="br">)</span>;',
].join('\n');

export component GettingStartedPage() {
	<head>
		<title>{'TSRX | Getting Started'}</title>
		<meta
			name="description"
			content="Get started with TSRX: install with React and Vite, learn the component syntax, and explore statement-based control flow."
		/>
	</head>

	<div class="app-shell">
		<div class="page-shell">
			<header class="masthead">
				<a class="brand-lockup" href="/" aria-label="TSRX home">
					<img class="header-logo" src="/images/tsrx-mark.svg?v=4" alt="TSRX logo" />
				</a>
				<nav class="masthead-nav">
					<a href="/getting-started" aria-current="page">{'Getting Started'}</a>
					<a href="/features">{'Features'}</a>
					<a href="/playground">{'Playground'}</a>
					<a href="/llms.txt" target="_blank" rel="noopener noreferrer">{'llms.txt'}</a>
					<a
						href="https://github.com/Ripple-TS/ripple/tree/main/packages/tsrx"
						target="_blank"
						rel="noopener noreferrer"
					>
						{'GitHub'}
					</a>
				</nav>
			</header>

			<section class="hero">
				<h1>{'Getting Started'}</h1>
				<p class="lede">
					{'Set up TSRX with React and Vite in minutes. Once installed, head over to the '}
					<a class="inline-link" href="/features">{'Features'}</a>
					{' page for a full tour of the language.'}
				</p>
			</section>

			<section class="doc-section" id="install">
				<h2 class="section-heading">{'Installation'}</h2>
				<h3 class="subsection-heading">{'React + Vite'}</h3>
				<p class="section-body">{'Install the compiler and Vite plugin:'}</p>
				<pre class="code-block">
					<code>{html INSTALL_HTML}</code>
				</pre>
				<p class="section-body">{'Then add the plugin to your Vite config:'}</p>
				<pre class="code-block">
					<code>{html VITE_CONFIG_HTML}</code>
				</pre>
				<p class="section-body">
					{'That\'s it — create any '}
					<code class="inline-code">{'.tsrx'}</code>
					{' file and import it from your existing JS, TS, or TSX code. The plugin compiles '}
					<code class="inline-code">{'.tsrx'}</code>
					{' modules into standard React components with scoped CSS.'}
				</p>

				<h3 class="subsection-heading">{'Solid + Vite'}</h3>
				<p class="section-body">
					{'Install the Solid compiler, its Vite plugin, and the upstream '}
					<code class="inline-code">{'vite-plugin-solid'}</code>
					{' which runs Solid\'s JSX transform on the emitted TSX:'}
				</p>
				<pre class="code-block">
					<code>{html SOLID_INSTALL_HTML}</code>
				</pre>
				<p class="section-body">
					{'Then wire both plugins into your Vite config (order matters — tsrxSolid first):'}
				</p>
				<pre class="code-block">
					<code>{html SOLID_VITE_CONFIG_HTML}</code>
				</pre>

				<h3 class="subsection-heading">{'Rspack & Webpack'}</h3>
				<p class="section-body muted">
					{'Rspack and Webpack loader support is coming soon. For now, Vite is the recommended build tool.'}
				</p>

				<h3 class="subsection-heading">{'Ripple'}</h3>
				<p class="section-body">
					{'The Ripple framework ships with TSRX support as standard. If you\'re using Ripple with '}
					<code class="inline-code">{'@ripple-ts/vite-plugin'}</code>
					{', '}
					<code class="inline-code">{'.tsrx'}</code>
					{' files work out of the box — no additional packages needed.'}
				</p>
			</section>

			<section class="doc-section" id="next">
				<h2 class="section-heading">{'What\'s next?'}</h2>
				<p class="section-body">
					{'Now that TSRX is set up, explore the language syntax — components, control flow, error boundaries, and more.'}
				</p>
				<a class="cta-link" href="/features">{'Explore the features →'}</a>
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

		.masthead-nav a:hover {
			color: #5e2cff;
		}

		.masthead-nav a[aria-current='page'] {
			color: #5e2cff;
			font-weight: 500;
		}

		.hero {
			padding: 2rem 0 1.5rem;
		}

		.hero h1 {
			margin: 0;
			font-size: clamp(2rem, 5vw, 3.5rem);
			line-height: 1.125;
			letter-spacing: -0.04em;
			background: linear-gradient(90deg, #5521dd 0%, #6f00ff 42%, #8741ff 100%);
			-webkit-background-clip: text;
			background-clip: text;
			color: transparent;
		}

		.lede {
			margin: 1rem 0 0;
			font-size: 1.1rem;
			line-height: 1.7;
			color: rgba(26, 22, 64, 0.72);
			max-width: 42rem;
		}

		.doc-section {
			margin-top: 3rem;
			max-width: 52rem;
		}

		.section-heading {
			margin: 0 0 0.75rem;
			font-size: clamp(1.5rem, 3vw, 2rem);
			line-height: 1.1;
			letter-spacing: -0.03em;
		}

		.subsection-heading {
			margin: 1.75rem 0 0.5rem;
			font-size: 1.1rem;
			font-weight: 600;
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

		.inline-code {
			background: rgba(94, 44, 255, 0.1);
			color: #5e2cff;
			padding: 0.12em 0.4em;
			border-radius: 4px;
			font-size: 0.92em;
		}

		.inline-link {
			color: #5e2cff;
			text-decoration: underline;
			text-underline-offset: 0.15em;
		}

		.inline-link:hover {
			color: #4a1ad4;
		}

		.cta-link {
			display: inline-block;
			margin-top: 1rem;
			font-size: 1.05rem;
			font-weight: 500;
			color: #5e2cff;
		}

		.cta-link:hover {
			color: #4a1ad4;
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
			}

			.masthead-nav {
				gap: 0.75rem;
				font-size: 0.88rem;
			}

			.header-logo {
				width: 2.4rem;
				height: 2.4rem;
			}

			.hero {
				padding: 1rem 0 1rem;
			}

			.hero h1 {
				font-size: clamp(1.65rem, 7vw, 2.2rem);
			}

			.lede {
				font-size: 1rem;
			}

			.doc-section {
				margin-top: 2rem;
			}

			.section-heading {
				font-size: clamp(1.3rem, 5vw, 1.65rem);
			}

			.section-body {
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
}
