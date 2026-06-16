export function About(props: { params: Record<string, string> }) @{
	<>
		<title>About - ripple-new meta</title>
		<meta name="description" content="About the ripple-new metaframework demo." />
		<section class="page" id="about">
			<header class="app-header">
				<a href="/">
					<strong>ripple-new meta</strong>
				</a>
				<nav>
					<a href="/">Home</a>

					<a href="/about">About</a>
				</nav>
			</header>
			<h1>About</h1>
			<p>A multi-route dev-SSR + hydration demo for the ripple-new renderer.</p>
			<p>This page is static: SSR markup is adopted on hydrate with no rebuild.</p>
		</section>
	</>
}
