import type { MockInstance } from 'vitest';
import { useState, use } from 'react';
import { mergeRefs } from '@tsrx/react/ref';
import {
	runSwitchFallthroughRuntimeTests,
} from '@tsrx/core/test-harness/runtime/switch-fallthrough';
import {
	runTsxExpressionTsrxRuntimeTests,
} from '@tsrx/core/test-harness/runtime/tsx-expression-tsrx';

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

function BasicApp() @{
	<div className="greeting">{'Hello world'}</div>
}

function JsxTextApp() @{
	<>
		<div className="jsx-text-entities">Rock &amp; &quot;Roll&quot;</div>
		<div className="jsx-text-backslash">line\nbreak</div>
		<pre className="jsx-text-multiline">
			first
second
		</pre>
	</>
}

function JsxTextIfElseTrueApp() @{
	@if (true) {
		<>Hello Ripple</>
	} @else {
		<>Hello React</>
	}
}

function JsxTextIfElseFalseApp() @{
	@if (false) {
		<>Hello Ripple</>
	} @else {
		<>Hello React</>
	}
}

function JsxTextIfElseApp() @{
	<>
		<div className="jsx-text-if-then">
			<JsxTextIfElseTrueApp />
		</div>
		<div className="jsx-text-if-else">
			<JsxTextIfElseFalseApp />
		</div>
	</>
}

function Child(props: { text: string }) @{
	<span className="child">{props.text}</span>
}

function NestedApp() @{
	<div>
		<Child text="nested" />
	</div>
}

function ExplicitTextApp() @{
	const markup = '<span>Not HTML</span>';
	const hidden = false;
	const empty = null;
	const missing = undefined;

	<>
		<div className="explicit-text-markup">{String(markup)}</div>
		<div className="explicit-text-boolean">{String(hidden)}</div>
		<div className="explicit-text-null">
			{empty == null ? '' : String(empty)}
		</div>
		<div className="explicit-text-undefined">
			{missing == null ? '' : String(missing)}
		</div>
	</>
}

function ExplicitHtmlApp() @{
	const [markup, setMarkup] = useState('<span class="html-node">safe enough</span>');

	<>
		<div className="explicit-html-child" dangerouslySetInnerHTML={{ __html: markup }} />
		<button
			className="explicit-html-update"
			onClick={() => {
				setMarkup('<strong class="html-node">updated</strong>');
			}}
		>{'update'}</button>
	</>
}

function SpreadHtmlApp() @{
	const [spreadProps, setSpreadProps] = useState({
		dangerouslySetInnerHTML: { __html: '<em class="html-node">spread</em>' },
	});
	const [markup, setMarkup] = useState('<span class="html-node">safe enough</span>');

	<>
		<div
			className="spread-html-child"
			{...spreadProps}
			dangerouslySetInnerHTML={{ __html: markup }}
		/>
		<button
			className="spread-html-update-spread"
			onClick={() => {
				setSpreadProps({
					dangerouslySetInnerHTML: { __html: '<i class="html-node">spread update</i>' },
				});
			}}
		>{'spread'}</button>
		<button
			className="spread-html-update-markup"
			onClick={() => {
				setMarkup('<strong class="html-node">updated</strong>');
			}}
		>{'markup'}</button>
	</>
}

function CallableBlockRuntimeApp() @{
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

	<section className="callable-block-runtime">
		<p className="decl-block">{readDeclaration()}</p>
		<p className="arrow-block">{readArrow()}</p>
		<p className="method-block">{reader.read()}</p>
	</section>
}

// ── Reactive counter ──

function CounterApp() @{
	const [count, setCount] = useState(0);

	<>
		<p className="count">{count}</p>
		<button className="inc" onClick={() => setCount(count + 1)}>{'+'}</button>
	</>
}

// ── Refs on elements ──

let element_ref_captured: HTMLDivElement | null = null;

function ElementRefApp() @{
	<div
		ref={(node: HTMLDivElement) => {
			element_ref_captured = node;
		}}
		className="ref-target"
	>{'ref test'}</div>
}

// ── Ref on composite components via prop forwarding ──

let composite_ref_captured: HTMLInputElement | null = null;

function InputComp(props: { type: string; ref?: (node: HTMLInputElement) => void }) @{
	<input type={props.type} ref={props.ref} />
}

function CompositeRefApp() @{
	<InputComp
		type="text"
		ref={(node: HTMLInputElement) => {
			composite_ref_captured = node;
		}}
	/>
}

// ── Multiple ref callbacks combined into one ──

let multi_ref1_node: HTMLDivElement | null = null;
let multi_ref2_node: HTMLDivElement | null = null;

function MultiRefApp() @{
	function firstRef(node: HTMLDivElement) {
		multi_ref1_node = node;
	}
	function secondRef(node: HTMLDivElement) {
		multi_ref2_node = node;
	}

	<div
		ref={(node: HTMLDivElement) => {
			firstRef(node);
			secondRef(node);
		}}
		className="multi-ref"
	>{'multi ref'}</div>
}

// ── Explicitly merged refs ──
// React's runtime treats duplicate `ref` props as a normal prop collision,
// so callers compose multiple refs with the target helper.

let auto_merged_a: HTMLDivElement | null = null;
let auto_merged_b: HTMLDivElement | null = null;
let auto_merged_c: HTMLDivElement | null = null;

function AutoMergedRefApp() @{
	function refA(node: HTMLDivElement) {
		auto_merged_a = node;
	}
	function refB(node: HTMLDivElement) {
		auto_merged_b = node;
	}
	function refC(node: HTMLDivElement) {
		auto_merged_c = node;
	}

	<div ref={mergeRefs(refA, refB, refC)} className="auto-merged">{'auto merged'}</div>
}

let mixed_keyword_node: HTMLDivElement | null = null;
let mixed_jsx_node: HTMLDivElement | null = null;

function AutoMergedMixedRefApp() @{
	function keywordRef(node: HTMLDivElement) {
		mixed_keyword_node = node;
	}
	function jsxRef(node: HTMLDivElement) {
		mixed_jsx_node = node;
	}

	<div ref={mergeRefs(keywordRef, jsxRef)} className="auto-merged-mixed">{'mixed merged'}</div>
}

// ── Mix callback refs and ref objects under mergeRefs ──
// `mergeRefs` accepts function refs and `{ current }` ref objects (e.g.
// the result of `useRef`). Both should be populated.

const ref_object: { current: HTMLDivElement | null } = { current: null };
let auto_ref_obj_callback_node: HTMLDivElement | null = null;

function AutoMergedRefObjectApp() @{
	function callbackRef(node: HTMLDivElement) {
		auto_ref_obj_callback_node = node;
	}

	<div
		ref={mergeRefs(ref_object, callbackRef)}
		className="auto-merged-objects"
	>{'object merged'}</div>
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

function CleanupRefApp() @{
	const [show, setShow] = useState(true);

	<>
		@if (show) {
			<div ref={mergeRefs(legacyMountRef, modernMountRef)} className="cleanup-target">{'x'}</div>
		}
		<button className="cleanup-hide" onClick={() => setShow(false)}>{'hide'}</button>
	</>
}

// ── If-statement with reactivity ──

function IfReactiveApp() @{
	const [show, setShow] = useState(true);

	<>
		@if (show) {
			<span className="visible">{'shown'}</span>
		} @else {
			<span className="hidden">{'hidden'}</span>
		}
		<button className="toggle" onClick={() => setShow(!show)}>{'toggle'}</button>
	</>
}

// ── For-of loop with reactivity ──

function ForReactiveApp() @{
	const [items, setItems] = useState(['a', 'b', 'c']);

	<>
		@for (const item of items) {
			<li className="item" key={item}>{item}</li>
		}
		<button className="add" onClick={() => setItems([...items, 'd'])}>{'add'}</button>
		<button className="remove" onClick={() => setItems(items.slice(1))}>{'remove'}</button>
	</>
}

function ForFilteredApp() @{
	const items = ['a', '', 'c'];
	const visibleItems = items.filter(Boolean);

	@for (const item of visibleItems) {
		<li className="continue-item" key={item}>{item}</li>
	}
}

// ── For-of over a Set ──

function ForOverSetApp() @{
	const items = new Set<string>(['x', 'y', 'z']);

	@for (const item of items) {
		<li className="set-item" key={item}>{item}</li>
	}
}

// ── For-of over a Map ──

function ForOverMapApp() @{
	const entries = new Map<string, number>([
		['a', 1],
		['b', 2],
		['c', 3],
	]);

	@for (const [key, value] of entries) {
		<li className="map-item" {key}>
			{key + ':' + value}
		</li>
	}
}

// ── For-of over a custom iterable ──

function ForOverCustomIterableApp() @{
	function* iter() {
		yield 'one';
		yield 'two';
		yield 'three';
	}
	const items = iter();

	@for (const item of items) {
		<li className="generator-item" key={item}>{item}</li>
	}
}

// ── Switch with reactivity ──

function SwitchReactiveApp() @{
	const [page, setPage] = useState('home');

	<>
		@switch (page) {
			@case 'home': {
				<div className="page">{'Home'}</div>
			}
			@case 'about': {
				<div className="page">{'About'}</div>
			}
			@default: {
				<div className="page">{'404'}</div>
			}
		}
		<button className="go-about" onClick={() => setPage('about')}>{'about'}</button>
		<button className="go-unknown" onClick={() => setPage('other')}>{'other'}</button>
	</>
}

// ── Composite children ──

function Wrapper(props: { children?: any }) @{
	<div className="wrapper">{props.children}</div>
}

function ChildrenApp() @{
	<Wrapper>
		<span>{'inside wrapper'}</span>
	</Wrapper>
}

// ── If-statement children through composite ──

function IfChildrenApp() @{
	const [show, setShow] = useState(false);

	<>
		<Wrapper>
			@if (show) {
				<span className="inner-visible">{'inner shown'}</span>
			}
		</Wrapper>
		<button className="toggle" onClick={() => setShow(!show)}>{'toggle'}</button>
	</>
}

// ── Scoped CSS ──

function StyledApp() @{
	<>
		<div className="styled">{'styled text'}</div>
		<style>
			.styled {
				color: red;
			}
		</style>
	</>
}

// ── Ref forwarding through spread ──

let spread_ref_captured: HTMLInputElement | null = null;

function SpreadInput(props: { id: string; [key: string]: any }) @{
	const { id, ...rest } = props;

	<input {id} {...rest} />
}

function SpreadRefApp() @{
	<SpreadInput
		id="spread-input"
		type="text"
		ref={(node: HTMLInputElement) => {
			spread_ref_captured = node;
		}}
	/>
}

// ── Named ref props merged with native and anonymous refs ──

let named_direct_node: HTMLInputElement | null = null;
let named_direct_native_node: HTMLInputElement | null = null;
let named_direct_anonymous_node: HTMLInputElement | null = null;

function NamedDirectRefApp() @{
	function nativeRef(node: HTMLInputElement | null) {
		named_direct_native_node = node;
	}
	function anonymousRef(node: HTMLInputElement | null) {
		named_direct_anonymous_node = node;
	}

	<input
		ref={mergeRefs(nativeRef, anonymousRef, (node: HTMLInputElement | null) => {
			named_direct_node = node;
		})}
		className="named-direct-ref"
		type="text"
	/>
}

let named_forward_node: HTMLInputElement | null = null;

function NamedForwardInput(props: { type: string; input_ref?: any }) @{
	<input type={props.type} ref={props.input_ref} className="named-forward-ref" />
}

function NamedForwardRefApp() @{
	<NamedForwardInput
		type="text"
		input_ref={(node: HTMLInputElement | null) => {
			named_forward_node = node;
		}}
	/>
}

let named_spread_before_node: HTMLInputElement | null = null;
let named_spread_before_native_node: HTMLInputElement | null = null;

function namedSpreadBeforeNativeRef(node: HTMLInputElement | null) {
	named_spread_before_native_node = node;
}

function NamedSpreadBeforeRefInput({ input_ref, ...props }: { type: string; input_ref?: any }) @{
	<input
		{...props}
		ref={mergeRefs(input_ref, namedSpreadBeforeNativeRef)}
		className="named-spread-before-ref"
	/>
}

function NamedSpreadBeforeRefApp() @{
	<NamedSpreadBeforeRefInput
		type="text"
		input_ref={(node: HTMLInputElement | null) => {
			named_spread_before_node = node;
		}}
	/>
}

let named_spread_after_node: HTMLInputElement | null = null;
let named_spread_after_native_node: HTMLInputElement | null = null;

function namedSpreadAfterNativeRef(node: HTMLInputElement | null) {
	named_spread_after_native_node = node;
}

function NamedSpreadAfterRefInput({ input_ref, ...props }: { type: string; input_ref?: any }) @{
	<input
		ref={mergeRefs(namedSpreadAfterNativeRef, input_ref)}
		{...props}
		className="named-spread-after-ref"
	/>
}

function NamedSpreadAfterRefApp() @{
	<NamedSpreadAfterRefInput
		type="text"
		input_ref={(node: HTMLInputElement | null) => {
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

function MultiSpreadExplicitRefInput(props: { type: string; first_ref?: any; second_ref?: any }) @{
	const first = { type: props.type, ref: props.first_ref };
	const second = { ref: props.second_ref };

	<input
		{...first}
		{...second}
		ref={multiSpreadExplicitNativeRef}
		className="multi-spread-explicit-ref"
	/>
}

function MultiSpreadExplicitRefApp() @{
	<MultiSpreadExplicitRefInput
		type="text"
		first_ref={(node: HTMLInputElement | null) => {
			multi_spread_first_node = node;
		}}
		second_ref={(node: HTMLInputElement | null) => {
			multi_spread_second_node = node;
		}}
	/>
}

const named_ref_object: { current: HTMLInputElement | null } = { current: null };

function NamedRefObjectApp() @{
	<NamedForwardInput type="text" input_ref={named_ref_object} />
}

let named_mutable_unmount_slot: HTMLInputElement | null | undefined;

function NamedMutableUnmountApp() @{
	const [show, setShow] = useState(true);

	<>
		@if (show) {
			<input
				type="text"
				className="named-mutable-unmount"
				defaultValue="keep"
				ref={(node: HTMLInputElement | null) => {
					named_mutable_unmount_slot = node;
				}}
			/>
		}
		<button className="named-mutable-unmount-hide" onClick={() => setShow(false)}>{'hide'}</button>
	</>
}

// ── Try/catch: synchronous error boundary ──

function ThrowingChild() @{
	throw new Error('sync boom');

	<p>{'unreachable'}</p>
}

function ErrorBoundaryApp() @{
	@try {
		<ThrowingChild />
	} @catch (err: Error) {
		<p className="caught">{err.message}</p>
	}
}

// ── Try/catch with reactive toggle into/out of error ──

function MaybeThrow(props: { shouldThrow: boolean }) @{
	if (props.shouldThrow) {
		throw new Error('conditional boom');
	}

	<p className="ok">{'no error'}</p>
}

function ErrorToggleApp() @{
	const [fail, setFail] = useState(false);

	<>
		@try {
			<MaybeThrow shouldThrow={fail} />
		} @catch (err: Error, reset: () => void) {
			<>
				<p className="caught">{err.message}</p>
				<button
					className="reset"
					onClick={() => {
						setFail(false);
						reset();
					}}
				>{'reset'}</button>
			</>
		}
		<button className="trigger-error" onClick={() => setFail(true)}>{'break'}</button>
	</>
}

// ── Try/pending: Suspense with use() ──

function AsyncChild(props: { promise: Promise<string> }) @{
	const data = use(props.promise);

	<p className="resolved">{data}</p>
}

function SuspenseApp(props: { promise: Promise<string> }) @{
	@try {
		<AsyncChild promise={props.promise} />
	} @pending {
		<p className="pending">{'loading...'}</p>
	}
}

function EmptyPendingSuspenseApp(props: { promise: Promise<string> }) @{
	@try {
		<AsyncChild promise={props.promise} />
	} @pending {}
}

// ── Try/pending/catch: Suspense + ErrorBoundary ──

function SuspenseErrorApp(props: { promise: Promise<string> }) @{
	@try {
		<AsyncChild promise={props.promise} />
	} @pending {
		<p className="pending">{'loading...'}</p>
	} @catch (err: Error) {
		<p className="caught">{err.message}</p>
	}
}

// ── Try/catch with reset: recover from error ──

function ErrorResetApp(props: { promise: Promise<string> }) @{
	@try {
		<AsyncChild promise={props.promise} />
	} @pending {
		<p className="pending">{'loading...'}</p>
	} @catch (err: Error, reset: () => void) {
		<>
			<p className="caught">{err.message}</p>
			<button className="retry" onClick={() => reset()}>{'retry'}</button>
		</>
	}
}

// ── Nested try: inner catch handles inner error ──

function InnerThrow() @{
	throw new Error('inner error');

	<p>{'unreachable'}</p>
}

function NestedTryApp() @{
	@try {
		<div className="outer">
			@try {
				<InnerThrow />
			} @catch (err: Error) {
				<p className="inner-caught">{err.message}</p>
			}
		</div>
	} @catch (err: Error) {
		<p className="outer-caught">{err.message}</p>
	}
}

// ── Try/pending with reactive promise swap ──

function SwappableAsyncApp() @{
	const [promise, setPromise] = useState(() => Promise.resolve('first'));

	<>
		@try {
			<AsyncChild {promise} />
		} @pending {
			<p className="pending">{'loading...'}</p>
		}
		<button className="swap" onClick={() => setPromise(Promise.resolve('second'))}>{'swap'}</button>
	</>
}

// ── If inside try body ──

function IfInsideTryApp() @{
	const [show, setShow] = useState(true);

	<>
		@try {
			@if (show) {
				<p className="branch-a">{'visible'}</p>
			} @else {
				<p className="branch-b">{'alternate'}</p>
			}
		} @catch (err: Error) {
			<p className="caught">{'error'}</p>
		}
		<button className="toggle" onClick={() => setShow(!show)}>{'toggle'}</button>
	</>
}

// ── For-of inside try body ──

function ForInsideTryApp() @{
	const [items, setItems] = useState(['x', 'y']);

	<>
		@try {
			@for (const item of items) {
				<span className="try-item" key={item}>{item}</span>
			}
		} @catch (err: Error) {
			<p className="caught">{'error'}</p>
		}
		<button className="add" onClick={() => setItems([...items, 'z'])}>{'add'}</button>
	</>
}

// ── Hook inside if-branch ──

function HookInIfApp() @{
	const [show, setShow]: [boolean, React.Dispatch<React.SetStateAction<boolean>>] = useState(true);

	<>
		@if (show) {
			@{
				const [count, setCount] = useState(0);

				<>
					<p className="hook-if-count">{count}</p>
					<button className="hook-if-inc" onClick={() => setCount(count + 1)}>{'inc'}</button>
				</>
			}
		} @else {
			<p className="hook-if-hidden">{'hidden'}</p>
		}
		<button className="hook-if-toggle" onClick={() => setShow(!show)}>{'toggle'}</button>
	</>
}

// ── Hook inside for-of loop ──

function HookInForApp() @{
	const [items, setItems] = useState(['a', 'b']);

	<>
		@for (const item of items) {
			@{
				const [clicked, setClicked] = useState(false);

				<div className="hook-for-item" key={item}>
					<span>
						{item}
						{clicked ? '!' : ''}
					</span>
					<button
						className={'hook-for-click-' + item}
						onClick={() => setClicked(true)}
					>{'click'}</button>
				</div>
			}
		}
		<button className="hook-for-add" onClick={() => setItems([...items, 'c'])}>{'add'}</button>
	</>
}

// ── Hook inside switch case ──

function HookInSwitchApp() @{
	const [page, setPage] = useState('home');

	<>
		@switch (page) {
			@case 'home': {
				const [homeCount, setHomeCount] = useState(0);
				<>
					<p className="hook-switch-val">{homeCount}</p>
					<button
						className="hook-switch-inc"
						onClick={() => setHomeCount(homeCount + 1)}
					>{'inc'}</button>
				</>
			}
			@case 'about': {
				<p className="hook-switch-val">{'about page'}</p>
			}
		}
		<button className="hook-switch-go" onClick={() => setPage('about')}>{'about'}</button>
	</>
}

// ── Hook inside if-else both branches ──

function HookInBothBranchesApp() @{
	const [mode, setMode] = useState('a');

	<>
		@if (mode === 'a') {
			@{
				const [x, setX] = useState(10);

				<>
					<p className="branch-val">{x}</p>
					<button className="branch-inc" onClick={() => setX(x + 1)}>{'inc'}</button>
				</>
			}
		} @else {
			@{
				const [y, setY] = useState(20);

				<>
					<p className="branch-val">{y}</p>
					<button className="branch-inc" onClick={() => setY(y + 1)}>{'inc'}</button>
				</>
			}
		}
		<button
			className="branch-toggle"
			onClick={() => setMode(mode === 'a' ? 'b' : 'a')}
		>{'toggle'}</button>
	</>
}

// ── Hook inside if-branch closing over parent scope ──

function HookClosingOverScopeApp() @{
	const [multiplier, setMultiplier] = useState(2);

	<>
		@if (multiplier > 0) {
			@{
				const [base, setBase] = useState(5);

				<>
					<p className="scope-result">
						{base * multiplier}
					</p>
					<button className="scope-inc-base" onClick={() => setBase(base + 1)}>{'inc base'}</button>
				</>
			}
		}
		<button
			className="scope-inc-mult"
			onClick={() => setMultiplier(multiplier + 1)}
		>{'inc multiplier'}</button>
	</>
}

// ── Hook inside element children (hooks in nested <div> body) ──

function HookInsideElementApp() @{
	const [label, setLabel] = useState('greeting');

	<>
		<div className="outer">
			<h2>{label}</h2>
			@if (label === 'greeting') {
				@{
					const [msg, setMsg] = useState('Hello');

					<>
						<p className="inner-msg">{msg}</p>
						<button className="inner-update" onClick={() => setMsg('Hi there')}>{'update'}</button>
					</>
				}
			}
		</div>
		<button
			className="outer-toggle"
			onClick={() => setLabel(label === 'greeting' ? 'farewell' : 'greeting')}
		>toggle</button>
	</>
}

// ── Hook inside for-of closing over parent scope ──

function HookInForClosingScopeApp() @{
	const [prefix, setPrefix] = useState('item');
	const [items, setItems] = useState(['a', 'b']);

	<>
		@for (const item of items) {
			@{
				const [active, setActive] = useState(false);

				<div className="for-scope-item" key={item}>
					<span className="for-scope-label">
						{prefix + '-' + item + (active ? '!' : '')}
					</span>
					<button
						className={'for-scope-toggle-' + item}
						onClick={() => setActive(!active)}
					>{'toggle'}</button>
				</div>
			}
		}
		<button
			className="for-scope-prefix"
			onClick={() => setPrefix('thing')}
		>{'change prefix'}</button>
	</>
}

// ── Component guard return before hooks with parent scope ──

function GuardReturnWithHooksApp() @{
	const [count, setCount] = useState(0);
	const [skip, setSkip] = useState(false);
	if (skip) {
		return null;
	}
	const [doubled, setDoubled] = useState(0);

	<>
		<p className="early-count">{count}</p>
		<p className="early-doubled">{doubled}</p>
		<button
			className="early-inc"
			onClick={() => {
				setCount(count + 1);
				setDoubled((count + 1) * 2);
			}}
		>inc</button>
		<button className="early-skip" onClick={() => setSkip(true)}>{'skip'}</button>
	</>
}

// ── Hook inside switch closing over parent scope ──

function HookInSwitchWithScopeApp() @{
	const [tab, setTab] = useState('counter');
	const [theme, setTheme] = useState('light');

	<>
		@switch (tab) {
			@case 'counter': {
				const [n, setN] = useState(0);
				<>
					<p className="switch-scope-val">
						{theme + ':' + n}
					</p>
					<button className="switch-scope-inc" onClick={() => setN(n + 1)}>{'inc'}</button>
				</>
			}
			@case 'info': {
				<p className="switch-scope-val">
					{theme + ':info'}
				</p>
			}
		}
		<button
			className="switch-scope-tab"
			onClick={() => setTab(tab === 'counter' ? 'info' : 'counter')}
		>{'switch tab'}</button>
		<button
			className="switch-scope-theme"
			onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
		>{'switch theme'}</button>
	</>
}

// ── Hook inside expression-position JSX fragments from a regular function ──

function TsrxExpressionHookPanel(props: { active: boolean; label: string }) @{
	if (!props.active) return null;

	const [count, setCount] = useState(0);

	<button className="tsrx-expression-hook-count" onClick={() => setCount(count + 1)}>
		{props.label + ':' + count}
	</button>
}

function TsrxExpressionHookApp() @{
	const [active, setActive] = useState(false);
	const [label, setLabel] = useState('first');

	<>
		<button className="tsrx-expression-hook-toggle" onClick={() => setActive(!active)}>
			{active ? 'hide' : 'show'}
		</button>
		<button
			className="tsrx-expression-hook-label"
			onClick={() => setLabel('second')}
		>{'label'}</button>
		<TsrxExpressionHookPanel {active} {label} />
	</>
}

// ── Static hoisting: mixed static and dynamic siblings ──

function StaticHoistMixedApp() @{
	const [count, setCount] = useState(0);

	<>
		<header className="static-header">
			<h1>{'Static Title'}</h1>
		</header>
		<p className="dynamic-count">{count}</p>
		<footer className="static-footer">{'Static Footer'}</footer>
		<button className="hoist-inc" onClick={() => setCount(count + 1)}>{'inc'}</button>
	</>
}

// ── Static hoisting: static element inside control flow ──

function StaticHoistInBranchApp() @{
	const [show, setShow] = useState(true);

	<>
		@if (show) {
			<div className="branch-static">
				<span>{'Always the same'}</span>
			</div>
		}
		<button className="hoist-toggle" onClick={() => setShow(!show)}>{'toggle'}</button>
	</>
}

// ── Static hoisting: fully static component ──

function FullyStaticApp() @{
	<div className="all-static">
		<h2>{'Title'}</h2>
		<p>{'Paragraph'}</p>
	</div>
}

// ── Lazy destructuring: object in props ──

function LazyPropsChild(&{ name, age }: { name: string; age: number }) @{
	<div className="lazy-props">
		{name}
		{' is '}
		{age}
	</div>
}

function LazyPropsApp() @{
	<LazyPropsChild name="Alice" age={30} />
}

// ── Lazy destructuring: array in variable ──

function LazyArrayApp() @{
	const [count, setCount] = useState(0);

	<>
		<p className="lazy-count">{count}</p>
		<button className="lazy-inc" onClick={() => setCount(count + 1)}>{'+'}</button>
	</>
}

// ── Lazy destructuring: object in variable ──

function LazyObjVarApp() @{
	const &{ x, y } = usePosition();

	<p className="lazy-pos">
		{x}
		{','}
		{y}
	</p>
}

function usePosition() {
	return { x: 10, y: 20 };
}

// ── Lazy destructuring: combined props + variable ──

function LazyCombinedApp(&{ label }: { label: string }) @{
	const [count, setCount] = useState(0);

	<>
		<p className="lazy-combined">
			{label}
			{': '}
			{count}
		</p>
		<button className="lazy-combined-inc" onClick={() => setCount(count + 1)}>{'+'}</button>
	</>
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

	it('renders JSX text children as text', async () => {
		await render(JsxTextApp);
		expect(text('.jsx-text-entities')).toBe('Rock & "Roll"');
		expect(text('.jsx-text-backslash')).toBe('line\\nbreak');
		expect(text('.jsx-text-multiline')).toBe('first second');
	});

	it('renders bare JSX text in if-else branches', async () => {
		await render(JsxTextIfElseApp);
		expect(text('.jsx-text-if-then')).toBe('Hello Ripple');
		expect(text('.jsx-text-if-else')).toBe('Hello React');
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
		expect(text('.explicit-html-child')).toBe('safe enough');
		expect(container.querySelector('.explicit-html-child .html-node')?.tagName).toBe('SPAN');

		await click('.explicit-html-update');
		expect(text('.explicit-html-child')).toBe('updated');
		expect(container.querySelector('.explicit-html-child .html-node')?.tagName).toBe('STRONG');
	});

	it('lets native runtime resolve spread props before explicit html interpolation', async () => {
		await render(SpreadHtmlApp);
		expect(text('.spread-html-child')).toBe('safe enough');
		expect(container.querySelector('.spread-html-child .html-node')?.tagName).toBe('SPAN');

		await click('.spread-html-update-spread');
		expect(text('.spread-html-child')).toBe('safe enough');
		expect(container.querySelector('.spread-html-child .html-node')?.tagName).toBe('SPAN');

		await click('.spread-html-update-markup');
		expect(text('.spread-html-child')).toBe('updated');
		expect(container.querySelector('.spread-html-child .html-node')?.tagName).toBe('STRONG');
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

	it('supports explicitly merged refs via mergeRefs', async () => {
		auto_merged_a = null;
		auto_merged_b = null;
		auto_merged_c = null;
		await render(AutoMergedRefApp);
		expect(auto_merged_a).toBeInstanceOf(HTMLDivElement);
		expect(auto_merged_a).toBe(auto_merged_b);
		expect(auto_merged_b).toBe(auto_merged_c);
		expect(auto_merged_a!.textContent).toBe('auto merged');
	});

	it('supports explicitly merged callback refs', async () => {
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

	it('merges explicit callback refs with native refs', async () => {
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

	it('merges explicitly forwarded ref props with native ref after the spread', async () => {
		named_spread_before_node = null;
		named_spread_before_native_node = null;
		await render(NamedSpreadBeforeRefApp);
		expect(named_spread_before_node).toBeInstanceOf(HTMLInputElement);
		expect(named_spread_before_node).toBe(named_spread_before_native_node);
	});

	it('merges explicitly forwarded ref props with native ref before the spread', async () => {
		named_spread_after_node = null;
		named_spread_after_native_node = null;
		await render(NamedSpreadAfterRefApp);
		expect(named_spread_after_node).toBeInstanceOf(HTMLInputElement);
		expect(named_spread_after_node).toBe(named_spread_after_native_node);
	});

	it('merges ref props from multiple host spreads with one explicit ref', async () => {
		multi_spread_first_node = null;
		multi_spread_second_node = null;
		multi_spread_native_node = null;
		multi_spread_native_calls = 0;
		await render(MultiSpreadExplicitRefApp);
		expect(multi_spread_first_node).toBeInstanceOf(HTMLInputElement);
		expect(multi_spread_first_node).toBe(multi_spread_second_node);
		expect(multi_spread_first_node).toBe(multi_spread_native_node);
		expect(multi_spread_native_calls).toBe(1);
		expect(container.querySelector('.multi-spread-explicit-ref')!.hasAttribute('ref')).toBe(false);
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

	it('renders filtered for-of items', async () => {
		await render(ForFilteredApp);
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

	it('component guard return before hooks passes scope correctly to continuation', async () => {
		await render(GuardReturnWithHooksApp);
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

	it('keeps <> expression hook state stable across regular function rerenders', async () => {
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

runSwitchFallthroughRuntimeTests();
runTsxExpressionTsrxRuntimeTests();
