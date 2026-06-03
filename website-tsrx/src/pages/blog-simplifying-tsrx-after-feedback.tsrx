import { highlight_tsrx } from '../lib/code-highlight.ts';

const OLD_COMPONENT_SYNTAX_HTML = highlight_tsrx(
	`component Profile({ user }: { user: User | null }) {
  if (!user) {
    return;
  }

  const displayName = user.name.trim();

  if (user.isAdmin) {
    <p>{displayName}" can manage settings."</p>
  }

  const title = <tsx><strong>{displayName}</strong></tsx>;
  <Card {title} />
}`,
);

const SINGLE_ELEMENT_RETURN_HTML = highlight_tsrx(
	`function Button({ label, onClick }: Props) {
  return <button {onClick}>{label}</button>;
}`,
);

const NATIVE_EXPRESSION_VALUE_HTML = highlight_tsrx(
	`function Profile({ user }: { user: User }) {
  const displayName = user.name.trim();
  const title = <strong>{displayName}</strong>;

  return <Card {title} />;
}`,
);

const STATEMENT_CONTROL_FLOW_HTML = highlight_tsrx(
	`function Dashboard({ items }: Props) {
  return <>
    const visibleItems = items.filter((item) => !item.hidden);

    <ul>
      for (const item of visibleItems; key item.id) {
        <li>{item.label}</li>
      }
    </ul>

    try {
      <ActivityFeed />
    } pending {
      <p>"Loading activity..."</p>
    } catch (error) {
      <p>"Could not load activity."</p>
    }
  </>;
}`,
);

const OLD_RETURN_MAGIC_HTML = highlight_tsrx(
	`component Profile({ user }: { user: User | null }) {
  if (!user) {
    return;
  }

  <h1>{user.name}</h1>
}`,
);

const NORMAL_RETURN_HTML = highlight_tsrx(
	`function Profile({ user }: { user: User | null }) {
  if (!user) {
    return null;
  }

  return <h1>{user.name}</h1>;
}`,
);

const REACT_PREACT_HOOKS_HTML = highlight_tsrx(
	`function Profile({ user }: { user: User | null }) {
  if (!user) {
    return null;
  }

  useEffect(() => {
    trackProfile(user.id);
  }, [user.id]);

  return <ProfileCard {user} />;
}`,
);

const SPECIAL_CASES_BEFORE_HTML = highlight_tsrx(
	`component Article({ contentHtml, inputRef }: Props) {
  <article>{html contentHtml}</article>
  {html contentHtml}
  <input {ref inputRef} />
  <Child class={style 'card'} />

  <style>
    .card { padding: 1rem; }
  </style>
}`,
);

const SPECIAL_CASES_AFTER_HTML = highlight_tsrx(
	`function Article({ contentHtml, inputRef }: Props) {
  const styles = <style>
    .card { padding: 1rem; }
  </style>;

  return <>
    // Ripple, Solid, and Vue host elements
    <article innerHTML={contentHtml} />

    // Ripple and Solid fragment output
    <Fragment innerHTML={contentHtml} />

    // React and Preact host elements
    <article dangerouslySetInnerHTML={{ __html: contentHtml }} />

    <input ref={inputRef} />

    // Ripple, Preact, Solid, and Vue component props
    <Child class={styles.card} />

    // React component props
    <Child className={styles.card} />
  </>;
}`,
);

const SCOPED_STYLE_HTML = highlight_tsrx(
	`function Card({ title, tone }: Props) {
  return <>
    <article class="card" style={{ '--card-tone': tone }}>
      <h2>{title}</h2>
    </article>

    <style>
      .card {
        padding: 1rem;
        border-radius: 0.75rem;
        border-color: var(--card-tone);
      }
    </style>
  </>;
}`,
);

const MODULE_STYLE_HTML = highlight_tsrx(
	`const styles = <style>
  .card { padding: 1rem; }
  .title { font-weight: 700; }
</style>;

function ArticleCard({ title }: Props) {
  // Ripple, Preact, Solid, and Vue host elements:
  return <article class={styles.card}>
    <h2 class={styles.title}>{title}</h2>
  </article>;

  // React host elements:
  // return <article className={styles.card}>
  //   <h2 className={styles.title}>{title}</h2>
  // </article>;
}`,
);

const TAILWIND_STYLE_HTML = highlight_tsrx(
	`function Card({ title }: Props) {
  return <article class="rounded-xl p-4">{title}</article>;
}`,
);

export function BlogSimplifyingTsrxAfterFeedbackPage() {
	return <>
		<head>
			<title>{'Simplifying TSRX | TSRX Blog'}</title>
			<meta
				name="description"
				content="TSRX is removing early alpha syntax and moving closer to ordinary TypeScript and JSX patterns."
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
						<a href="/specification">{'Specification'}</a>
						<a href="/playground">{'Playground'}</a>
						<a href="/blog" aria-current="page">{'Blog'}</a>
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

				<main class="article-shell">
					<a class="back-link" href="/blog">{'Back to blog'}</a>
					<article>
						<header class="article-header">
							<p class="eyebrow">{'May 29, 2026'}</p>
							<h1>{'Simplifying TSRX'}</h1>
							<p class="lead">
								{'We listened to your feedback, TSRX is becoming smaller, clearer, and easier to debug.'}
							</p>
						</header>

						<p>
							{'PR '}
							<a
								href="https://github.com/Ripple-TS/ripple/pull/1177"
								target="_blank"
								rel="noopener noreferrer"
							>
								{'#1177'}
							</a>
							{' is a big cleanup pass for TSRX. The goal is simple: keep the parts that make UI authoring nicer, and remove the parts that made the language feel unfamiliar.'}
						</p>

						<p>
							{'This came from feedback from humans and companies experimenting with TSRX. It also came from evaluations of AI-generated output. The same pattern kept showing up: people and tools liked inline UI structure, but got confused by new concepts when debugging, especially the lack of a normal return statement, early-return magic, and too many TSRX-only syntax points.'}
						</p>

						<h2>{'Components are just functions'}</h2>
						<p>
							{'Before this cleanup, TSRX introduced its own '}
							<code>{'component'}</code>
							{' form. It removed the visible return statement, which made components look less like ordinary TypeScript.'}
						</p>
						<pre class="code-block">
							<code innerHTML={OLD_COMPONENT_SYNTAX_HTML} />
						</pre>
						<p>
							{'Now TSRX is an expression you return from an ordinary function. A component can return a single element directly when that is all it needs.'}
						</p>
						<pre class="code-block">
							<code innerHTML={SINGLE_ELEMENT_RETURN_HTML} />
						</pre>
						<p>
							{'We also removed the plain '}
							<code>{'<tsx>'}</code>
							{' island. TSRX itself is expression-based now: native elements and native fragments can be assigned, passed as props, or returned directly. The old '}
							<code>{'<tsrx>'}</code>
							{' wrapper is not needed either because TSRX is already the default in '}
							<code>{'.tsrx'}</code>
							{' files.'}
						</p>
						<pre class="code-block">
							<code innerHTML={NATIVE_EXPRESSION_VALUE_HTML} />
						</pre>
						<p>
							{'Native fragments offer the same benefits '}
							<code>{'<tsx>'}</code>
							{' was meant to provide. Keeping multiple ways to do the same thing did not add much once one path was clearer, more consistent, and easier for tools to explain.'}
						</p>
						<p>
							{'When you return a fragment, its body is statement-driven: you can declare values, branch with '}
							<code>{'if'}</code>
							{', loop with '}
							<code>{'for...of'}</code>
							{', and emit UI in order.'}
						</p>
						<pre class="code-block">
							<code innerHTML={STATEMENT_CONTROL_FLOW_HTML} />
						</pre>
						<p>
							{'All the useful TSRX control flow remains as-is: lists can still be rendered with '}
							<code>{'for...of'}</code>
							{', async boundaries can still use '}
							<code>{'try / pending / catch'}</code>
							{', and the template still reads in the order the UI is produced.'}
						</p>

						<h2>{'No more return magic inside templates'}</h2>
						<p>
							{'The earlier '}
							<code>{'component'}</code>
							{' model also allowed template bodies to bail out with a return. That looked convenient, but it made debugging strange because UI output and component exit behavior were mixed together.'}
						</p>
						<pre class="code-block">
							<code innerHTML={OLD_RETURN_MAGIC_HTML} />
						</pre>
						<p>
							{'Now guard returns live before TSRX opens, just like normal TypeScript and JSX. Inside template '}
							<code>{'for...of'}</code>
							{' loops, '}
							<code>{'continue'}</code>
							{' still skips the current item.'}
						</p>
						<pre class="code-block">
							<code innerHTML={NORMAL_RETURN_HTML} />
						</pre>
						<p>
							{'React and Preact still get one useful target-specific compiler pass here. If a guard return appears before a hook, TSRX can keep the source simple while compiling the hook path into a shape that preserves hook ordering.'}
						</p>
						<pre class="code-block">
							<code innerHTML={REACT_PREACT_HOOKS_HTML} />
						</pre>

						<h2>{'Fewer special cases'}</h2>
						<p>
							{'Ripple had accumulated a few TSRX-only shortcuts inside the old '}
							<code>{'component'}</code>
							{' shape: raw HTML blocks, ref blocks, and style class expressions. They worked, but each one was another rule to remember and another thing for tools to explain.'}
						</p>
						<pre class="code-block">
							<code innerHTML={SPECIAL_CASES_BEFORE_HTML} />
						</pre>
						<p>
							{'Those are now regular props. Ripple, Solid, and Vue use '}
							<code>{'innerHTML'}</code>
							{' on DOM elements. Ripple and Solid can also use '}
							<code>{'<Fragment innerHTML={...} />'}</code>
							{' when you want to insert HTML without a wrapper element. React and Preact use '}
							<code>{'dangerouslySetInnerHTML'}</code>
							{'. Refs use '}
							<code>{'ref={...}'}</code>
							{', and scoped classes can be shared with children through '}
							<code>{'const styles = <style>...</style>'}</code>
							{'.'}
						</p>
						<p>
							{'React TSRX does not rewrite an authored '}
							<code>{'class'}</code>
							{' prop into '}
							<code>{'className'}</code>
							{'. Use '}
							<code>{'className'}</code>
							{' when your React component expects it; the compiler will not hide that difference for you.'}
						</p>
						<p>
							{'For scoped styles on React host elements, TSRX still emits '}
							<code>{'className'}</code>
							{' for the generated CSS hash. That is generated output, not a rewrite of a class you wrote yourself.'}
						</p>
						<p>
							{'Removing the old '}
							<code>{'class'}</code>
							{' to '}
							<code>{'className'}</code>
							{' magic makes generated code easier for humans and LLMs to predict.'}
						</p>
						<p>
							{'The style expression is just a value. Put it before the returned content, then pass '}
							<code>{'styles.card'}</code>
							{' anywhere that value is in scope.'}
						</p>
						<pre class="code-block">
							<code innerHTML={SPECIAL_CASES_AFTER_HTML} />
						</pre>

						<h2>{'Styling stays optional'}</h2>
						<p>
							{'The '}
							<code>{'<style>'}</code>
							{' block is still there, but its mental model is clearer: styles are scoped to the TSRX fragment that contains them, not to a separate component declaration form. It works the same way as before for colocated styles.'}
						</p>
						<p>
							{'Inside '}
							<code>{'<style>'}</code>
							{', write static CSS. The TSRX rules for JavaScript statements and expressions inside elements do not apply there: no '}
							<code>{'if'}</code>
							{', '}
							<code>{'for'}</code>
							{', or '}
							<code>{'{expr}'}</code>
							{'. When a style value needs to change at runtime, set a CSS custom property on the element and read it with '}
							<code>{'var(...)'}</code>
							{'.'}
						</p>
						<pre class="code-block">
							<code innerHTML={SCOPED_STYLE_HTML} />
						</pre>
						<p>
							{'When you move styles into a value before the returned template, the model is intentionally more like '}
							<code>{'StyleX'}</code>
							{' and other popular CSS-in-JS solutions: the CSS is still static, but you get a declarative class map, and you pass those class names explicitly where you need them.'}
						</p>
						<pre class="code-block">
							<code innerHTML={MODULE_STYLE_HTML} />
						</pre>
						<p>
							{'This is optional. If your team prefers Tailwind, CSS modules, vanilla CSS, or a design system class API, keep using that. TSRX does not require colocated '}
							<code>{'<style>'}</code>
							{' blocks.'}
						</p>
						<pre class="code-block">
							<code innerHTML={TAILWIND_STYLE_HTML} />
						</pre>

						<h2>{'Why this matters'}</h2>
						<p>
							{'TSRX should make UI code easier to read, not harder to reason about. These changes make the language closer to TypeScript, closer to JSX, and easier for both people and AI tools to debug.'}
						</p>
						<p>
							{'The result is a smaller language with the same core idea: open TSRX from an expression, then write clear statement-based UI inside it.'}
						</p>
					</article>
				</main>

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
				overflow-x: clip;
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
				overflow-x: clip;
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
				width: min(1040px, calc(100vw - 2rem));
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

			.masthead-nav a:hover,
			.back-link:hover,
			article a:hover {
				color: #5e2cff;
			}

			.masthead-nav a[aria-current='page'] {
				color: #5e2cff;
				font-weight: 500;
			}

			.article-shell {
				width: min(760px, 100%);
				margin: 0;
				padding-top: 2.5rem;
			}

			.back-link {
				display: inline-flex;
				margin-bottom: 2rem;
				font-size: 0.95rem;
				font-weight: 700;
				color: #5e2cff;
			}

			.article-header {
				margin-bottom: 2rem;
			}

			.eyebrow {
				margin: 0 0 0.75rem;
				font-size: 0.78rem;
				font-weight: 700;
				text-transform: uppercase;
				letter-spacing: 0.08em;
				color: #5e2cff;
			}

			h1 {
				margin: 0;
				font-size: clamp(2.6rem, 8vw, 5.5rem);
				line-height: 0.95;
				letter-spacing: 0;
			}

			.lead {
				margin: 1.2rem 0 0;
				font-size: 1.25rem;
				line-height: 1.65;
				color: rgba(26, 22, 64, 0.72);
			}

			article p {
				margin: 1rem 0 0;
				font-size: 1.08rem;
				line-height: 1.75;
				color: rgba(26, 22, 64, 0.76);
			}

			article h2 {
				margin: 2.25rem 0 0;
				font-size: clamp(1.55rem, 4vw, 2.05rem);
				line-height: 1.15;
				letter-spacing: 0;
			}

			article a {
				color: #5e2cff;
				font-weight: 700;
			}

			article p code {
				background: rgba(94, 44, 255, 0.1);
				color: #5e2cff;
				padding: 0.12em 0.4em;
				border-radius: 4px;
				font-size: 0.92em;
			}

			.code-block {
				margin: 1rem 0 0;
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
			:global(.code-block .cmt) {
				color: #6a9955;
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

				.article-shell {
					padding-top: 2rem;
				}

				.lead,
				article p {
					font-size: 1rem;
				}

				.code-block {
					padding: 1rem 0.75rem;
					font-size: 0.75rem;
					line-height: 1.55;
				}
			}
		</style>
	</>;
}
