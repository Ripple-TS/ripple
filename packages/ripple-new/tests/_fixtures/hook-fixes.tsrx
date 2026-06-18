import {
	useState,
	useReducer,
	useEffect,
	useMemo,
	useCallback,
	useSyncExternalStore,
	use,
	createContext,
	memo,
} from 'ripple-new';

// ---------------------------------------------------------------------------
// #1 — effect cleanup lifecycle: old cleanup fires exactly once on dep change
// (before the new setup) and exactly once on unmount. No stale replays.
// ---------------------------------------------------------------------------
export function CleanupLifecycle(props) @{
	useEffect(() => {
		props.log('setup:' + props.n);
		return () => props.log('cleanup:' + props.n);
	}, [props.n]);
	<div>
		{props.n as string}
	</div>
}

// ---------------------------------------------------------------------------
// #2 — omitted deps: useEffect(fn) / useMemo(fn) with NO deps array. The
// compiler appends the slot last, so these arrive as (fn, slot); the runtime
// must treat the missing deps as "run/recompute every commit", not throw.
// ---------------------------------------------------------------------------
export function NoDeps(props) @{
	const [n, setN] = useState(0);
	// No deps array — runs on every commit.
	useEffect(() => {
		props.log('effect:' + n);
	});
	// No deps array — recomputes every render.
	const m = useMemo(() => {
		props.log('memo');
		return n * 10;
	});
	<button id="bump" onClick={() => setN(n + 1)}>
		{m as string}
	</button>
}

// ---------------------------------------------------------------------------
// #3 — useReducer init semantics.
//   2-arg form: a function passed as initialArg is the state AS-IS (not called).
//   3-arg form: init(initialArg) lazily computes the initial state.
// ---------------------------------------------------------------------------
export function ReducerFnInitialArg(props) @{
	// initialArg is a function — React stores it verbatim, does NOT call it.
	const [state] = useReducer((s) => s, () => 'fn-value');
	props.observe(state);
	<div>
		{typeof state as string}
	</div>
}

export function ReducerLazyInit() @{
	// Third arg is the lazy initializer: state = init(5) = 10.
	const [state] = useReducer((s, a: number) => s + a, 5, (x: number) => x * 2);
	<div id="v">
		{state as string}
	</div>
}

// ---------------------------------------------------------------------------
// #4 — memo: Object.is shallow compare + optional arePropsEqual comparator +
// context invalidation (a memo'd consumer re-renders when a context it reads
// changes, even though its props are shallow-equal).
// ---------------------------------------------------------------------------

// Object.is: a NaN prop should compare equal across renders → skip the body.
function PlainChildImpl(props) @{
	props.log('render');
	<span class="val">
		{String(props.value) as string}
	</span>
}
const PlainChild = memo(PlainChildImpl);

export function MemoObjectIs(props) @{
	const [, setTick] = useState(0);
	<div>
		<button id="rerender" onClick={() => setTick((t: number) => t + 1)}>{'go'}</button>
		<PlainChild value={NaN} log={props.log} />
	</div>
}

// Custom comparator: only re-render when `id` changes; ignore `noise`.
function ComparedChildImpl(props) @{
	props.log('render:' + props.id);
	<span class="cmp">
		{props.id as string}
	</span>
}
const ComparedChild = memo(ComparedChildImpl, (prev, next) => prev.id === next.id);

export function MemoComparator(props) @{
	const [noise, setNoise] = useState(0);
	const [id, setId] = useState(1);
	<div>
		<button id="noise" onClick={() => setNoise(noise + 1)}>{'noise'}</button>
		<button id="id" onClick={() => setId(id + 1)}>{'id'}</button>
		<ComparedChild id={id} noise={noise} log={props.log} />
	</div>
}

// Context invalidation through a memo boundary.
const Theme = createContext('light');

function ThemedChildImpl(props) @{
	const theme = use(Theme);
	props.log('render:' + theme);
	<span class="theme">
		{theme as string}
	</span>
}
const ThemedChild = memo(ThemedChildImpl);

export function MemoContext(props) @{
	const [theme, setTheme] = useState('light');
	// `label` is a stable prop so ThemedChild's props never change — only the
	// context value does. A correct memo must still re-render the child.
	<div>
		<Theme.Provider value={theme}>
			<ThemedChild label="x" log={props.log} />
		</Theme.Provider>
		<button
			id="toggle"
			onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
		>{'toggle'}</button>
	</div>
}

// Context invalidation reaching a consumer NESTED behind the memo boundary
// (the memo'd component doesn't read the context itself; a child does).
function DeepConsumer(props) @{
	const theme = use(Theme);
	props.log('deep:' + theme);
	<span class="deep">
		{theme as string}
	</span>
}

function MemoWrapperImpl(props) @{
	<div class="wrapper">
		<DeepConsumer log={props.log} />
	</div>
}
const MemoWrapper = memo(MemoWrapperImpl);

export function MemoContextDeep(props) @{
	const [theme, setTheme] = useState('light');
	<div>
		<Theme.Provider value={theme}>
			<MemoWrapper label="x" log={props.log} />
		</Theme.Provider>
		<button
			id="toggle"
			onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
		>{'toggle'}</button>
	</div>
}

// ---------------------------------------------------------------------------
// #5 — useSyncExternalStore: reads via getSnapshot, subscribes, and dedups
// notifications with Object.is (a notify with an unchanged snapshot must not
// re-render).
// ---------------------------------------------------------------------------
export function StoreConsumer(props) @{
	const value = useSyncExternalStore(props.store.subscribe, props.store.getSnapshot);
	props.log('render:' + value);
	<span class="store">
		{value as string}
	</span>
}

// ---------------------------------------------------------------------------
// deps-as-args (Ripple superset, retained): the effect/memo body receives the
// deps spread as positional arguments, so a body that closes over nothing is
// hoistable. Zero-arg React-style bodies still work.
// ---------------------------------------------------------------------------
export function DepsAsArgs(props) @{
	const doubled = useMemo((x) => x * 2, [props.n]);
	const cb = useCallback((label) => label, [props.label]);
	useEffect((n, log) => {
		log('eff:' + n);
	}, [props.n, props.log]);
	<div class="out">
		{doubled + ':' + cb(props.label) as string}
	</div>
}
