import type { Children } from 'ripple';

export component Layout(&{ children }: { children?: Children }) {
	<div class="layout">{children}</div>
}

export component TextWrappedLayout(&{ children }: { children?: Children }) {
	<div class="layout">
		{text 'before'}
		{children}
		{text 'after'}
	</div>
}

export component SingleChild() {
	<div class="single">{'single'}</div>
}

export component MultiRootChild() {
	<h1>{'title'}</h1>
	<p>{'description'}</p>
}

export component EmptyLayout() {
	<Layout />
}

export component LayoutWithSingleChild() {
	<Layout>
		<SingleChild />
	</Layout>
}

export component LayoutWithMultipleChildren() {
	<Layout>
		<SingleChild />
		<div class="extra">{'extra'}</div>
	</Layout>
}

export component LayoutWithMultiRootChild() {
	<Layout>
		<MultiRootChild />
	</Layout>
}

export component LayoutWithTextAroundChildren() {
	<TextWrappedLayout>
		<SingleChild />
	</TextWrappedLayout>
}
