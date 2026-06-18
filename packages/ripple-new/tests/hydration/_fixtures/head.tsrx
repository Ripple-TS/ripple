// Hoisted document metadata: `<title>`/`<meta>` rendered inline are NOT body
// DOM — they hoist to render().head / document.head (React-19 model), leaving a
// SINGLE body root (<section>) that hydrates via the single-root path (no
// <ripple-frag>). `<style>` likewise routes to CSS.
export function Page(props: { params: Record<string, string> }) @{
	const [n, setN] = useState(0);
	<>
		<title>TSRX Page</title>
		<meta name="description" content="A test page" />
		<style>
			.page {
				color: rebeccapurple;
			}
		</style>
		<section id="body" class="page">
			<h1>Hello</h1>
			<button id="bump" onClick={() => setN(n + 1)}>{`n:${n}`}</button>
		</section>
	</>
}
