// --- Code snippets (hand-highlighted, matching homepage code-block style) ---

const INSTALL_HTML = [
	'<span class="ln">1</span> <span class="fn">pnpm</span> <span class="prop">install</span> <span class="str">@tsrx/react</span> <span class="str">@tsrx/vite-plugin-react</span>',
].join('\n');

const VITE_CONFIG_HTML = [
	'<span class="ln">1</span> <span class="kw-export">import</span> <span class="br">{</span> <span class="prop">defineConfig</span> <span class="br">}</span> <span class="kw-export">from</span> <span class="str">\'vite\'</span>;',
	'<span class="ln">2</span> <span class="kw-export">import</span> <span class="prop">tsrxReact</span> <span class="kw-export">from</span> <span class="str">\'@tsrx/vite-plugin-react\'</span>;',
	'<span class="ln">3</span>',
	'<span class="ln">4</span> <span class="kw-export">export default</span> <span class="fn">defineConfig</span><span class="br">(</span><span class="br">{</span>',
	'<span class="ln">5</span>   <span class="prop">plugins</span>: <span class="br">[</span><span class="fn">tsrxReact</span><span class="br">(</span><span class="br">)</span><span class="br">]</span>,',
	'<span class="ln">6</span> <span class="br">}</span><span class="br">)</span>;',
].join('\n');

const PREACT_INSTALL_HTML = [
	'<span class="ln">1</span> <span class="fn">pnpm</span> <span class="prop">install</span> <span class="str">@tsrx/preact</span> <span class="str">@tsrx/vite-plugin-preact</span>',
].join('\n');

const PREACT_VITE_CONFIG_HTML = [
	'<span class="ln">1</span> <span class="kw-export">import</span> <span class="br">{</span> <span class="prop">defineConfig</span> <span class="br">}</span> <span class="kw-export">from</span> <span class="str">\'vite\'</span>;',
	'<span class="ln">2</span> <span class="kw-export">import</span> <span class="prop">tsrxPreact</span> <span class="kw-export">from</span> <span class="str">\'@tsrx/vite-plugin-preact\'</span>;',
	'<span class="ln">3</span>',
	'<span class="ln">4</span> <span class="kw-export">export default</span> <span class="fn">defineConfig</span><span class="br">(</span><span class="br">{</span>',
	'<span class="ln">5</span>   <span class="prop">plugins</span>: <span class="br">[</span><span class="fn">tsrxPreact</span><span class="br">(</span><span class="br">)</span><span class="br">]</span>,',
	'<span class="ln">6</span> <span class="br">}</span><span class="br">)</span>;',
].join('\n');

const SOLID_INSTALL_HTML = [
	'<span class="ln">1</span> <span class="fn">pnpm</span> <span class="prop">install</span> <span class="str">@tsrx/solid</span> <span class="str">@tsrx/vite-plugin-solid</span> <span class="str">vite-plugin-solid</span>',
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

const RSPACK_INSTALL_HTML = [
	'<span class="ln">1</span> <span class="fn">pnpm</span> <span class="prop">install</span> <span class="str">@tsrx/react</span> <span class="str">@tsrx/rspack-plugin-react</span>',
].join('\n');

const RSPACK_CONFIG_HTML = [
	'<span class="ln">1</span> <span class="kw-export">import</span> <span class="br">{</span> <span class="prop">TsrxReactRspackPlugin</span> <span class="br">}</span> <span class="kw-export">from</span> <span class="str">\'@tsrx/rspack-plugin-react\'</span>;',
	'<span class="ln">2</span>',
	'<span class="ln">3</span> <span class="kw-export">export default</span> <span class="br">{</span>',
	'<span class="ln">4</span>   <span class="prop">plugins</span>: <span class="br">[</span><span class="kw">new</span> <span class="fn">TsrxReactRspackPlugin</span><span class="br">(</span><span class="br">)</span><span class="br">]</span>,',
	'<span class="ln">5</span> <span class="br">}</span>;',
].join('\n');

const TURBOPACK_INSTALL_HTML = [
	'<span class="ln">1</span> <span class="fn">pnpm</span> <span class="prop">install</span> <span class="str">@tsrx/react</span> <span class="str">@tsrx/turbopack-plugin-react</span> <span class="str">next</span> <span class="str">react</span> <span class="str">react-dom</span>',
].join('\n');

const TURBOPACK_CONFIG_HTML = [
	'<span class="ln">1</span> <span class="kw-export">import</span> <span class="prop">tsrxReactTurbopack</span> <span class="kw-export">from</span> <span class="str">\'@tsrx/turbopack-plugin-react\'</span>;',
	'<span class="ln">2</span>',
	'<span class="ln">3</span> <span class="kw-export">export default</span> <span class="fn">tsrxReactTurbopack</span><span class="br">(</span><span class="br">{</span>',
	'<span class="ln">4</span>   <span class="prop">reactStrictMode</span>: <span class="kw">true</span>,',
	'<span class="ln">5</span> <span class="br">}</span><span class="br">)</span>;',
].join('\n');

const PRETTIER_INSTALL_HTML = [
	'<span class="ln">1</span> <span class="fn">pnpm</span> <span class="prop">install</span> <span class="str">-D</span> <span class="str">prettier</span> <span class="str">@tsrx/prettier-plugin</span>',
].join('\n');

const ESLINT_INSTALL_HTML = [
	'<span class="ln">1</span> <span class="fn">pnpm</span> <span class="prop">install</span> <span class="str">-D</span> <span class="str">eslint</span> <span class="str">@tsrx/eslint-plugin</span>',
].join('\n');

const TYPESCRIPT_PLUGIN_INSTALL_HTML = [
	'<span class="ln">1</span> <span class="fn">pnpm</span> <span class="prop">install</span> <span class="str">-D</span> <span class="str">@tsrx/typescript-plugin</span>',
].join('\n');

const PRETTIER_CONFIG_HTML = [
	'<span class="ln">1</span> <span class="br">{</span>',
	'<span class="ln">2</span>   <span class="attr">"plugins"</span>: <span class="br">[</span><span class="str">"@tsrx/prettier-plugin"</span><span class="br">]</span>',
	'<span class="ln">3</span> <span class="br">}</span>',
].join('\n');

const ESLINT_CONFIG_HTML = [
	'<span class="ln">1</span> <span class="kw-export">import</span> <span class="prop">tsrx</span> <span class="kw-export">from</span> <span class="str">\'@tsrx/eslint-plugin\'</span>;',
	'<span class="ln">2</span>',
	'<span class="ln">3</span> <span class="kw-export">export default</span> <span class="br">[</span>...<span class="prop">tsrx</span>.<span class="prop">configs</span>.<span class="prop">recommended</span><span class="br">]</span>;',
].join('\n');

const TYPESCRIPT_PLUGIN_CONFIG_HTML = [
	'<span class="ln">1</span> <span class="br">{</span>',
	'<span class="ln">2</span>   <span class="attr">"compilerOptions"</span>: <span class="br">{</span>',
	'<span class="ln">3</span>     <span class="attr">"jsx"</span>: <span class="str">"preserve"</span>,',
	'<span class="ln">4</span>     <span class="attr">"plugins"</span>: <span class="br">[</span>',
	'<span class="ln">5</span>       <span class="br">{</span> <span class="attr">"name"</span>: <span class="str">"@tsrx/typescript-plugin"</span> <span class="br">}</span>',
	'<span class="ln">6</span>     <span class="br">]</span>',
	'<span class="ln">7</span>   <span class="br">}</span>',
	'<span class="ln">8</span> <span class="br">}</span>',
].join('\n');

const TYPECHECK_SCRIPT_HTML = [
	'<span class="ln">1</span> <span class="br">{</span>',
	'<span class="ln">2</span>   <span class="attr">"scripts"</span>: <span class="br">{</span>',
	'<span class="ln">3</span>     <span class="attr">"typecheck"</span>: <span class="str">"tsrx-tsc --noEmit"</span>',
	'<span class="ln">4</span>   <span class="br">}</span>',
	'<span class="ln">5</span> <span class="br">}</span>',
].join('\n');

const NAV_GROUPS = [
	{
		heading: 'Frameworks',
		items: [
			{ id: 'react-vite', label: 'React + Vite' },
			{ id: 'react-rspack', label: 'React + Rspack' },
			{ id: 'react-turbopack', label: 'React + Turbopack' },
			{ id: 'preact-vite', label: 'Preact + Vite' },
			{ id: 'solid-vite', label: 'Solid + Vite' },
			{ id: 'ripple', label: 'Ripple' },
		],
	},
	{
		heading: 'Tooling',
		items: [
			{ id: 'tooling-install', label: 'Tooling overview' },
			{ id: 'prettier', label: 'Prettier' },
			{ id: 'eslint', label: 'ESLint' },
			{ id: 'typescript-plugin', label: 'TypeScript plugin' },
			{ id: 'vscode', label: 'VS Code' },
		],
	},
	{
		heading: 'Next',
		items: [
			{ id: 'next', label: 'What\'s next?' },
		],
	},
];

export component GettingStartedPage() {
	<head>
		<title>{'TSRX | Getting Started'}</title>
		<meta
			name="description"
			content="Get started with TSRX: install with React, Preact, Solid, or Ripple for Vite, Rspack, or Turbopack, learn the component syntax, and explore statement-based control flow."
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

			<section class="hero">
				<h1>{'Getting Started'}</h1>
				<p class="lede">
					{'Set up TSRX with React, Solid, or Ripple and then wire in the editor tooling that makes '}
					<code class="inline-code">{'.tsrx'}</code>
					{' files feel native in the rest of your repo.'}
				</p>
			</section>

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
							for (const group of NAV_GROUPS) {
								<optgroup label={group.heading}>
									for (const item of group.items) {
										<option value={item.id}>{item.label}</option>
									}
								</optgroup>
							}
						</select>
					</label>
					<nav>
						for (const group of NAV_GROUPS) {
							<p class="side-nav-heading">{group.heading}</p>
							for (const item of group.items) {
								<a class="side-nav-link" href={`#${item.id}`}>{item.label}</a>
							}
						}
					</nav>
				</aside>

				<main class="docs-content">
					<section class="doc-section" id="react-vite">
						<p class="section-kicker">{'Framework setup'}</p>
						<h2 class="section-heading">{'React + Vite'}</h2>
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
					</section>

					<section class="doc-section" id="preact-vite">
						<h2 class="section-heading">{'Preact + Vite'}</h2>
						<p class="section-body">{'Install the Preact compiler and Vite plugin:'}</p>
						<pre class="code-block">
							<code>{html PREACT_INSTALL_HTML}</code>
						</pre>
						<p class="section-body">{'Then add the plugin to your Vite config:'}</p>
						<pre class="code-block">
							<code>{html PREACT_VITE_CONFIG_HTML}</code>
						</pre>
						<p class="section-body">
							{'The plugin compiles '}
							<code class="inline-code">{'.tsrx'}</code>
							{' modules into standard Preact components. '}
							<code class="inline-code">{'Suspense'}</code>
							{' is imported from '}
							<code class="inline-code">{'preact/compat'}</code>
							{' by default; pass '}
							<code class="inline-code">{'{ suspenseSource: \'preact-suspense\' }'}</code>
							{' to '}
							<code class="inline-code">{'tsrxPreact()'}</code>
							{' if you want to avoid pulling in the full compat layer.'}
						</p>
					</section>

					<section class="doc-section" id="react-rspack">
						<h2 class="section-heading">{'React + Rspack'}</h2>
						<p class="section-body">{'Install the compiler and Rspack plugin:'}</p>
						<pre class="code-block">
							<code>{html RSPACK_INSTALL_HTML}</code>
						</pre>
						<p class="section-body">{'Then add the plugin to your Rspack config:'}</p>
						<pre class="code-block">
							<code>{html RSPACK_CONFIG_HTML}</code>
						</pre>
						<p class="section-body">
							{'The plugin chains '}
							<code class="inline-code">{'builtin:swc-loader'}</code>
							{' for the final JSX transform and routes per-component '}
							<code class="inline-code">{'<style>'}</code>
							{' blocks through Rspack\'s built-in CSS module type, so no extra loaders are required.'}
						</p>
					</section>

					<section class="doc-section" id="react-turbopack">
						<h2 class="section-heading">{'React + Turbopack'}</h2>
						<p class="section-body">{'Install the compiler and Turbopack helper:'}</p>
						<pre class="code-block">
							<code>{html TURBOPACK_INSTALL_HTML}</code>
						</pre>
						<p class="section-body">{'Then wrap your Next config with the helper:'}</p>
						<pre class="code-block">
							<code>{html TURBOPACK_CONFIG_HTML}</code>
						</pre>
						<p class="section-body">
							{'The helper registers a Turbopack rule for '}
							<code class="inline-code">{'.tsrx'}</code>
							{' files, hands the compiled output back to Next as TSX, and routes component-local '}
							<code class="inline-code">{'<style>'}</code>
							{' blocks through a sibling virtual CSS import so Turbopack can process the scoped styles without extra loader setup.'}
						</p>
					</section>

					<section class="doc-section" id="solid-vite">
						<h2 class="section-heading">{'Solid + Vite'}</h2>
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
					</section>

					<section class="doc-section" id="ripple">
						<h2 class="section-heading">{'Ripple'}</h2>
						<p class="section-body">
							{'The Ripple framework ships with TSRX support as standard. If you\'re using Ripple with '}
							<code class="inline-code">{'@ripple-ts/vite-plugin'}</code>
							{', '}
							<code class="inline-code">{'.tsrx'}</code>
							{' files work out of the box — no additional packages needed.'}
						</p>
					</section>

					<section class="doc-section" id="tooling-install">
						<p class="section-kicker">{'Tooling setup'}</p>
						<h2 class="section-heading">{'Choose the tooling you want'}</h2>
						<p class="section-body">
							{'Once your compiler target is installed, add the editor tooling you actually want so '}
							<code class="inline-code">{'.tsrx'}</code>
							{' files behave like first-class source files in the rest of your repo. Prettier and ESLint are separate paths here, so you can adopt one without committing to the other.'}
						</p>
					</section>

					<section class="doc-section" id="prettier">
						<h2 class="section-heading">{'Prettier'}</h2>
						<p class="section-body">{'Install Prettier and the TSRX plugin:'}</p>
						<pre class="code-block">
							<code>{html PRETTIER_INSTALL_HTML}</code>
						</pre>
						<p class="section-body">
							{'Add the TSRX Prettier plugin to your '}
							<code class="inline-code">{'.prettierrc'}</code>
							{' so Prettier can parse and format '}
							<code class="inline-code">{'.tsrx'}</code>
							{' modules:'}
						</p>
						<pre class="code-block">
							<code>{html PRETTIER_CONFIG_HTML}</code>
						</pre>
					</section>

					<section class="doc-section" id="eslint">
						<h2 class="section-heading">{'ESLint'}</h2>
						<p class="section-body">{'Install ESLint and the TSRX plugin:'}</p>
						<pre class="code-block">
							<code>{html ESLINT_INSTALL_HTML}</code>
						</pre>
						<p class="section-body">
							{'The recommended flat config is the simplest starting point for '}
							<code class="inline-code">{'.tsrx'}</code>
							{' files:'}
						</p>
						<pre class="code-block">
							<code>{html ESLINT_CONFIG_HTML}</code>
						</pre>
					</section>

					<section class="doc-section" id="typescript-plugin">
						<h2 class="section-heading">{'TypeScript plugin'}</h2>
						<p class="section-body">
							{'Install '}
							<code class="inline-code">{'@tsrx/typescript-plugin'}</code>
							{' when you want TypeScript itself to understand '}
							<code class="inline-code">{'.tsrx'}</code>
							{' files, especially outside the TSRX VS Code extension: other editors, '}
							<code class="inline-code">{'tsserver'}</code>
							{', and command-line '}
							<code class="inline-code">{'tsc'}</code>
							{' workflows.'}
						</p>
						<pre class="code-block">
							<code>{html TYPESCRIPT_PLUGIN_INSTALL_HTML}</code>
						</pre>
						<p class="section-body">
							{'Then register it in your '}
							<code class="inline-code">{'tsconfig.json'}</code>
							{'. Keep your existing compiler options and add the '}
							<code class="inline-code">{'plugins'}</code>
							{' entry under '}
							<code class="inline-code">{'compilerOptions'}</code>
							{':'}
						</p>
						<pre class="code-block">
							<code>{html TYPESCRIPT_PLUGIN_CONFIG_HTML}</code>
						</pre>
						<p class="section-body">
							{'The plugin turns TSRX into virtual TypeScript for diagnostics, navigation, completions, and type checking. If you already use the TSRX VS Code extension, this manual setup is optional because the extension runs the language tooling for you.'}
						</p>
						<h3 class="subsection-heading">{'Command-line type checking'}</h3>
						<p class="section-body">
							{'The package also ships a '}
							<code class="inline-code">{'tsrx-tsc'}</code>
							{' binary — a drop-in '}
							<code class="inline-code">{'tsc'}</code>
							{' wrapper that understands '}
							<code class="inline-code">{'.tsrx'}</code>
							{' files. Use it for CI type checking and any '}
							<code class="inline-code">{'tsc'}</code>
							{' workflow that needs to see your TSRX modules. Add a '}
							<code class="inline-code">{'typecheck'}</code>
							{' script to your '}
							<code class="inline-code">{'package.json'}</code>
							{':'}
						</p>
						<pre class="code-block">
							<code>{html TYPECHECK_SCRIPT_HTML}</code>
						</pre>
						<p class="section-body">
							{'Then run '}
							<code class="inline-code">{'pnpm typecheck'}</code>
							{' to type check the whole project, including '}
							<code class="inline-code">{'.tsrx'}</code>
							{' files, without emitting any output. It accepts the same flags as '}
							<code class="inline-code">{'tsc'}</code>
							{'.'}
						</p>
					</section>

					<section class="doc-section" id="vscode">
						<h2 class="section-heading">{'VS Code'}</h2>
						<p class="section-body">
							{'Install '}
							<a
								class="inline-link"
								href="https://marketplace.visualstudio.com/items?itemName=Ripple-TS.ripple-ts-vscode-plugin"
								target="_blank"
								rel="noopener noreferrer"
							>
								{'TSRX for VS Code'}
							</a>
							{' from the Visual Studio Code Marketplace for diagnostics, navigation, completions, and TypeScript-aware editor support. Pair it with the official Prettier extension if you want format-on-save support inside the editor.'}
						</p>
						<p class="section-body">
							{'After that, opening a '}
							<code class="inline-code">{'.tsrx'}</code>
							{' file should give you syntax highlighting, diagnostics, go-to-definition, formatting, and the rest of the normal editor loop without extra manual setup.'}
						</p>
					</section>

					<section class="doc-section" id="next">
						<p class="section-kicker">{'Next'}</p>
						<h2 class="section-heading">{'What\'s next?'}</h2>
						<p class="section-body">
							{'Now that TSRX is set up, explore the language syntax — components, control flow, error boundaries, and more.'}
						</p>
						<a class="cta-link" href="/features">{'Explore the features →'}</a>
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

		.docs-layout {
			display: grid;
			grid-template-columns: 200px 1fr;
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

		.side-nav-heading:not(:first-child) {
			margin-top: 1.1rem;
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

		.doc-section:first-child {
			margin-top: 0.5rem;
		}

		.section-kicker {
			margin: 0 0 0.55rem;
			font-size: 0.78rem;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.08em;
			color: rgba(94, 44, 255, 0.7);
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
				display: flex;
				flex-direction: column;
				width: calc(100vw - 1.5rem);
				padding: 0.5rem 0 2rem;
			}

			.masthead {
				order: 1;
			}

			.docs-layout {
				order: 3;
			}

			.hero {
				order: 2;
			}

			.site-footer {
				order: 4;
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
				padding: 1rem 0 1rem;
			}

			.hero h1 {
				font-size: clamp(1.65rem, 7vw, 2.2rem);
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
