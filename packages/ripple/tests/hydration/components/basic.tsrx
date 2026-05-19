// Basic static components for hydration testing
import { track } from 'ripple';
import type { Children } from 'ripple';

export component StaticText() {
	<div>{'Hello World'}</div>
}

export component MultipleElements() {
	<h1>{'Title'}</h1>
	<p>{'Paragraph text'}</p>
	<span>{'Span text'}</span>
}

export component NestedElements() {
	<div class="outer">
		<div class="inner">
			<span>{'Nested content'}</span>
		</div>
	</div>
}

export component WithAttributes() {
	<input type="text" placeholder="Enter text" disabled />
	<a href="/link" target="_blank">{'Link'}</a>
}

export component ChildComponent() {
	<span class="child">{'Child content'}</span>
}

export component ParentWithChild() {
	<div class="parent">
		<ChildComponent />
	</div>
}

export component FirstSibling() {
	<div class="first">{'First'}</div>
}

export component SecondSibling() {
	<div class="second">{'Second'}</div>
}

export component SiblingComponents() {
	<FirstSibling />
	<SecondSibling />
}

export component Greeting(props: { name: string }) {
	<div>
		{'Hello '}
		{props.name}
	</div>
}

export component WithGreeting() {
	<Greeting name="World" />
}

export component ExpressionContent() {
	const value = 42;
	const label = 'computed';
	<div>{value}</div>
	<span>{label.toUpperCase()}</span>
}

function makeNestedTsxTsrxFragment(label: string) {
	return <tsrx>
		<span class="label">{label}</span>
		const test = <tsx>
			{[1, 2, 3, 4].map(
				(item) => <tsx>
					{<tsrx>
						<div class="helper-item">{item}</div>
					</tsrx>}
				</tsx>,
			)}
		</tsx>;
		{test}
	</tsrx>;
}

export component NestedTsxTsrxExpressionValues() {
	{<tsx>{[1, 2, 3].map((item) => <div class="app-item">{item}</div>)}</tsx>}
	{makeNestedTsxTsrxFragment('from helper')}
}

export component MixedTsrxCollectionText() {
	const content = <tsx>
		{[
			'alpha ',
			<strong class="middle">
				{'beta'}
			</strong>,
			' gamma ',
			[
				'delta ',
				<em class="tail">
					{'epsilon'}
				</em>,
				' zeta',
			],
		]}
	</tsx>;

	<div class="mixed-collection">{content}</div>
}

export component MixedTsrxCollectionSplitServerText() {
	const content = <tsx>
		{[
			'alpha ',
			<strong class="middle">
				{'beta'}
			</strong>,
			' gamma ',
			[
				'delta ',
				<em class="tail">
					{'epsilon'}
				</em>,
				' zeta',
			],
		]}
	</tsx>;

	<div class="mixed-collection-split">{content}</div>
}

export component MixedTsrxCollectionSplitClientText() {
	const content = <tsx>
		{[
			'alpha ',
			<strong class="middle">
				{'beta'}
			</strong>,
			' gamma ',
			[
				'changed ',
				<em class="tail">
					{'epsilon'}
				</em>,
				' zeta',
			],
		]}
	</tsx>;

	<div class="mixed-collection-split">{content}</div>
}

export component MixedTsrxCollectionPrimitiveServerText() {
	const content = <tsx>
		{[
			'count: ',
			1,
			' / ',
			true,
			<span class="primitive-tail">
				{' ok'}
			</span>,
		]}
	</tsx>;

	<div class="mixed-collection-primitive">{content}</div>
}

export component MixedTsrxCollectionPrimitiveClientText() {
	const content = <tsx>
		{[
			'count: ',
			2,
			' / ',
			false,
			<span class="primitive-tail">
				{' ok'}
			</span>,
		]}
	</tsx>;

	<div class="mixed-collection-primitive">{content}</div>
}

function createPrimitiveItems() {
	return ['start:', ['one', 2], true, null, false, ':end'];
}

export component DynamicArrayFromCall() {
	const items = createPrimitiveItems();

	<div class="dynamic-array-call">{items}</div>
}

export component DynamicArrayFromTrack() {
	let &[items] = track(['start:', ['one', 2], true, null, false, ':end']);

	<div class="dynamic-array-track">{items}</div>
}

export component DynamicArrayFromConditional() {
	const condition = true;
	const items = condition ? ['start:', ['one', 2], true, null, false, ':end'] : ['fallback'];

	<div class="dynamic-array-conditional">{items}</div>
}

export component DynamicArrayFromLogical() {
	const condition = true;
	const items = condition && ['start:', ['one', 2], true, null, false, ':end'];

	<div class="dynamic-array-logical">{items}</div>
}

export component NestedTsrxInsideTopLevelTsxExpression() {
	const content = <tsx>
		<section class="outer">
			{<tsrx>
				<div class="inner">
					{'from tsrx'}
				</div>
			</tsrx>}
		</section>
	</tsx>;

	{content}
}

export component NestedTsrxElementsInsideTopLevelTsxValue() {
	const content = <tsx>
		<div class="wrapper">
			{<tsrx>
				<section class="native">
					<span class="nested-tsrx">
						{'inside nested tsrx'}
					</span>
				</section>
			</tsrx>}
		</div>
	</tsx>;

	{content}
}

export component TsxDeclaredInsideNestedTsrxFromTopLevelTsx() {
	const content = <tsx>
		{<tsrx>
			const nested = <tsx>
				<span class="nested-tsx">
					{'inside nested tsx'}
				</span>
			</tsx>;
			<div class="native">{nested}</div>
		</tsrx>}
	</tsx>;

	{content}
}

component TextProp(&{ children }: { children: string }) {
	<div class="text-prop">{children}</div>
}

export component TextPropWithToggle() {
	let &[show] = track(false);

	<TextProp children={show ? 'hello' : ''} />
	<button class="show-text" onClick={() => (show = true)}>{'Show'}</button>
}

// Test for static content in child component followed by sibling content
component StaticHeader() {
	<h1 class="sr-only">{'heading'}</h1>
	<p class="subtitle">{'first paragraph'}</p>
	<p class="subtitle">{'second paragraph'}</p>
}

export component StaticChildWithSiblings() {
	const foo = 'bar';
	<StaticHeader />
	<span class="sibling1">{foo}</span>
	<span class="sibling2">{foo}</span>
}

// Website-like components for testing complex hydration scenarios

component Header() {
	<h1 class="sr-only">{'Ripple'}</h1>
	<img src="/images/logo.png" alt="Logo" class="logo" />
	<p class="subtitle">{'the elegant TypeScript UI framework'}</p>
}

component Actions({ playgroundVisible = false }: { playgroundVisible: boolean }) {
	<div class="social-links">
		<a href="https://github.com" class="github-link">{'GitHub'}</a>
		<a href="https://discord.com" class="discord-link">{'Discord'}</a>
		if (playgroundVisible) {
			<a href="/playground" class="playground-link">{'Playground'}</a>
		}
	</div>
}

component Layout({ children }: { children: Children }) {
	<main>
		<div class="container">{children}</div>
	</main>
}

component Content() {
	<div class="content">
		<p>{'Some content here'}</p>
	</div>
}

export component WebsiteIndex() {
	<Layout>
		<Header />
		<Actions playgroundVisible={true} />
		<Content />
		<Actions playgroundVisible={false} />
	</Layout>
}

// Test case for component as last element with no following siblings.
// This exercises hydrate_advance() in append() - at the end of content,
// there's no next sibling and that should be handled gracefully.
component LastChild() {
	<footer class="last-child">{'I am the last child'}</footer>
}

export component ComponentAsLastSibling() {
	<div class="wrapper">
		<h1>{'Header'}</h1>
		<p>{'Some content'}</p>
		<LastChild />
	</div>
}

// Nested version - component is last child inside another component
component InnerContent() {
	<div class="inner">
		<span>{'Inner text'}</span>
		<LastChild />
	</div>
}

export component NestedComponentAsLastSibling() {
	<section class="outer">
		<h2>{'Section title'}</h2>
		<InnerContent />
	</section>
}
