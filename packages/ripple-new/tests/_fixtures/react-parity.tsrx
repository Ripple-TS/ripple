import { createRoot, createContext, useState, useContext } from 'ripple-new';

// --- Root render (React-style `root.render(<App/>)`) -----------------------
// App renders props.label every render (so prop updates are observable) and
// holds its own count (so block-identity reuse across re-renders is observable).
export function App(props) @{
	const [n, setN] = useState(5);
	<button id="app-btn" onClick={() => setN(n + 1)}>
		{props.label + ':' + n as string}
	</button>
}

// Uses the React element form — the compiler lowers <App/> to createElement(App, …).
export function mountApp(container: Element, label: string) {
	const root = createRoot(container);
	root.render(<App label={label} />);
	return root;
}

// Re-render via the element form: same component identity, new props.
export function rerender(root: any, label: string) {
	root.render(<App label={label} />);
}

// --- useContext ------------------------------------------------------------
const Theme = createContext('light');

export function ThemeReader() @{
	const theme = useContext(Theme);
	<span id="theme-read">
		{theme as string}
	</span>
}

export function ThemeApp(props) @{
	<Theme.Provider value={props.theme}>
		<ThemeReader />
	</Theme.Provider>
}

// --- camelCase style -------------------------------------------------------
export function CamelStyle(props) @{
	<div id="cs" style={props.style}>{'x'}</div>
}
