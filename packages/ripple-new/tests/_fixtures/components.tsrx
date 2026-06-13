import { useState, createContext, use } from 'ripple-new';

export function Label(props) @{
	<span class="lbl">
		{props.text as string}
	</span>
}

export function Greeting(props) @{
	<div>
		<Label text={props.name} />
	</div>
}

// Context test setup.
export const Theme = createContext('light');

export function ThemeReader() @{
	const theme = use(Theme);
	<span class="theme">
		{theme as string}
	</span>
}

export function App() @{
	const [n, setN] = useState(0);
	<div>
		<button onClick={() => setN(n + 1)}>
			{n as string}
		</button>
		<Theme.Provider value={n % 2 === 0 ? 'light' : 'dark'}>
			<ThemeReader />
		</Theme.Provider>
	</div>
}

// Nested Providers — inner overrides outer.
export function Nested() @{
	<div>
		<Theme.Provider value="outer">
			<div class="o">
				<ThemeReader />
			</div>
			<Theme.Provider value="inner">
				<div class="i">
					<ThemeReader />
				</div>
			</Theme.Provider>
		</Theme.Provider>
	</div>
}

// No Provider — falls back to default.
export function DefaultOnly() @{
	<div>
		<ThemeReader />
	</div>
}

// Key-driven remount fixtures: KeyHost wraps a Counter that owns its own
// useState + useEffect. The host passes `props.k` as the component slot's
// key — changing it triggers a fresh Block (state resets, cleanup fires,
// mount effect runs again). Same key + new props re-renders in place.
import { useEffect } from 'ripple-new';

export let mountCount = 0;
export let cleanupCount = 0;
export function resetKeyCounters() {
	mountCount = 0;
	cleanupCount = 0;
}

export function Counter(props) @{
	const [n, setN] = useState(0);
	useEffect(() => {
		mountCount++;
		return () => {
			cleanupCount++;
		};
	}, []);
	<div class="kh">
		<span class="label">
			{props.label ?? '' as string}
		</span>
		<span class="count">
			{n as string}
		</span>
		<button class="inc" onClick={() => setN(n + 1)}>{'+'}</button>
	</div>
}

export function KeyHost(props) @{
	<Counter key={props.k} label={props.label} />
}
