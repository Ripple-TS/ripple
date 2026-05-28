import type { Children } from 'ripple';

export function Layout(&{ children }: { children?: Children }) {
	return <><div class="layout">{children}</div></>;
}

export function TextWrappedLayout(&{ children }: { children?: Children }) {
	return <>
		<div class="layout">
			{'before'}
			{children}
			{'after'}
		</div>
	</>;
}

export function SingleChild() {
	return <><div class="single">{'single'}</div></>;
}

export function MultiRootChild() {
	return <>
		<h1>{'title'}</h1>
		<p>{'description'}</p>
	</>;
}

export function EmptyLayout() {
	return <><Layout /></>;
}

export function LayoutWithSingleChild() {
	return <>
		<Layout>
			<SingleChild />
		</Layout>
	</>;
}

export function LayoutWithMultipleChildren() {
	return <>
		<Layout>
			<SingleChild />
			<div class="extra">{'extra'}</div>
		</Layout>
	</>;
}

export function LayoutWithMultiRootChild() {
	return <>
		<Layout>
			<MultiRootChild />
		</Layout>
	</>;
}

export function LayoutWithTextAroundChildren() {
	return <>
		<TextWrappedLayout>
			<SingleChild />
		</TextWrappedLayout>
	</>;
}
