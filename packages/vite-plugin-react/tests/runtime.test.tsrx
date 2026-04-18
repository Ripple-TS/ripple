import { describe, it, expect } from 'vitest';

// ── Basic rendering ──

component BasicApp() {
	<div class="greeting">{'Hello world'}</div>
}

component Child(props: { text: string }) {
	<span class="child">{props.text}</span>
}

component NestedApp() {
	<div>
		<Child text="nested" />
	</div>
}

// ── Refs on elements ──

let element_ref_captured: HTMLDivElement | null = null;

component ElementRefApp() {
	<div
		{ref (node: HTMLDivElement) => {
			element_ref_captured = node;
		}}
		class="ref-target"
	>
		{'ref test'}
	</div>
}

// ── Ref on composite components via prop forwarding ──

let composite_ref_captured: HTMLInputElement | null = null;

component Input(props: { type: string; ref?: (node: HTMLInputElement) => void }) {
	<input type={props.type} ref={props.ref} />
}

component CompositeRefApp() {
	<Input
		type="text"
		{ref (node: HTMLInputElement) => {
			composite_ref_captured = node;
		}}
	/>
}

// ── Multiple ref callbacks combined into one ──

let multi_ref1_node: HTMLDivElement | null = null;
let multi_ref2_node: HTMLDivElement | null = null;

component MultiRefApp() {
	function firstRef(node: HTMLDivElement) {
		multi_ref1_node = node;
	}
	function secondRef(node: HTMLDivElement) {
		multi_ref2_node = node;
	}

	<div
		{ref (node: HTMLDivElement) => {
			firstRef(node);
			secondRef(node);
		}}
		class="multi-ref"
	>
		{'multi ref'}
	</div>
}

// ── If-statement children ──

component IfApp() {
	const show = true;
	if (show) {
		<span class="visible">{'shown'}</span>
	}
}

// ── For-of loop ──

component ForApp() {
	const items = ['a', 'b', 'c'];
	for (const item of items) {
		<li class="item" key={item}>{item}</li>
	}
}

// ── Composite children ──

component Wrapper(props: { children?: any }) {
	<div class="wrapper">{props.children}</div>
}

component ChildrenApp() {
	<Wrapper>
		<span>{'inside wrapper'}</span>
	</Wrapper>
}

// ── Scoped CSS ──

component StyledApp() {
	<div class="styled">{'styled text'}</div>

	<style>
		.styled {
			color: red;
		}
	</style>
}

// ── Ref forwarding through spread ──

let spread_ref_captured: HTMLInputElement | null = null;

component SpreadInput(props: { id: string; [key: string]: any }) {
	const { id, ...rest } = props;
	<input {id} {...rest} />
}

component SpreadRefApp() {
	<SpreadInput
		id="spread-input"
		type="text"
		{ref (node: HTMLInputElement) => {
			spread_ref_captured = node;
		}}
	/>
}

// ── Tests ──

describe('tsrx-react runtime', () => {
	it('renders a basic component into the DOM', () => {
		render(BasicApp);

		const div = container.querySelector('.greeting');
		expect(div).not.toBeNull();
		expect(div.textContent).toBe('Hello world');
	});

	it('renders nested components', () => {
		render(NestedApp);

		const span = container.querySelector('.child');
		expect(span).not.toBeNull();
		expect(span.textContent).toBe('nested');
	});

	it('supports ref callback on elements', () => {
		element_ref_captured = null;
		render(ElementRefApp);

		expect(element_ref_captured).not.toBeNull();
		expect(element_ref_captured).toBeInstanceOf(HTMLDivElement);
		expect(element_ref_captured!.textContent).toBe('ref test');
		expect(element_ref_captured!.className).toBe('ref-target');
	});

	it('supports ref on composite components via prop forwarding', () => {
		composite_ref_captured = null;
		render(CompositeRefApp);

		expect(composite_ref_captured).not.toBeNull();
		expect(composite_ref_captured).toBeInstanceOf(HTMLInputElement);
		expect(composite_ref_captured!.type).toBe('text');
	});

	it('supports multiple ref callbacks on the same element', () => {
		multi_ref1_node = null;
		multi_ref2_node = null;
		render(MultiRefApp);

		expect(multi_ref1_node).not.toBeNull();
		expect(multi_ref2_node).not.toBeNull();
		expect(multi_ref1_node).toBe(multi_ref2_node);
		expect(multi_ref1_node!.textContent).toBe('multi ref');
	});

	it('supports if-statement children', () => {
		render(IfApp);

		const span = container.querySelector('.visible');
		expect(span).not.toBeNull();
		expect(span.textContent).toBe('shown');
	});

	it('supports for-of loop rendering', () => {
		render(ForApp);

		const items = container.querySelectorAll('.item');
		expect(items.length).toBe(3);
		expect(items[0].textContent).toBe('a');
		expect(items[1].textContent).toBe('b');
		expect(items[2].textContent).toBe('c');
	});

	it('supports composite components with children passed through', () => {
		render(ChildrenApp);

		const wrapper = container.querySelector('.wrapper');
		expect(wrapper).not.toBeNull();
		const span = wrapper!.querySelector('span');
		expect(span).not.toBeNull();
		expect(span!.textContent).toBe('inside wrapper');
	});

	it('supports scoped CSS via style blocks', () => {
		render(StyledApp);

		const div = container.querySelector('div');
		expect(div).not.toBeNull();
		expect(div!.textContent).toBe('styled text');
		// The div should have the scoped hash class applied
		expect(div!.className).toContain('styled');
	});

	it('supports ref forwarding through spread props', () => {
		spread_ref_captured = null;
		render(SpreadRefApp);

		expect(spread_ref_captured).not.toBeNull();
		expect(spread_ref_captured).toBeInstanceOf(HTMLInputElement);
		expect(spread_ref_captured!.id).toBe('spread-input');
		expect(spread_ref_captured!.type).toBe('text');
	});
});
