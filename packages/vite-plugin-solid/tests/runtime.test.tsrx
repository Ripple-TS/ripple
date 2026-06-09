import type { MockInstance } from 'vitest';
import type { JSX } from '@solidjs/web';
import { createSignal, lazy } from 'solid-js';
import { Dynamic } from '@tsrx/solid/dynamic';
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

function BasicApp() @{
	<div class="greeting">{'Hello world'}</div>
}

function Child(props: { text: string }) @{
	<span class="child">{props.text}</span>
}

function NestedApp() @{
	<div>
		<Child text="nested" />
	</div>
}

function DynamicElementApp() @{
	const tag = 'section';
	<Dynamic is={tag} class="dynamic-host">{'dynamic element'}</Dynamic>
}

function DynamicChild(props: { label: string }) @{
	<span class="dynamic-child">{props.label}</span>
}

function DynamicComponentApp() @{
	const component = DynamicChild;
	<Dynamic is={component} label="dynamic component" />
}

function DynamicSwitchApp() @{
	const [tag, setTag] = createSignal<'section' | 'article'>('section');
	<>
		<Dynamic is={tag()} class="dynamic-switch">{tag()}</Dynamic>
		<button
			class="dynamic-switch-toggle"
			onClick={() => setTag(tag() === 'section' ? 'article' : 'section')}
		>{'toggle'}</button>
	</>
}

function ExplicitTextApp() @{
	const markup = '<span>Not HTML</span>';
	const hidden = false;
	const empty = null;
	const missing = undefined;
	<>
		<div class="explicit-text-markup">{String(markup)}</div>
		<div class="explicit-text-boolean">{String(hidden)}</div>
		<div class="explicit-text-null">
			{empty == null ? '' : String(empty)}
		</div>
		<div class="explicit-text-undefined">
			{missing == null ? '' : String(missing)}
		</div>
	</>
}

function ExplicitHtmlApp() @{
	const [markup, setMarkup] = createSignal('<span class="html-node">safe enough</span>');
	<>
		<div class="explicit-html-child" innerHTML={markup()} />
		<button
			class="explicit-html-update"
			onClick={() => {
				setMarkup('<strong class="html-node">updated</strong>');
			}}
		>{'update'}</button>
	</>
}

function SpreadHtmlApp() @{
	const [spreadProps, setSpreadProps] = createSignal({
		innerHTML: '<em class="html-node">spread</em>',
	});
	const [markup, setMarkup] = createSignal('<span class="html-node">safe enough</span>');
	<>
		<div class="spread-html-child" {...spreadProps()} innerHTML={markup()} />
		<button
			class="spread-html-update-spread"
			onClick={() => {
				setSpreadProps({ innerHTML: '<i class="html-node">spread update</i>' });
			}}
		>{'spread'}</button>
		<button
			class="spread-html-update-markup"
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
	<section class="callable-block-runtime">
		<p class="decl-block">{readDeclaration()}</p>
		<p class="arrow-block">{readArrow()}</p>
		<p class="method-block">{reader.read()}</p>
	</section>
}

// ── Reactive counter (signals) ──

function CounterApp() @{
	const [count, setCount] = createSignal(0);
	<>
		<p class="count">{count()}</p>
		<button class="inc" onClick={() => setCount(count() + 1)}>{'+'}</button>
	</>
}

// ── Refs on elements via ref={expr} assignment sugar ──

let element_ref_captured: HTMLDivElement | null = null;

function ElementRefApp() @{
	let el: HTMLDivElement | undefined;
	queueMicrotask(() => {
		element_ref_captured = el ?? null;
	});
	<div ref={el} class="ref-target">{'ref test'}</div>
}

// ── Ref callback via plain ref={callback} on elements ──

let callback_ref_captured: HTMLDivElement | null = null;

function ElementRefCallbackApp() @{
	<div
		ref={(node: HTMLDivElement) => {
			callback_ref_captured = node;
		}}
		class="ref-callback"
	>ref callback</div>
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

// ── ref={expr} on composite components forwards through `props.ref` ──
// Solid's spread runtime applies `props.ref` automatically when the child
// spreads `{...props}` onto a DOM element, so `ref={fn}` on a composite
// travels down without any explicit plumbing in the child.

let spread_ref_captured: HTMLInputElement | null = null;

function SpreadRefChild(props: { type: string }) @{
	<input {...props} />
}

function SpreadRefApp() @{
	function onMount(node: HTMLInputElement) {
		spread_ref_captured = node;
	}
	<SpreadRefChild type="text" ref={onMount} />
}

// ── Multiple refs on the same DOM element ──
// Solid's applyRef iterates array refs and invokes each with the element.

let multi_dom_a: HTMLInputElement | null = null;
let multi_dom_b: HTMLInputElement | null = null;

function MultiDomRefApp() @{
	function refA(node: HTMLInputElement) {
		multi_dom_a = node;
	}
	function refB(node: HTMLInputElement) {
		multi_dom_b = node;
	}
	<input type="text" ref={[refA, refB]} />
}

let mixed_keyword_node: HTMLInputElement | null = null;
let mixed_jsx_node: HTMLInputElement | null = null;

function MixedDomRefApp() @{
	function keywordRef(node: HTMLInputElement) {
		mixed_keyword_node = node;
	}
	function jsxRef(node: HTMLInputElement) {
		mixed_jsx_node = node;
	}
	<input type="text" ref={[keywordRef, jsxRef]} />
}

// ── Multiple ref={...} on the same composite component ──
// Each ref sees the same underlying DOM node once the child spreads props.

let multi_comp_a: HTMLInputElement | null = null;
let multi_comp_b: HTMLInputElement | null = null;
let multi_comp_c: HTMLInputElement | null = null;

function MultiCompRefApp() @{
	function refA(node: HTMLInputElement) {
		multi_comp_a = node;
	}
	function refB(node: HTMLInputElement) {
		multi_comp_b = node;
	}
	function refC(node: HTMLInputElement) {
		multi_comp_c = node;
	}
	<SpreadRefChild type="text" ref={[refA, refB, refC]} />
}

// ── Deep ref propagation through nested composite components ──

let deep_ref_captured: HTMLInputElement | null = null;

function DeepInner(props: { type: string }) @{
	<input {...props} />
}

function DeepOuter(props: { type: string }) @{
	<DeepInner {...props} />
}

function DeepRefApp() @{
	function onMount(node: HTMLInputElement) {
		deep_ref_captured = node;
	}
	<DeepOuter type="text" ref={onMount} />
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
		ref={[
			nativeRef,
			anonymousRef,
			(node: HTMLInputElement | null) => {
				named_direct_node = node;
			},
		]}
		class="named-direct-ref"
		type="text"
	/>
}

let named_forward_node: HTMLInputElement | null = null;

function NamedForwardInput(props: { type: string; input_ref?: any }) @{
	<input type={props.type} ref={props.input_ref} class="named-forward-ref" />
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
	<input {...props} ref={[input_ref, namedSpreadBeforeNativeRef]} class="named-spread-before-ref" />
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
	<input ref={[namedSpreadAfterNativeRef, input_ref]} {...props} class="named-spread-after-ref" />
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
		class="multi-spread-explicit-ref"
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

const named_ref_object: { value: HTMLInputElement | null } = { value: null };

function NamedRefObjectApp() @{
	<NamedForwardInput
		type="text"
		input_ref={(node: HTMLInputElement | null) => {
			named_ref_object.value = node;
		}}
	/>
}

// ── If-statement with reactivity ──

function IfReactiveApp() @{
	const [show, setShow] = createSignal(true);
	<>
		@if (show()) {
			<span class="visible">{'shown'}</span>
		} @else {
			<span class="hidden">{'hidden'}</span>
		}
		<button class="toggle" onClick={() => setShow(!show())}>{'toggle'}</button>
	</>
}

// ── For-of loop with reactivity ──

function ForReactiveApp() @{
	const [items, setItems] = createSignal(['a', 'b', 'c']);
	<>
		@for (const item of items(); index i) {
			<li class="item">{item()}</li>
		}
		<button class="add" onClick={() => setItems([...items(), 'd'])}>{'add'}</button>
		<button class="remove" onClick={() => setItems(items().slice(1))}>{'remove'}</button>
	</>
}

function ForFilteredApp() @{
	const items = ['a', '', 'c'];
	const visibleItems = items.filter(Boolean);
	@for (const item of visibleItems) {
		const item_value = item;
		<li class="continue-item">{item_value}</li>
	}
}

function ForContinueAfterPriorJsxApp() @{
	const items = ['a', '', 'c'];
	@for (const item of items) {
		const item_value = item;
		<>
			<span class="continue-before">{`before-${item_value || 'empty'}`}</span>
			@if (item_value) {
				<span class="continue-after">{`after-${item_value}`}</span>
			}
		</>
	}
}

// ── Switch with reactivity ──

function SwitchReactiveApp() @{
	const [page, setPage] = createSignal('home');
	<>
		@switch (page()) {
			@case 'home': {
				<div class="page">{'Home'}</div>
			}
			@case 'about': {
				<div class="page">{'About'}</div>
			}
			@default: {
				<div class="page">{'404'}</div>
			}
		}
		<button class="go-about" onClick={() => setPage('about')}>{'about'}</button>
		<button class="go-unknown" onClick={() => setPage('other')}>{'other'}</button>
	</>
}

function GuardTrailingReturnApp() @{
	const [kind, setKind] = createSignal('skip');
	if (kind() === 'done') {
		return <><p class="guard-result">{'done'}</p></>;
	}
	<>
		<p class="guard-rest">{'rest'}</p>
		<button class="guard-done" onClick={() => setKind('done')}>{'done'}</button>
	</>
}

// ── Composite children ──

function Wrapper(props: { children?: any }) @{
	<div class="wrapper">{props.children}</div>
}

function ChildrenApp() @{
	<Wrapper>
		<span>{'inside wrapper'}</span>
	</Wrapper>
}

// ── If-statement children through composite ──

function IfChildrenApp() @{
	const [show, setShow] = createSignal(false);
	<>
		<Wrapper>
			@if (show()) {
				<span class="inner-visible">{'inner shown'}</span>
			}
		</Wrapper>
		<button class="toggle" onClick={() => setShow(!show())}>{'toggle'}</button>
	</>
}

// ── Scoped CSS ──

function StyledApp() @{
	<>
		<div class="styled">{'styled text'}</div>
		<style>
			.styled {
				color: red;
			}
		</style>
	</>
}

// ── Try/catch: synchronous error boundary ──

function ThrowingChild(): JSX.Element @{
	throw new Error('sync boom');
	<p>{'unreachable'}</p>
}

function ErrorBoundaryApp() @{
	@try {
		<ThrowingChild />
	} @catch (err) {
		<p class="caught">{(err() as Error).message}</p>
	}
}

// ── Try/catch with reset: recover from error ──

function MaybeThrow(props: { shouldThrow: boolean }) @{
	if (props.shouldThrow) {
		throw new Error('conditional boom');
	}
	<p class="ok">{'no error'}</p>
}

function ErrorToggleApp() @{
	const [fail, setFail] = createSignal(false);
	<>
		@try {
			<MaybeThrow shouldThrow={fail()} />
		} @catch (err, reset) {
			<>
				<p class="caught">{(err() as Error).message}</p>
				<button
					class="reset"
					onClick={() => {
						setFail(false);
						reset();
					}}
				>{'reset'}</button>
			</>
		}
		<button class="trigger-error" onClick={() => setFail(true)}>{'break'}</button>
	</>
}

// ── Try/pending: Loading boundary with lazy() ──

function ResolvedChild(props: { value: string }) @{
	<p class="resolved">{props.value}</p>
}

function SuspenseApp(props: { loader: () => Promise<{ default: typeof ResolvedChild }> }) @{
	const LazyChild = lazy(props.loader);
	@try {
		<LazyChild value="hello" />
	} @pending {
		<p class="pending">{'loading...'}</p>
	}
}

function EmptyPendingSuspenseApp(props: {
	loader: () => Promise<{ default: typeof ResolvedChild }>;
}) @{
	const LazyChild = lazy(props.loader);
	@try {
		<LazyChild value="hello" />
	} @pending {}
}

// ── Try/pending/catch: Loading + Errored ──

function SuspenseErrorApp(props: { loader: () => Promise<{ default: typeof ResolvedChild }> }) @{
	const LazyChild = lazy(props.loader);
	@try {
		<LazyChild value="hello" />
	} @pending {
		<p class="pending">{'loading...'}</p>
	} @catch (err) {
		<p class="caught">{(err() as Error).message}</p>
	}
}

// ── Nested try: inner catch handles inner error ──

function InnerThrow(): JSX.Element @{
	throw new Error('inner error');
	<p>{'unreachable'}</p>
}

function NestedTryApp() @{
	@try {
		<div class="outer">
			@try {
				<InnerThrow />
			} @catch (err) {
				<p class="inner-caught">{(err() as Error).message}</p>
			}
		</div>
	} @catch (err) {
		<p class="outer-caught">{(err() as Error).message}</p>
	}
}

// ── If inside try body ──

function IfInsideTryApp() @{
	const [show, setShow] = createSignal(true);
	<>
		@try {
			@if (show()) {
				<p class="branch-a">{'visible'}</p>
			} @else {
				<p class="branch-b">{'alternate'}</p>
			}
		} @catch (err) {
			<p class="caught">{'error'}</p>
		}
		<button class="toggle" onClick={() => setShow(!show())}>{'toggle'}</button>
	</>
}

// ── For-of inside try body ──

function ForInsideTryApp() @{
	const [items, setItems] = createSignal(['x', 'y']);
	<>
		@try {
			@for (const item of items(); index i) {
				<span class="try-item">{item()}</span>
			}
		} @catch (err) {
			<p class="caught">{'error'}</p>
		}
		<button class="add" onClick={() => setItems([...items(), 'z'])}>{'add'}</button>
	</>
}

// ── Signal inside if-branch ──

function SignalInIfApp() @{
	const [show, setShow] = createSignal(true);
	<>
		@if (show()) {
			const [count, setCount] = createSignal(0);
			<>
				<p class="sig-if-count">{count()}</p>
				<button class="sig-if-inc" onClick={() => setCount(count() + 1)}>{'inc'}</button>
			</>
		} @else {
			<p class="sig-if-hidden">{'hidden'}</p>
		}
		<button class="sig-if-toggle" onClick={() => setShow(!show())}>{'toggle'}</button>
	</>
}

// ── Signal inside both if-else branches ──

function SignalInBothBranchesApp() @{
	const [mode, setMode] = createSignal('a');
	<>
		@if (mode() === 'a') {
			const [x, setX] = createSignal(10);
			<>
				<p class="branch-val">{x()}</p>
				<button class="branch-inc" onClick={() => setX(x() + 1)}>{'inc'}</button>
			</>
		} @else {
			const [y, setY] = createSignal(20);
			<>
				<p class="branch-val">{y()}</p>
				<button class="branch-inc" onClick={() => setY(y() + 1)}>{'inc'}</button>
			</>
		}
		<button
			class="branch-toggle"
			onClick={() => setMode(mode() === 'a' ? 'b' : 'a')}
		>{'toggle'}</button>
	</>
}

// ── Signal inside if closing over parent scope ──

function SignalClosingOverScopeApp() @{
	const [multiplier, setMultiplier] = createSignal(2);
	<>
		@if (multiplier() > 0) {
			const [base, setBase] = createSignal(5);
			<>
				<p class="scope-result">
					{base() * multiplier()}
				</p>
				<button class="scope-inc-base" onClick={() => setBase(base() + 1)}>{'inc base'}</button>
			</>
		}
		<button
			class="scope-inc-mult"
			onClick={() => setMultiplier(multiplier() + 1)}
		>{'inc multiplier'}</button>
	</>
}

// ── Signal inside for-of loop body ──
// NOTE: Solid's <For keyed={false}> passes each item as an accessor (`() => T`)
// and the index as a raw number. This differs from the React runtime tests.

function SignalInForApp() @{
	const [items, setItems] = createSignal(['a', 'b']);
	<>
		@for (const item of items(); index i) {
			const item_value = (item as unknown as () => string)();
			const [clicked, setClicked] = createSignal(false);
			<div class="sig-for-item">
				<span>
					{item_value + (clicked() ? '!' : '')}
				</span>
				<button
					class={'sig-for-click-' + item_value}
					onClick={() => setClicked(true)}
				>{'click'}</button>
			</div>
		}
		<button class="sig-for-add" onClick={() => setItems([...items(), 'c'])}>{'add'}</button>
	</>
}

// ── Signal inside switch case ──

function SignalInSwitchApp() @{
	const [page, setPage] = createSignal('home');
	<>
		@switch (page()) {
			@case 'home': {
				const [homeCount, setHomeCount] = createSignal(0);
				<>
					<p class="sig-switch-val">{homeCount()}</p>
					<button
						class="sig-switch-inc"
						onClick={() => setHomeCount(homeCount() + 1)}
					>{'inc'}</button>
				</>
			}
			@case 'about': {
				<p class="sig-switch-val">{'about page'}</p>
			}
		}
		<button class="sig-switch-go" onClick={() => setPage('about')}>{'about'}</button>
	</>
}

// ── Component guard return before signals with parent scope ──

function GuardReturnWithSignalsApp() @{
	const [count, setCount] = createSignal(0);
	const [skip, setSkip] = createSignal(false);
	if (skip()) {
		return null;
	}
	const [doubled, setDoubled] = createSignal(0);

	<>
		<p class="early-count">{count()}</p>
		<p class="early-doubled">{doubled()}</p>
		<button
			class="early-inc"
			onClick={() => {
				setCount(count() + 1);
				setDoubled((count() + 1) * 2);
			}}
		>{'inc'}</button>
		<button class="early-skip" onClick={() => setSkip(true)}>{'skip'}</button>
	</>
}

function ConditionalBranchTemplateApp() @{
	const [guard, setGuard] = createSignal(false);
	<>
		<button class="template-return-toggle" onClick={() => setGuard(!guard())}>{'toggle'}</button>
		@if (!guard()) {
			<p class="template-return-rest">{'rest'}</p>
		} @else {
			<p class="template-return-guard">{'guard'}</p>
		}
	</>
}

// ── Static structure inside control flow ──

function StaticInBranchApp() @{
	const [show, setShow] = createSignal(true);
	<>
		@if (show()) {
			<div class="branch-static">
				<span>{'Always the same'}</span>
			</div>
		}
		<button class="static-toggle" onClick={() => setShow(!show())}>{'toggle'}</button>
	</>
}

// ── Mixed static + dynamic siblings ──

function MixedStaticDynamicApp() @{
	const [count, setCount] = createSignal(0);
	<>
		<header class="static-header">
			<h1>{'Static Title'}</h1>
		</header>
		<p class="dynamic-count">{count()}</p>
		<footer class="static-footer">{'Static Footer'}</footer>
		<button class="mixed-inc" onClick={() => setCount(count() + 1)}>{'inc'}</button>
	</>
}

// ── Fully static component ──

function FullyStaticApp() @{
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

function MidTemplateLocalsApp() @{
	<div class="mid-template-shell">@{
		const [count, setCount] = createSignal(0);
		mid_template_log.push('ran');
		<>
			@for (const item of ['a', 'b']; index i) {
				<span class="mid-template-item">{item()}</span>
			}
			<p class="mid-template-count">{count()}</p>
			<button class="mid-template-inc" onClick={() => setCount(count() + 1)}>{'inc'}</button>
			<div class="mid-template-side"></div>
		</>
	}</div>
}

// ── Lazy destructuring: object in props ──

function LazyPropsChild(&{ name, age }: { name: string; age: number }) @{
	<div class="lazy-props">
		{name}
		{' is '}
		{age}
	</div>
}

function LazyPropsApp() @{
	<LazyPropsChild name="Alice" age={30} />
}

// ── Lazy destructuring: array in variable (signals) ──

function LazyArrayApp() @{
	const [count, setCount] = createSignal(0);
	<>
		<p class="lazy-count">{count()}</p>
		<button class="lazy-inc" onClick={() => setCount(count() + 1)}>{'+'}</button>
	</>
}

// ── Lazy destructuring: object in variable ──

function LazyObjVarApp() @{
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

function LazyCombinedApp(&{ label }: { label: string }) @{
	const [count, setCount] = createSignal(0);
	<>
		<p class="lazy-combined">
			{label}
			{': '}
			{count()}
		</p>
		<button class="lazy-combined-inc" onClick={() => setCount(count() + 1)}>{'+'}</button>
	</>
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

	it('renders dynamic host elements', async () => {
		await render(DynamicElementApp);
		const element = container.querySelector('.dynamic-host');
		expect(element?.tagName).toBe('SECTION');
		expect(element?.textContent).toBe('dynamic element');
	});

	it('renders dynamic components', async () => {
		await render(DynamicComponentApp);
		expect(text('.dynamic-child')).toBe('dynamic component');
	});

	it('updates when the dynamic is prop changes', async () => {
		await render(DynamicSwitchApp);
		let element = container.querySelector('.dynamic-switch');
		expect(element?.tagName).toBe('SECTION');
		expect(element?.textContent).toBe('section');

		await click('.dynamic-switch-toggle');
		element = container.querySelector('.dynamic-switch');
		expect(element?.tagName).toBe('ARTICLE');
		expect(element?.textContent).toBe('article');
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

	it('supports ref={el} assignment sugar on elements', async () => {
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
		'ref={expr} on a composite component forwards through {...props} to the DOM element',
		async () => {
			spread_ref_captured = null;
			await render(SpreadRefApp);
			expect(spread_ref_captured).toBeInstanceOf(HTMLInputElement);
			expect(spread_ref_captured!.type).toBe('text');
		},
	);

	it('supports multiple ref={...} on the same DOM element', async () => {
		multi_dom_a = null;
		multi_dom_b = null;
		await render(MultiDomRefApp);
		expect(multi_dom_a).toBeInstanceOf(HTMLInputElement);
		expect(multi_dom_b).toBeInstanceOf(HTMLInputElement);
		expect(multi_dom_a).toBe(multi_dom_b);
	});

	it('mixes Ripple ref={expr} and TSX-style ref={expr} on the same DOM element', async () => {
		mixed_keyword_node = null;
		mixed_jsx_node = null;
		await render(MixedDomRefApp);
		expect(mixed_keyword_node).toBeInstanceOf(HTMLInputElement);
		expect(mixed_keyword_node).toBe(mixed_jsx_node);
	});

	it('supports multiple ref={...} on the same composite component', async () => {
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

	it('ref={expr} propagates through nested composite components', async () => {
		deep_ref_captured = null;
		await render(DeepRefApp);
		expect(deep_ref_captured).toBeInstanceOf(HTMLInputElement);
		expect(deep_ref_captured!.type).toBe('text');
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

	it('assigns explicitly adapted named ref props backed by value-like objects', async () => {
		named_ref_object.value = null;
		await render(NamedRefObjectApp);
		expect(named_ref_object.value).toBeInstanceOf(HTMLInputElement);
		expect(named_ref_object.value!.className).toBe('named-forward-ref');
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

	it('renders filtered for-of items', async () => {
		await render(ForFilteredApp);
		expect(
			Array.from(container.querySelectorAll('.continue-item'), (item) => item.textContent),
		).toEqual([
			'a',
			'c',
		]);
	});

	it('keeps prior JSX children when conditional output skips a for-of continuation', async () => {
		await render(ForContinueAfterPriorJsxApp);
		expect(
			Array.from(container.querySelectorAll('.continue-before'), (item) => item.textContent),
		).toEqual([
			'before-a',
			'before-empty',
			'before-c',
		]);
		expect(
			Array.from(container.querySelectorAll('.continue-after'), (item) => item.textContent),
		).toEqual([
			'after-a',
			'after-c',
		]);
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

	it('renders trailing component output for guard return cases', async () => {
		await render(GuardTrailingReturnApp);
		expect(text('.guard-rest')).toBe('rest');
		expect(container.querySelector('.guard-result')).toBeNull();

		await click('.guard-done');
		expect(text('.guard-result')).toBe('done');
		expect(container.querySelector('.guard-rest')).toBeNull();
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

	it('renders nothing for an empty pending fallback then resolves (<Loading> + lazy)', async () => {
		let resolve_fn: (mod: { default: typeof ResolvedChild }) => void;
		const loader = () => new Promise<{ default: typeof ResolvedChild }>((r) => {
			resolve_fn = r;
		});

		await render(EmptyPendingSuspenseApp, { loader });
		expect(container.innerHTML).toBe('');
		expect(container.querySelector('.resolved')).toBeNull();

		resolve_fn!({ default: ResolvedChild });
		await flush();
		await flush();
		expect(text('.resolved')).toBe('hello');
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

	it('component guard return before signals updates reactively', async () => {
		await render(GuardReturnWithSignalsApp);
		expect(text('.early-count')).toBe('0');
		expect(text('.early-doubled')).toBe('0');

		await click('.early-inc');
		expect(text('.early-count')).toBe('1');
		expect(text('.early-doubled')).toBe('2');

		await click('.early-skip');
		expect(container.querySelector('.early-count')).toBeNull();
		expect(container.querySelector('.early-doubled')).toBeNull();
	});

	it('conditional branch template updates reactively', async () => {
		await render(ConditionalBranchTemplateApp);
		expect(text('.template-return-toggle')).toBe('toggle');
		expect(text('.template-return-rest')).toBe('rest');
		expect(container.querySelector('.template-return-guard')).toBeNull();

		await click('.template-return-toggle');
		expect(text('.template-return-toggle')).toBe('toggle');
		expect(text('.template-return-guard')).toBe('guard');
		expect(container.querySelector('.template-return-rest')).toBeNull();
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

runSwitchFallthroughRuntimeTests();
runTsxExpressionTsrxRuntimeTests();
