import type { MockInstance } from 'vitest';
import { createSignal, lazy } from 'solid-js';

const EXPECTED_ERROR_LOG_SNIPPETS = [
	'sync boom',
	'conditional boom',
	'async fail',
	'rejected',
	'inner error',
];

let console_error_spy: MockInstance | undefined;

function is_expected_error_log(args: unknown[]) {
	const message = args.map((arg) => {
		if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
		return String(arg);
	}).join(' ');
	return EXPECTED_ERROR_LOG_SNIPPETS.some((snippet) => message.includes(snippet));
}

// ── Helpers ──

async function click(selector: string) {
	const btn = container.querySelector(selector) as HTMLElement;
	btn.click();
	await flush();
}

function text(selector: string): string | null {
	return container.querySelector(selector)?.textContent ?? null;
}

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

component CallableBlockRuntimeApp() {
	function readDeclaration() {
		const marker = 'decl-outer';
		let selected = marker;

		{
			const marker = 'decl-inner';
			selected = marker;
		}

		return `${selected}/${marker}`;
	}

	const readArrow = () => {
		const base = 10;
		let total = base;

		{
			const base = 32;
			total += base;
		}

		return total;
	};

	class MethodReader {
		read() {
			const marker = 'method-outer';
			let selected = marker;

			{
				const marker = 'method-inner';
				selected = marker;
			}

			return `${selected}/${marker}`;
		}
	}

	const reader = new MethodReader();

	<section class="callable-block-runtime">
		<p class="decl-block">{readDeclaration()}</p>
		<p class="arrow-block">{readArrow()}</p>
		<p class="method-block">{reader.read()}</p>
	</section>
}

// ── Reactive counter (signals) ──

component CounterApp() {
	const [count, setCount] = createSignal(0);
	<p class="count">{count()}</p>
	<button class="inc" onClick={() => setCount(count() + 1)}>{'+'}</button>
}

// ── Refs on elements via {ref expr} assignment sugar ──

let element_ref_captured: HTMLDivElement | null = null;

component ElementRefApp() {
	let el: HTMLDivElement | undefined;
	<div {ref el} class="ref-target">{'ref test'}</div>
	// Solid sets refs synchronously during rendering.
	queueMicrotask(() => {
		element_ref_captured = el ?? null;
	});
}

// ── Ref callback via plain ref={callback} on elements ──

let callback_ref_captured: HTMLDivElement | null = null;

component ElementRefCallbackApp() {
	<div
		ref={(node: HTMLDivElement) => {
			callback_ref_captured = node;
		}}
		class="ref-callback"
	>
		{'ref callback'}
	</div>
}

// ── Ref on composite components via prop forwarding ──

let composite_ref_captured: HTMLInputElement | null = null;

component InputComp(props: { type: string; ref?: (node: HTMLInputElement) => void }) {
	<input type={props.type} ref={props.ref} />
}

component CompositeRefApp() {
	<InputComp
		type="text"
		ref={(node: HTMLInputElement) => {
			composite_ref_captured = node;
		}}
	/>
}

// ── {ref expr} on composite components forwards through `props.ref` ──
// Solid's spread runtime applies `props.ref` automatically when the child
// spreads `{...props}` onto a DOM element, so `{ref fn}` on a composite
// travels down without any explicit plumbing in the child.

let spread_ref_captured: HTMLInputElement | null = null;

component SpreadRefChild(props: { type: string }) {
	<input {...props} />
}

component SpreadRefApp() {
	function onMount(node: HTMLInputElement) {
		spread_ref_captured = node;
	}
	<SpreadRefChild type="text" {ref onMount} />
}

// ── Multiple {ref ...} on the same DOM element ──
// The compiler collects them into `ref={[a, b]}`; Solid's applyRef
// iterates array refs and invokes each with the element.

let multi_dom_a: HTMLInputElement | null = null;
let multi_dom_b: HTMLInputElement | null = null;

component MultiDomRefApp() {
	function refA(node: HTMLInputElement) {
		multi_dom_a = node;
	}
	function refB(node: HTMLInputElement) {
		multi_dom_b = node;
	}
	<input type="text" {ref refA} {ref refB} />
}

// ── Mixing Ripple {ref expr} and TSX-style ref={expr} on the same element ──
// Multiple TSX-style `ref={...}` on one element is a compile error;
// combining a single `ref={...}` with any number of `{ref expr}` is the
// supported way to attach multiple refs.

let mixed_keyword_node: HTMLInputElement | null = null;
let mixed_jsx_node: HTMLInputElement | null = null;

component MixedDomRefApp() {
	function keywordRef(node: HTMLInputElement) {
		mixed_keyword_node = node;
	}
	function jsxRef(node: HTMLInputElement) {
		mixed_jsx_node = node;
	}
	<input type="text" {ref keywordRef} ref={jsxRef} />
}

// ── Multiple {ref ...} on the same composite component ──
// Each ref sees the same underlying DOM node once the child spreads props.

let multi_comp_a: HTMLInputElement | null = null;
let multi_comp_b: HTMLInputElement | null = null;
let multi_comp_c: HTMLInputElement | null = null;

component MultiCompRefApp() {
	function refA(node: HTMLInputElement) {
		multi_comp_a = node;
	}
	function refB(node: HTMLInputElement) {
		multi_comp_b = node;
	}
	function refC(node: HTMLInputElement) {
		multi_comp_c = node;
	}
	<SpreadRefChild type="text" {ref refA} {ref refB} {ref refC} />
}

// ── Deep ref propagation through nested composite components ──

let deep_ref_captured: HTMLInputElement | null = null;

component DeepInner(props: { type: string }) {
	<input {...props} />
}

component DeepOuter(props: { type: string }) {
	<DeepInner {...props} />
}

component DeepRefApp() {
	function onMount(node: HTMLInputElement) {
		deep_ref_captured = node;
	}
	<DeepOuter type="text" {ref onMount} />
}

// ── If-statement with reactivity ──

component IfReactiveApp() {
	const [show, setShow] = createSignal(true);

	if (show()) {
		<span class="visible">{'shown'}</span>
	} else {
		<span class="hidden">{'hidden'}</span>
	}

	<button class="toggle" onClick={() => setShow(!show())}>{'toggle'}</button>
}

// ── For-of loop with reactivity ──

component ForReactiveApp() {
	const [items, setItems] = createSignal(['a', 'b', 'c']);

	for (const item of items(); index i) {
		<li class="item">{item()}</li>
	}

	<button class="add" onClick={() => setItems([...items(), 'd'])}>{'add'}</button>
	<button class="remove" onClick={() => setItems(items().slice(1))}>{'remove'}</button>
}

// ── Switch with reactivity ──

component SwitchReactiveApp() {
	const [page, setPage] = createSignal('home');

	switch (page()) {
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

	<button class="go-about" onClick={() => setPage('about')}>{'about'}</button>
	<button class="go-unknown" onClick={() => setPage('other')}>{'other'}</button>
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

// ── If-statement children through composite ──

component IfChildrenApp() {
	const [show, setShow] = createSignal(false);

	<Wrapper>
		if (show()) {
			<span class="inner-visible">{'inner shown'}</span>
		}
	</Wrapper>

	<button class="toggle" onClick={() => setShow(!show())}>{'toggle'}</button>
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

// ── Try/catch: synchronous error boundary ──

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

// ── Try/catch with reset: recover from error ──

component MaybeThrow(props: { shouldThrow: boolean }) {
	if (props.shouldThrow) {
		throw new Error('conditional boom');
	}
	<p class="ok">{'no error'}</p>
}

component ErrorToggleApp() {
	const [fail, setFail] = createSignal(false);

	try {
		<MaybeThrow shouldThrow={fail()} />
	} catch (err, reset) {
		<p class="caught">{(err as Error).message}</p>
		<button
			class="reset"
			onClick={() => {
				setFail(false);
				reset();
			}}
		>
			{'reset'}
		</button>
	}

	<button class="trigger-error" onClick={() => setFail(true)}>{'break'}</button>
}

// ── Try/pending: Loading boundary with lazy() ──

component ResolvedChild(props: { value: string }) {
	<p class="resolved">{props.value}</p>
}

component SuspenseApp(props: { loader: () => Promise<{ default: typeof ResolvedChild }> }) {
	const LazyChild = lazy(props.loader);

	try {
		<LazyChild value="hello" />
	} pending {
		<p class="pending">{'loading...'}</p>
	}
}

// ── Try/pending/catch: Loading + Errored ──

component SuspenseErrorApp(props: { loader: () => Promise<{ default: typeof ResolvedChild }> }) {
	const LazyChild = lazy(props.loader);

	try {
		<LazyChild value="hello" />
	} pending {
		<p class="pending">{'loading...'}</p>
	} catch (err) {
		<p class="caught">{(err as Error).message}</p>
	}
}

// ── Nested try: inner catch handles inner error ──

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

// ── If inside try body ──

component IfInsideTryApp() {
	const [show, setShow] = createSignal(true);

	try {
		if (show()) {
			<p class="branch-a">{'visible'}</p>
		} else {
			<p class="branch-b">{'alternate'}</p>
		}
	} catch (err) {
		<p class="caught">{'error'}</p>
	}

	<button class="toggle" onClick={() => setShow(!show())}>{'toggle'}</button>
}

// ── For-of inside try body ──

component ForInsideTryApp() {
	const [items, setItems] = createSignal(['x', 'y']);

	try {
		for (const item of items(); index i) {
			<span class="try-item">{item()}</span>
		}
	} catch (err) {
		<p class="caught">{'error'}</p>
	}

	<button class="add" onClick={() => setItems([...items(), 'z'])}>{'add'}</button>
}

// ── Signal inside if-branch ──

component SignalInIfApp() {
	const [show, setShow] = createSignal(true);

	if (show()) {
		const [count, setCount] = createSignal(0);
		<p class="sig-if-count">{count()}</p>
		<button class="sig-if-inc" onClick={() => setCount(count() + 1)}>{'inc'}</button>
	} else {
		<p class="sig-if-hidden">{'hidden'}</p>
	}

	<button class="sig-if-toggle" onClick={() => setShow(!show())}>{'toggle'}</button>
}

// ── Signal inside both if-else branches ──

component SignalInBothBranchesApp() {
	const [mode, setMode] = createSignal('a');

	if (mode() === 'a') {
		const [x, setX] = createSignal(10);
		<p class="branch-val">{x()}</p>
		<button class="branch-inc" onClick={() => setX(x() + 1)}>{'inc'}</button>
	} else {
		const [y, setY] = createSignal(20);
		<p class="branch-val">{y()}</p>
		<button class="branch-inc" onClick={() => setY(y() + 1)}>{'inc'}</button>
	}

	<button class="branch-toggle" onClick={() => setMode(mode() === 'a' ? 'b' : 'a')}>
		{'toggle'}
	</button>
}

// ── Signal inside if closing over parent scope ──

component SignalClosingOverScopeApp() {
	const [multiplier, setMultiplier] = createSignal(2);

	if (multiplier() > 0) {
		const [base, setBase] = createSignal(5);
		<p class="scope-result">{base() * multiplier()}</p>
		<button class="scope-inc-base" onClick={() => setBase(base() + 1)}>{'inc base'}</button>
	}

	<button class="scope-inc-mult" onClick={() => setMultiplier(multiplier() + 1)}>
		{'inc multiplier'}
	</button>
}

// ── Signal inside for-of loop body ──
// NOTE: Solid's <For> passes each item as an accessor (`() => T`) rather than
// a plain value, so branch-local uses of `item` outside JSX reactive positions
// must call `item()` explicitly. This differs from the React runtime tests.

component SignalInForApp() {
	const [items, setItems] = createSignal(['a', 'b']);

	for (const item of items(); index i) {
		const item_value = (item as unknown as () => string)();
		const [clicked, setClicked] = createSignal(false);
		<div class="sig-for-item">
			<span>{item_value + (clicked() ? '!' : '')}</span>
			<button class={'sig-for-click-' + item_value} onClick={() => setClicked(true)}>
				{'click'}
			</button>
		</div>
	}

	<button class="sig-for-add" onClick={() => setItems([...items(), 'c'])}>{'add'}</button>
}

// ── Signal inside switch case ──

component SignalInSwitchApp() {
	const [page, setPage] = createSignal('home');

	switch (page()) {
		case 'home':
			const [homeCount, setHomeCount] = createSignal(0);
			<p class="sig-switch-val">{homeCount()}</p>
			<button class="sig-switch-inc" onClick={() => setHomeCount(homeCount() + 1)}>{'inc'}</button>
			break;
		case 'about':
			<p class="sig-switch-val">{'about page'}</p>
			break;
	}

	<button class="sig-switch-go" onClick={() => setPage('about')}>{'about'}</button>
}

// ── Early return before signals with parent scope ──

component EarlyReturnWithSignalsApp() {
	const [count, setCount] = createSignal(0);
	const [skip, setSkip] = createSignal(false);

	if (skip()) {
		return;
	}

	const [doubled, setDoubled] = createSignal(0);

	<p class="early-count">{count()}</p>
	<p class="early-doubled">{doubled()}</p>
	<button
		class="early-inc"
		onClick={() => {
			setCount(count() + 1);
			setDoubled((count() + 1) * 2);
		}}
	>
		{'inc'}
	</button>
	<button class="early-skip" onClick={() => setSkip(true)}>{'skip'}</button>
}

// ── Static structure inside control flow ──

component StaticInBranchApp() {
	const [show, setShow] = createSignal(true);

	if (show()) {
		<div class="branch-static">
			<span>{'Always the same'}</span>
		</div>
	}

	<button class="static-toggle" onClick={() => setShow(!show())}>{'toggle'}</button>
}

// ── Mixed static + dynamic siblings ──

component MixedStaticDynamicApp() {
	const [count, setCount] = createSignal(0);

	<header class="static-header">
		<h1>{'Static Title'}</h1>
	</header>
	<p class="dynamic-count">{count()}</p>
	<footer class="static-footer">{'Static Footer'}</footer>

	<button class="mixed-inc" onClick={() => setCount(count() + 1)}>{'inc'}</button>
}

// ── Fully static component ──

component FullyStaticApp() {
	<div class="all-static">
		<h2>{'Title'}</h2>
		<p>{'Paragraph'}</p>
	</div>
}

// ── Mid-template locals + interleaved statements inside element children ──
// `.tsrx` lets you declare locals and run plain statements between JSX
// children. The Solid transform wraps the block in an IIFE so the statements
// execute as JS during render, their locals stay scoped to the enclosing
// element, and no source code leaks through as literal text.

const mid_template_log: string[] = [];

component MidTemplateLocalsApp() {
	<div class="mid-template-shell">
		const [count, setCount] = createSignal(0);

		for (const item of ['a', 'b']; index i) {
			<span class="mid-template-item">{item()}</span>
		}

		<p class="mid-template-count">{count()}</p>
		<button class="mid-template-inc" onClick={() => setCount(count() + 1)}>{'inc'}</button>

		<div class="mid-template-side">
			mid_template_log.push('ran');
		</div>
	</div>
}

// ── Lazy destructuring: object in props ──

component LazyPropsChild(&{ name, age }: { name: string; age: number }) {
	<div class="lazy-props">
		{name}
		{' is '}
		{age}
	</div>
}

component LazyPropsApp() {
	<LazyPropsChild name="Alice" age={30} />
}

// ── Lazy destructuring: array in variable (signals) ──

component LazyArrayApp() {
	const [count, setCount] = createSignal(0);
	<p class="lazy-count">{count()}</p>
	<button class="lazy-inc" onClick={() => setCount(count() + 1)}>{'+'}</button>
}

// ── Lazy destructuring: object in variable ──

component LazyObjVarApp() {
	const &{ x, y } = usePosition();
	<p class="lazy-pos">
		{x}
		{','}
		{y}
	</p>
}

function usePosition() {
	return { x: 10, y: 20 };
}

// ── Lazy destructuring: combined props + variable ──

component LazyCombinedApp(&{ label }: { label: string }) {
	const [count, setCount] = createSignal(0);
	<p class="lazy-combined">
		{label}
		{': '}
		{count()}
	</p>
	<button class="lazy-combined-inc" onClick={() => setCount(count() + 1)}>{'+'}</button>
}

// ── Tests ──

describe('tsrx-solid runtime', () => {
	beforeEach(() => {
		const original_console_error = console.error;
		console_error_spy = vi.spyOn(console, 'error').mockImplementation((...args) => {
			if (is_expected_error_log(args)) return;
			original_console_error(...args);
		});
	});

	afterEach(() => {
		console_error_spy?.mockRestore();
		console_error_spy = undefined;
	});

	// ── Basic rendering ──

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

	it('runs nested JavaScript blocks inside component-local callables', async () => {
		await render(CallableBlockRuntimeApp);
		expect(text('.decl-block')).toBe('decl-inner/decl-outer');
		expect(text('.arrow-block')).toBe('42');
		expect(text('.method-block')).toBe('method-inner/method-outer');
	});

	// ── Reactivity ──

	it('increments a counter on click (createSignal)', async () => {
		await render(CounterApp);
		expect(text('.count')).toBe('0');
		await click('.inc');
		expect(text('.count')).toBe('1');
		await click('.inc');
		expect(text('.count')).toBe('2');
	});

	// ── Refs ──

	it('supports {ref el} assignment sugar on elements', async () => {
		element_ref_captured = null;
		await render(ElementRefApp);
		await flush();
		expect(element_ref_captured).toBeInstanceOf(HTMLDivElement);
		expect(element_ref_captured!.textContent).toBe('ref test');
		expect(element_ref_captured!.className).toBe('ref-target');
	});

	it('supports ref={callback} on elements', async () => {
		callback_ref_captured = null;
		await render(ElementRefCallbackApp);
		expect(callback_ref_captured).toBeInstanceOf(HTMLDivElement);
		expect(callback_ref_captured!.textContent).toBe('ref callback');
	});

	it('supports ref on composite components via prop forwarding', async () => {
		composite_ref_captured = null;
		await render(CompositeRefApp);
		expect(composite_ref_captured).toBeInstanceOf(HTMLInputElement);
		expect(composite_ref_captured!.type).toBe('text');
	});

	it(
		'{ref expr} on a composite component forwards through {...props} to the DOM element',
		async () => {
			spread_ref_captured = null;
			await render(SpreadRefApp);
			expect(spread_ref_captured).toBeInstanceOf(HTMLInputElement);
			expect(spread_ref_captured!.type).toBe('text');
		},
	);

	it('supports multiple {ref ...} on the same DOM element', async () => {
		multi_dom_a = null;
		multi_dom_b = null;
		await render(MultiDomRefApp);
		expect(multi_dom_a).toBeInstanceOf(HTMLInputElement);
		expect(multi_dom_b).toBeInstanceOf(HTMLInputElement);
		expect(multi_dom_a).toBe(multi_dom_b);
	});

	it('mixes Ripple {ref expr} and TSX-style ref={expr} on the same DOM element', async () => {
		mixed_keyword_node = null;
		mixed_jsx_node = null;
		await render(MixedDomRefApp);
		expect(mixed_keyword_node).toBeInstanceOf(HTMLInputElement);
		expect(mixed_keyword_node).toBe(mixed_jsx_node);
	});

	it('supports multiple {ref ...} on the same composite component', async () => {
		multi_comp_a = null;
		multi_comp_b = null;
		multi_comp_c = null;
		await render(MultiCompRefApp);
		expect(multi_comp_a).toBeInstanceOf(HTMLInputElement);
		expect(multi_comp_b).toBeInstanceOf(HTMLInputElement);
		expect(multi_comp_c).toBeInstanceOf(HTMLInputElement);
		expect(multi_comp_a).toBe(multi_comp_b);
		expect(multi_comp_b).toBe(multi_comp_c);
	});

	it('{ref expr} propagates through nested composite components', async () => {
		deep_ref_captured = null;
		await render(DeepRefApp);
		expect(deep_ref_captured).toBeInstanceOf(HTMLInputElement);
		expect(deep_ref_captured!.type).toBe('text');
	});

	// ── Reactive control flow: if ──

	it('toggles if-else branches on signal change (<Show>)', async () => {
		await render(IfReactiveApp);
		expect(text('.visible')).toBe('shown');
		expect(container.querySelector('.hidden')).toBeNull();

		await click('.toggle');
		expect(container.querySelector('.visible')).toBeNull();
		expect(text('.hidden')).toBe('hidden');

		await click('.toggle');
		expect(text('.visible')).toBe('shown');
	});

	// ── Reactive control flow: for-of ──

	it('adds and removes items in a for-of loop (<For>)', async () => {
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

	// ── Reactive control flow: switch ──

	it('switches rendered branch on signal change (<Switch>/<Match>)', async () => {
		await render(SwitchReactiveApp);
		expect(text('.page')).toBe('Home');

		await click('.go-about');
		expect(text('.page')).toBe('About');

		await click('.go-unknown');
		expect(text('.page')).toBe('404');
	});

	// ── Composite children ──

	it('passes children through composite components', async () => {
		await render(ChildrenApp);
		expect(container.querySelector('.wrapper span')!.textContent).toBe('inside wrapper');
	});

	it('toggles if-statement children inside composite components', async () => {
		await render(IfChildrenApp);
		expect(container.querySelector('.inner-visible')).toBeNull();

		await click('.toggle');
		expect(text('.inner-visible')).toBe('inner shown');

		await click('.toggle');
		expect(container.querySelector('.inner-visible')).toBeNull();
	});

	// ── Scoped CSS ──

	it('applies scoped CSS class', async () => {
		await render(StyledApp);
		expect(container.querySelector('div')!.className).toContain('styled');
	});

	// ── Try/catch: error boundary ──

	it('catches synchronous child errors (<Errored>)', async () => {
		await render(ErrorBoundaryApp);
		expect(text('.caught')).toBe('sync boom');
	});

	it('recovers from error via reset and re-triggers on signal change', async () => {
		await render(ErrorToggleApp);
		expect(text('.ok')).toBe('no error');

		await click('.trigger-error');
		expect(text('.caught')).toBe('conditional boom');
		expect(container.querySelector('.ok')).toBeNull();

		await click('.reset');
		expect(text('.ok')).toBe('no error');
		expect(container.querySelector('.caught')).toBeNull();
	});

	// ── Try/pending: Loading ──

	it('shows pending fallback then resolves (<Loading> + lazy)', async () => {
		let resolve_fn: (mod: { default: typeof ResolvedChild }) => void;
		const loader = () => new Promise<{ default: typeof ResolvedChild }>((r) => {
			resolve_fn = r;
		});

		await render(SuspenseApp, { loader });
		expect(text('.pending')).toBe('loading...');
		expect(container.querySelector('.resolved')).toBeNull();

		resolve_fn!({ default: ResolvedChild });
		await flush();
		await flush();
		expect(text('.resolved')).toBe('hello');
		expect(container.querySelector('.pending')).toBeNull();
	});

	// ── Try/pending/catch: Loading + Errored ──

	it('shows pending then catches rejected promise (<Errored>)', async () => {
		let reject_fn: (error: Error) => void;
		const loader = () => {
			const p = new Promise<{ default: typeof ResolvedChild }>((_, r) => {
				reject_fn = r;
			});
			// Attach a no-op catch so the rejection isn't reported as unhandled
			// before Solid's lazy() observes it.
			p.catch(() => {});
			return p;
		};

		await render(SuspenseErrorApp, { loader });
		expect(text('.pending')).toBe('loading...');

		reject_fn!(new Error('async fail'));
		await flush();
		await flush();
		expect(text('.caught')).toBe('async fail');
		expect(container.querySelector('.pending')).toBeNull();
		expect(container.querySelector('.resolved')).toBeNull();
	});

	it('resolves successfully through Loading + Errored', async () => {
		let resolve_fn: (mod: { default: typeof ResolvedChild }) => void;
		const loader = () => new Promise<{ default: typeof ResolvedChild }>((r) => {
			resolve_fn = r;
		});

		await render(SuspenseErrorApp, { loader });
		expect(text('.pending')).toBe('loading...');

		resolve_fn!({ default: ResolvedChild });
		await flush();
		await flush();
		expect(text('.resolved')).toBe('hello');
		expect(container.querySelector('.pending')).toBeNull();
		expect(container.querySelector('.caught')).toBeNull();
	});

	// ── Nested try blocks ──

	it('inner try/catch handles errors without propagating to outer', async () => {
		await render(NestedTryApp);
		expect(text('.inner-caught')).toBe('inner error');
		expect(container.querySelector('.outer-caught')).toBeNull();
		expect(container.querySelector('.outer')).not.toBeNull();
	});

	// ── Control flow inside try bodies ──

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

	// ── Signals inside control flow ──

	it('supports createSignal inside an if-branch', async () => {
		await render(SignalInIfApp);
		expect(text('.sig-if-count')).toBe('0');

		await click('.sig-if-inc');
		expect(text('.sig-if-count')).toBe('1');

		await click('.sig-if-toggle');
		expect(text('.sig-if-hidden')).toBe('hidden');
		expect(container.querySelector('.sig-if-count')).toBeNull();
	});

	it('supports createSignal inside a for-of loop body', async () => {
		await render(SignalInForApp);
		const items = container.querySelectorAll('.sig-for-item');
		expect(items.length).toBe(2);

		await click('.sig-for-click-a');
		expect(container.querySelector('.sig-for-item span')!.textContent).toBe('a!');
	});

	it('supports createSignal inside a switch case', async () => {
		await render(SignalInSwitchApp);
		expect(text('.sig-switch-val')).toBe('0');

		await click('.sig-switch-inc');
		expect(text('.sig-switch-val')).toBe('1');

		await click('.sig-switch-go');
		expect(text('.sig-switch-val')).toBe('about page');
	});

	it('supports signals in both if-else branches independently', async () => {
		await render(SignalInBothBranchesApp);
		expect(text('.branch-val')).toBe('10');

		await click('.branch-inc');
		expect(text('.branch-val')).toBe('11');

		await click('.branch-toggle');
		expect(text('.branch-val')).toBe('20');

		await click('.branch-inc');
		expect(text('.branch-val')).toBe('21');
	});

	// ── Signals closing over parent scope ──

	it('signal in if-branch correctly closes over parent scope variables', async () => {
		await render(SignalClosingOverScopeApp);
		// base=5, multiplier=2 → 10
		expect(text('.scope-result')).toBe('10');

		await click('.scope-inc-base');
		// base=6, multiplier=2 → 12
		expect(text('.scope-result')).toBe('12');

		await click('.scope-inc-mult');
		// base=6, multiplier=3 → 18
		expect(text('.scope-result')).toBe('18');
	});

	it('early return before signals passes scope correctly to continuation', async () => {
		await render(EarlyReturnWithSignalsApp);
		expect(text('.early-count')).toBe('0');
		expect(text('.early-doubled')).toBe('0');

		await click('.early-inc');
		expect(text('.early-count')).toBe('1');
		expect(text('.early-doubled')).toBe('2');

		await click('.early-skip');
		expect(container.querySelector('.early-count')).toBeNull();
		expect(container.querySelector('.early-doubled')).toBeNull();
	});

	// ── Static structure ──

	it('renders static elements inside control flow branches', async () => {
		await render(StaticInBranchApp);
		expect(text('.branch-static span')).toBe('Always the same');

		await click('.static-toggle');
		expect(container.querySelector('.branch-static')).toBeNull();

		await click('.static-toggle');
		expect(text('.branch-static span')).toBe('Always the same');
	});

	it('renders mixed static and dynamic siblings correctly', async () => {
		await render(MixedStaticDynamicApp);
		expect(text('.static-header h1')).toBe('Static Title');
		expect(text('.dynamic-count')).toBe('0');
		expect(text('.static-footer')).toBe('Static Footer');

		await click('.mixed-inc');
		expect(text('.dynamic-count')).toBe('1');
		expect(text('.static-header h1')).toBe('Static Title');
		expect(text('.static-footer')).toBe('Static Footer');
	});

	it('renders a fully static component correctly', async () => {
		await render(FullyStaticApp);
		expect(text('.all-static h2')).toBe('Title');
		expect(text('.all-static p')).toBe('Paragraph');
	});

	// ── Mid-template locals + interleaved statements ──

	it('executes mid-template statements and keeps locals scoped to the element', async () => {
		mid_template_log.length = 0;
		await render(MidTemplateLocalsApp);

		// The inner <div> body is a pure statement (`mid_template_log.push('ran')`).
		// If the transform emitted it as a JSX text child the source code would
		// render as literal text; the IIFE wrapping lets the side effect fire
		// and leaves the element visually empty.
		expect(mid_template_log).toEqual(['ran']);
		expect(container.querySelector('.mid-template-side')!.textContent).toBe('');

		// Siblings around the local declaration render normally.
		const items = container.querySelectorAll('.mid-template-item');
		expect(items.length).toBe(2);
		expect(items[0].textContent).toBe('a');
		expect(items[1].textContent).toBe('b');

		// The locally-declared signal stays reactive across clicks — declared
		// mid-template yet closed over by sibling JSX in the same IIFE scope.
		expect(text('.mid-template-count')).toBe('0');
		await click('.mid-template-inc');
		expect(text('.mid-template-count')).toBe('1');
		await click('.mid-template-inc');
		expect(text('.mid-template-count')).toBe('2');

		// Re-rendering shouldn't duplicate the side-effect — the IIFE runs
		// once during setup, not on every reactive update.
		expect(mid_template_log).toEqual(['ran']);
	});

	// ── Lazy destructuring ──

	it('lazy object destructuring in props works at runtime', async () => {
		await render(LazyPropsApp);
		expect(text('.lazy-props')).toBe('Alice is 30');
	});

	it('lazy array destructuring in variables works at runtime (signals)', async () => {
		await render(LazyArrayApp);
		expect(text('.lazy-count')).toBe('0');

		await click('.lazy-inc');
		expect(text('.lazy-count')).toBe('1');

		await click('.lazy-inc');
		expect(text('.lazy-count')).toBe('2');
	});

	it('lazy object destructuring in variables works at runtime', async () => {
		await render(LazyObjVarApp);
		expect(text('.lazy-pos')).toBe('10,20');
	});

	it('combined lazy props and lazy variables work at runtime', async () => {
		await render(LazyCombinedApp, { label: 'Count' });
		expect(text('.lazy-combined')).toBe('Count: 0');

		await click('.lazy-combined-inc');
		expect(text('.lazy-combined')).toBe('Count: 1');
	});
});
