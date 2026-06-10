// Code snippets

import { highlight_tsrx } from '../lib/code-highlight.ts';

const COMPONENT_HTML = highlight_tsrx(
	`export function Button({ label, onClick }: {
  label: string;
  onClick: () => void;
}) @{
  <>
    // Ripple, Preact, Solid, and Vue host elements:
    <button class="btn" {onClick}>{label}</button>

    // React host elements:
    // <button className="btn" {onClick}>{label}</button>

    <style>
      .btn {
        padding: 0.5rem 1rem;
        border-radius: 4px;
      }
    </style>
  </>
}`,
);

const BAILOUT_HTML = highlight_tsrx(
	`export function Counter() @{
  let count = 0;

  // Plain JS/TS control flow can live in nested functions.
  function increment() {
    if (count >= 10) {
      count = 0;
    } else {
      count += 1;
    }
  }

  <button onClick={increment}>Count: {count}</button>
}`,
);

const TEMPLATE_STRUCTURE_HTML = highlight_tsrx(
	`function ProductCard({ product }: { product: Product }) @{
  const name = product.name.trim();
  const price = money(product.price);

  <article>
    <h2>{name}</h2>

    <footer>@{
      const hasDiscount = product.discount > 0;

      <>
        <strong>{price}</strong>
        @if (hasDiscount) {
          <span>Sale</span>
        }
      </>
    }</footer>
  </article>
}`,
);

const COMMENTS_HTML = highlight_tsrx(
	`function Menu({ showAdmin }: { showAdmin: boolean }) @{
  <nav>
    // Comments can sit between template children.
    <a href="/">Home</a>

    /*
     * Block comments stay comments too.
     */
    @if (showAdmin) {
      // Branch comments are allowed too.
      <a href="/admin">Admin</a>
    }
  </nav>
}`,
);

const IF_HTML = highlight_tsrx(
	`function StatusBadge({ status }: { status: 'active' | 'idle' | 'offline' }) @{
  @if (status === 'active') {
    <span class="badge active">Online</span>
  } @else if (status === 'idle') {
    <span class="badge idle">Away</span>
  } @else {
    <span class="badge">Offline</span>
  }
}`,
);

const FOR_HTML = highlight_tsrx(
	`function TodoList({ items }: { items: Todo[] }) @{
  const visibleItems = items.filter((item) => !item.hidden);

  <ul>
    @for (const item of visibleItems; index i; key item.id) {
      <li>{i + 1}. {item.text}</li>
    } @empty {
      <li>No todos yet</li>
    }
  </ul>
}`,
);

const TRY_HTML = highlight_tsrx(
	`function SafeProfile({ userId }: { userId: string }) @{
  @try {
    <UserProfile id={userId} />
  } @catch (error) {
    <div class="error">
      <p>Something went wrong.</p>
    </div>
  }
}`,
);

const TRY_RESET_HTML = highlight_tsrx(
	`export function RetryBoundary() @{
  @try {
    <ComponentThatMightFail />
  } @catch (e, reset) {
    <div>
      <p>Error: {e.message}</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  }
}`,
);

const SWITCH_HTML = highlight_tsrx(
	`function StatusMessage({ status }: { status: string }) @{
  @switch (status) {
    @case 'loading': {
      <p>Loading...</p>
    }
    @case 'success': {
      <p class="success">Done!</p>
    }
    @default: {
      <p>Unknown status.</p>
    }
  }
}`,
);

const SHORTHAND_HTML = highlight_tsrx(
	`// Instead of repeating the name:
<Input value={value} onChange={onChange} />

// Use the shorthand:
<Input {value} {onChange} />`,
);

const SCOPING_HTML = highlight_tsrx(
	`function App() @{
  const name = 'World';

  <div>@{
    // This is a new scope - you can declare variables here
    const greeting = 'Hello, ' + name + '!';

    <h1>{greeting}</h1>
  }</div>
}`,
);

const CHILDREN_HTML = highlight_tsrx(
	`// Children as nested JSX - this works:
<Card>
  <h2>Title</h2>
  <p>Content goes here.</p>
</Card>

// Passing an array or function? Use the children prop:
<List children={items.map(renderItem)} />`,
);

const RENDER_PROPS_HTML = highlight_tsrx(
	`function App({ items }: { items: Item[] }) @{
  function renderItem(item: Item) {
    return <li>{item.label}</li>;
  }

  <List items={items} render={renderItem} />
}`,
);

const ASYNC_BOUNDARY_HTML = highlight_tsrx(
	`const UserProfile = lazy(() => import('./UserProfile.tsrx'));

export function App() @{
  @try {
    <UserProfile id={1} />
  } @pending {
    <p>Loading...</p>
  } @catch (e) {
    <p>Something went wrong.</p>
  }
}`,
);

const DYNAMIC_HTML = highlight_tsrx(
	`type PanelProps = {
  as?: 'section' | 'article';
  item: Item;
  expanded: boolean;
};

function Summary({ item }: { item: Item }) @{
  <p>{item.summary}</p>
}

function Details({ item }: { item: Item }) @{
  <article>{item.body}</article>
}

export function Panel({ as = 'section', item, expanded }: PanelProps) @{
  const Body = expanded ? Details : Summary;

  <{as} className="panel">
    <{Body} item={item} />
  </{as}>
}`,
);

const SCOPED_STYLES_HTML = highlight_tsrx(
	`function Card() @{
  <>
    <div class="card">
      <h2>Scoped title</h2>
      <p>Styles here won't leak out.</p>
    </div>

    <style>
      .card {
        padding: 1.5rem;
        border: 1px solid #ddd;
      }

      h2 { color: #333; }
    </style>
  </>
}`,
);

const STYLE_COMPOSITION_HTML = highlight_tsrx(
	`function Badge({ class: className }: { class?: string }) @{
  <>
    <span class={'badge ' + (className ?? '')}>New</span>

    <style>
      .badge { padding: 0.25rem 0.5rem; }
    </style>
  </>
}

function App() @{
  const styles = <style>
    .highlight { background: #e8f5e9; color: #2e7d32; }
  </style>;

  <>
    // Ripple, Preact, Solid, and Vue component props:
    <Badge class={styles.highlight} />

    // React component props:
    // <Badge className={styles.highlight} />
  </>
}`,
);

const MODULE_STYLE_COMPOSITION_HTML = highlight_tsrx(
	`const articleStyles = <style>
  .card { padding: 1rem; }
  .title { font-weight: 700; }
</style>;

export function ArticleCard({ title }: { title: string }) @{
  // Ripple, Preact, Solid, and Vue host elements:
  <article class={articleStyles.card}>
    <h2 class={articleStyles.title}>{title}</h2>
  </article>

  // React host elements:
  // <article className={articleStyles.card}>
  //   <h2 className={articleStyles.title}>{title}</h2>
  // </article>
}`,
);

const LAZY_PROPS_HTML = highlight_tsrx(
	`function UserCard(&{ name, age }: { name: string; age: number }) {
  return <div>
    <h2>{name}</h2>
    <p>Age: {age}</p>
  </div>;
}`,
);

const NAV_ITEMS = [
	{ id: 'components', label: 'Components' },
	{ id: 'template-structure', label: 'Statement containers' },
	{ id: 'comments', label: 'JS comments' },
	{ id: 'lazy-destructuring', label: 'Lazy destructuring' },
	{ id: 'prop-shorthands', label: 'Prop shorthands' },
	{ id: 'scoping', label: 'Lexical scoping' },
	{ id: 'if', label: 'Conditional rendering' },
	{ id: 'for', label: 'List rendering' },
	{ id: 'switch', label: 'Switch statements' },
	{ id: 'try', label: 'Error boundaries' },
	{ id: 'async-boundaries', label: 'Async boundaries' },
	{ id: 'dynamic', label: 'Dynamic rendering' },
	{ id: 'scoped-styles', label: 'Scoped styles' },
	{ id: 'style-composition', label: 'Style composition' },
];

export const FeaturesPage = () => @{
	<>
		<head>
			<title>TSRX | Features</title>
			<meta
				name="description"
				content="TSRX language features: function components, statement containers, JSX control flow, dynamic rendering, error boundaries, and more."
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
						<a href="/features" aria-current="page">Features</a>
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
							<p class="side-nav-heading">Features</p>
							@for (const item of NAV_ITEMS) {
								<a class="side-nav-link" href={`#${item.id}`}>{item.label}</a>
							}
						</nav>
					</aside>
					<main class="docs-content">
						<section class="doc-section" id="components">
							<h2 class="section-heading">Components</h2>
							<p class="section-body">
								A TSRX component is just a TypeScript function that produces JSX. Use a
								statement-container body for component-shaped templates, especially when local
								setup, comments, scoped styles, or multiple rendered children belong with the
								markup.
							</p>
							<p class="section-body">
								In practice, components are ordinary TypeScript functions or
								{' '}
								<code class="inline-code">const</code>
								{' '}
								values. A component can use
								{' '}
								<code class="inline-code">{'@{...}'}</code>
								{' '}
								as the function body, giving you one place for local state, derived values, template
								control flow, rendered elements, and scoped styles.
							</p>
							<pre class="code-block">
								<code innerHTML={COMPONENT_HTML} />
							</pre>
							<p class="section-body">
								Export them like any other function:
								{' '}
								<code class="inline-code">{'export function Name() @{ <div /> }'}</code>
								. The compiler turns that into the right component shape for the target you're
								using.
							</p>
							<p class="section-body">
								When a bit of logic should stay plain JavaScript rather than render into the
								template, put it in a normal function beside the markup. Use
								{' '}
								<code class="inline-code">{'function fn() { ... }'}</code>
								{' '}
								for ordinary control flow, then call helpers from event handlers or expressions:
								{' '}
								<code class="inline-code">{'onClick={fn}'}</code>
								.
							</p>
							<pre class="code-block">
								<code innerHTML={BAILOUT_HTML} />
							</pre>
						</section>
						<section class="doc-section" id="template-structure">
							<h2 class="section-heading">Statement containers</h2>
							<p class="section-body">
								When a template scope mixes TypeScript setup with rendered output, wrap the setup in
								<code class="inline-code">{'@{...}'}</code>
								. TSRX treats everything before the final renderable child as script, then the
								container must finish with exactly one output node.
							</p>
							<p class="section-body muted">
								That final output can be a JSX element, a JSX fragment, or JSX control flow like
								{' '}
								<code class="inline-code">{'@if'}</code>
								,
								{' '}
								<code class="inline-code">{'@for'}</code>
								,
								{' '}
								<code class="inline-code">{'@switch'}</code>
								, or
								{' '}
								<code class="inline-code">{'@try'}</code>
								. It cannot be a bare expression container, and no script statements can appear
								after it.
							</p>
							<p class="section-body muted">
								If the rendered part needs multiple siblings or text next to elements, wrap those
								children in a fragment so they become one output. The rule applies locally to
								component bodies, element children, and control-flow branches, so setup can stay
								close to the markup that uses it without turning ordinary template text into
								JavaScript.
							</p>
							<p class="section-body muted">
								Control-flow bodies are implicit statement containers too:
								<code class="inline-code">@if</code>
								,
								<code class="inline-code">@for</code>
								,
								<code class="inline-code">@switch</code>
								, and
								<code class="inline-code">@try</code>
								arms all use
								<code class="inline-code">{'{}'}</code>
								blocks.
							</p>
							<p class="section-body muted">
								If you write setup statements and then a bare JSX element inside a normal
								<code class="inline-code">{'{}'}</code>
								function body, the compiler will ask you to add the missing
								<code class="inline-code">@</code>
								. Plain braces are JavaScript; statement-container braces are
								<code class="inline-code">{'@{...}'}</code>
								.
							</p>
							<pre class="code-block">
								<code innerHTML={TEMPLATE_STRUCTURE_HTML} />
							</pre>
						</section>
						<section class="doc-section" id="comments">
							<h2 class="section-heading">JS comments</h2>
							<p class="section-body">
								JavaScript line and block comments are valid inside template children. They are
								comments, not rendered text, so you can annotate element bodies and control-flow
								branches without wrapping the note in braces.
							</p>
							<pre class="code-block">
								<code innerHTML={COMMENTS_HTML} />
							</pre>
						</section>
						<section class="doc-section" id="lazy-destructuring">
							<h2 class="section-heading">Lazy destructuring</h2>
							<p class="section-body">
								TSRX adds two sigils —
								<code class="inline-code">{'&{ ... }'}</code>
								for objects and
								<code class="inline-code">{'&[ ... ]'}</code>
								for arrays — that look like destructuring but defer the actual property access until
								each binding is read. Every reference to a lazy binding is compiled back to a
								property lookup on the source object, so downstream readers pick up the latest value
								without a manual getter.
							</p>
							<p class="section-body">
								The most common use is in component parameters. Regular object destructuring would
								snapshot each prop at call time and break any target runtime that relies on
								per-access reactivity (Ripple, Solid, Vue).
								<code class="inline-code">{'&{ ... }'}</code>
								preserves that reactivity while keeping the ergonomic destructuring syntax:
							</p>
							<pre class="code-block">
								<code innerHTML={LAZY_PROPS_HTML} />
							</pre>
							<p class="section-body muted">
								Lazy destructuring is supported across every target. In React and Preact it compiles
								to direct property access on the source object; in Ripple, Solid, and Vue it
								preserves tracked, signal, or proxy-backed reactivity without needing a wrapper
								call.
							</p>
						</section>
						<section class="doc-section" id="prop-shorthands">
							<h2 class="section-heading">Prop shorthands</h2>
							<p class="section-body">
								When a prop name matches the variable you're passing, you can use the shorthand
								<code class="inline-code">{'{name}'}</code>
								instead of
								<code class="inline-code">{'name={name}'}</code>
								. This works for any attribute or prop — including event handlers like
								<code class="inline-code">{'{onClick}'}</code>
								.
							</p>
							<pre class="code-block">
								<code innerHTML={SHORTHAND_HTML} />
							</pre>
						</section>
						<section class="doc-section" id="scoping">
							<h2 class="section-heading">Lexical scoping</h2>
							<p class="section-body">
								Every statement container and control-flow block creates its own lexical scope. You
								can declare variables, compute derived values, or call functions there — they're
								scoped to that block and won't leak into the surrounding function.
							</p>
							<pre class="code-block">
								<code innerHTML={SCOPING_HTML} />
							</pre>
							<p class="section-body">
								This applies to all block-like contexts: statement containers and control flow
								branches (
								<code class="inline-code">@if</code>
								,
								<code class="inline-code">@for</code>
								,
								<code class="inline-code">@switch</code>
								,
								<code class="inline-code">@try</code>
								). Each one has its own scope.
							</p>
						</section>
						<section class="doc-section" id="if">
							<h2 class="section-heading">Conditional rendering</h2>
							<p class="section-body">
								Use
								<code class="inline-code">@if</code>
								/
								<code class="inline-code">else if</code>
								/
								<code class="inline-code">else</code>
								template expressions directly inside templates, or return them directly from a
								component. Branches render their template output, while ordinary
								<code class="inline-code">if</code>
								statements in setup stay plain JavaScript for guard returns. Direct
								<code class="inline-code">return</code>
								,
								<code class="inline-code">continue</code>
								, and
								<code class="inline-code">break</code>
								are not allowed inside
								<code class="inline-code">@if</code>
								template branches.
							</p>
							<pre class="code-block">
								<code innerHTML={IF_HTML} />
							</pre>
						</section>
						<section class="doc-section" id="for">
							<h2 class="section-heading">List rendering</h2>
							<p class="section-body">
								Render lists with
								<code class="inline-code">{'@for (... of ...)'}</code>
								loops. TSRX extends the syntax with optional
								<code class="inline-code">index</code>
								and
								<code class="inline-code">key</code>
								clauses so you don't need separate counters or key-extraction boilerplate. The
								optional
								<code class="inline-code">@empty</code>
								branch renders when the iterable has no items.
							</p>
							<p class="section-body">
								Filter the collection before passing it to
								<code class="inline-code">@for</code>
								when some items should not render. Use
								<code class="inline-code">@empty</code>
								for the no-items branch. Direct
								<code class="inline-code">continue</code>
								,
								<code class="inline-code">break</code>
								, and
								<code class="inline-code">return</code>
								statements are not allowed in
								<code class="inline-code">@for</code>
								template loop bodies; nested functions keep ordinary JavaScript control flow.
							</p>
							<p class="section-body">
								Other JavaScript loops are not template rendering constructs: regular
								<code class="inline-code">for</code>
								,
								<code class="inline-code">for...in</code>
								,
								<code class="inline-code">while</code>
								, and
								<code class="inline-code">do...while</code>
								are rejected in TSRX template scope. Move imperative loops into a nested function or
								effect, or render collections with
								<code class="inline-code">{'@for (... of ...)'}</code>
								.
							</p>
							<pre class="code-block">
								<code innerHTML={FOR_HTML} />
							</pre>
						</section>
						<section class="doc-section" id="switch">
							<h2 class="section-heading">Switch statements</h2>
							<p class="section-body">
								Multi-branch rendering uses an
								<code class="inline-code">@switch</code>
								template expression. Each
								<code class="inline-code">case</code>
								or
								<code class="inline-code">default</code>
								has its own
								<code class="inline-code">{'{}'}</code>
								body, cases never fall through, and
								<code class="inline-code">break</code>
								and
								<code class="inline-code">return</code>
								are invalid inside the case body.
							</p>
							<pre class="code-block">
								<code innerHTML={SWITCH_HTML} />
							</pre>
						</section>
						<section class="doc-section" id="try">
							<h2 class="section-heading">Error boundaries</h2>
							<p class="section-body">
								Wrap components in
								<code class="inline-code">@try</code>
								/
								<code class="inline-code">catch</code>
								to create error boundaries. If a child component throws, the catch block renders its
								fallback children.
							</p>
							<pre class="code-block">
								<code innerHTML={TRY_HTML} />
							</pre>
							<p class="section-body">
								The
								<code class="inline-code">catch</code>
								block also receives a
								<code class="inline-code">reset</code>
								function as its second argument. Calling
								<code class="inline-code">reset()</code>
								clears the error state and re-renders the children, which is useful for building
								retry UIs:
							</p>
							<pre class="code-block">
								<code innerHTML={TRY_RESET_HTML} />
							</pre>
						</section>
						<section class="doc-section" id="async-boundaries">
							<h2 class="section-heading">Async boundaries</h2>
							<p class="section-body">
								Wrap a component subtree in
								<code class="inline-code">@try</code>
								/
								<code class="inline-code">pending</code>
								/
								<code class="inline-code">catch</code>
								to handle async children. While a lazy child or resource is in flight, the
								<code class="inline-code">pending</code>
								branch renders; when it resolves, the
								<code class="inline-code">@try</code>
								body takes over; if it rejects — or any child throws synchronously —
								<code class="inline-code">catch</code>
								runs. Both
								<code class="inline-code">pending</code>
								and
								<code class="inline-code">catch</code>
								are optional and can be used independently. Each branch follows the same
								setup-then-one-output rule as a statement container.
							</p>
							<p class="section-body">
								Async work itself is expressed using the target's own lazy-loading primitive —
								<code class="inline-code">lazy()</code>
								from
								<code class="inline-code">react</code>
								,
								<code class="inline-code">preact/compat</code>
								, or
								<code class="inline-code">solid-js</code>
								,
								<code class="inline-code">defineVaporAsyncComponent()</code>
								on Vue Vapor, and
								<code class="inline-code">trackAsync()</code>
								on Ripple. In Solid, Vue, and Ripple targets, returned TSRX templates are
								synchronous and do not allow inline
								<code class="inline-code">await</code>
								. On React and Preact, template-body
								<code class="inline-code">await</code>
								is supported and TSRX emits an async component function.
							</p>
							<p class="section-body muted">
								React/Preact note:
								<code class="inline-code">for await...of</code>
								is not supported inside component templates. Use an upstream async helper and render
								the resolved data.
							</p>
							<pre class="code-block">
								<code innerHTML={ASYNC_BOUNDARY_HTML} />
							</pre>
						</section>
						<section class="doc-section" id="dynamic">
							<h2 class="section-heading">Dynamic elements and components</h2>
							<p class="section-body">
								Use the dynamic tag syntax
								<code class="inline-code">{'<{expression}>'}</code>
								when the host element tag or component constructor is selected at runtime. The
								expression can evaluate to a string tag name like
								<code class="inline-code">'section'</code>
								or a component value, and the closing tag repeats the same expression:
								<code class="inline-code">{'</{expression}>'}</code>
								. No import is required; each target compiler lowers the tag to its own runtime
								helper.
							</p>
							<p class="section-body">
								The tag expression must be able to resolve to an element name: an identifier, member
								access, static string, or a runtime expression composed of those. Calls, spreads,
								string concatenation, string interpolation, and static non-string literals are not
								valid tag names.
							</p>
							<pre class="code-block">
								<code innerHTML={DYNAMIC_HTML} />
							</pre>
							<p class="section-body muted">
								The example uses React's
								<code class="inline-code">className</code>
								prop. Ripple, Preact, Solid, and Vue use
								<code class="inline-code">class</code>
								for host classes. Removed dynamic tag forms like
								<code class="inline-code">{'<@tag />'}</code>
								and
								<code class="inline-code">{'<@Component />'}</code>
								are not part of current TSRX.
							</p>
						</section>
						<section class="doc-section" id="scoped-styles">
							<h2 class="section-heading">Scoped styles</h2>
							<p class="section-body">
								Each returned TSRX template can include a
								<code class="inline-code">{'<style>'}</code>
								block. Styles are automatically scoped — the compiler rewrites selectors with a
								unique hash so they only apply to elements inside the component fragment that
								defines them. A parent's scoped styles will not leak into child components.
							</p>
							<pre class="code-block">
								<code innerHTML={SCOPED_STYLES_HTML} />
							</pre>
							<p class="section-body">
								To escape scoping and apply styles globally, wrap a selector in
								<code class="inline-code">:global()</code>
								. This lets you reach into child components or target elements outside the current
								scope.
							</p>
							<p class="section-body muted">
								React note: TSRX keeps authored attributes as written. Use
								<code class="inline-code">className</code>
								on React host elements and React component props, just like ordinary JSX.
								Compiler-injected scoped style hashes still use React's
								<code class="inline-code">className</code>
								output when needed.
							</p>
						</section>
						<section class="doc-section" id="style-composition">
							<h2 class="section-heading">Style composition</h2>
							<p class="section-body">
								Because scoped styles don't cross component boundaries, assigning a
								<code class="inline-code">{'<style>'}</code>
								expression to a variable exposes a class map for passing scoped class names to child
								components as props.
								<code class="inline-code">styles.highlight</code>
								contains both the scope hash and the class name, which the child applies via its
								<code class="inline-code">class</code>
								prop. React components use
								<code class="inline-code">className</code>
								instead, matching React's normal prop names.
							</p>
							<pre class="code-block">
								<code innerHTML={STYLE_COMPOSITION_HTML} />
							</pre>
							<p class="section-body">
								You can also create the style expression at module scope and reference the generated
								class map from any component in the file. This gives teams moving from StyleX-like
								patterns a declarative, reusable class map without putting the
								<code class="inline-code">{'<style>'}</code>
								block inside the returned template.
							</p>
							<pre class="code-block">
								<code innerHTML={MODULE_STYLE_COMPOSITION_HTML} />
							</pre>
							<p class="section-body">
								Classes exposed on the map come from standalone selectors in the
								<code class="inline-code">{'<style>'}</code>
								block. Classes that only appear in compound or descendant selectors are not exported
								on the map.
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

			/* Docs layout with side nav */

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

			/* Content sections */

			.docs-content {
				min-width: 0;
			}

			.doc-section {
				margin-top: 3rem;
			}

			.doc-section:first-child {
				margin-top: 0.5rem;
			}

			.section-heading {
				margin: 0 0 0.75rem;
				font-size: clamp(1.5rem, 3vw, 2rem);
				line-height: 1.1;
				letter-spacing: -0.03em;
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
				display: inline-block;
				background: rgba(94, 44, 255, 0.1);
				color: #5e2cff;
				padding: 0.16em 0.48em;
				margin: 0 0.18em;
				border-radius: 4px;
				font-size: 0.92em;
			}

			.section-body a:not(.cta-link) {
				display: inline-block;
				margin: 0 0.18em;
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
			:global(.code-block .comment),
			:global(.code-block .cmt) {
				color: #808080;
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
	</>
};
