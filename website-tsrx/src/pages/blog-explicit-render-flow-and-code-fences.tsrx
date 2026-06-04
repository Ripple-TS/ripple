import { highlight_tsrx } from '../lib/code-highlight.ts';

const PREFERRED_COMPONENT_HTML = highlight_tsrx(
	`type CardProps = {
  count: number;
};

const Card = ({ count }: CardProps): JSX.Element => <>
  let tone = 'quiet';

  if (count > 5) {
    tone = 'strong';
  }
  ---
  @if (count > 5) {
    const label = \`Count \${count}\`;
    ---
    <div class={tone}>{label} is greater than 5</div>
  } else {
    <div class={tone}>Count is 5 or less</div>
  }
</>;`,
);

const FUNCTION_SCOPE_LOGIC_HTML = highlight_tsrx(
	`const ProfileCard = ({ user }: ProfileCardProps): JSX.Element => {
  const displayName = user.name.trim();

  if (!displayName) {
    return <p>Unknown user</p>;
  }

  return <>
    const initials = getInitials(displayName);
    ---
    <article>
      <h2>{displayName}</h2>
      <p>{initials}</p>
    </article>
  </>;
};`,
);

const NATIVE_AND_RENDER_FLOW_HTML = highlight_tsrx(
	`const Dashboard = ({ items }: DashboardProps): JSX.Element => {
  const visibleItems = items.filter((item) => !item.hidden);

  if (visibleItems.length === 0) {
    return <p>No items yet</p>;
  }

  return <section>
    <h2>Items</h2>

    @for (const item of visibleItems; key item.id) {
      <article>
        @if (item.isNew) {
          <span>New</span>
        }
        @switch (item.priority) {
          case 'high':
            <strong>High priority</strong>
            break;
          default:
            <span>Normal priority</span>
        }
        <h3>{item.label}</h3>
      </article>
    }
  </section>;
};`,
);

const NESTED_FENCES_HTML = highlight_tsrx(
	`const OrderSummary = ({ order }: OrderSummaryProps): JSX.Element => <section>
  const visibleLines = order.lines.filter((line) => line.quantity > 0);
  const total = visibleLines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  ---
  <h2>Order {order.id}</h2>
  <ul>
    @for (const line of visibleLines; key line.id) {
      <li>
        const subtotal = line.price * line.quantity;
        ---
        <span>{line.label}</span>
        <span>{formatCurrency(subtotal)}</span>
      </li>
    }
  </ul>
  <strong>{formatCurrency(total)}</strong>
</section>;`,
);

const CONTROL_FLOW_FENCE_HTML = highlight_tsrx(
	`const ActivityPanel = ({ result }: ActivityPanelProps): JSX.Element => <>
  @try {
    const activity = result.value;
    const latest = activity[0];
    ---
    @if (latest) {
      <ActivityCard activity={latest} />
    } else {
      <p>No activity yet</p>
    }
  } pending {
    <p>Loading activity...</p>
  } catch (error) {
    <p>{getErrorMessage(error)}</p>
  }
</>;`,
);

const ASSIGNED_RENDER_FLOW_HTML = highlight_tsrx(
	`const StatusBadge = ({ count }: StatusBadgeProps): JSX.Element => {
  const badge: JSX.Element = @if (count > 5) {
    <strong>High count: {count}</strong>
  } else {
    <span>Normal count</span>
  };

  return <header>{badge}</header>;
};`,
);

const REGULAR_TEXT_HTML = highlight_tsrx(
	`const Greeting = (): JSX.Element => <div>Hello there!</div>;

const EmptyState = ({ search }: EmptyStateProps): JSX.Element => <section>
  <h2>No results for {search}</h2>
  <p>Try a different search term.</p>
</section>;`,
);

const COMPONENT_SCOPE_HTML = highlight_tsrx(
	`const ProductCard = ({ product }: ProductCardProps): JSX.Element => <article>
  const price = formatCurrency(product.price);
  const title = product.name.trim();
  ---
  <h2>{title}</h2>
  @if (product.salePrice) {
    const salePrice = formatCurrency(product.salePrice);
    ---
    <p>Now {salePrice}, usually {price}</p>
  } else {
    <p>{price}</p>
  }
</article>;`,
);

export function BlogExplicitRenderFlowAndCodeFencesPage() {
	return <>
		<head>
			<title>Explicit render flow & code fences | TSRX Blog</title>
			<meta
				name="description"
				content="TSRX is making render control flow explicit with @if, @switch, @try, and @for, and separating template-local logic with code fences."
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
						<a
							href="https://discord.gg/HCYpT5QHQR"
							target="_blank"
							rel="noopener noreferrer"
						>Discord</a>
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
							<p class="eyebrow">June 3, 2026</p>
							<h1>Explicit render flow & code fences</h1>
						</header>
						<p>Ripple started with an idea we still believe in: let UI templates keep the power of JavaScript close to the markup that uses it. As TSRX grew out of that work, we also learned where that idea needed clearer boundaries, especially for codebases that have to scale across teams, tooling, and AI-assisted development.</p>
						<p>
							The previous post,
							<a href="/blog/simplifying-tsrx-after-feedback">Simplifying TSRX after feedback</a>
							, covered the first big correction: components became ordinary functions, returns became ordinary returns, and TSRX values became easier to store, pass, and type. That change moved TSRX closer to TypeScript and JSX. This post is about the next correction: making sure the specialized parts of TSRX no longer look like native JavaScript by accident.
						</p>
						<p>
							The feedback was consistent. People could not always tell the difference between JavaScript that ran as normal component logic and JavaScript-shaped syntax that meant "render this UI." The old render controls looked too much like native
							<code>if</code>
							,
							<code>switch</code>
							,
							<code>try</code>
							, and
							<code>for</code>
							. That made code harder for humans to scan and harder for LLMs to explain or edit safely, because custom template semantics were masquerading as real JavaScript with unclear indicators of what they're actually producing / returning.
						</p>
						<p>
							We also heard loud and clear that forcing static text through
							<code>""</code>
							or
							<code>
								{'{\'\'}'}
							</code>
							was annoying and unintuitive. JSX text is one of JSX's most useful affordances, and TSRX should preserve backwards compatibility with JSX instead of asking people to relearn something that already works. The same applies to composition: teams want to return a single element, a fragment with multiple elements, a render-control value, an array of elements, a scalar value, or the result of a component function call without each case feeling like a separate language feature.
						</p>
						<p>That is the spirit behind this update. TSRX keeps the parts that make templates expressive, but it becomes more honest about where template syntax begins, where JavaScript begins, and how values flow through the system. Crucially though, TSRX is now expression based like JSX, not statement based, like it originally started life as. This also means that JSX is fully backwards compatible with TSRX.</p>
						<h2>The new boundary</h2>
						<p>
							The new rule is simple. Native JavaScript control flow is still JavaScript. Render control flow is prefixed with
							<code>@</code>
							:
							<code>@if</code>
							,
							<code>@switch</code>
							,
							<code>@try</code>
							, and
							<code>@for</code>
							. When JavaScript statements are colocated inside an element or fragment, a single
							<code>---</code>
							(Astro style)
							fence separates that logic from the rendered template below it.
						</p>
						<h2>The preferred shape</h2>
						<p>Any function syntax can still define a component, but the most ergonomic pattern is a const declaration with an arrow return and an explicit return type when you want one. It keeps the props type close to the parameter, keeps the result type visible, and makes the returned template the obvious center of the component.</p>
						<pre class="code-block">
							<code innerHTML={PREFERRED_COMPONENT_HTML} />
						</pre>
						<p>
							In this example,
							<code>tone</code>
							is ordinary TypeScript that belongs to the fragment scope, and the unprefixed
							<code>if</code>
							above the fence is regular JavaScript control flow. The
							<code>---</code>
							line says: the script is done; the template starts now. The
							<code>@if</code>
							branch can have its own fenced script too, because render-control bodies are template scopes.
						</p>
						<h2>Fences are local to their element</h2>
						<p>Each element, fragment, and render-control body is its own lexical scope. A scope may have one code fence, and that fence must be at the top before any rendered output. If a deeper part of the template needs its own local values, put those values at the top of that deeper scope.</p>
						<pre class="code-block">
							<code innerHTML={NESTED_FENCES_HTML} />
						</pre>
						<p>
							This preserves one of TSRX's best ideas: logic can stay close to the markup that uses it. The fence just gives that colocated logic a predictable shape. If a scope starts to need multiple script sections, wrap the later section in another
							<code>
								{'<></>'}
							</code>
							fragment or extract a component. In practice, keeping script at the top nudges components toward clearer data flow.
						</p>
						<h2>Control flow can have fences too</h2>
						<p>Control flow is template syntax, so their bodies can also start with fenced JavaScript. That makes complex branches and async boundaries easier to read without losing locality.</p>
						<pre class="code-block">
							<code innerHTML={CONTROL_FLOW_FENCE_HTML} />
						</pre>
						<p>
							Expressions stay familiar as well. Inside
							<code>
								{'{}'}
							</code>
							, write JavaScript expression syntax the same way you would in JSX or React: call a formatter, read a property, choose a value, or pass a computed prop.
						</p>
						<h2>Render flow is a value</h2>
						<p>
							Because render controls are explicitly template constructs, they can now be assigned directly to variables. You no longer need to wrap an
							<code>if</code>
							branch in a fragment just to capture the rendered result.
						</p>
						<pre class="code-block">
							<code innerHTML={ASSIGNED_RENDER_FLOW_HTML} />
						</pre>
						<p>
							This is also where precise types become more useful. A stored element can be annotated as
							<code>JSX.Element</code>
							, and a component arrow can declare that it returns
							<code>JSX.Element</code>
							. The type describes the value you are producing instead of depending on a special component declaration form.
						</p>
						<h2>Text is regular JSX text</h2>
						<p>The old string-delimiting requirement is gone. Static text inside elements can be written like regular JSX text, and dynamic values still use expression braces.</p>
						<pre class="code-block">
							<code innerHTML={REGULAR_TEXT_HTML} />
						</pre>
						<p>
							That removes a small but persistent source of friction.
							<code>
								{'<div>Hello there!</div>'}
							</code>
							now means what JSX users expect it to mean.
						</p>
						<h2>Conclusion</h2>
						<p>The result is easier to scan, easier to type, and easier for tools to understand. Templates still have lexical scopes. Logic can still be colocated. Control flow still reads in the order the UI is produced. But the special parts are now marked as special, and ordinary JavaScript gets to remain ordinary JavaScript.</p>
						<p>Thank you for bearing with us while TSRX found this shape. From now, we're ready to move into the beta phase and we do not anticipate more core syntax changes beyond major bug fixes. The focus shifts to hardening the compiler, runtime behavior, editor tooling, and documentation around this syntax.</p>
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
	</>;
}
