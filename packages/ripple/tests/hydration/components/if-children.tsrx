import { track, type Tracked } from 'ripple';

// Minimal repro for hydration issue with if block containing children
// Based on SidebarGroup pattern from website-new

export function IfWithChildren({ children }: { children: any }) @{
	const expanded = track(true);
	<div class="container">
		<div
			class="header"
			role="button"
			onClick={() => (expanded.value = !expanded.value)}
		>{'Toggle'}</div>
		@if (expanded.value) {
			<div class="content">{children}</div>
		}
	</div>
}

export function ChildItem({ text: label }: { text: string }) @{
	<div class="item">{label}</div>
}

export function TestIfWithChildren() @{
	<IfWithChildren>
		<ChildItem text="Item 1" />
		<ChildItem text="Item 2" />
	</IfWithChildren>
}

// Simpler variant - if block with static children
export function IfWithStaticChildren() @{
	const expanded = track(true);
	<div class="container">
		<div
			class="header"
			role="button"
			onClick={() => (expanded.value = !expanded.value)}
		>{'Toggle'}</div>
		@if (expanded.value) {
			<div class="content">
				<span>{'Static child 1'}</span>
				<span>{'Static child 2'}</span>
			</div>
		}
	</div>
}

// Variant with sibling elements before the if block (like SidebarGroup)
export function IfWithSiblingsAndChildren({ children }: { children: any }) @{
	const expanded = track(true);
	<section class="group">
		<div class="item" role="button" onClick={() => (expanded.value = !expanded.value)}>
			<div class="indicator" />
			<h2 class="text">{'Title'}</h2>
			<div class="caret">
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
					<path d="m9 18 6-6-6-6" />
				</svg>
			</div>
		</div>
		@if (expanded.value) {
			<div class="items">{children}</div>
		}
	</section>
}

export function TestIfWithSiblingsAndChildren() @{
	<IfWithSiblingsAndChildren>
		<ChildItem text="Item A" />
		<ChildItem text="Item B" />
	</IfWithSiblingsAndChildren>
}

// Test case for hydration pop bug: element with nested children followed by dynamic if sibling
// This tests that hydrate_node is properly restored after processing an element's children
// before navigating to a dynamic sibling (if/for/switch)
export function ElementWithChildrenThenIf() @{
	const show = track(true);
	<>
		<div class="wrapper">
			<div class="nested-parent">
				<div class="nested-child">
					<span class="deep">{'Deep content'}</span>
				</div>
			</div>
			@if (show.value) {
				<div class="conditional">{'Conditional content'}</div>
			}
		</div>
		<button class="toggle" onClick={() => (show.value = !show.value)}>{'Toggle'}</button>
	</>
}

// More complex: multiple levels of nesting before if sibling
export function DeepNestingThenIf() @{
	const visible = track(true);
	<>
		<section class="outer">
			<article class="middle">
				<div class="inner">
					<p class="leaf">
						<strong>{'Bold'}</strong>
						<em>{'Italic'}</em>
					</p>
				</div>
			</article>
			@if (visible.value) {
				<footer class="footer">{'Footer'}</footer>
			}
		</section>
		<button class="btn" onClick={() => (visible.value = !visible.value)}>{'Toggle'}</button>
	</>
}

// Test case for CodeBlock pattern: element with only DOM element children (like buttons)
// followed by another sibling element. This requires pop() to restore hydrate_node
// because we descend into the first element to get the button children.
export function DomElementChildrenThenSibling() @{
	const activeTab = track('code');
	<div class="tabs">
		<div class="tab-list">
			<button
				class="tab"
				aria-selected={activeTab.value === 'code' ? 'true' : 'false'}
				onClick={() => (activeTab.value = 'code')}
			>{'Code'}</button>
			<button
				class="tab"
				aria-selected={activeTab.value === 'preview' ? 'true' : 'false'}
				onClick={() => (activeTab.value = 'preview')}
			>{'Preview'}</button>
		</div>
		<div class="panel">
			@if (activeTab.value === 'code') {
				<pre class="code">{'const x = 1;'}</pre>
			} @else {
				<div class="preview">{'Preview content'}</div>
			}
		</div>
	</div>
}

// Test case for element with DOM children followed by static siblings that don't
// generate sibling() calls. This was causing incorrect pop() generation before next().
// Pattern: <ul> with dynamic <li> children -> static <h2> -> static <p> -> next()
export function DomChildrenThenStaticSiblings() @{
	const count = track(0);
	<>
		<div class="container">
			<ul class="list">
				<li class="item">
					{'Item count: '}
					{count.value}
				</li>
				<li class="item">{'Another item'}</li>
			</ul>
			<h2 class="heading">{'Static Heading'}</h2>
			<p class="para">{'Static paragraph'}</p>
		</div>
		<button class="inc" onClick={() => count.value++}>{'Increment'}</button>
	</>
}

// Test case for completely static element children followed by static siblings.
// Pattern from introduction page: <ul> with static <li> (strong, code, text)
// followed by static <h2> and <p>. No pop() should be generated for these.
export function StaticListThenStaticSiblings() @{
	<div class="wrapper">
		<ul class="features">
			<li>
				<strong>{'Feature One'}</strong>
				{': Description of feature one with '}
				<code>{'code'}</code>
				{' reference'}
			</li>
			<li>
				<strong>{'Feature Two'}</strong>
				{': Another feature description'}
			</li>
			<li>
				<strong>{'Feature Three'}</strong>
				{': Third feature'}
			</li>
		</ul>
		<h2 class="section-heading">{'Section Heading'}</h2>
		<p class="section-content">
			{'Static paragraph with '}
			<a href="/link">{'a link'}</a>
			{' and more text.'}
		</p>
	</div>
}

// All-component children render into their parent through an append-into
// sentinel instead of a `<!>` placeholder per child. A child whose root is
// control flow keeps re-rendering relative to its anchor after hydration, so it
// must resolve the sentinel to its own position rather than the parent's end.
function RootIfChild(props: { on: Tracked<boolean> }) @{
	@if (props.on.value) {
		<span class="root-if">{'on'}</span>
	} @else {
		<span class="root-if">{'off'}</span>
	}
}

function RootForChild(props: { items: Tracked<number[]> }) @{
	@for (const item of props.items.value; key item) {
		<span class="root-for">{item}</span>
	}
}

function TrailingChild() @{
	<span class="trailing">{'end'}</span>
}

export function ComponentChildrenWithControlFlowRoots() @{
	const on = track(true);
	const items = track([1, 2, 3]);
	<div class="wrapper">
		<div class="host">
			<RootIfChild {on} />
			<RootForChild {items} />
			<TrailingChild />
		</div>
		<button class="toggle" onClick={() => (on.value = !on.value)}>{'Toggle'}</button>
		<button
			class="rotate"
			onClick={() => (items.value = [items.value[1], items.value[2], items.value[0]])}
		>{'Rotate'}</button>
	</div>
}
