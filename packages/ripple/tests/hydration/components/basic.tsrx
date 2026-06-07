// Basic static components for hydration testing
import { track } from 'ripple';
import type { Children } from 'ripple';

export function StaticText() @{
	<div>{'Hello World'}</div>
}

export function MultipleElements() @{
	<>
		<h1>{'Title'}</h1>
		<p>{'Paragraph text'}</p>
		<span>{'Span text'}</span>
	</>
}

export function NestedElements() @{
	<div class="outer">
		<div class="inner">
			<span>{'Nested content'}</span>
		</div>
	</div>
}

export function WithAttributes() @{
	<>
		<input type="text" placeholder="Enter text" disabled />
		<a href="/link" target="_blank">{'Link'}</a>
	</>
}

export function ChildComponent() @{
	<span class="child">{'Child content'}</span>
}

export function ParentWithChild() @{
	<div class="parent">
		<ChildComponent />
	</div>
}

export function FirstSibling() @{
	<div class="first">{'First'}</div>
}

export function SecondSibling() @{
	<div class="second">{'Second'}</div>
}

export function SiblingComponents() @{
	<>
		<FirstSibling />
		<SecondSibling />
	</>
}

export function Greeting(props: { name: string }) @{
	<div>
		{'Hello '}
		{props.name}
	</div>
}

export function WithGreeting() @{
	<Greeting name="World" />
}

export function ExpressionContent() @{
	const value = 42;
	const label = 'computed';
	<>
		<div>{value}</div>
		<span>{label.toUpperCase()}</span>
	</>
}

function NestedHelperItem({ item }: { item: number }) @{
	<div class="helper-item">{item}</div>
}

function NestedTsxTsrxFragment({ label }: { label: string }) @{
	<>
		<span class="label">{label}</span>
		@for (const item of [1, 2, 3, 4]) {
			<NestedHelperItem {item} />
		}
	</>
}

export function NestedTsxTsrxExpressionValues() @{
	<div class="nested-expression-values">
		@for (const item of [1, 2, 3]) {
			<div class="app-item">{item}</div>
		}
		<NestedTsxTsrxFragment label="from helper" />
	</div>
}

export function MixedTsrxCollectionText() @{
	const content = <>
		{[
			'alpha ',
			<strong class="middle">{'beta'}</strong>,
			' gamma ',
			[
				'delta ',
				<em class="tail">{'epsilon'}</em>,
				' zeta',
			],
		]}
	</>;
	<div class="mixed-collection">{content}</div>
}

export function MixedTsrxCollectionSplitServerText() @{
	const content = <>
		{[
			'alpha ',
			<strong class="middle">{'beta'}</strong>,
			' gamma ',
			[
				'delta ',
				<em class="tail">{'epsilon'}</em>,
				' zeta',
			],
		]}
	</>;
	<div class="mixed-collection-split">{content}</div>
}

export function MixedTsrxCollectionSplitClientText() @{
	const content = <>
		{[
			'alpha ',
			<strong class="middle">{'beta'}</strong>,
			' gamma ',
			[
				'changed ',
				<em class="tail">{'epsilon'}</em>,
				' zeta',
			],
		]}
	</>;
	<div class="mixed-collection-split">{content}</div>
}

export function MixedTsrxCollectionPrimitiveServerText() @{
	const content = <>
		{[
			'count: ',
			1,
			' / ',
			true,
			<span class="primitive-tail">{' ok'}</span>,
		]}
	</>;
	<div class="mixed-collection-primitive">{content}</div>
}

export function MixedTsrxCollectionPrimitiveClientText() @{
	const content = <>
		{[
			'count: ',
			2,
			' / ',
			false,
			<span class="primitive-tail">{' ok'}</span>,
		]}
	</>;
	<div class="mixed-collection-primitive">{content}</div>
}

function createPrimitiveItems() {
	return ['start:', ['one', 2], true, null, false, ':end'];
}

export function DynamicArrayFromCall() @{
	const items = createPrimitiveItems();
	<div class="dynamic-array-call">{items}</div>
}

export function DynamicArrayFromTrack() @{
	let &[items] = track(['start:', ['one', 2], true, null, false, ':end']);
	<div class="dynamic-array-track">{items}</div>
}

export function DynamicArrayFromConditional() @{
	const condition = true;
	const items = condition ? ['start:', ['one', 2], true, null, false, ':end'] : ['fallback'];
	<div class="dynamic-array-conditional">{items}</div>
}

export function DynamicArrayFromLogical() @{
	const condition = true;
	const items = condition && ['start:', ['one', 2], true, null, false, ':end'];
	<div class="dynamic-array-logical">{items}</div>
}

export function NestedTsrxInsideTopLevelTsxExpression() @{
	const content = <>
		<section class="outer">
			<div class="inner">{'from tsrx'}</div>
		</section>
	</>;
	<>
		{content}
	</>
}

export function NestedTsrxElementsInsideTopLevelTsxValue() @{
	const content = <>
		<div class="wrapper">
			<section class="native">
				<span class="nested-tsrx">{'inside nested tsrx'}</span>
			</section>
		</div>
	</>;
	<>
		{content}
	</>
}

export function TsxDeclaredBeforeTopLevelTsx() @{
	const nested = <span class="nested-tsx">inside nested tsx</span>;
	const content = <><div class="native">{nested}</div></>;
	<>
		{content}
	</>
}

function TextProp(&{ children }: { children: string }) @{
	<div class="text-prop">{children}</div>
}

export function TextPropWithToggle() @{
	let &[show] = track(false);
	<>
		<TextProp children={show ? 'hello' : ''} />
		<button class="show-text" onClick={() => (show = true)}>{'Show'}</button>
	</>
}

// Test for static content in child component followed by sibling content
function StaticHeader() @{
	<>
		<h1 class="sr-only">{'heading'}</h1>
		<p class="subtitle">{'first paragraph'}</p>
		<p class="subtitle">{'second paragraph'}</p>
	</>
}

export function StaticChildWithSiblings() @{
	const foo = 'bar';
	<>
		<StaticHeader />
		<span class="sibling1">{foo}</span>
		<span class="sibling2">{foo}</span>
	</>
}

// Website-like components for testing complex hydration scenarios

function Header() @{
	<>
		<h1 class="sr-only">{'Ripple'}</h1>
		<img src="/images/logo.png" alt="Logo" class="logo" />
		<p class="subtitle">{'the elegant TypeScript UI framework'}</p>
	</>
}

function Actions({ playgroundVisible = false }: { playgroundVisible: boolean }) @{
	<div class="social-links">
		<a href="https://github.com" class="github-link">{'GitHub'}</a>
		<a href="https://discord.com" class="discord-link">{'Discord'}</a>
		{playgroundVisible ? <a href="/playground" class="playground-link">{'Playground'}</a> : null}
	</div>
}

function Layout({ children }: { children: Children }) @{
	<main>
		<div class="container">{children}</div>
	</main>
}

function Content() @{
	<div class="content">
		<p>{'Some content here'}</p>
	</div>
}

export function WebsiteIndex() @{
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
function LastChild() @{
	<footer class="last-child">{'I am the last child'}</footer>
}

export function ComponentAsLastSibling() @{
	<div class="wrapper">
		<h1>{'Header'}</h1>
		<p>{'Some content'}</p>
		<LastChild />
	</div>
}

// Nested version - component is last child inside another component
function InnerContent() @{
	<div class="inner">
		<span>{'Inner text'}</span>
		<LastChild />
	</div>
}

export function NestedComponentAsLastSibling() @{
	<section class="outer">
		<h2>{'Section title'}</h2>
		<InnerContent />
	</section>
}
