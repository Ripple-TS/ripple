// Top-level <head> extraction: the <head> (and <style>) are NOT body DOM —
// they route to render().head / document.head, leaving a SINGLE body root
// (<section>) that hydrates via the single-root path (no <ripple-frag>).
export function Page(props: { params: Record<string, string> }) @{
	const [n, setN] = useState(0);
	<>
		<head>
			<title>TSRX Page</title>
			<meta name="description" content="A test page" />
		</head>
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
