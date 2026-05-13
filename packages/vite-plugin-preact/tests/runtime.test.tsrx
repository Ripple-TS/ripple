import { lazy } from 'preact/compat';
import { act } from 'preact/test-utils';
import { useState } from 'preact/hooks';
import {
	runSwitchFallthroughRuntimeTests,
} from '@tsrx/core/test-harness/runtime/switch-fallthrough';

component ResolvedChild(props: { value: string }) {
	<p class="resolved">{props.value}</p>
}

component EmptyPendingSuspenseApp(props: {
	loader: () => Promise<{ default: typeof ResolvedChild }>;
}) {
	const LazyChild = lazy(props.loader);

	try {
		<LazyChild value="hello" />
	} pending {}
}

component ForContinueApp() {
	const items = ['a', '', 'c'];

	for (const item of items) {
		if (!item) continue;
		<li class="continue-item" key={item}>{item}</li>
	}
}

component ForOverSetApp() {
	const items = new Set<string>(['x', 'y', 'z']);

	for (const item of items) {
		<li class="set-item" key={item}>{item}</li>
	}
}

component ForOverMapApp() {
	const entries = new Map<string, number>([
		['a', 1],
		['b', 2],
		['c', 3],
	]);

	for (const [key, value] of entries) {
		<li class="map-item" {key}>{key + ':' + value}</li>
	}
}

component ForOverCustomIterableApp() {
	function* iter() {
		yield 'one';
		yield 'two';
		yield 'three';
	}

	const items = iter();

	for (const item of items) {
		<li class="generator-item" key={item}>{item}</li>
	}
}

let named_direct_node: HTMLInputElement | null = null;
let named_direct_native_node: HTMLInputElement | null = null;
let named_direct_anonymous_node: HTMLInputElement | null = null;

component NamedDirectRefApp() {
	function nativeRef(node: HTMLInputElement | null) {
		named_direct_native_node = node;
	}

	function anonymousRef(node: HTMLInputElement | null) {
		named_direct_anonymous_node = node;
	}

	<input
		ref={nativeRef}
		{ref anonymousRef}
		input_ref={ref (node: HTMLInputElement | null) => {
			named_direct_node = node;
		}}
		class="named-direct-ref"
		type="text"
	/>
}

let named_forward_node: HTMLInputElement | null = null;

component NamedForwardInput(props: { type: string; input_ref?: any }) {
	<input type={props.type} ref={props.input_ref} class="named-forward-ref" />
}

component NamedForwardRefApp() {
	<NamedForwardInput
		type="text"
		input_ref={ref (node: HTMLInputElement | null) => {
			named_forward_node = node;
		}}
	/>
}

let named_spread_before_node: HTMLInputElement | null = null;
let named_spread_before_native_node: HTMLInputElement | null = null;

function namedSpreadBeforeNativeRef(node: HTMLInputElement | null) {
	named_spread_before_native_node = node;
}

component NamedSpreadBeforeRefInput(props: { type: string; input_ref?: any }) {
	<input {...props} ref={namedSpreadBeforeNativeRef} class="named-spread-before-ref" />
}

component NamedSpreadBeforeRefApp() {
	<NamedSpreadBeforeRefInput
		type="text"
		input_ref={ref (node: HTMLInputElement | null) => {
			named_spread_before_node = node;
		}}
	/>
}

let named_spread_after_node: HTMLInputElement | null = null;
let named_spread_after_native_node: HTMLInputElement | null = null;

function namedSpreadAfterNativeRef(node: HTMLInputElement | null) {
	named_spread_after_native_node = node;
}

component NamedSpreadAfterRefInput(props: { type: string; input_ref?: any }) {
	<input ref={namedSpreadAfterNativeRef} {...props} class="named-spread-after-ref" />
}

component NamedSpreadAfterRefApp() {
	<NamedSpreadAfterRefInput
		type="text"
		input_ref={ref (node: HTMLInputElement | null) => {
			named_spread_after_node = node;
		}}
	/>
}

let multi_spread_first_node: HTMLInputElement | null = null;
let multi_spread_second_node: HTMLInputElement | null = null;
let multi_spread_native_node: HTMLInputElement | null = null;
let multi_spread_native_calls = 0;

function multiSpreadExplicitNativeRef(node: HTMLInputElement | null) {
	if (node) {
		multi_spread_native_calls += 1;
	}
	multi_spread_native_node = node;
}

component MultiSpreadExplicitRefInput(props: { type: string; first_ref?: any; second_ref?: any }) {
	const first = { type: props.type, first_ref: props.first_ref };
	const second = { second_ref: props.second_ref };

	<input
		{...first}
		{...second}
		ref={multiSpreadExplicitNativeRef}
		class="multi-spread-explicit-ref"
	/>
}

component MultiSpreadExplicitRefApp() {
	<MultiSpreadExplicitRefInput
		type="text"
		first_ref={ref (node: HTMLInputElement | null) => {
			multi_spread_first_node = node;
		}}
		second_ref={ref (node: HTMLInputElement | null) => {
			multi_spread_second_node = node;
		}}
	/>
}

const named_ref_object: { current: HTMLInputElement | null } = { current: null };

component NamedRefObjectApp() {
	<NamedForwardInput type="text" input_ref={ref named_ref_object} />
}

function TsrxExpressionHookPanel(props: { active: boolean; label: string }) {
	if (!props.active) return null;

	return <tsrx>
		const [count, setCount] = useState(0);
		<button class="tsrx-expression-hook-count" onClick={() => setCount(count + 1)}>
			{props.label + ':' + count}
		</button>
	</tsrx>;
}

component TsrxExpressionHookApp() {
	const [active, setActive] = useState(false);
	const [label, setLabel] = useState('first');

	<button class="tsrx-expression-hook-toggle" onClick={() => setActive(!active)}>
		{active ? 'hide' : 'show'}
	</button>
	<button class="tsrx-expression-hook-label" onClick={() => setLabel('second')}>{'label'}</button>
	<TsrxExpressionHookPanel {active} {label} />
}

describe('@tsrx/vite-plugin-preact runtime', () => {
	it('renders nothing for an empty pending fallback then resolves', async () => {
		let resolve_fn: (mod: { default: typeof ResolvedChild }) => void;
		const loader = () => new Promise<{ default: typeof ResolvedChild }>((r) => {
			resolve_fn = r;
		});

		await render(EmptyPendingSuspenseApp, { loader });
		expect(container.innerHTML).toBe('');
		expect(container.querySelector('.resolved')).toBeNull();

		await act(async () => {
			resolve_fn!({ default: ResolvedChild });
		});
		expect(container.querySelector('.resolved')?.textContent).toBe('hello');
	});

	it('skips for-of iterations with continue', async () => {
		await render(ForContinueApp);
		expect(
			Array.from(container.querySelectorAll('.continue-item'), (item) => item.textContent),
		).toEqual([
			'a',
			'c',
		]);
	});

	it('renders for-of over a Set via map_iterable', async () => {
		await render(ForOverSetApp);
		expect(Array.from(container.querySelectorAll('.set-item'), (el) => el.textContent)).toEqual([
			'x',
			'y',
			'z',
		]);
	});

	it('renders for-of over a Map via map_iterable', async () => {
		await render(ForOverMapApp);
		expect(Array.from(container.querySelectorAll('.map-item'), (el) => el.textContent)).toEqual([
			'a:1',
			'b:2',
			'c:3',
		]);
	});

	it('renders for-of over a generator/iterator via map_iterable', async () => {
		await render(ForOverCustomIterableApp);
		expect(
			Array.from(container.querySelectorAll('.generator-item'), (el) => el.textContent),
		).toEqual([
			'one',
			'two',
			'three',
		]);
	});

	it('merges direct named ref props with native ref and anonymous {ref}', async () => {
		named_direct_node = null;
		named_direct_native_node = null;
		named_direct_anonymous_node = null;
		await render(NamedDirectRefApp);
		expect(named_direct_node).toBeInstanceOf(HTMLInputElement);
		expect(named_direct_node).toBe(named_direct_native_node);
		expect(named_direct_node).toBe(named_direct_anonymous_node);
		expect(container.querySelector('.named-direct-ref')!.hasAttribute('input_ref')).toBe(false);
	});

	it('supports explicit forwarding of named ref props into host ref', async () => {
		named_forward_node = null;
		await render(NamedForwardRefApp);
		expect(named_forward_node).toBeInstanceOf(HTMLInputElement);
		expect(named_forward_node!.className).toBe('named-forward-ref');
	});

	it('merges named spread refs with native ref after the spread', async () => {
		named_spread_before_node = null;
		named_spread_before_native_node = null;
		await render(NamedSpreadBeforeRefApp);
		expect(named_spread_before_node).toBeInstanceOf(HTMLInputElement);
		expect(named_spread_before_node).toBe(named_spread_before_native_node);
	});

	it('merges named spread refs with native ref before the spread', async () => {
		named_spread_after_node = null;
		named_spread_after_native_node = null;
		await render(NamedSpreadAfterRefApp);
		expect(named_spread_after_node).toBeInstanceOf(HTMLInputElement);
		expect(named_spread_after_node).toBe(named_spread_after_native_node);
	});

	it('merges named refs from multiple host spreads with one explicit ref', async () => {
		multi_spread_first_node = null;
		multi_spread_second_node = null;
		multi_spread_native_node = null;
		multi_spread_native_calls = 0;
		await render(MultiSpreadExplicitRefApp);
		expect(multi_spread_first_node).toBeInstanceOf(HTMLInputElement);
		expect(multi_spread_first_node).toBe(multi_spread_second_node);
		expect(multi_spread_first_node).toBe(multi_spread_native_node);
		expect(multi_spread_native_calls).toBe(1);
		expect(container.querySelector('.multi-spread-explicit-ref')!.hasAttribute('first_ref')).toBe(
			false,
		);
		expect(container.querySelector('.multi-spread-explicit-ref')!.hasAttribute('second_ref')).toBe(
			false,
		);
	});

	it('assigns named ref props backed by Preact-style ref objects', async () => {
		named_ref_object.current = null;
		await render(NamedRefObjectApp);
		expect(named_ref_object.current).toBeInstanceOf(HTMLInputElement);
		expect(named_ref_object.current!.className).toBe('named-forward-ref');
	});

	it('keeps <tsrx> expression hook state stable across regular function rerenders', async () => {
		await render(TsrxExpressionHookApp);
		expect(container.querySelector('.tsrx-expression-hook-count')).toBeNull();

		await act(() => {
			(container.querySelector('.tsrx-expression-hook-toggle') as HTMLButtonElement).click();
		});
		expect(container.querySelector('.tsrx-expression-hook-count')?.textContent).toBe('first:0');

		await act(() => {
			(container.querySelector('.tsrx-expression-hook-count') as HTMLButtonElement).click();
		});
		expect(container.querySelector('.tsrx-expression-hook-count')?.textContent).toBe('first:1');

		await act(() => {
			(container.querySelector('.tsrx-expression-hook-label') as HTMLButtonElement).click();
		});
		expect(container.querySelector('.tsrx-expression-hook-count')?.textContent).toBe('second:1');
	});
});

runSwitchFallthroughRuntimeTests();
