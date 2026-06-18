// Renderable `{expr}` holes (no string cast) — mirror Ripple/React: a
// component / element descriptor / children render-fn RENDERS, a primitive
// coerces to text, and null/undefined/boolean/'' render nothing.

export function Inner() @{
	<span id="inner">INNER</span>
}

export function Counter(props) @{
	const [n, setN] = useState(0);
	<button id="counter" onClick={() => setN(n + 1)}>{`count:${n}`}</button>
}

// Sole-child renderable hole (textOnlyChild path).
export function Hole(props) @{
	<div id="h">{props.value}</div>
}

// Mixed-children renderable hole (the layout `{children}` pattern).
export function Layout(props) @{
	<main id="layout">
		<header>HEAD</header>
		{props.children}
		<footer>FOOT</footer>
	</main>
}

// Multi-root FRAGMENT `{children}` — the exact website-tsrx Layout shape
// (`<>{children}<style/></>`), here without the style. Top-level childSlot.
export function FragLayout(props) @{
	<>
		{props.children}
	</>
}
