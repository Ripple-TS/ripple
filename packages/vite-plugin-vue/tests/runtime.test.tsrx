import type { MockInstance } from 'vitest';
import { inject, provide, reactive, ref, watch, watchEffect } from 'vue';

const EXPECTED_ERROR_LOG_SNIPPETS = [
	'sync boom',
	'conditional boom',
	'inner error',
	'Unhandled error during execution of setup function',
	'Active effect was not restored correctly',
];

let console_error_spy: MockInstance | undefined;
let console_warn_spy: MockInstance | undefined;

function is_expected_error_log(args: unknown[]) {
	const message = args.map((arg) => {
		if (arg instanceof Error) {
			return `${arg.name}: ${arg.message}`;
		}
		return String(arg);
	}).join(' ');

	return EXPECTED_ERROR_LOG_SNIPPETS.some((snippet) => message.includes(snippet));
}

async function click(selector: string) {
	const btn = container.querySelector(selector) as HTMLElement;
	btn.click();
	await flush();
}

function text(selector: string): string | null {
	return container.querySelector(selector)?.textContent ?? null;
}

function texts(selector: string): Array<string | null> {
	return Array.from(container.querySelectorAll(selector), (node: Element) => node.textContent);
}

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

component ExplicitTextApp() {
	const markup = '<span>Not HTML</span>';
	const hidden = false;
	const empty = null;
	const missing = undefined;

	<div class="explicit-text-markup">{text markup}</div>
	<div class="explicit-text-boolean">{text hidden}</div>
	<div class="explicit-text-null">{text empty}</div>
	<div class="explicit-text-undefined">{text missing}</div>
}

component ExplicitHtmlApp() {
	const markup = ref('<span class="html-node">safe enough</span>');

	<div class="explicit-html-target">{html markup.value}</div>
	<button
		class="explicit-html-update"
		onClick={() => {
			markup.value = '<strong class="html-node">updated</strong>';
		}}
	>
		{'update'}
	</button>
}

let element_ref_captured: HTMLDivElement | null = null;

let keyword_ref_callback_captured: HTMLDivElement | null = null;

let multi_dom_ref_a: HTMLInputElement | null = null;

let multi_dom_ref_b: HTMLInputElement | null = null;

component ElementRefApp() {
	<div
		ref={(node: HTMLDivElement) => {
			element_ref_captured = node;
		}}
		class="ref-target"
	>
		{'ref test'}
	</div>
}

component KeywordRefCallbackApp() {
	function capture(node: HTMLDivElement | null) {
		keyword_ref_callback_captured = node;
	}

	<div {ref capture} class="keyword-ref-target">{'keyword ref'}</div>
}

component MultiDomRefApp() {
	function captureA(node: HTMLInputElement | null) {
		multi_dom_ref_a = node;
	}

	function captureB(node: HTMLInputElement | null) {
		multi_dom_ref_b = node;
	}

	<input {ref captureA} {ref captureB} class="multi-dom-ref" type="text" />
}

let combo_jsx_node: HTMLInputElement | null = null;
let combo_keyword_node: HTMLInputElement | null = null;

component ComboRefApp() {
	function jsxRef(node: HTMLInputElement | null) {
		combo_jsx_node = node;
	}

	function keywordRef(node: HTMLInputElement | null) {
		combo_keyword_node = node;
	}

	<input ref={jsxRef} {ref keywordRef} class="combo-ref" type="text" />
}

const value_ref_object = ref<HTMLInputElement | null>(null);
let value_ref_callback_node: HTMLInputElement | null = null;

component ValueRefObjectApp() {
	function callbackRef(node: HTMLInputElement | null) {
		value_ref_callback_node = node;
	}

	<input {ref value_ref_object} {ref callbackRef} class="value-ref" type="text" />
}

component CounterApp() {
	const count = ref(0);
	<p class="count">{count.value}</p>
	<button class="inc" onClick={() => count.value++}>{'+'}</button>
}

component LazyParamChild(&{ count }: { count: number }) {
	<p class="lazy-child-count">{count}</p>
}

component LazyObjectDestructuringApp() {
	const state = reactive({ count: 0 });
	let &{ count } = state;

	<p class="lazy-local-count">{count}</p>
	<LazyParamChild count={state.count} />
	<button class="lazy-inc" onClick={() => count++}>{'+'}</button>
}

component LazyArrayDestructuringApp() {
	const values = reactive([1, 2]);
	let &[first, second] = values;

	<p class="lazy-array-counts">{`${first}-${second}`}</p>
	<button class="lazy-array-update" onClick={() => (first = second + 1)}>{'update'}</button>
}

component EarlyReturnWithRefsApp() {
	const count = ref(0);
	const skip = ref(false);

	<button class="early-skip" onClick={() => (skip.value = !skip.value)}>{'skip'}</button>

	if (skip.value) {
		return;
	}

	const doubled = ref(0);

	<p class="early-count">{count.value}</p>
	<p class="early-doubled">{doubled.value}</p>
	<button class="early-inc" onClick={() => count.value++}>{'inc'}</button>
	<button class="early-double" onClick={() => doubled.value++}>{'double'}</button>
}
let watch_fire_count = 0;
let watch_effect_fire_count = 0;

component ProvideChild() {
	const value = inject('provide-test-key', 'default');
	<span class="provide-child">{value}</span>
}

// All four fixtures below have continuations with NO state primitives, so the
// existing helper-split does NOT trigger. They exercise the bare-JSX /
// provide / watch / watchEffect cases that should be made reactive by the
// render-time-inlining fix.
component BareJsxEarlyReturnApp() {
	const skip = ref(true);

	<button class="bare-toggle" onClick={() => (skip.value = !skip.value)}>{'toggle'}</button>

	if (skip.value) {
		return;
	}

	<p class="bare-continuation">{'visible'}</p>
}

component ProvideEarlyReturnApp() {
	const skip = ref(true);

	<button class="provide-toggle" onClick={() => (skip.value = !skip.value)}>{'toggle'}</button>

	if (skip.value) {
		return;
	}

	provide('provide-test-key', 'dark');
	<ProvideChild />
}

component WatchEarlyReturnApp() {
	const skip = ref(true);
	const value = ref(0);

	<button class="watch-toggle" onClick={() => (skip.value = !skip.value)}>{'toggle'}</button>
	<button class="watch-inc" onClick={() => value.value++}>{'inc'}</button>

	if (skip.value) {
		return;
	}

	watch(value, () => {
		watch_fire_count++;
	});
	<p class="watch-value">{value.value}</p>
}

component WatchEffectEarlyReturnApp() {
	const skip = ref(true);
	const value = ref(0);

	<button class="watch-effect-toggle" onClick={() => (skip.value = !skip.value)}>{'toggle'}</button>
	<button class="watch-effect-inc" onClick={() => value.value++}>{'inc'}</button>

	if (skip.value) {
		return;
	}

	watchEffect(() => {
		void value.value;
		watch_effect_fire_count++;
	});
	<p class="watch-effect-value">{value.value}</p>
}

component IfReactiveApp() {
	const show = ref(true);

	if (show.value) {
		<span class="visible">{'shown'}</span>
	} else {
		<span class="hidden">{'hidden'}</span>
	}

	<button class="toggle" onClick={() => (show.value = !show.value)}>{'toggle'}</button>
}

component ConditionalLocalStateApp() {
	const count = ref(3);

	<button class="outer-inc" onClick={() => count.value++}>
		{'Outer: '}
		{count.value}
	</button>

	if (count.value > 2) {
		const newCount = ref(0);
		<button class="inner-inc" onClick={() => newCount.value++}>
			{'Inner: '}
			{newCount.value}
		</button>
	}
}

component StatefulChild() {
	const inner = ref(0);
	<button class="stateful-child" onClick={() => inner.value++}>
		{'Child: '}
		{inner.value}
	</button>
}

component StatefulChildHostApp() {
	<div>
		<StatefulChild />
	</div>
}

component StatefulChildWithProp(props: { count: ReturnType<typeof ref> }) {
	const inner = ref(0);
	<button class="stateful-child-prop" onClick={() => inner.value++}>
		{'Child prop: '}
		{inner.value}
	</button>
}

component StatefulChildWithPropHostApp() {
	const count = ref(3);
	<div>
		<StatefulChildWithProp {count} />
	</div>
}

component ForReactiveApp() {
	const items = ref(['a', 'b', 'c']);

	for (const item of items.value) {
		<li class="item" key={item}>{item}</li>
	}

	<button class="add" onClick={() => (items.value = [...items.value, 'd'])}>{'add'}</button>
	<button class="remove" onClick={() => (items.value = items.value.slice(1))}>{'remove'}</button>
}

component ForIndexReactiveApp() {
	const items = ref(['a', 'b', 'c']);

	for (const item of items.value; index i) {
		<li class="indexed-item">{`${i}:${item}`}</li>
	}

	<button class="prepend" onClick={() => (items.value = ['z', ...items.value])}>{'prepend'}</button>
	<button
		class="drop-middle"
		onClick={() => (items.value = [items.value[0], ...items.value.slice(2)])}
	>
		{'drop middle'}
	</button>
	<button class="reverse" onClick={() => (items.value = [...items.value].reverse())}>
		{'reverse'}
	</button>
}

component KeyedRow(props: { item: { id: string; label: string } }) {
	const count = ref(0);

	<button class={`keyed-row row-${props.item.id}`} onClick={() => count.value++}>
		{`${props.item.label}:${count.value}`}
	</button>
}

component ForKeyedStateApp() {
	const items = ref([
		{ id: 'a', label: 'Alpha' },
		{ id: 'b', label: 'Beta' },
		{ id: 'c', label: 'Gamma' },
	]);

	for (const item of items.value; key item.id) {
		<KeyedRow {item} />
	}

	<button class="reverse-keyed" onClick={() => (items.value = [...items.value].reverse())}>
		{'reverse'}
	</button>
	<button
		class="rename-beta"
		onClick={() => (items.value = items.value.map(
			(item) => item.id === 'b' ? { ...item, label: 'Bravo' } : item,
		))}
	>
		{'rename'}
	</button>
}

component ForIndexKeyedStateApp() {
	const items = ref([
		{ id: 'a', label: 'Alpha' },
		{ id: 'b', label: 'Beta' },
		{ id: 'c', label: 'Gamma' },
	]);

	for (const item of items.value; index i; key item.id) {
		<p class={`indexed-keyed-row row-${item.id}`}>{`${i}:${item.label}`}</p>
	}

	<button class="reverse-index-keyed" onClick={() => (items.value = [...items.value].reverse())}>
		{'reverse'}
	</button>
}

component SwitchReactiveApp() {
	const page = ref('home');

	switch (page.value) {
		case 'home':
			<div class="page">{'Home'}</div>
			break;
		case 'about':
			<div class="page">{'About'}</div>
			break;
		default:
			<div class="page">{'404'}</div>
			break;
	}

	<button class="go-about" onClick={() => (page.value = 'about')}>{'about'}</button>
	<button class="go-unknown" onClick={() => (page.value = 'other')}>{'other'}</button>
}

component StyledApp() {
	<div class="styled">{'styled text'}</div>

	<style>
		.styled {
			color: red;
		}
	</style>
}

component ThrowingChild() {
	throw new Error('sync boom');
	<p>{'unreachable'}</p>
}

component ErrorBoundaryApp() {
	try {
		<ThrowingChild />
	} catch (err) {
		<p class="caught">{(err as Error).message}</p>
	}
}

component MaybeThrow(props: { shouldThrow: boolean }) {
	if (props.shouldThrow) {
		throw new Error('conditional boom');
	}
	<p class="ok">{'no error'}</p>
}

component ErrorToggleApp() {
	const fail = ref(false);

	try {
		<MaybeThrow shouldThrow={fail.value} />
	} catch (err, reset) {
		<p class="caught">{(err as Error).message}</p>
		<button
			class="reset"
			onClick={() => {
				fail.value = false;
				reset();
			}}
		>
			{'reset'}
		</button>
	}

	<button class="trigger-error" onClick={() => (fail.value = true)}>{'break'}</button>
}

component InnerThrow() {
	throw new Error('inner error');
	<p>{'unreachable'}</p>
}

component NestedTryApp() {
	try {
		<div class="outer">
			try {
				<InnerThrow />
			} catch (err) {
				<p class="inner-caught">{(err as Error).message}</p>
			}
		</div>
	} catch (err) {
		<p class="outer-caught">{(err as Error).message}</p>
	}
}

component IfInsideTryApp() {
	const show = ref(true);

	try {
		if (show.value) {
			<p class="branch-a">{'visible'}</p>
		} else {
			<p class="branch-b">{'alternate'}</p>
		}
	} catch (err) {
		<p class="caught">{'error'}</p>
	}

	<button class="toggle" onClick={() => (show.value = !show.value)}>{'toggle'}</button>
}

component ForInsideTryApp() {
	const items = ref(['x', 'y']);

	try {
		for (const item of items.value) {
			<span class="try-item" key={item}>{item}</span>
		}
	} catch (err) {
		<p class="caught">{'error'}</p>
	}

	<button class="add" onClick={() => (items.value = [...items.value, 'z'])}>{'add'}</button>
}

component SwitchInsideTryApp() {
	const page = ref('home');

	try {
		switch (page.value) {
			case 'home':
				<p class="try-page">{'Home'}</p>
				break;
			case 'about':
				<p class="try-page">{'About'}</p>
				break;
			default:
				<p class="try-page">{'404'}</p>
				break;
		}
	} catch (err) {
		<p class="caught">{'error'}</p>
	}

	<button class="go-about" onClick={() => (page.value = 'about')}>{'about'}</button>
	<button class="go-unknown" onClick={() => (page.value = 'other')}>{'other'}</button>
}

describe('tsrx-vue runtime', () => {
	beforeEach(() => {
		const original_console_error = console.error;
		console_error_spy = vi.spyOn(console, 'error').mockImplementation((...args) => {
			if (is_expected_error_log(args)) {
				return;
			}

			original_console_error(...args);
		});

		const original_console_warn = console.warn;
		console_warn_spy = vi.spyOn(console, 'warn').mockImplementation((...args) => {
			if (is_expected_error_log(args)) {
				return;
			}

			original_console_warn(...args);
		});
	});

	afterEach(() => {
		console_error_spy?.mockRestore();
		console_error_spy = undefined;
		console_warn_spy?.mockRestore();
		console_warn_spy = undefined;
	});

	it('renders a basic component into the DOM', async () => {
		await render(BasicApp);
		expect(text('.greeting')).toBe('Hello world');
	});

	it('renders nested components', async () => {
		await render(NestedApp);
		expect(text('.child')).toBe('nested');
	});

	it('renders explicit text interpolation as text', async () => {
		await render(ExplicitTextApp);
		expect(text('.explicit-text-markup')).toBe('<span>Not HTML</span>');
		expect(container.querySelector('.explicit-text-markup span')).toBeNull();
		expect(text('.explicit-text-boolean')).toBe('false');
		expect(text('.explicit-text-null')).toBe('');
		expect(text('.explicit-text-undefined')).toBe('');
	});

	it('renders explicit html interpolation as html', async () => {
		await render(ExplicitHtmlApp);
		expect(text('.explicit-html-target')).toBe('safe enough');
		expect(container.querySelector('.explicit-html-target .html-node')?.tagName).toBe('SPAN');

		await click('.explicit-html-update');
		expect(text('.explicit-html-target')).toBe('updated');
		expect(container.querySelector('.explicit-html-target .html-node')?.tagName).toBe('STRONG');
	});

	it('supports ref callback on elements', async () => {
		element_ref_captured = null;
		await render(ElementRefApp);
		expect(element_ref_captured).toBeInstanceOf(HTMLDivElement);
		expect(element_ref_captured!.textContent).toBe('ref test');
		expect(element_ref_captured!.className).toContain('ref-target');
	});

	it('supports TSRX {ref fn} callback refs on elements', async () => {
		keyword_ref_callback_captured = null;
		await render(KeywordRefCallbackApp);
		expect(keyword_ref_callback_captured).toBeInstanceOf(HTMLDivElement);
		expect(keyword_ref_callback_captured!.textContent).toBe('keyword ref');
		expect(keyword_ref_callback_captured!.className).toContain('keyword-ref-target');
	});

	it('supports multiple TSRX ref callbacks on the same DOM element', async () => {
		multi_dom_ref_a = null;
		multi_dom_ref_b = null;
		await render(MultiDomRefApp);
		expect(multi_dom_ref_a).toBeInstanceOf(HTMLInputElement);
		expect(multi_dom_ref_b).toBeInstanceOf(HTMLInputElement);
		expect(multi_dom_ref_a).toBe(multi_dom_ref_b);
		expect(multi_dom_ref_a?.className).toContain('multi-dom-ref');
	});

	it('combines a single ref={fn} with a {ref expr} keyword-form ref via mergeRefs', async () => {
		combo_jsx_node = null;
		combo_keyword_node = null;
		await render(ComboRefApp);
		expect(combo_jsx_node).toBeInstanceOf(HTMLInputElement);
		expect(combo_jsx_node).toBe(combo_keyword_node);
	});

	it('mergeRefs assigns Vue ref() objects via .value alongside callback refs', async () => {
		value_ref_object.value = null;
		value_ref_callback_node = null;
		await render(ValueRefObjectApp);
		expect(value_ref_object.value).toBeInstanceOf(HTMLInputElement);
		expect(value_ref_object.value).toBe(value_ref_callback_node);
	});

	it('increments a counter on click', async () => {
		await render(CounterApp);
		expect(text('.count')).toBe('0');
		await click('.inc');
		expect(text('.count')).toBe('1');
		await click('.inc');
		expect(text('.count')).toBe('2');
	});

	it('supports lazy object destructuring for local state and child params', async () => {
		await render(LazyObjectDestructuringApp);
		expect(text('.lazy-local-count')).toBe('0');
		expect(text('.lazy-child-count')).toBe('0');

		await click('.lazy-inc');
		expect(text('.lazy-local-count')).toBe('1');
		expect(text('.lazy-child-count')).toBe('1');

		await click('.lazy-inc');
		expect(text('.lazy-local-count')).toBe('2');
		expect(text('.lazy-child-count')).toBe('2');
	});

	it('supports lazy array destructuring with reactive arrays', async () => {
		await render(LazyArrayDestructuringApp);
		expect(text('.lazy-array-counts')).toBe('1-2');

		await click('.lazy-array-update');
		expect(text('.lazy-array-counts')).toBe('3-2');
	});

	it('toggles if-statement branches reactively', async () => {
		await render(IfReactiveApp);
		expect(text('.visible')).toBe('shown');

		await click('.toggle');
		expect(text('.hidden')).toBe('hidden');
		expect(container.querySelector('.visible')).toBeNull();

		await click('.toggle');
		expect(text('.visible')).toBe('shown');
	});

	it('preserves branch-local Vue refs across parent updates', async () => {
		await render(ConditionalLocalStateApp);
		expect(text('.inner-inc')).toBe('Inner: 0');

		await click('.inner-inc');
		expect(text('.inner-inc')).toBe('Inner: 1');

		await click('.outer-inc');
		expect(text('.outer-inc')).toBe('Outer: 4');
		expect(text('.inner-inc')).toBe('Inner: 1');
	});

	it('supports local ref state in a normal nested Vue component', async () => {
		await render(StatefulChildHostApp);
		expect(text('.stateful-child')).toBe('Child: 0');

		await click('.stateful-child');
		expect(text('.stateful-child')).toBe('Child: 1');
	});

	it('supports local ref state in a nested Vue component that receives a ref prop', async () => {
		await render(StatefulChildWithPropHostApp);
		expect(text('.stateful-child-prop')).toBe('Child prop: 0');

		await click('.stateful-child-prop');
		expect(text('.stateful-child-prop')).toBe('Child prop: 1');
	});

	it('early return before refs passes scope correctly to continuation', async () => {
		await render(EarlyReturnWithRefsApp);
		expect(text('.early-skip')).toBe('skip');
		expect(text('.early-count')).toBe('0');
		expect(text('.early-doubled')).toBe('0');

		await click('.early-double');
		expect(text('.early-doubled')).toBe('1');

		await click('.early-inc');
		expect(text('.early-count')).toBe('1');
		expect(text('.early-doubled')).toBe('1');

		await click('.early-skip');
		expect(container.querySelector('.early-count')).toBeNull();
		expect(container.querySelector('.early-doubled')).toBeNull();
		expect(text('.early-skip')).toBe('skip');
	});

	it('renders bare-JSX continuation reactively after early-return condition flips', async () => {
		await render(BareJsxEarlyReturnApp);
		expect(container.querySelector('.bare-continuation')).toBeNull();

		await click('.bare-toggle');
		await flush();

		expect(text('.bare-continuation')).toBe('visible');
	});

	it(
		'calls provide in the continuation after a reactive early-return condition flips',
		async () => {
			await render(ProvideEarlyReturnApp);
			expect(container.querySelector('.provide-child')).toBeNull();

			await click('.provide-toggle');
			await flush();

			expect(text('.provide-child')).toBe('dark');
		},
	);

	it(
		'registers watch in the continuation after a reactive early-return condition flips',
		async () => {
			watch_fire_count = 0;
			await render(WatchEarlyReturnApp);
			expect(container.querySelector('.watch-value')).toBeNull();

			await click('.watch-toggle');
			await flush();
			expect(text('.watch-value')).toBe('0');

			const baseline = watch_fire_count;
			await click('.watch-inc');
			await flush();
			expect(text('.watch-value')).toBe('1');
			expect(watch_fire_count).toBe(baseline + 1);
		},
	);

	it(
		'registers watchEffect in the continuation after a reactive early-return condition flips',
		async () => {
			watch_effect_fire_count = 0;
			await render(WatchEffectEarlyReturnApp);
			expect(container.querySelector('.watch-effect-value')).toBeNull();

			await click('.watch-effect-toggle');
			await flush();
			expect(text('.watch-effect-value')).toBe('0');

			const baseline = watch_effect_fire_count;
			expect(baseline).toBeGreaterThan(0);

			await click('.watch-effect-inc');
			await flush();
			expect(text('.watch-effect-value')).toBe('1');
			expect(watch_effect_fire_count).toBeGreaterThan(baseline);
		},
	);

	it('adds and removes items in a for-of loop reactively', async () => {
		await render(ForReactiveApp);
		expect(container.querySelectorAll('.item').length).toBe(3);

		await click('.add');
		const items = container.querySelectorAll('.item');
		expect(items.length).toBe(4);
		expect(items[3].textContent).toBe('d');

		await click('.remove');
		const after = container.querySelectorAll('.item');
		expect(after.length).toBe(3);
		expect(after[0].textContent).toBe('b');
	});

	it('updates for-of index bindings after insertions, removals, and reorders', async () => {
		await render(ForIndexReactiveApp);
		expect(texts('.indexed-item')).toEqual([
			'0:a',
			'1:b',
			'2:c',
		]);

		await click('.prepend');
		expect(texts('.indexed-item')).toEqual([
			'0:z',
			'1:a',
			'2:b',
			'3:c',
		]);

		await click('.drop-middle');
		expect(texts('.indexed-item')).toEqual([
			'0:z',
			'1:b',
			'2:c',
		]);

		await click('.reverse');
		expect(texts('.indexed-item')).toEqual([
			'0:c',
			'1:b',
			'2:z',
		]);
	});

	it('preserves keyed loop component state across reorders and prop updates', async () => {
		await render(ForKeyedStateApp);
		expect(texts('.keyed-row')).toEqual([
			'Alpha:0',
			'Beta:0',
			'Gamma:0',
		]);

		await click('.row-b');
		expect(text('.row-b')).toBe('Beta:1');

		await click('.reverse-keyed');
		expect(texts('.keyed-row')).toEqual([
			'Gamma:0',
			'Beta:1',
			'Alpha:0',
		]);

		await click('.rename-beta');
		expect(text('.row-b')).toBe('Bravo:1');
	});

	it('updates index bindings in keyed for-of loops after reorders', async () => {
		await render(ForIndexKeyedStateApp);
		expect(texts('.indexed-keyed-row')).toEqual([
			'0:Alpha',
			'1:Beta',
			'2:Gamma',
		]);

		await click('.reverse-index-keyed');
		expect(texts('.indexed-keyed-row')).toEqual([
			'0:Gamma',
			'1:Beta',
			'2:Alpha',
		]);
	});

	it('switches rendered branches reactively', async () => {
		await render(SwitchReactiveApp);
		expect(text('.page')).toBe('Home');

		await click('.go-about');
		expect(text('.page')).toBe('About');

		await click('.go-unknown');
		expect(text('.page')).toBe('404');
	});

	it('applies scoped CSS classes', async () => {
		await render(StyledApp);
		expect(container.querySelector('div')!.className).toContain('styled');
	});

	it('catches synchronous child errors', async () => {
		await render(ErrorBoundaryApp);
		await flush();
		expect(text('.caught')).toBe('sync boom');
	});

	it('recovers from error via reset and re-triggers on state change', async () => {
		await render(ErrorToggleApp);
		expect(text('.ok')).toBe('no error');

		await click('.trigger-error');
		expect(text('.caught')).toBe('conditional boom');
		expect(container.querySelector('.ok')).toBeNull();

		await click('.reset');
		expect(text('.ok')).toBe('no error');
		expect(container.querySelector('.caught')).toBeNull();
	});

	it('inner try/catch handles errors without propagating to outer', async () => {
		await render(NestedTryApp);
		await flush();
		expect(text('.inner-caught')).toBe('inner error');
		expect(container.querySelector('.outer-caught')).toBeNull();
		expect(container.querySelector('.outer')).not.toBeNull();
	});

	it('toggles if-else branches inside a try block', async () => {
		await render(IfInsideTryApp);
		expect(text('.branch-a')).toBe('visible');

		await click('.toggle');
		expect(text('.branch-b')).toBe('alternate');
		expect(container.querySelector('.branch-a')).toBeNull();

		await click('.toggle');
		expect(text('.branch-a')).toBe('visible');
	});

	it('adds items in a for-of loop inside a try block', async () => {
		await render(ForInsideTryApp);
		expect(container.querySelectorAll('.try-item').length).toBe(2);

		await click('.add');
		expect(container.querySelectorAll('.try-item').length).toBe(3);
		expect(container.querySelectorAll('.try-item')[2].textContent).toBe('z');
	});

	it('switches branches inside a try block', async () => {
		await render(SwitchInsideTryApp);
		expect(text('.try-page')).toBe('Home');

		await click('.go-about');
		expect(text('.try-page')).toBe('About');

		await click('.go-unknown');
		expect(text('.try-page')).toBe('404');
	});
});
