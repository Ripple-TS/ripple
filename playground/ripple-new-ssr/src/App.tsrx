import { useState, use } from 'ripple-new';

// A module-level promise stands in for async data (a fetch / DB call). It is
// created once. On the SERVER, render() awaits it and serializes the resolved
// value into the HTML; on the CLIENT, hydrate() seeds that value back, so this
// use() returns synchronously and the boundary never re-suspends or re-fetches
// after hydration (including on later re-renders, e.g. clicking the counter).
const greeting = new Promise<string>((resolve) => {
	setTimeout(() => resolve('Hello from the server 👋'), 40);
});

// A single-root component (its root element is what hydrate() adopts). It mixes
// server-resolved async data (use), static markup, and an interactive counter
// (useState + onClick) — the click proves event handlers attached to the
// server-rendered DOM that the client adopted rather than rebuilt.
export function App() @{
	const message = use(greeting);
	const [count, setCount] = useState(0);

	<main class="app">
		<h1>
			{message as string}
		</h1>
		<p>
			{'This markup was rendered to HTML on the server, then hydrated in the browser. The async greeting was resolved server-side and seeded across the boundary — no client re-fetch. Click below: the handler is live.' as string}
		</p>
		<button id="counter" class="counter" onClick={() => setCount(count + 1)}>
			{'Clicked ' + count + (count === 1 ? ' time' : ' times') as string}
		</button>
	</main>
}
