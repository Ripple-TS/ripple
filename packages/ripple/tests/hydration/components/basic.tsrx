// Basic static components for hydration testing
import { track } from 'ripple';
import type { Children } from 'ripple';

export function StaticText() {
	return <><div>{'Hello World'}</div></>;
}

export function MultipleElements() {
	return <>
		<h1>{'Title'}</h1>
		<p>{'Paragraph text'}</p>
		<span>{'Span text'}</span>
	</>;
}

export function NestedElements() {
	return <>
		<div class="outer">
			<div class="inner">
				<span>{'Nested content'}</span>
			</div>
		</div>
	</>;
}

export function WithAttributes() {
	return <>
		<input type="text" placeholder="Enter text" disabled />
		<a href="/link" target="_blank">{'Link'}</a>
	</>;
}

export function ChildComponent() {
	return <><span class="child">{'Child content'}</span></>;
}

export function ParentWithChild() {
	return <>
		<div class="parent">
			<ChildComponent />
		</div>
	</>;
}

export function FirstSibling() {
	return <><div class="first">{'First'}</div></>;
}

export function SecondSibling() {
	return <><div class="second">{'Second'}</div></>;
}

export function SiblingComponents() {
	return <>
		<FirstSibling />
		<SecondSibling />
	</>;
}

export function Greeting(props: { name: string }) {
	return <>
		<div>
			{'Hello '}
			{props.name}
		</div>
	</>;
}

export function WithGreeting() {
	return <><Greeting name="World" /></>;
}

export function ExpressionContent() {
	return <>
		const value = 42;
		const label = 'computed';
		<div>{value}</div>
		<span>{label.toUpperCase()}</span>
	</>;
}

function NestedHelperItem({ item }: { item: number }) {
	return <><div class="helper-item">{item}</div></>;
}

function NestedTsxTsrxFragment({ label }: { label: string }) {
	return <>
		<span class="label">{label}</span>
		for (const item of [1, 2, 3, 4]) {
			<NestedHelperItem {item} />
		}
	</>;
}

export function NestedTsxTsrxExpressionValues() {
	return <>
		for (const item of [1, 2, 3]) {
			<div class="app-item">{item}</div>
		}
		<NestedTsxTsrxFragment label="from helper" />
	</>;
}

export function MixedTsrxCollectionText() {
	return <>
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
	</>;
}

export function MixedTsrxCollectionSplitServerText() {
	return <>
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
	</>;
}

export function MixedTsrxCollectionSplitClientText() {
	return <>
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
	</>;
}

export function MixedTsrxCollectionPrimitiveServerText() {
	return <>
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
	</>;
}

export function MixedTsrxCollectionPrimitiveClientText() {
	return <>
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
	</>;
}

function createPrimitiveItems() {
	return ['start:', ['one', 2], true, null, false, ':end'];
}

export function DynamicArrayFromCall() {
	return <>
		const items = createPrimitiveItems();
		<div class="dynamic-array-call">{items}</div>
	</>;
}

export function DynamicArrayFromTrack() {
	return <>
		let &[items] = track(['start:', ['one', 2], true, null, false, ':end']);
		<div class="dynamic-array-track">{items}</div>
	</>;
}

export function DynamicArrayFromConditional() {
	return <>
		const condition = true;
		const items = condition ? ['start:', ['one', 2], true, null, false, ':end'] : ['fallback'];
		<div class="dynamic-array-conditional">{items}</div>
	</>;
}

export function DynamicArrayFromLogical() {
	return <>
		const condition = true;
		const items = condition && ['start:', ['one', 2], true, null, false, ':end'];
		<div class="dynamic-array-logical">{items}</div>
	</>;
}

export function NestedTsrxInsideTopLevelTsxExpression() {
	return <>
		const content = <>
			<section class="outer">
				{<><div class="inner">{'from tsrx'}</div></>}
			</section>
		</>;
		{content}
	</>;
}

export function NestedTsrxElementsInsideTopLevelTsxValue() {
	return <>
		const content = <>
			<div class="wrapper">
				{<>
					<section class="native">
						<span class="nested-tsrx">{'inside nested tsrx'}</span>
					</section>
				</>}
			</div>
		</>;
		{content}
	</>;
}

export function TsxDeclaredBeforeTopLevelTsx() {
	return <>
		const nested = <><span class="nested-tsx">{'inside nested tsx'}</span></>;
		const content = <><div class="native">{nested}</div></>;
		{content}
	</>;
}

function TextProp(&{ children }: { children: string }) {
	return <><div class="text-prop">{children}</div></>;
}

export function TextPropWithToggle() {
	return <>
		let &[show] = track(false);
		<TextProp children={show ? 'hello' : ''} />
		<button class="show-text" onClick={() => (show = true)}>{'Show'}</button>
	</>;
}

// Test for static content in child component followed by sibling content
function StaticHeader() {
	return <>
		<h1 class="sr-only">{'heading'}</h1>
		<p class="subtitle">{'first paragraph'}</p>
		<p class="subtitle">{'second paragraph'}</p>
	</>;
}

export function StaticChildWithSiblings() {
	return <>
		const foo = 'bar';
		<StaticHeader />
		<span class="sibling1">{foo}</span>
		<span class="sibling2">{foo}</span>
	</>;
}

// Website-like components for testing complex hydration scenarios

function Header() {
	return <>
		<h1 class="sr-only">{'Ripple'}</h1>
		<img src="/images/logo.png" alt="Logo" class="logo" />
		<p class="subtitle">{'the elegant TypeScript UI framework'}</p>
	</>;
}

function Actions({ playgroundVisible = false }: { playgroundVisible: boolean }) {
	return <>
		<div class="social-links">
			<a href="https://github.com" class="github-link">{'GitHub'}</a>
			<a href="https://discord.com" class="discord-link">{'Discord'}</a>
			if (playgroundVisible) {
				<a href="/playground" class="playground-link">{'Playground'}</a>
			}
		</div>
	</>;
}

function Layout({ children }: { children: Children }) {
	return <>
		<main>
			<div class="container">{children}</div>
		</main>
	</>;
}

function Content() {
	return <>
		<div class="content">
			<p>{'Some content here'}</p>
		</div>
	</>;
}

export function WebsiteIndex() {
	return <>
		<Layout>
			<Header />
			<Actions playgroundVisible={true} />
			<Content />
			<Actions playgroundVisible={false} />
		</Layout>
	</>;
}

// Test case for component as last element with no following siblings.
// This exercises hydrate_advance() in append() - at the end of content,
// there's no next sibling and that should be handled gracefully.
function LastChild() {
	return <><footer class="last-child">{'I am the last child'}</footer></>;
}

export function ComponentAsLastSibling() {
	return <>
		<div class="wrapper">
			<h1>{'Header'}</h1>
			<p>{'Some content'}</p>
			<LastChild />
		</div>
	</>;
}

// Nested version - component is last child inside another component
function InnerContent() {
	return <>
		<div class="inner">
			<span>{'Inner text'}</span>
			<LastChild />
		</div>
	</>;
}

export function NestedComponentAsLastSibling() {
	return <>
		<section class="outer">
			<h2>{'Section title'}</h2>
			<InnerContent />
		</section>
	</>;
}
