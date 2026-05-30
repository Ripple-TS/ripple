// --- Code snippets ---

import { highlight_tsrx } from '../lib/code-highlight.ts';

const COMPONENT_HTML = highlight_tsrx(
	`export function Button({ label, onClick }: {
  label: string;
  onClick: () => void;
}) {
  return <>
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
  </>;
}`,
);

const BAILOUT_HTML = highlight_tsrx(
	`export function Counter() {
  return <>
    let count = 0;

    // Plain JS/TS control flow can live in nested functions.
    const increment = () => {
      if (count >= 10) {
        count = 0;
      } else {
        count += 1;
      }
    };

    <button onClick={increment}>"Count: "{count}</button>
  </>;
}`,
);

const TEMPLATE_HTML = highlight_tsrx(
	`function Greeting() {
  return <>
    <h1>"Hello World"</h1>
    <p>"Welcome to TSRX."</p>
  </>;
}`,
);

const TSX_EXPR_HTML = highlight_tsrx(
	`function App() {
  const title = <><span class="title">"Settings"</span></>;

  return <>
    <Card {title} />
  </>;
}`,
);

const TSX_EXPR_HTML_SINGLE = highlight_tsrx(
	`function App() {
  const title = <span class="title">"Settings"</span>;

  return <Card {title} />;
}`,
);

const TEXT_EXPR_HTML = highlight_tsrx(
	`function Inbox({ name, count }: { name: string; count: number }) {
  return <>
    <p>"Hello, "{name}"!"</p>
    <p>{'You have ' + count + ' unread messages'}</p>
    <p>{count > 0 ? 'Check your inbox.' : 'All caught up.'}</p>
  </>;
}`,
);

const IF_HTML = highlight_tsrx(
	`function StatusBadge({ status }: { status: string }) {
  return <>
    <div>
      if (status === 'active') {
        <span class="badge active">"Online"</span>
      } else if (status === 'idle') {
        <span class="badge idle">"Away"</span>
      } else {
        <span class="badge">"Offline"</span>
      }
    </div>
  </>;
}`,
);

const FOR_HTML = highlight_tsrx(
	`function TodoList({ items }: { items: Todo[] }) {
  return <>
    <ul>
      for (const item of items; index i; key item.id) {
        if (item.hidden) continue;
        <li>{i + 1}". "{item.text}</li>
      }
    </ul>
  </>;
}`,
);

const TRY_HTML = highlight_tsrx(
	`function SafeProfile({ userId }: { userId: string }) {
  return <>
    try {
      <UserProfile id={userId} />
    } catch (error) {
      <div class="error">
        <p>"Something went wrong."</p>
      </div>
    }
  </>;
}`,
);

const TRY_RESET_HTML = highlight_tsrx(
	`export function RetryBoundary() {
  return <>
    try {
      <ComponentThatMightFail />
    } catch (e, reset) {
      <div>
        <p>"Error: "{e.message}</p>
        <button onClick={() => reset()}>"Try again"</button>
      </div>
    }
  </>;
}`,
);

const SWITCH_HTML = highlight_tsrx(
	`function StatusMessage({ status }: { status: string }) {
  return <>
    switch (status) {
      case 'loading':
        <p>"Loading..."</p>
        break;
      case 'success':
        <p class="success">"Done!"</p>
        break;
      default:
        <p>"Unknown status."</p>
    }
  </>;
}`,
);

const SHORTHAND_HTML = highlight_tsrx(
	`// Instead of repeating the name:
<Input value={value} onChange={onChange} />

// Use the shorthand:
<Input {value} {onChange} />`,
);

const SCOPING_HTML = highlight_tsrx(
	`function App() {
  const name = 'World';

  return <>
    <div>
      // This is a new scope - you can declare variables here
      const greeting = 'Hello, ' + name + '!';
      <h1>{greeting}</h1>
    </div>
  </>;
}`,
);

const CHILDREN_HTML = highlight_tsrx(
	`// Children as nested JSX - this works:
<Card>
  <h2>"Title"</h2>
  <p>"Content goes here."</p>
</Card>

// Passing a function or array? Use the children prop:
<List children={items.map(renderItem)} />`,
);

const RENDER_PROPS_HTML = highlight_tsrx(
	`function App({ items }: { items: Item[] }) {
  const renderItem = (item: Item) => <>
    <li>{item.label}</li>
  </>;

  return <>
    <List items={items} render={renderItem} />
  </>;
}`,
);

const ASYNC_BOUNDARY_HTML = highlight_tsrx(
	`const UserProfile = lazy(() => import('./UserProfile.tsrx'));

export function App() {
  return <>
    try {
      <UserProfile id={1} />
    } pending {
      <p>"Loading..."</p>
    } catch (e) {
      <p>"Something went wrong."</p>
    }
  </>;
}`,
);

const SCOPED_STYLES_HTML = highlight_tsrx(
	`function Card() {
  return <>
    <div class="card">
      <h2>"Scoped title"</h2>
      <p>"Styles here won't leak out."</p>
    </div>

    <style>
      .card {
        padding: 1.5rem;
        border: 1px solid #ddd;
      }

      h2 { color: #333; }
    </style>
  </>;
}`,
);

const STYLE_COMPOSITION_HTML = highlight_tsrx(
	`function Badge({ class: className }: { class?: string }) {
  return <>
    <span class={'badge ' + (className ?? '')}>"New"</span>

    <style>
      .badge { padding: 0.25rem 0.5rem; }
    </style>
  </>;
}

function App() {
  const styles = <style>
    .highlight { background: #e8f5e9; color: #2e7d32; }
  </style>;

  // Ripple, Preact, Solid, and Vue component props:
  return <Badge class={styles.highlight} />;

  // React component props:
  // return <Badge className={styles.highlight} />;
}`,
);

const MODULE_STYLE_COMPOSITION_HTML = highlight_tsrx(
	`const articleStyles = <style>
  .card { padding: 1rem; }
  .title { font-weight: 700; }
</style>;

export function ArticleCard({ title }: { title: string }) {
  // Ripple, Preact, Solid, and Vue host elements:
  return <article class={articleStyles.card}>
    <h2 class={articleStyles.title}>{title}</h2>
  </article>;

  // React host elements:
  // return <article className={articleStyles.card}>
  //   <h2 className={articleStyles.title}>{title}</h2>
  // </article>;
}`,
);

const REACT_HOOKS_HTML = highlight_tsrx(
	`import { useState, useEffect } from 'react';

function UserProfile({ user, posts }: { user: User | null; posts: Post[] }) {
  if (!user) {
    return null;
  }

  const [tab, setTab] = useState('overview');

  return <>
    // Hooks inside TSRX template branches are isolated safely.

    <h1>{user.name}</h1>
    <TabBar value={tab} onChange={setTab} />

    <ul>
      for (const post of posts) {
        useEffect(() => {
          console.log('viewed ' + post.title);
        }, [post.title]);

        <li>{post.title}</li>
      }
    </ul>
  </>;
}`,
);

const LAZY_PROPS_HTML = highlight_tsrx(
	`function UserCard(&{ name, age }: { name: string; age: number }) {
  return <>
    <div>
      <h2>{name}</h2>
      <p>"Age: "{age}</p>
    </div>
  </>;
}`,
);

const NAV_ITEMS = [
	{ id: 'components', label: 'Components' },
	{ id: 'jsx', label: 'TSRX templates' },
	{ id: 'text-expressions', label: 'Text expressions' },
	{ id: 'lazy-destructuring', label: 'Lazy destructuring' },
	{ id: 'prop-shorthands', label: 'Prop shorthands' },
	{ id: 'scoping', label: 'Lexical scoping' },
	{ id: 'children', label: 'Children & render props' },
	{ id: 'if', label: 'Conditional rendering' },
	{ id: 'for', label: 'List rendering' },
	{ id: 'switch', label: 'Switch statements' },
	{ id: 'try', label: 'Error boundaries' },
	{ id: 'async-boundaries', label: 'Async boundaries' },
	{ id: 'scoped-styles', label: 'Scoped styles' },
	{ id: 'style-composition', label: 'Style composition' },
	{ id: 'react-hooks', label: 'React & Preact Hooks' },
];

export function FeaturesPage() {
	return <>
		<head>
			<title>{'TSRX | Features'}</title>
			<meta
				name="description"
				content="TSRX language features: function components, returned templates, control flow, error boundaries, and more."
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
						<a href="/features" aria-current="page">{'Features'}</a>
						<a href="/specification">{'Specification'}</a>
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
							<p class="side-nav-heading">{'Features'}</p>
							for (const item of NAV_ITEMS) {
								<a class="side-nav-link" href={`#${item.id}`}>{item.label}</a>
							}
						</nav>
					</aside>

					<main class="docs-content">
						<section class="doc-section" id="components">
							<h2 class="section-heading">{'Components'}</h2>
							<p class="section-body">
								{'TSRX components are ordinary '}
								<code class="inline-code">{'function'}</code>
								{' declarations. Props are typed with a single parameter, normal JavaScript setup can run before the return, and the returned TSRX template contains the rendered structure, control flow, and scoped styles.'}
							</p>
							<pre class="code-block">
								<code innerHTML={COMPONENT_HTML} />
							</pre>
							<p class="section-body">
								{'Export components with '}
								<code class="inline-code">{'export function'}</code>
								{' exactly as you would in TSX. The compiler transforms returned TSRX into standard framework components for whichever target you\'re using.'}
							</p>
							<p class="section-body">
								{'Since returned TSRX templates have their own template rules (see '}
								<a href="#jsx">{'TSRX templates'}</a>
								{'), anything that needs ordinary JavaScript-only control flow can simply live in a plain inline function. Declare a '}
								<code class="inline-code">{'const fn = () => { ... }'}</code>
								{' next to your template, write whatever JS/TS you like inside it, and call it from an event handler or expression — it stays ordinary JavaScript, outside the returned template rules.'}
							</p>
							<pre class="code-block">
								<code innerHTML={BAILOUT_HTML} />
							</pre>
						</section>

						<section class="doc-section" id="jsx">
							<h2 class="section-heading">{'TSRX templates'}</h2>
							<p class="section-body">
								{'TSRX opens from ordinary JSX expression positions such as '}
								<code class="inline-code">{'return <div />'}</code>
								{' or '}
								<code class="inline-code">{'return <>...</>'}</code>
								{'. Once you are inside that returned template, control flow, locals, and nested elements can appear directly in the tree. Static text can be written as direct double-quoted children, while dynamic values and JavaScript expressions still use '}
								<code class="inline-code">{'{}'}</code>
								{'.'}
							</p>
							<pre class="code-block">
								<code innerHTML={TEMPLATE_HTML} />
							</pre>
							<p class="section-body">
								{'When you need a native TSRX subtree as a value inside another expression — for example to assign it to a variable or pass it as a prop — wrap it in '}
								<code class="inline-code">{'<>...</>'}</code>
								{'. Compatibility islands such as '}
								<code class="inline-code">{'<tsx:react>...</tsx:react>'}</code>
								{' are available for hosts that need JSX-style children instead:'}
							</p>
							<pre class="code-block">
								<code innerHTML={TSX_EXPR_HTML} />
							</pre>
							<p class="section-body">
								{'As in JSX, you don\'t need fragments for a single element: '}
							</p>
							<pre class="code-block">
								<code innerHTML={TSX_EXPR_HTML_SINGLE} />
							</pre>
						</section>

						<section class="doc-section" id="text-expressions">
							<h2 class="section-heading">{'Text expressions'}</h2>
							<p class="section-body">
								{'Because TSRX templates parse text deliberately, unquoted bare text can\'t sit directly inside an element the way it does in React. Static text may be written as a direct double-quoted child. JavaScript string literals, template literals, variables, function calls, ternaries, and other dynamic values live inside expression containers '}
								<code class="inline-code">{'{ ... }'}</code>
								{'.'}
							</p>
							<pre class="code-block">
								<code innerHTML={TEXT_EXPR_HTML} />
							</pre>
						</section>

						<section class="doc-section" id="lazy-destructuring">
							<h2 class="section-heading">{'Lazy destructuring'}</h2>
							<p class="section-body">
								{'TSRX adds two sigils — '}
								<code class="inline-code">{'&{ ... }'}</code>
								{' for objects and '}
								<code class="inline-code">{'&[ ... ]'}</code>
								{' for arrays — that look like destructuring but defer the actual property access until each binding is read. Every reference to a lazy binding is compiled back to a property lookup on the source object, so downstream readers pick up the latest value without a manual getter.'}
							</p>
							<p class="section-body">
								{'The most common use is in component parameters. Regular object destructuring would snapshot each prop at call time and break any target runtime that relies on per-access reactivity (Ripple, Solid, Vue). '}
								<code class="inline-code">{'&{ ... }'}</code>
								{' preserves that reactivity while keeping the ergonomic destructuring syntax:'}
							</p>
							<pre class="code-block">
								<code innerHTML={LAZY_PROPS_HTML} />
							</pre>
							<p class="section-body muted">
								{'Lazy destructuring is supported across every target. In React and Preact it compiles to direct property access on the source object; in Ripple, Solid, and Vue it preserves tracked, signal, or proxy-backed reactivity without needing a wrapper call.'}
							</p>
						</section>

						<section class="doc-section" id="prop-shorthands">
							<h2 class="section-heading">{'Prop shorthands'}</h2>
							<p class="section-body">
								{'When a prop name matches the variable you\'re passing, you can use the shorthand '}
								<code class="inline-code">{'{name}'}</code>
								{' instead of '}
								<code class="inline-code">{'name={name}'}</code>
								{'. This works for any attribute or prop — including event handlers like '}
								<code class="inline-code">{'{onClick}'}</code>
								{'.'}
							</p>
							<pre class="code-block">
								<code innerHTML={SHORTHAND_HTML} />
							</pre>
						</section>

						<section class="doc-section" id="scoping">
							<h2 class="section-heading">{'Lexical scoping'}</h2>
							<p class="section-body">
								{'Every returned TSRX template and nested element creates its own lexical scope. You can declare variables, compute derived values, or call functions inside an element\'s children — they\'re scoped to that block and won\'t leak into the surrounding function.'}
							</p>
							<pre class="code-block">
								<code innerHTML={SCOPING_HTML} />
							</pre>
							<p class="section-body">
								{'This applies to all block-like contexts: element children, component children, and control flow branches ('}
								<code class="inline-code">{'if'}</code>
								{', '}
								<code class="inline-code">{'for'}</code>
								{', '}
								<code class="inline-code">{'switch'}</code>
								{', '}
								<code class="inline-code">{'try'}</code>
								{'). Each one has its own scope.'}
							</p>
						</section>

						<section class="doc-section" id="children">
							<h2 class="section-heading">{'Children'}</h2>
							<p class="section-body">
								{'Composite components accept children as nested JSX — just like HTML elements. However, children must be JSX statements, not expressions. You can\'t pass an array, function, or other value as children between the opening and closing tags.'}
							</p>
							<p class="section-body">
								{'When you need to pass a computed value, use the '}
								<code class="inline-code">{'children'}</code>
								{' prop explicitly instead:'}
							</p>
							<pre class="code-block">
								<code innerHTML={CHILDREN_HTML} />
							</pre>
							<p class="section-body">
								<strong>{'Render props: '}</strong>
								{'Render props are just function-valued props in TSRX. Pass them explicitly as '}
								<code class="inline-code">{'children={...}'}</code>
								{' or a named prop like '}
								<code class="inline-code">{'render={...}'}</code>
								{'. If that function returns native TSRX, wrap it in '}
								<code class="inline-code">{'<>...</>'}</code>
								{'. Use compatibility islands such as '}
								<code class="inline-code">{'<tsx:react>...</tsx:react>'}</code>
								{' for host-specific JSX-style values.'}
							</p>
							<pre class="code-block">
								<code innerHTML={RENDER_PROPS_HTML} />
							</pre>
						</section>

						<section class="doc-section" id="if">
							<h2 class="section-heading">{'Conditional rendering'}</h2>
							<p class="section-body">
								{'Use standard '}
								<code class="inline-code">{'if'}</code>
								{' / '}
								<code class="inline-code">{'else if'}</code>
								{' / '}
								<code class="inline-code">{'else'}</code>
								{' statements directly inside templates. No ternaries or wrapper components needed.'}
							</p>
							<pre class="code-block">
								<code innerHTML={IF_HTML} />
							</pre>
						</section>

						<section class="doc-section" id="for">
							<h2 class="section-heading">{'List rendering'}</h2>
							<p class="section-body">
								{'Render lists with '}
								<code class="inline-code">{'for...of'}</code>
								{' loops. TSRX extends the syntax with optional '}
								<code class="inline-code">{'index'}</code>
								{' and '}
								<code class="inline-code">{'key'}</code>
								{' clauses so you don\'t need separate counters or key-extraction boilerplate.'}
							</p>
							<p class="section-body">
								{'Use '}
								<code class="inline-code">{'continue'}</code>
								{' inside a template '}
								<code class="inline-code">{'for...of'}</code>
								{' body to skip the current item. '}
								<code class="inline-code">{'return'}</code>
								{' statements are invalid anywhere inside a TSRX element or fragment body. '}
								<code class="inline-code">{'break'}</code>
								{' is not allowed in '}
								<code class="inline-code">{'for...of'}</code>
								{' template loop bodies; use '}
								<code class="inline-code">{'break'}</code>
								{' only for '}
								<code class="inline-code">{'switch'}</code>
								{' cases. Nested functions keep ordinary JavaScript control flow.'}
							</p>
							<p class="section-body">
								{'Other JavaScript loops are not template rendering constructs: regular '}
								<code class="inline-code">{'for'}</code>
								{', '}
								<code class="inline-code">{'for...in'}</code>
								{', '}
								<code class="inline-code">{'while'}</code>
								{', and '}
								<code class="inline-code">{'do...while'}</code>
								{' are rejected in TSRX template scope. Move imperative loops into a nested function or effect, or render collections with '}
								<code class="inline-code">{'for...of'}</code>
								{'.'}
							</p>
							<pre class="code-block">
								<code innerHTML={FOR_HTML} />
							</pre>
						</section>

						<section class="doc-section" id="switch">
							<h2 class="section-heading">{'Switch statements'}</h2>
							<p class="section-body">
								{'Multi-branch rendering uses a standard '}
								<code class="inline-code">{'switch'}</code>
								{' statement. Each case can contain JSX elements and ends with '}
								<code class="inline-code">{'break'}</code>
								{'.'}
							</p>
							<pre class="code-block">
								<code innerHTML={SWITCH_HTML} />
							</pre>
						</section>

						<section class="doc-section" id="try">
							<h2 class="section-heading">{'Error boundaries'}</h2>
							<p class="section-body">
								{'Wrap components in '}
								<code class="inline-code">{'try'}</code>
								{' / '}
								<code class="inline-code">{'catch'}</code>
								{' to create error boundaries. If a child component throws, the catch block renders fallback UI.'}
							</p>
							<pre class="code-block">
								<code innerHTML={TRY_HTML} />
							</pre>
							<p class="section-body">
								{'The '}
								<code class="inline-code">{'catch'}</code>
								{' block also receives a '}
								<code class="inline-code">{'reset'}</code>
								{' function as its second argument. Calling '}
								<code class="inline-code">{'reset()'}</code>
								{' clears the error state and re-renders the children, which is useful for building retry UIs:'}
							</p>
							<pre class="code-block">
								<code innerHTML={TRY_RESET_HTML} />
							</pre>
						</section>

						<section class="doc-section" id="async-boundaries">
							<h2 class="section-heading">{'Async boundaries'}</h2>
							<p class="section-body">
								{'Wrap a component subtree in '}
								<code class="inline-code">{'try'}</code>
								{' / '}
								<code class="inline-code">{'pending'}</code>
								{' / '}
								<code class="inline-code">{'catch'}</code>
								{' to handle async children. While a lazy child or resource is in flight, the '}
								<code class="inline-code">{'pending'}</code>
								{' branch renders; when it resolves, the '}
								<code class="inline-code">{'try'}</code>
								{' body takes over; if it rejects — or any child throws synchronously — '}
								<code class="inline-code">{'catch'}</code>
								{' runs. Both '}
								<code class="inline-code">{'pending'}</code>
								{' and '}
								<code class="inline-code">{'catch'}</code>
								{' are optional and can be used independently.'}
							</p>
							<p class="section-body">
								{'Async work itself is expressed using the target\'s own lazy-loading primitive — '}
								<code class="inline-code">{'lazy()'}</code>
								{' from '}
								<code class="inline-code">{'react'}</code>
								{', '}
								<code class="inline-code">{'preact/compat'}</code>
								{', or '}
								<code class="inline-code">{'solid-js'}</code>
								{', '}
								<code class="inline-code">{'defineVaporAsyncComponent()'}</code>
								{' on Vue Vapor, and '}
								<code class="inline-code">{'trackAsync()'}</code>
								{' on Ripple. In Solid, Vue, and Ripple targets, returned TSRX templates are synchronous and do not allow inline '}
								<code class="inline-code">{'await'}</code>
								{'. On React and Preact, template-body '}
								<code class="inline-code">{'await'}</code>
								{' is supported and TSRX emits an async component function.'}
							</p>
							<p class="section-body muted">
								{'React/Preact note: '}
								<code class="inline-code">{'for await...of'}</code>
								{' is not supported inside component templates. Use an upstream async helper and render the resolved data.'}
							</p>
							<pre class="code-block">
								<code innerHTML={ASYNC_BOUNDARY_HTML} />
							</pre>
						</section>

						<section class="doc-section" id="scoped-styles">
							<h2 class="section-heading">{'Scoped styles'}</h2>
							<p class="section-body">
								{'Each returned TSRX template can include a '}
								<code class="inline-code">{'<style>'}</code>
								{' block. Styles are automatically scoped — the compiler rewrites selectors with a unique hash so they only apply to elements inside the function return that defines them. A parent\'s scoped styles will not leak into child components.'}
							</p>
							<pre class="code-block">
								<code innerHTML={SCOPED_STYLES_HTML} />
							</pre>
							<p class="section-body">
								{'To escape scoping and apply styles globally, wrap a selector in '}
								<code class="inline-code">{':global()'}</code>
								{'. This lets you reach into child components or target elements outside the current scope.'}
							</p>
							<p class="section-body muted">
								{'React note: TSRX keeps authored attributes as written. Use '}
								<code class="inline-code">{'className'}</code>
								{' on React host elements and React component props, just like ordinary JSX. Compiler-injected scoped style hashes still use React\'s '}
								<code class="inline-code">{'className'}</code>
								{' output when needed.'}
							</p>
						</section>

						<section class="doc-section" id="style-composition">
							<h2 class="section-heading">{'Style composition'}</h2>
							<p class="section-body">
								{'Because scoped styles don\'t cross component boundaries, assigning a '}
								<code class="inline-code">{'<style>'}</code>
								{' expression to a variable exposes a class map for passing scoped class names to child components as props. '}
								<code class="inline-code">{'styles.highlight'}</code>
								{' contains both the scope hash and the class name, which the child applies via its '}
								<code class="inline-code">{'class'}</code>
								{' prop. React components use '}
								<code class="inline-code">{'className'}</code>
								{' instead, matching React\'s normal prop names.'}
							</p>
							<pre class="code-block">
								<code innerHTML={STYLE_COMPOSITION_HTML} />
							</pre>
							<p class="section-body">
								{'You can also create the style expression at module scope and reference the generated class map from any component in the file. This gives teams moving from StyleX-like patterns a declarative, reusable class map without putting the '}
								<code class="inline-code">{'<style>'}</code>
								{' block inside the returned template.'}
							</p>
							<pre class="code-block">
								<code innerHTML={MODULE_STYLE_COMPOSITION_HTML} />
							</pre>
							<p class="section-body">
								{'Classes exposed on the map come from standalone selectors in the '}
								<code class="inline-code">{'<style>'}</code>
								{' block. Classes that only appear in compound or descendant selectors are not exported on the map.'}
							</p>
						</section>

						<section class="doc-section" id="react-hooks">
							<h2 class="section-heading">{'React & Preact Hooks'}</h2>
							<p class="section-body">
								{'When targeting React with '}
								<code class="inline-code">{'@tsrx/react'}</code>
								{' or Preact with '}
								<code class="inline-code">{'@tsrx/preact'}</code>
								{', hooks that appear in conditional, loop, switch, try, or returned-template '}
								<code class="inline-code">{'<>...</>'}</code>
								{' scopes are isolated behind generated child components when the compiler can do so safely. Hook callbacks may read outer values and mutate branch-local or module-level bindings, but assigning hook results or mutating a parent binding across the generated component boundary is a compiler error. Move that state into an explicit child component when values need to cross the boundary.'}
							</p>
							<p class="section-body">
								{'Both targets also support template-body '}
								<code class="inline-code">{'await'}</code>
								{' and TSRX will emit an async component function when it appears in the returned template.'}
							</p>
							<pre class="code-block">
								<code innerHTML={REACT_HOOKS_HTML} />
							</pre>
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

			/* --- Docs layout with side nav --- */

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

			/* --- Content sections --- */

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
				background: rgba(94, 44, 255, 0.1);
				color: #5e2cff;
				padding: 0.12em 0.4em;
				border-radius: 4px;
				font-size: 0.92em;
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
	</>;
}
