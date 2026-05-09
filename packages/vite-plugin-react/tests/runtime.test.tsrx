import type { MockInstance } from 'vitest';
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

let console_error_spy: MockInstance | undefined;

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

component DirectQuotedTextApp() {
	<div class="direct-quoted-entities">"Rock &amp; &quot;Roll&quot;"</div>
	<div class="direct-quoted-backslash">"line\nbreak"</div>
	<pre class="direct-quoted-multiline">"first
second"</pre>
}

component DirectQuotedTextIfElseTrueApp() {
	if (true) {
		"Hello Ripple"
	} else "Hello React"
}

component DirectQuotedTextIfElseFalseApp() {
	if (false) {
		"Hello Ripple"
	} else "Hello React"
}

component DirectQuotedTextIfElseApp() {
	<div class="direct-quoted-if-then">
		<DirectQuotedTextIfElseTrueApp />
	</div>
	<div class="direct-quoted-if-else">
		<DirectQuotedTextIfElseFalseApp />
	</div>
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

// ── Multiple `{ref expr}` keyword-form refs auto-merged by the compiler ──
// React's runtime treats duplicate `ref` props as a normal prop collision,
// so multiple TSX-style `ref={...}` attributes are a compile error. The
// Ripple `{ref expr}` keyword form is the supported way to combine refs;
// the compiler folds them into a single `mergeRefs(...)` call.

let auto_merged_a: HTMLDivElement | null = null;
let auto_merged_b: HTMLDivElement | null = null;
let auto_merged_c: HTMLDivElement | null = null;

component AutoMergedRefApp() {
	function refA(node: HTMLDivElement) {
		auto_merged_a = node;
	}
	function refB(node: HTMLDivElement) {
		auto_merged_b = node;
	}
	function refC(node: HTMLDivElement) {
		auto_merged_c = node;
	}

	<div {ref refA} {ref refB} {ref refC} class="auto-merged">{'auto merged'}</div>
}

// ── Mixing Ripple `{ref expr}` and TSX-style `ref={expr}` ──
// At most one TSX-style `ref={expr}` is allowed; any number of
// `{ref expr}` keyword-form refs may sit alongside it. Both should fire
// with the same node.

let mixed_keyword_node: HTMLDivElement | null = null;
let mixed_jsx_node: HTMLDivElement | null = null;

component AutoMergedMixedRefApp() {
	function keywordRef(node: HTMLDivElement) {
		mixed_keyword_node = node;
	}
	function jsxRef(node: HTMLDivElement) {
		mixed_jsx_node = node;
	}

	<div {ref keywordRef} ref={jsxRef} class="auto-merged-mixed">{'mixed merged'}</div>
}

// ── Mix callback refs and ref objects under mergeRefs ──
// `mergeRefs` accepts function refs and `{ current }` ref objects (e.g.
// the result of `useRef`). Both should be populated.

const ref_object: { current: HTMLDivElement | null } = { current: null };
let auto_ref_obj_callback_node: HTMLDivElement | null = null;

component AutoMergedRefObjectApp() {
	function callbackRef(node: HTMLDivElement) {
		auto_ref_obj_callback_node = node;
	}

	<div ref={ref_object} {ref callbackRef} class="auto-merged-objects">{'object merged'}</div>
}

// ── React 19 cleanup contract through mergeRefs ──
// `mergeRefs` always returns a cleanup function. Under React 19 the
// runtime calls the cleanup on unmount instead of re-invoking the merged
// ref with null. Per-ref behavior:
//   - a callback that returns a cleanup → its cleanup is invoked.
//   - a callback that returns nothing   → it is invoked with null
//     (legacy contract is preserved by mergeRefs).

let cleanup_log: string[] = [];

function legacyMountRef(node: HTMLDivElement | null) {
	cleanup_log.push(node === null ? 'legacy:null' : 'legacy:mount');
}

function modernMountRef(_node: HTMLDivElement) {
	cleanup_log.push('modern:mount');
	return () => {
		cleanup_log.push('modern:cleanup');
	};
}

component CleanupRefApp() {
	const [show, setShow] = useState(true);

	if (show) {
		<div ref={legacyMountRef} {ref modernMountRef} class="cleanup-target">{'x'}</div>
	}

	<button class="cleanup-hide" onClick={() => setShow(false)}>{'hide'}</button>
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

component ForContinueApp() {
	const items = ['a', '', 'c'];

	for (const item of items) {
		if (!item) continue;
		<li class="continue-item" key={item}>{item}</li>
	}
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

let tsx_spread_ref_captured: HTMLInputElement | null = null;
let tsx_explicit_ref_captured: HTMLInputElement | null = null;

class TsxSpreadRefRenderer {
	render() {
		const props = {
			id: 'tsx-spread-ref-input',
			ref: (node: HTMLInputElement | null) => {
				tsx_spread_ref_captured = node;
			},
		};

		return <tsx>
			<input
				{...props}
				ref={(node: HTMLInputElement | null) => {
					tsx_explicit_ref_captured = node;
				}}
			/>
		</tsx>;
	}
}

component TsxSpreadRefApp() {
	const renderer = new TsxSpreadRefRenderer();

	<div class="tsx-spread-ref">{renderer.render()}</div>
}

// ── Named ref props merged with native and anonymous refs ──

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

let named_mutable_unmount_slot: HTMLInputElement | null | undefined;

component NamedMutableUnmountApp() {
	const [show, setShow] = useState(true);

	if (show) {
		<input
			type="text"
			class="named-mutable-unmount"
			defaultValue="keep"
			input_ref={ref named_mutable_unmount_slot}
		/>
	}
	<button class="named-mutable-unmount-hide" onClick={() => setShow(false)}>{'hide'}</button>
}

// ── Try/catch: synchronous error boundary ──

component ThrowingChild() {
	throw new Error('sync boom');
	<p>{'unreachable'}</p>
}

component ErrorBoundaryApp() {
	try {
		<ThrowingChild />
	} catch (err: Error) {
		<p class="caught">{err.message}</p>
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
	} catch (err: Error, reset: () => void) {
		<p class="caught">{err.message}</p>
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

component EmptyPendingSuspenseApp(props: { promise: Promise<string> }) {
	try {
		<AsyncChild promise={props.promise} />
	} pending {}
}

// ── Try/pending/catch: Suspense + ErrorBoundary ──

component SuspenseErrorApp(props: { promise: Promise<string> }) {
	try {
		<AsyncChild promise={props.promise} />
	} pending {
		<p class="pending">{'loading...'}</p>
	} catch (err: Error) {
		<p class="caught">{err.message}</p>
	}
}

// ── Try/catch with reset: recover from error ──

component ErrorResetApp(props: { promise: Promise<string> }) {
	try {
		<AsyncChild promise={props.promise} />
	} pending {
		<p class="pending">{'loading...'}</p>
	} catch (err: Error, reset: () => void) {
		<p class="caught">{err.message}</p>
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
			} catch (err: Error) {
				<p class="inner-caught">{err.message}</p>
			}
		</div>
	} catch (err: Error) {
		<p class="outer-caught">{err.message}</p>
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
	} catch (err: Error) {
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
	} catch (err: Error) {
		<p class="caught">{'error'}</p>
	}

	<button class="add" onClick={() => setItems([...items, 'z'])}>{'add'}</button>
}

// ── Hook inside if-branch ──

component HookInIfApp() {
	const [show, setShow]: [boolean, React.Dispatch<React.SetStateAction<boolean>>] = useState(true);

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

// ── Hook inside if-branch closing over parent scope ──

component HookClosingOverScopeApp() {
	const [multiplier, setMultiplier] = useState(2);

	if (multiplier > 0) {
		const [base, setBase] = useState(5);
		<p class="scope-result">{base * multiplier}</p>
		<button class="scope-inc-base" onClick={() => setBase(base + 1)}>{'inc base'}</button>
	}

	<button class="scope-inc-mult" onClick={() => setMultiplier(multiplier + 1)}>
		{'inc multiplier'}
	</button>
}

// ── Hook inside element children (hooks in nested <div> body) ──

component HookInsideElementApp() {
	const [label, setLabel] = useState('greeting');

	<div class="outer">
		<h2>{label}</h2>
		if (label === 'greeting') {
			const [msg, setMsg] = useState('Hello');
			<p class="inner-msg">{msg}</p>
			<button class="inner-update" onClick={() => setMsg('Hi there')}>{'update'}</button>
		}
	</div>

	<button
		class="outer-toggle"
		onClick={() => setLabel(label === 'greeting' ? 'farewell' : 'greeting')}
	>
		{'toggle'}
	</button>
}

// ── Hook inside for-of closing over parent scope ──

component HookInForClosingScopeApp() {
	const [prefix, setPrefix] = useState('item');
	const [items, setItems] = useState(['a', 'b']);

	for (const item of items) {
		const [active, setActive] = useState(false);
		<div class="for-scope-item" key={item}>
			<span class="for-scope-label">{prefix + '-' + item + (active ? '!' : '')}</span>
			<button class={'for-scope-toggle-' + item} onClick={() => setActive(!active)}>
				{'toggle'}
			</button>
		</div>
	}

	<button class="for-scope-prefix" onClick={() => setPrefix('thing')}>{'change prefix'}</button>
}

// ── Early return before hooks with parent scope ──

component EarlyReturnWithHooksApp() {
	const [count, setCount] = useState(0);
	const [skip, setSkip] = useState(false);

	if (skip) {
		return;
	}

	const [doubled, setDoubled] = useState(0);

	<p class="early-count">{count}</p>
	<p class="early-doubled">{doubled}</p>
	<button
		class="early-inc"
		onClick={() => {
			setCount(count + 1);
			setDoubled((count + 1) * 2);
		}}
	>
		{'inc'}
	</button>
	<button class="early-skip" onClick={() => setSkip(true)}>{'skip'}</button>
}

// ── Hook inside switch closing over parent scope ──

component HookInSwitchWithScopeApp() {
	const [tab, setTab] = useState('counter');
	const [theme, setTheme] = useState('light');

	switch (tab) {
		case 'counter':
			const [n, setN] = useState(0);
			<p class="switch-scope-val">{theme + ':' + n}</p>
			<button class="switch-scope-inc" onClick={() => setN(n + 1)}>{'inc'}</button>
			break;
		case 'info':
			<p class="switch-scope-val">{theme + ':info'}</p>
			break;
	}

	<button class="switch-scope-tab" onClick={() => setTab(tab === 'counter' ? 'info' : 'counter')}>
		{'switch tab'}
	</button>
	<button class="switch-scope-theme" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
		{'switch theme'}
	</button>
}

// ── Hook inside expression-position <tsrx> from a regular function ──

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

// ── Static hoisting: mixed static and dynamic siblings ──

component StaticHoistMixedApp() {
	const [count, setCount] = useState(0);

	<header class="static-header">
		<h1>{'Static Title'}</h1>
	</header>
	<p class="dynamic-count">{count}</p>
	<footer class="static-footer">{'Static Footer'}</footer>

	<button class="hoist-inc" onClick={() => setCount(count + 1)}>{'inc'}</button>
}

// ── Static hoisting: static element inside control flow ──

component StaticHoistInBranchApp() {
	const [show, setShow] = useState(true);

	if (show) {
		<div class="branch-static">
			<span>{'Always the same'}</span>
		</div>
	}

	<button class="hoist-toggle" onClick={() => setShow(!show)}>{'toggle'}</button>
}

// ── Static hoisting: fully static component ──

component FullyStaticApp() {
	<div class="all-static">
		<h2>{'Title'}</h2>
		<p>{'Paragraph'}</p>
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

// ── Lazy destructuring: array in variable ──

component LazyArrayApp() {
	const [count, setCount] = useState(0);
	<p class="lazy-count">{count}</p>
	<button class="lazy-inc" onClick={() => setCount(count + 1)}>{'+'}</button>
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
	const [count, setCount] = useState(0);
	<p class="lazy-combined">
		{label}
		{': '}
		{count}
	</p>
	<button class="lazy-combined-inc" onClick={() => setCount(count + 1)}>{'+'}</button>
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

	it('renders direct double-quoted text children as text', async () => {
		await render(DirectQuotedTextApp);
		expect(text('.direct-quoted-entities')).toBe('Rock & "Roll"');
		expect(text('.direct-quoted-backslash')).toBe('line\\nbreak');
		expect(text('.direct-quoted-multiline')).toBe('first\nsecond');
	});

	it('renders bare direct double-quoted text in if-else branches', async () => {
		await render(DirectQuotedTextIfElseApp);
		expect(text('.direct-quoted-if-then')).toBe('Hello Ripple');
		expect(text('.direct-quoted-if-else')).toBe('Hello React');
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

	it('auto-merges multiple {ref expr} keyword-form refs via mergeRefs', async () => {
		auto_merged_a = null;
		auto_merged_b = null;
		auto_merged_c = null;
		await render(AutoMergedRefApp);
		expect(auto_merged_a).toBeInstanceOf(HTMLDivElement);
		expect(auto_merged_a).toBe(auto_merged_b);
		expect(auto_merged_b).toBe(auto_merged_c);
		expect(auto_merged_a!.textContent).toBe('auto merged');
	});

	it('auto-merges mixed Ripple {ref expr} and TSX-style ref={expr}', async () => {
		mixed_keyword_node = null;
		mixed_jsx_node = null;
		await render(AutoMergedMixedRefApp);
		expect(mixed_keyword_node).toBeInstanceOf(HTMLDivElement);
		expect(mixed_keyword_node).toBe(mixed_jsx_node);
	});

	it('mergeRefs populates both ref objects and callback refs', async () => {
		ref_object.current = null;
		auto_ref_obj_callback_node = null;
		await render(AutoMergedRefObjectApp);
		expect(ref_object.current).toBeInstanceOf(HTMLDivElement);
		expect(ref_object.current).toBe(auto_ref_obj_callback_node);
	});

	it('mergeRefs honors React 19 cleanup contract and legacy null callbacks', async () => {
		cleanup_log = [];
		await render(CleanupRefApp);
		expect(cleanup_log).toContain('legacy:mount');
		expect(cleanup_log).toContain('modern:mount');
		expect(cleanup_log).not.toContain('legacy:null');
		expect(cleanup_log).not.toContain('modern:cleanup');

		await click('.cleanup-hide');
		// Element unmounted: each ref must have observed teardown.
		expect(cleanup_log).toContain('legacy:null');
		expect(cleanup_log).toContain('modern:cleanup');
	});

	it('supports ref forwarding through spread props', async () => {
		spread_ref_captured = null;
		await render(SpreadRefApp);
		expect(spread_ref_captured).toBeInstanceOf(HTMLInputElement);
		expect(spread_ref_captured!.id).toBe('spread-input');
	});

	it('merges spread and explicit refs inside tsx expression blocks', async () => {
		tsx_spread_ref_captured = null;
		tsx_explicit_ref_captured = null;
		await render(TsxSpreadRefApp);
		expect(tsx_spread_ref_captured).toBeInstanceOf(HTMLInputElement);
		expect(tsx_spread_ref_captured).toBe(tsx_explicit_ref_captured);
		expect(tsx_spread_ref_captured!.id).toBe('tsx-spread-ref-input');
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

	it('assigns named ref props backed by React-style ref objects', async () => {
		named_ref_object.current = null;
		await render(NamedRefObjectApp);
		expect(named_ref_object.current).toBeInstanceOf(HTMLInputElement);
		expect(named_ref_object.current!.className).toBe('named-forward-ref');
	});

	it('clears named mutable ref props on unmount without mutating input.value', async () => {
		named_mutable_unmount_slot = undefined;
		await render(NamedMutableUnmountApp);
		expect(named_mutable_unmount_slot).toBeInstanceOf(HTMLInputElement);
		const previous_input = named_mutable_unmount_slot!;
		expect(previous_input.value).toBe('keep');

		await click('.named-mutable-unmount-hide');

		expect(named_mutable_unmount_slot).toBeNull();
		expect(previous_input.value).toBe('keep');
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

	it('skips for-of iterations with continue', async () => {
		await render(ForContinueApp);
		expect(
			Array.from(container.querySelectorAll('.continue-item'), (item) => item.textContent),
		).toEqual([
			'a',
			'c',
		]);
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

	it('renders nothing for an empty pending fallback then resolves with use()', async () => {
		let resolve_fn: (value: string) => void;
		const promise = new Promise<string>((r) => {
			resolve_fn = r;
		});

		await render(EmptyPendingSuspenseApp, { promise });
		expect(container.innerHTML).toBe('');
		expect(container.querySelector('.resolved')).toBeNull();

		await act(async () => {
			resolve_fn('hello');
		});
		expect(text('.resolved')).toBe('hello');
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

	// ── Hoisted hooks closing over parent scope ──

	it('hook in if-branch correctly closes over parent scope variables', async () => {
		await render(HookClosingOverScopeApp);
		// base=5, multiplier=2 → 10
		expect(text('.scope-result')).toBe('10');

		await click('.scope-inc-base');
		// base=6, multiplier=2 → 12
		expect(text('.scope-result')).toBe('12');

		await click('.scope-inc-mult');
		// base=6, multiplier=3 → 18
		expect(text('.scope-result')).toBe('18');
	});

	it('hook inside element children works with parent scope', async () => {
		await render(HookInsideElementApp);
		expect(text('h2')).toBe('greeting');
		expect(text('.inner-msg')).toBe('Hello');

		await click('.inner-update');
		expect(text('.inner-msg')).toBe('Hi there');

		await click('.outer-toggle');
		expect(text('h2')).toBe('farewell');
		expect(container.querySelector('.inner-msg')).toBeNull();

		await click('.outer-toggle');
		expect(text('h2')).toBe('greeting');
		// Hook state resets since the component remounts
		expect(text('.inner-msg')).toBe('Hello');
	});

	it('hook in for-of loop correctly uses parent scope variables', async () => {
		await render(HookInForClosingScopeApp);
		const labels = container.querySelectorAll('.for-scope-label');
		expect(labels[0].textContent).toBe('item-a');
		expect(labels[1].textContent).toBe('item-b');

		await click('.for-scope-toggle-a');
		expect(container.querySelector('.for-scope-label')!.textContent).toBe('item-a!');

		await click('.for-scope-prefix');
		expect(container.querySelector('.for-scope-label')!.textContent).toBe('thing-a!');
	});

	it('early return before hooks passes scope correctly to continuation', async () => {
		await render(EarlyReturnWithHooksApp);
		expect(text('.early-count')).toBe('0');
		expect(text('.early-doubled')).toBe('0');

		await click('.early-inc');
		expect(text('.early-count')).toBe('1');
		expect(text('.early-doubled')).toBe('2');

		await click('.early-skip');
		expect(container.querySelector('.early-count')).toBeNull();
		expect(container.querySelector('.early-doubled')).toBeNull();
	});

	it('hook in switch case correctly uses parent scope variables', async () => {
		await render(HookInSwitchWithScopeApp);
		expect(text('.switch-scope-val')).toBe('light:0');

		await click('.switch-scope-inc');
		expect(text('.switch-scope-val')).toBe('light:1');

		await click('.switch-scope-theme');
		expect(text('.switch-scope-val')).toBe('dark:1');

		await click('.switch-scope-tab');
		expect(text('.switch-scope-val')).toBe('dark:info');
	});

	it('keeps <tsrx> expression hook state stable across regular function rerenders', async () => {
		await render(TsrxExpressionHookApp);
		expect(container.querySelector('.tsrx-expression-hook-count')).toBeNull();

		await click('.tsrx-expression-hook-toggle');
		expect(text('.tsrx-expression-hook-count')).toBe('first:0');

		await click('.tsrx-expression-hook-count');
		expect(text('.tsrx-expression-hook-count')).toBe('first:1');

		await click('.tsrx-expression-hook-label');
		expect(text('.tsrx-expression-hook-count')).toBe('second:1');
	});

	// ── Static hoisting ──

	it('hoists static elements while keeping dynamic siblings interactive', async () => {
		await render(StaticHoistMixedApp);
		expect(text('.static-header h1')).toBe('Static Title');
		expect(text('.dynamic-count')).toBe('0');
		expect(text('.static-footer')).toBe('Static Footer');

		await click('.hoist-inc');
		expect(text('.dynamic-count')).toBe('1');
		// Static elements remain unchanged
		expect(text('.static-header h1')).toBe('Static Title');
		expect(text('.static-footer')).toBe('Static Footer');
	});

	it('hoists static elements inside control flow branches', async () => {
		await render(StaticHoistInBranchApp);
		expect(text('.branch-static span')).toBe('Always the same');

		await click('.hoist-toggle');
		expect(container.querySelector('.branch-static')).toBeNull();

		await click('.hoist-toggle');
		expect(text('.branch-static span')).toBe('Always the same');
	});

	it('renders a fully static component correctly', async () => {
		await render(FullyStaticApp);
		expect(text('.all-static h2')).toBe('Title');
		expect(text('.all-static p')).toBe('Paragraph');
	});

	// ── Lazy destructuring ──

	it('lazy object destructuring in props works at runtime', async () => {
		await render(LazyPropsApp);
		expect(text('.lazy-props')).toBe('Alice is 30');
	});

	it('lazy array destructuring in variables works at runtime', async () => {
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
