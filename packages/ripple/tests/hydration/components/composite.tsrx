import type { Children } from 'ripple';

export function Layout(&{ children }: { children?: Children }) @{
	<div class="layout">{children}</div>
}

export function TextWrappedLayout(&{ children }: { children?: Children }) @{
	<div class="layout">
		{'before'}
		{children}
		{'after'}
	</div>
}

export function SingleChild() @{
	<div class="single">{'single'}</div>
}

export function MultiRootChild() @{
	<>
		<h1>{'title'}</h1>
		<p>{'description'}</p>
	</>
}

export function EmptyLayout() @{
	<Layout />
}

export function LayoutWithSingleChild() @{
	<Layout>
		<SingleChild />
	</Layout>
}

export function LayoutWithMultipleChildren() @{
	<Layout>
		<SingleChild />
		<div class="extra">{'extra'}</div>
	</Layout>
}

export function LayoutWithMultiRootChild() @{
	<Layout>
		<MultiRootChild />
	</Layout>
}

export function LayoutWithTextAroundChildren() @{
	<TextWrappedLayout>
		<SingleChild />
	</TextWrappedLayout>
}

export function DynamicTagElement() @{
	const Tag = 'section';
	<{Tag} class="host">{'hello'}</{Tag}>
}

export function DynamicTagComponent() @{
	const Comp = SingleChild;
	<Layout>
		<{Comp} />
	</Layout>
}
