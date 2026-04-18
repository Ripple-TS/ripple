import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useState, use } from 'react';

const EXPECTED_ERROR_LOG_SNIPPETS = [
	'sync boom',
	'conditional boom',
	'async fail',
	'rejected',
	'inner error',
	'The above error occurred in the <',
	'React will try to recreate this component tree from scratch using the error boundary you provided',
];

/** @type {import('vitest').MockInstance | undefined} */
let console_error_spy;

function is_expected_error_log(args: unknown[]) {
	const message = args.map((arg) => {
		if (arg instanceof Error) {
			return `${arg.name}: ${arg.message}`;
		}
		return String(arg);
	}).join(' ');

	return EXPECTED_ERROR_LOG_SNIPPETS.some((snippet) => message.includes(snippet));
}

// ── Helpers ──

async function click(selector: string) {
	const btn = container.querySelector(selector) as HTMLElement;
	await act(async () => btn.click());
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

// ── Reactive counter ──

component CounterApp() {
	const [count, setCount] = useState(0);
	<p class="count">{count}</p>
	<button class="inc" onClick={() => setCount(count + 1)}>{'+'}</button>
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

component InputComp(props: { type: string; ref?: (node: HTMLInputElement) => void }) {
	<input type={props.type} ref={props.ref} />
}

component CompositeRefApp() {
	<InputComp
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

// ── If-statement with reactivity ──

component IfReactiveApp() {
	const [show, setShow] = useState(true);

	if (show) {
		<span class="visible">{'shown'}</span>
	} else {
		<span class="hidden">{'hidden'}</span>
	}

	<button class="toggle" onClick={() => setShow(!show)}>{'toggle'}</button>
}

// ── For-of loop with reactivity ──

component ForReactiveApp() {
	const [items, setItems] = useState(['a', 'b', 'c']);

	for (const item of items) {
		<li class="item" key={item}>{item}</li>
	}

	<button class="add" onClick={() => setItems([...items, 'd'])}>{'add'}</button>
	<button class="remove" onClick={() => setItems(items.slice(1))}>{'remove'}</button>
}

// ── Switch with reactivity ──

component SwitchReactiveApp() {
	const [page, setPage] = useState('home');

	switch (page) {
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
	const [show, setShow] = useState(false);

	<Wrapper>
		if (show) {
			<span class="inner-visible">{'inner shown'}</span>
		}
	</Wrapper>

	<button class="toggle" onClick={() => setShow(!show)}>{'toggle'}</button>
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

// ── Try/catch with reactive toggle into/out of error ──

component MaybeThrow(props: { shouldThrow: boolean }) {
	if (props.shouldThrow) {
		throw new Error('conditional boom');
	}
	<p class="ok">{'no error'}</p>
}

component ErrorToggleApp() {
	const [fail, setFail] = useState(false);

	try {
		<MaybeThrow shouldThrow={fail} />
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

// ── Try/pending: Suspense with use() ──

component AsyncChild(props: { promise: Promise<string> }) {
	const data = use(props.promise);
	<p class="resolved">{data}</p>
}

component SuspenseApp(props: { promise: Promise<string> }) {
	try {
		<AsyncChild promise={props.promise} />
	} pending {
		<p class="pending">{'loading...'}</p>
	}
}

// ── Try/pending/catch: Suspense + ErrorBoundary ──

component SuspenseErrorApp(props: { promise: Promise<string> }) {
	try {
		<AsyncChild promise={props.promise} />
	} pending {
		<p class="pending">{'loading...'}</p>
	} catch (err) {
		<p class="caught">{(err as Error).message}</p>
	}
}

// ── Try/catch with reset: recover from error ──

component ErrorResetApp(props: { promise: Promise<string> }) {
	try {
		<AsyncChild promise={props.promise} />
	} pending {
		<p class="pending">{'loading...'}</p>
	} catch (err, reset) {
		<p class="caught">{(err as Error).message}</p>
		<button class="retry" onClick={() => reset()}>{'retry'}</button>
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

// ── Try/pending with reactive promise swap ──

component SwappableAsyncApp() {
	const [promise, setPromise] = useState(() => Promise.resolve('first'));

	try {
		<AsyncChild {promise} />
	} pending {
		<p class="pending">{'loading...'}</p>
	}

	<button class="swap" onClick={() => setPromise(Promise.resolve('second'))}>{'swap'}</button>
}

// ── If inside try body ──

component IfInsideTryApp() {
	const [show, setShow] = useState(true);

	try {
		if (show) {
			<p class="branch-a">{'visible'}</p>
		} else {
			<p class="branch-b">{'alternate'}</p>
		}
	} catch (err) {
		<p class="caught">{'error'}</p>
	}

	<button class="toggle" onClick={() => setShow(!show)}>{'toggle'}</button>
}

// ── For-of inside try body ──

component ForInsideTryApp() {
	const [items, setItems] = useState(['x', 'y']);

	try {
		for (const item of items) {
			<span class="try-item" key={item}>{item}</span>
		}
	} catch (err) {
		<p class="caught">{'error'}</p>
	}

	<button class="add" onClick={() => setItems([...items, 'z'])}>{'add'}</button>
}

// ── Hook inside if-branch ──

component HookInIfApp() {
	const [show, setShow] = useState(true);

	if (show) {
		const [count, setCount] = useState(0);
		<p class="hook-if-count">{count}</p>
		<button class="hook-if-inc" onClick={() => setCount(count + 1)}>{'inc'}</button>
	} else {
		<p class="hook-if-hidden">{'hidden'}</p>
	}

	<button class="hook-if-toggle" onClick={() => setShow(!show)}>{'toggle'}</button>
}

// ── Hook inside for-of loop ──

component HookInForApp() {
	const [items, setItems] = useState(['a', 'b']);

	for (const item of items) {
		const [clicked, setClicked] = useState(false);
		<div class="hook-for-item" key={item}>
			<span>
				{item}
				{clicked ? '!' : ''}
			</span>
			<button class={'hook-for-click-' + item} onClick={() => setClicked(true)}>{'click'}</button>
		</div>
	}

	<button class="hook-for-add" onClick={() => setItems([...items, 'c'])}>{'add'}</button>
}

// ── Hook inside switch case ──

component HookInSwitchApp() {
	const [page, setPage] = useState('home');

	switch (page) {
		case 'home':
			const [homeCount, setHomeCount] = useState(0);
			<p class="hook-switch-val">{homeCount}</p>
			<button class="hook-switch-inc" onClick={() => setHomeCount(homeCount + 1)}>{'inc'}</button>
			break;
		case 'about':
			<p class="hook-switch-val">{'about page'}</p>
			break;
	}

	<button class="hook-switch-go" onClick={() => setPage('about')}>{'about'}</button>
}

// ── Hook inside if-else both branches ──

component HookInBothBranchesApp() {
	const [mode, setMode] = useState('a');

	if (mode === 'a') {
		const [x, setX] = useState(10);
		<p class="branch-val">{x}</p>
		<button class="branch-inc" onClick={() => setX(x + 1)}>{'inc'}</button>
	} else {
		const [y, setY] = useState(20);
		<p class="branch-val">{y}</p>
		<button class="branch-inc" onClick={() => setY(y + 1)}>{'inc'}</button>
	}

	<button class="branch-toggle" onClick={() => setMode(mode === 'a' ? 'b' : 'a')}>
		{'toggle'}
	</button>
}

// ── Tests ──

describe('tsrx-react runtime', () => {
	beforeEach(() => {
		const original_console_error = console.error;
		console_error_spy = vi.spyOn(console, 'error').mockImplementation((...args) => {
			if (is_expected_error_log(args)) {
				return;
			}

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

	// ── Reactivity with useState ──

	it('increments a counter on click', async () => {
		await render(CounterApp);
		expect(text('.count')).toBe('0');
		await click('.inc');
		expect(text('.count')).toBe('1');
		await click('.inc');
		expect(text('.count')).toBe('2');
	});

	// ── Refs ──

	it('supports ref callback on elements', async () => {
		element_ref_captured = null;
		await render(ElementRefApp);
		expect(element_ref_captured).toBeInstanceOf(HTMLDivElement);
		expect(element_ref_captured!.textContent).toBe('ref test');
		expect(element_ref_captured!.className).toBe('ref-target');
	});

	it('supports ref on composite components via prop forwarding', async () => {
		composite_ref_captured = null;
		await render(CompositeRefApp);
		expect(composite_ref_captured).toBeInstanceOf(HTMLInputElement);
		expect(composite_ref_captured!.type).toBe('text');
	});

	it('supports multiple ref callbacks on the same element', async () => {
		multi_ref1_node = null;
		multi_ref2_node = null;
		await render(MultiRefApp);
		expect(multi_ref1_node).toBe(multi_ref2_node);
		expect(multi_ref1_node!.textContent).toBe('multi ref');
	});

	it('supports ref forwarding through spread props', async () => {
		spread_ref_captured = null;
		await render(SpreadRefApp);
		expect(spread_ref_captured).toBeInstanceOf(HTMLInputElement);
		expect(spread_ref_captured!.id).toBe('spread-input');
	});

	// ── Reactive control flow: if ──

	it('toggles if-else branches on state change', async () => {
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

	it('adds and removes items in a for-of loop', async () => {
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

	it('switches rendered branch on state change', async () => {
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

	it('catches synchronous child errors', async () => {
		await render(ErrorBoundaryApp);
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

	// ── Try/pending: Suspense with use() ──

	it('shows pending fallback then resolves with use()', async () => {
		let resolve_fn: (value: string) => void;
		const promise = new Promise<string>((r) => {
			resolve_fn = r;
		});

		await render(SuspenseApp, { promise });
		expect(text('.pending')).toBe('loading...');
		expect(container.querySelector('.resolved')).toBeNull();

		await act(async () => {
			resolve_fn('hello');
		});
		expect(text('.resolved')).toBe('hello');
		expect(container.querySelector('.pending')).toBeNull();
	});

	// ── Try/pending/catch: Suspense + ErrorBoundary ──

	it('shows pending then catches rejected promise', async () => {
		let reject_fn: (error: Error) => void;
		const promise = new Promise<string>((_, r) => {
			reject_fn = r;
		});

		await render(SuspenseErrorApp, { promise });
		expect(text('.pending')).toBe('loading...');

		await act(async () => {
			reject_fn(new Error('async fail'));
		});
		expect(text('.caught')).toBe('async fail');
		expect(container.querySelector('.pending')).toBeNull();
		expect(container.querySelector('.resolved')).toBeNull();
	});

	it('resolves successfully through Suspense + ErrorBoundary', async () => {
		let resolve_fn: (value: string) => void;
		const promise = new Promise<string>((r) => {
			resolve_fn = r;
		});

		await render(SuspenseErrorApp, { promise });
		expect(text('.pending')).toBe('loading...');

		await act(async () => {
			resolve_fn('success');
		});
		expect(text('.resolved')).toBe('success');
		expect(container.querySelector('.pending')).toBeNull();
		expect(container.querySelector('.caught')).toBeNull();
	});

	// ── Try/catch with reset ──

	it('catches rejected promise and provides reset', async () => {
		let reject_fn: (error: Error) => void;
		const promise = new Promise<string>((_, r) => {
			reject_fn = r;
		});

		await render(ErrorResetApp, { promise });
		expect(text('.pending')).toBe('loading...');

		await act(async () => {
			reject_fn(new Error('rejected'));
		});
		expect(text('.caught')).toBe('rejected');
		expect(container.querySelector('.retry')).not.toBeNull();
	});

	// ── Nested try blocks ──

	it('inner try/catch handles errors without propagating to outer', async () => {
		await render(NestedTryApp);
		expect(text('.inner-caught')).toBe('inner error');
		expect(container.querySelector('.outer-caught')).toBeNull();
		expect(container.querySelector('.outer')).not.toBeNull();
	});

	// ── Reactive promise swap under Suspense ──

	it('swaps resolved content when promise changes', async () => {
		await render(SwappableAsyncApp);
		// First promise resolves immediately
		await act(async () => {});
		expect(text('.resolved')).toBe('first');

		await click('.swap');
		await act(async () => {});
		expect(text('.resolved')).toBe('second');
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

	// ── Hooks inside control flow ──

	it('supports useState inside an if-branch', async () => {
		await render(HookInIfApp);
		expect(text('.hook-if-count')).toBe('0');

		await click('.hook-if-inc');
		expect(text('.hook-if-count')).toBe('1');

		await click('.hook-if-toggle');
		expect(text('.hook-if-hidden')).toBe('hidden');
		expect(container.querySelector('.hook-if-count')).toBeNull();
	});

	it('supports useState inside a for-of loop body', async () => {
		await render(HookInForApp);
		const items = container.querySelectorAll('.hook-for-item');
		expect(items.length).toBe(2);

		await click('.hook-for-click-a');
		expect(container.querySelector('.hook-for-item span')!.textContent).toBe('a!');
	});

	it('supports useState inside a switch case', async () => {
		await render(HookInSwitchApp);
		expect(text('.hook-switch-val')).toBe('0');

		await click('.hook-switch-inc');
		expect(text('.hook-switch-val')).toBe('1');

		await click('.hook-switch-go');
		expect(text('.hook-switch-val')).toBe('about page');
	});

	it('supports hooks in both if-else branches independently', async () => {
		await render(HookInBothBranchesApp);
		expect(text('.branch-val')).toBe('10');

		await click('.branch-inc');
		expect(text('.branch-val')).toBe('11');

		await click('.branch-toggle');
		expect(text('.branch-val')).toBe('20');

		await click('.branch-inc');
		expect(text('.branch-val')).toBe('21');
	});
});
