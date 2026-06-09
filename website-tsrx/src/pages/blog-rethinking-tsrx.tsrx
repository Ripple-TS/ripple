import { highlight_tsrx } from '../lib/code-highlight.ts';

const STATEMENT_CONTAINER_COMPONENT_BODY_HTML = highlight_tsrx(
	`type ProductCardProps = {
  product: Product;
};

const ProductCard = ({ product }: ProductCardProps): JSX.Element => @{
  const price = formatCurrency(product.price);

  <article>
    <h2>{product.name}</h2>
    <p>{price}</p>
  </article>
};`,
);

const FUNCTION_STATEMENT_CONTAINER_BODY_HTML = highlight_tsrx(
	`export function UserBadge({ user }: UserBadgeProps): JSX.Element @{
  if (!user) {
    return <span class="muted">Signed out</span>;
  }

  const initials = user.name.slice(0, 2).toUpperCase();

  <button title={user.name}>{initials}</button>
}`,
);

const TOP_LEVEL_EARLY_RETURN_HTML = highlight_tsrx(
	`export function AccountPanel({ user }: AccountPanelProps): JSX.Element @{
  if (!user) {
    return <a href="/login">Sign in</a>;
  }

  const displayName = user.name.trim();

  <section>
    <h2>{displayName}</h2>
    <p>{user.plan}</p>
  </section>
}`,
);

const EXPLICIT_HOOK_COMPONENT_HTML = highlight_tsrx(
	`const DetailsPanel = ({ open }: DetailsPanelProps): JSX.Element => @{
  const [selected, setSelected] = useState('summary');

  @if (open) {
    <DetailsEditor />
  } @else {
    <button onClick={() => setSelected('details')}>Showing {selected}</button>
  }
};

function DetailsEditor(): JSX.Element {
  const [draft, setDraft] = useState('');

  return <Editor value={draft} onInput={setDraft} />;
}`,
);

const JSX_CONTROL_FLOW_SCOPE_HTML = highlight_tsrx(
	`const ActivityPanel = ({ result }: ActivityPanelProps): JSX.Element => @{
  @try {
    const activity = result.value;
    const latest = activity[0];

    @if (latest) {
      <ActivityCard activity={latest} />
    } @else {
      <p>No activity yet</p>
    }
  } @pending {
    <p>Loading activity...</p>
  } @catch (error) {
    <p>{getErrorMessage(error)}</p>
  }
};`,
);

const OLD_CONTROL_FLOW_LOOP_HTML = highlight_tsrx(
	`const ProductList = ({ products }: ProductListProps): JSX.Element => @{
  <ul>
    for (const product of products) {
      if (!product.available) {
        continue;
      }

      <li>{product.name}</li>
    }
  </ul>
};`,
);

const JSX_CONTROL_FLOW_LOOP_HTML = highlight_tsrx(
	`const ProductList = ({ products }: ProductListProps): JSX.Element => @{
  const visibleProducts = products.filter((product) => product.available);

  <ul>
    @for (const product of visibleProducts; key product.id) {
      const price = formatCurrency(product.price);

      <li>
        <span>{product.name}</span>
        <strong>{price}</strong>
      </li>
    } @empty {
      <li>No products available</li>
    }
  </ul>
};`,
);

const MULTIPLE_CONTROL_FLOW_CHILDREN_HTML = highlight_tsrx(
	`const Profile = ({ user }: ProfileProps): JSX.Element => @{
  @if (user) {
    const displayName = user.name.trim();

    <>
      <h2>{displayName}</h2>
      <p>{user.bio}</p>
    </>
  } @else {
    <a href="/login">Sign in</a>
  }
};`,
);

const JSX_COMMENTS_HTML = highlight_tsrx(
	`const Toolbar = (): JSX.Element => <nav>
  // Primary actions stay first for keyboard users.
  <button>Save</button>
  <button>Publish</button>

  /*
   * Secondary actions can be grouped later.
   */
  <a href="/settings">Settings</a>
</nav>;`,
);

const JSX_STATEMENT_CONTAINER_HTML = highlight_tsrx(
	`const App = (): JSX.Element => @{
  const message = formatMessage(user);

  <p>{message}</p>
};`,
);

const ASSIGNED_JSX_STATEMENT_CONTAINER_HTML = highlight_tsrx(
	`const summary: JSX.Element = @{
  const count = items.length;
  const label = count === 1 ? 'item' : 'items';

  <p>{count} {label}</p>
};

return <aside>{summary}</aside>;`,
);

const JSX_STATEMENT_CONTAINER_RULES_HTML = highlight_tsrx(
	`const App = (): JSX.Element => @{
  const title = getTitle();

  // Text and multiple children are wrapped in one fragment.
  <>
    Plain text goes in a fragment.
    <h2>{title}</h2>
  </>
};`,
);

const ASSIGNED_JSX_CONTROL_FLOW_HTML = highlight_tsrx(
	`const StatusBadge = ({ status }: StatusBadgeProps): JSX.Element => {
  const badge: JSX.Element = @switch (status) {
    @case 'active': {
      <strong>Active</strong>
    }
    @case 'idle': {
      <span>Idle</span>
    }
    @default: {
      <span>Offline</span>
    }
  };

  return <header>{badge}</header>;
};`,
);

const OLD_TEXT_HTML = highlight_tsrx(
	`const Greeting = (): JSX.Element => <div>"Hello there!"</div>;

const EmptyState = ({ search }: EmptyStateProps): JSX.Element => <section>
  <h2>"No results for "{search}</h2>
  <p>"Try a different search term."</p>
</section>;`,
);

const REGULAR_TEXT_HTML = highlight_tsrx(
	`const Greeting = (): JSX.Element => <div>Hello there!</div>;

const EmptyState = ({ search }: EmptyStateProps): JSX.Element => <section>
  <h2>No results for {search}</h2>
  <p>Try a different search term.</p>
</section>;`,
);

export function BlogRethinkingTsrxPage() @{
	<>
		<head>
			<title>Rethinking TSRX | TSRX Blog</title>
			<meta
				name="description"
				content="TSRX is leaning back into JSX: regular JSX text, expressions, comments, @{...} statement containers, and @if, @switch, @try, and @for for template control flow."
			/>
		</head>
		<div class="app-shell">
			<div class="page-shell">
				<header class="masthead">
					<a class="brand-lockup" href="/" aria-label="TSRX home">
						<img class="header-logo" src="/images/tsrx-mark.svg?v=4" alt="TSRX logo" />
					</a>
					<nav class="masthead-nav">
						<a href="/getting-started">Getting Started</a>
						<a href="/features">Features</a>
						<a href="/specification">Specification</a>
						<a href="/playground">Playground</a>
						<a href="/blog" aria-current="page">Blog</a>
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
				<main class="article-shell">
					<a class="back-link" href="/blog">Back to blog</a>
					<article>
						<header class="article-header">
							<p class="eyebrow">June 8, 2026</p>
							<h1>Rethinking TSRX</h1>
							<p class="lead">
								TSRX is leaning back into JSX, and making its specialized syntax look special
								instead of masquerading as ordinary JavaScript.
							</p>
						</header>
						<p>
							Ripple started with an idea we still believe in: let UI templates keep the power of
							JavaScript close to the markup that uses it. As TSRX grew out of that work, we also
							learned where that idea needed clearer boundaries, especially for codebases that have
							to scale across teams, tooling, and AI-assisted development.
						</p>
						<p>
							The previous post,
							<a href="/blog/simplifying-tsrx-after-feedback">Simplifying TSRX after feedback</a>
							, covered the first big correction: components became ordinary functions, returns
							became ordinary returns, and TSRX values became easier to store, pass, and type. That
							change moved TSRX closer to TypeScript and JSX. This post is about the next
							correction: making sure the specialized parts of TSRX no longer look like native
							JavaScript by accident.
						</p>
						<p>
							The feedback was consistent. People could not always tell the difference between
							JavaScript that ran as normal component logic and JavaScript-shaped syntax that meant
							"create this UI." Earlier control flow looked too much like native
							<code>if</code>
							,
							<code>switch</code>
							,
							<code>try</code>
							, and
							<code>for</code>
							. That made code harder for humans to scan and harder for LLMs to explain or edit
							safely, because custom template semantics were masquerading as real JavaScript with
							unclear indicators of what they were producing.
						</p>
						<p>
							We also heard loud and clear that forcing static text through
							<code>""</code>
							or
							<code>{'{\'\'}'}</code>
							was annoying and unintuitive. JSX text is one of JSX's most useful affordances, and
							TSRX should preserve backwards compatibility with JSX instead of asking people to
							relearn something that already works. The same applies to composition: teams want to
							return a single element, a fragment with multiple elements, or a JSX control flow
							value without each case feeling like a separate language feature.
						</p>
						<p>
							That is the spirit behind this update. TSRX keeps the parts that make templates
							expressive, but it becomes more honest about where template syntax begins, where
							JavaScript begins, and how values flow through the system. Crucially, TSRX is now
							expression-based like JSX, rather than statement-based as it originally started.
						</p>
						<h2>It is JSX again</h2>
						<p>
							Before this change, TSRX static text had to opt out of being parsed as template
							statements. That meant simple JSX-looking markup often carried extra quotes around the
							text, even when there was nothing dynamic going on.
						</p>
						<pre class="code-block">
							<code innerHTML={OLD_TEXT_HTML} />
						</pre>
						<p>
							That worked, but it made everyday markup feel like a dialect of JSX instead of JSX
							itself. The most important part of this update is also the most ordinary: if you know
							JSX, the template surface should now feel familiar. Static text is JSX text. Dynamic
							values use expression braces. Multiple children live in an element or fragment.
						</p>
						<pre class="code-block">
							<code innerHTML={REGULAR_TEXT_HTML} />
						</pre>
						<p>
							That removes a small but persistent source of friction.
							<code>{'<div>Hello there!</div>'}</code>
							now means what JSX users expect it to mean. Inside
							<code>{'{}'}</code>
							, write JavaScript expression syntax the same way you would in JSX or React: call a
							formatter, read a property, choose a value, or pass a computed prop.
						</p>
						<h2>Comments stay comments</h2>
						<p>
							TSRX also permits JavaScript comments between JSX children, including multiline block
							comments. They are useful for keeping intent close to a tricky bit of markup, and they
							do not render as text.
						</p>
						<pre class="code-block">
							<code innerHTML={JSX_COMMENTS_HTML} />
						</pre>
						<h2>JSX statement containers</h2>
						<p>
							JSX already has expression containers:
							<code>{'{value}'}</code>
							. TSRX adds the statement version:
							<code>{'@{...}'}</code>
							. It is still an expression, so it can appear anywhere JSX can appear: as a component
							body, as an assigned value, as a returned value, or as a child inside another element.
							The only difference is that it can now also contain JavaScript statements and yield
							JSX template when placed at the end.
						</p>
						<pre class="code-block">
							<code innerHTML={JSX_STATEMENT_CONTAINER_HTML} />
						</pre>
						<p>
							JSX statement containers are just expressions, so you can assign them to variables and
							use them like any other JSX.
						</p>
						<pre class="code-block">
							<code innerHTML={ASSIGNED_JSX_STATEMENT_CONTAINER_HTML} />
						</pre>
						<p>
							A statement container ends with exactly one output node: a JSX element, a JSX
							fragment, or JSX control flow like
							<code>@if</code>
							. Multiple elements need a fragment, and plain JSX text needs one too. Once that
							output appears, the container is done: no JavaScript logic can come after it.
						</p>
						<p>
							The
							<code>@</code>
							is the important boundary. If you write setup statements followed by a bare JSX
							element in a normal
							<code>{'{}'}</code>
							function body, the compiler will tell you to add the missing
							<code>@</code>
							so the body becomes
							<code>{'@{...}'}</code>
							.
						</p>
						<pre class="code-block">
							<code innerHTML={JSX_STATEMENT_CONTAINER_RULES_HTML} />
						</pre>
						<h2>Statement containers as component bodies</h2>
						<p>
							Most TSRX components can return JSX directly. When the body needs local setup before
							rendering, return a statement container directly instead of wrapping it in an empty
							fragment. Fragments are still there for real multiple-child output; they just are not
							ceremony.
						</p>
						<pre class="code-block">
							<code innerHTML={STATEMENT_CONTAINER_COMPONENT_BODY_HTML} />
						</pre>
						<p>
							A named function can use the same body shape. Ordinary JavaScript guard returns still
							work before the final template output.
						</p>
						<pre class="code-block">
							<code innerHTML={FUNCTION_STATEMENT_CONTAINER_BODY_HTML} />
						</pre>
						<p>
							Top-level early returns are permitted when
							<code>{'@{...}'}</code>
							is the body of the component function. They behave like ordinary component guard
							returns: leave early when you need to, otherwise finish the statement container with
							one final template output.
						</p>
						<pre class="code-block">
							<code innerHTML={TOP_LEVEL_EARLY_RETURN_HTML} />
						</pre>
						<h2>React and Preact hooks stay explicit</h2>
						<p>
							TSRX does not try to make conditional React or Preact hooks safe by moving them into
							generated child components. Hook ordering is runtime behavior, especially for effects,
							so a branch that owns hook state should be an explicit component with a name you can
							reason about.
						</p>
						<pre class="code-block">
							<code innerHTML={EXPLICIT_HOOK_COMPONENT_HTML} />
						</pre>
						<h2>JSX control flow</h2>
						<p>
							Control flow is now explicit JSX syntax. Use
							<code>@if</code>
							,
							<code>@for</code>
							,
							<code>@switch</code>
							, and
							<code>@try</code>
							when the control flow itself should produce template output. Each branch or block
							follows the same structural boundary as
							<code>{'@{...}'}</code>
							: optional TypeScript setup first, then a single rendered template output.
						</p>
						<p>
							The
							<code>@</code>
							is doing real work here. A bare
							<code>for</code>
							looks like JavaScript control flow, so both humans and AI agents naturally reach for
							JavaScript rules:
							<code>break</code>
							,
							<code>continue</code>
							, fallthrough, or branch-local returns. Template control flow is different: it is JSX
							that chooses what to render. The prefix makes that boundary visible before anyone has
							to infer it from context.
						</p>
						<pre class="code-block">
							<code innerHTML={JSX_CONTROL_FLOW_SCOPE_HTML} />
						</pre>
						<p>
							Here is what that looked like — the same list written with a bare loop, where reaching
							for a JavaScript-style
							<code>continue</code>
							to skip an item seems perfectly natural:
						</p>
						<pre class="code-block">
							<code innerHTML={OLD_CONTROL_FLOW_LOOP_HTML} />
						</pre>
						<p>
							The prefixed loop removes that ambiguity and uses the same shape: setup can happen at
							the top of each iteration, then the loop body produces one output node. If some items
							should not render, filter the iterable before the loop. If the list is empty, use the
							loop's
							<code>@empty</code>
							branch instead of smuggling a
							<code>continue</code>
							or
							<code>return</code>
							into template control flow.
						</p>
						<pre class="code-block">
							<code innerHTML={JSX_CONTROL_FLOW_LOOP_HTML} />
						</pre>
						<p>
							When a branch needs more than one rendered child, the one output node is simply a
							fragment. That keeps the shape predictable without making branches feel cramped.
						</p>
						<pre class="code-block">
							<code innerHTML={MULTIPLE_CONTROL_FLOW_CHILDREN_HTML} />
						</pre>
						<p>
							Because JSX control flow is explicitly template syntax, it can also be assigned
							directly to variables. You no longer need to wrap a
							<code>switch</code>
							branch in a helper just to store it.
						</p>
						<pre class="code-block">
							<code innerHTML={ASSIGNED_JSX_CONTROL_FLOW_HTML} />
						</pre>
						<p>
							This is also where precise types become more useful. A stored element can be annotated
							as
							<code>JSX.Element</code>
							, and a component arrow can declare that it returns
							<code>JSX.Element</code>
							. The type describes the value you are producing instead of depending on a special
							component declaration form.
						</p>
						<h2>Conclusion</h2>
						<p>
							The result is easier to scan, easier to type, and easier for tools to understand.
							Templates still have lexical scopes. Logic can still be colocated. JSX control flow
							still reads in the order the UI is produced. But the special parts are now marked as
							special with
							<code>@</code>
							, and ordinary JavaScript gets to remain ordinary JavaScript.
						</p>
						<p>
							Thank you for bearing with us while TSRX found this shape. From now, we're ready to
							move into the beta phase and we do not anticipate more core syntax changes beyond
							major bug fixes. The focus shifts to hardening the compiler, runtime behavior, editor
							tooling, and documentation around this syntax.
						</p>
					</article>
				</main>
				<footer class="site-footer">
					<p>Released under the MIT License.</p>
					<p>Copyright © 2025-present Dominic Gannaway</p>
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
				display: inline-block;
				margin: 0 0.18em;
				color: #5e2cff;
				font-weight: 700;
			}

			article p code {
				display: inline-block;
				background: rgba(94, 44, 255, 0.1);
				color: #5e2cff;
				padding: 0.16em 0.48em;
				margin: 0 0.18em;
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
	</>
}
