import { highlight_tsrx } from '../lib/code-highlight.ts';

const SNIPPET_HTML = highlight_tsrx(
	`export function Greeting({ name }: { name?: string }) @{
  const message = name ? \`Hello, \${name}\` : 'Hello, stranger';

  <>
    <div class="card">
      <p>{message}</p>
    </div>

    <style>
      .card { padding: 1rem; }
    </style>
  </>
}`,
);

const SOLID_LAZY_HTML = highlight_tsrx(
	`function Counter(&{ count, label }: Props) @{
  <section>
    <h2>{label}</h2>
    <p>Count: {count}</p>
  </section>
}`,
);

const INLINE_LOCALS_HTML = highlight_tsrx(
	`function Cart({ items }: { items: Item[] }) @{
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const discount = subtotal > 100 ? 0.1 : 0;

  <div>
    <h2>Your cart</h2>
    <p>Subtotal: \${subtotal}</p>
    <p>Save: \${(subtotal * discount).toFixed(2)}</p>
  </div>
}`,
);

const COLOCATION_HTML = highlight_tsrx(
	`function UserList({ users, showBio }: Props) @{
  @for (const user of users) {
    const initials = user.name.slice(0, 2).toUpperCase();
    const role = user.admin ? 'Admin' : 'Member';

    <div class="user-row">
      <span class="avatar">{initials}</span>
      <strong>{user.name}</strong>
      <span class="badge">{role}</span>

      @if (showBio && user.bio) {
        const short_bio = user.bio.slice(0, 140);
        const report = () => console.log('viewed ' + user.name);

        <div class="bio-detail">
          <p class="bio">{short_bio}</p>
          <button onClick={report}>Viewed</button>
        </div>
      }
    </div>
  }
}`,
);

export const IndexPage = () => @{
	<>
		<head>
			<title>
				TSRX | A TypeScript language extension for building declarative UIs in an agentic era.
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
						<a href="/getting-started">Getting Started</a>
						<a href="/features">Features</a>
						<a href="/specification">Specification</a>
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
				<section class="hero" id="top">
					<div class="hero-copy">
						<h1>
							TSRX is a TypeScript language extension for building declarative UIs in an agentic
							era.
						</h1>
					</div>
				</section>
				<section class="readable-section section-shell what-is-section" aria-label="What is TSRX">
					<p class="section-body what-is-copy">
						TSRX (TypeScript Render Extensions) is a way to write UI component code that stays
						readable and co-located. Structure, styling, and control flow live together, and the
						result stays fully backwards compatible with TypeScript and JSX.
					</p>
					<pre class="code-block">
						<code innerHTML={SNIPPET_HTML} />
					</pre>
					<p class="section-body what-is-copy">
						You can think of TSRX as a spiritual successor to JSX — the same mental model of
						embedding UI directly inside TypeScript, but with its own flavor. Control flow, scoped
						styles, and statement containers sit in the template as first-class syntax instead of
						being squeezed through expression slots, and the language stays aware of them through to
						the compiled output.
					</p>
					<p class="section-body what-is-copy">
						TSRX is framework-agnostic and interoperable. Today it compiles to React, Preact,
						Ripple, Solid, and Vue, with room for more targets over time. You can import
						<code class="inline-code">.tsrx</code>
						modules from JS, TS, and TSX files and it just works.
					</p>
					<div class="hero-actions">
						<a class="cta-link" href="/getting-started">Get started →</a>
						<a
							class="secondary-cta-link"
							href="https://github.com/Ripple-TS/ripple/tree/main/packages/tsrx"
							target="_blank"
							rel="noopener noreferrer"
						>View Source</a>
					</div>
					<p class="section-body what-is-copy compact-link-copy">
						Looking for the formal grammar and AST shape? Read the
						<a class="supporting-link" href="/specification">specification →</a>
					</p>
					<aside class="alpha-notice" role="note" aria-label="Beta release notice">
						<span class="alpha-badge">Beta</span>
						<p class="alpha-notice-body">
							TSRX is in active beta development. Feedback on the
							{' '}
							<a
								class="alpha-notice-link"
								href="https://github.com/Ripple-TS/ripple/issues"
								target="_blank"
								rel="noopener noreferrer"
							>issue tracker</a>
							{' '}
							is very welcome.
						</p>
					</aside>
				</section>
				<section class="readable-section section-shell">
					<p class="eyebrow">Benefits of TSRX</p>
					<h2 class="section-heading">Co-location helps engineers and AI systems alike.</h2>
					<p class="section-body">
						When structure, control flow, styling, and component shape live in the same file, the
						source reads closer to the interface it describes. TSRX keeps that co-location legible
						with a structural rule: TypeScript setup stays first, then the scope resolves to one
						output node. That cuts down on ternaries, map chains, and render helpers while making
						refactors and onboarding less brittle.
					</p>
					<pre class="code-block">
						<code innerHTML={COLOCATION_HTML} />
					</pre>
					<p class="section-body">
						Code is increasingly written, reviewed, and transformed with machine assistance. When UI
						structure is more explicit, editors, compilers, and code generation tools have a better
						surface to work with without changing the framework semantics underneath.
					</p>
					<p class="section-body">
						This is consistent with findings that language models attend unevenly to long contexts,
						performing best when relevant information sits close together rather than scattered
						across a window.
					</p>
					<p class="section-body">
						<a
							class="cta-link"
							href="https://arxiv.org/abs/2307.03172"
							target="_blank"
							rel="noopener noreferrer"
						>Lost in the Middle (Liu et al., TACL 2024) →</a>
					</p>
				</section>
				<section class="readable-section section-shell">
					<p class="eyebrow">Ergonomics</p>
					<h2 class="section-heading">Better ergonomics for today's frameworks.</h2>
					<p class="section-body">
						TSRX takes care of awkward target-specific details where the compiler can preserve the
						runtime's semantics directly. The source stays readable for humans and predictable for
						language models, while target transforms handle the mechanical parts that are safe to
						automate.
					</p>
					<p class="section-body">
						Solid props can be destructured eagerly. The
						<code class="inline-code">{'&{ ... }'}</code>
						pattern compiles to lazy getters, so reads stay reactive without forcing
						<code class="inline-code">props.count</code>
						everywhere and without losing type inference on the destructured names.
					</p>
					<pre class="code-block">
						<code innerHTML={SOLID_LAZY_HTML} />
					</pre>
					<p class="section-body">
						Locals can live next to the JSX that uses them. A statement container starts with
						TypeScript setup and ends with one output node, so derived values sit beside the markup
						they feed instead of piling up at the top of the component. Concerns stay together;
						readers (and LLMs) do less bookkeeping to follow the data flow.
					</p>
					<pre class="code-block">
						<code innerHTML={INLINE_LOCALS_HTML} />
					</pre>
				</section>
				<section class="readable-section section-shell" id="tooling">
					<p class="eyebrow">Tooling and adoption</p>
					<h2 class="section-heading">Rich integration with existing tooling.</h2>
					<p class="section-body">
						TSRX ships with a language server for editor diagnostics, navigation, and completion.
						Prettier and ESLint plugins keep formatting and linting consistent inside existing
						repositories, so the language can be adopted seriously instead of treated like a
						compiler experiment. Plus support for many IDEs and editors including VS Code, Zed,
						Neovim, IntelliJ and Sublime.
					</p>
					<p class="section-body">
						It interoperates with existing TypeScript and TSX codebases rather than demanding a full
						rewrite. Teams can adopt it where ergonomics matter most while keeping the surrounding
						code familiar.
					</p>
				</section>
				<section class="readable-section section-shell">
					<p class="eyebrow">Smart compilation</p>
					<h2 class="section-heading">TSRX compiles to multiple framework runtime outputs.</h2>
					<p class="section-body">
						The TSRX compiler parses component source into an AST and hands it off to
						framework-specific plugins for code generation. Plugins such as
						<code class="inline-code">@tsrx/react</code>
						,
						<code class="inline-code">@tsrx/preact</code>
						,
						<code class="inline-code">@tsrx/ripple</code>
						,
						<code class="inline-code">@tsrx/solid</code>
						, and
						<code class="inline-code">@tsrx/vue</code>
						transform the same AST into idiomatic output for their target runtimes, including scoped
						CSS. New targets can be added as standalone compiler plugins without changing the
						language itself.
					</p>
					<p class="section-body">
						<a class="cta-link" href="/playground">Try it in the playground →</a>
					</p>
				</section>
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
				padding: 1rem 0 6rem;
			}

			.section-shell {
				margin-top: 3.25rem;
			}

			.brand-lockup {
				justify-content: center;
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
				background: linear-gradient(
					90deg,
					rgba(111, 0, 255, 0.08) 0%,
					rgba(146, 92, 255, 0.08) 100%
				);
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
				display: inline-block;
				margin: 0 0.18em;
				color: #5e2cff;
				text-decoration: underline;
				text-underline-offset: 2px;
			}

			.alpha-notice-link:hover {
				color: #6f00ff;
			}

			.supporting-link {
				display: inline-block;
				margin: 0 0.18em;
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
	</>
};
