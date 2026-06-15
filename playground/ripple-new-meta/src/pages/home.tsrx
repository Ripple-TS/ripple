// Website page shape: <head> (per-route title/meta) + <style> + ONE body root.
// Head extraction collapses it to a single <section> root that hydrates.
export function Home(props: { params: Record<string, string> }) @{
	const [count, setCount] = useState(0);
	<>
		<head>
			<title>Home - ripple-new meta</title>
			<meta name="description" content="The ripple-new metaframework dev-SSR demo home page." />
		</head>
		<section class="page" id="home">
			<header class="app-header">
				<a href="/"><strong>ripple-new meta</strong></a>
				<nav><a href="/">Home</a> <a href="/about">About</a></nav>
			</header>
			<h1>Home</h1>
			<p>Server-rendered, then hydrated by @ripple-ts/vite-plugin-new.</p>
			<button class="counter" id="counter" onClick={() => setCount(count + 1)}>
				{`count: ${count}`}
			</button>
		</section>
	</>
}
