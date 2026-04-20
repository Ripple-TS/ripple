import { CompilerDemo } from '../components/compiler-demo.tsrx';

export component PlaygroundPage() {
	<head>
		<title>{'TSRX | Playground'}</title>
		<meta
			name="description"
			content="Try TSRX in the browser. Write component code and see the compiled code in real time."
		/>
	</head>

	<div class="demo-page">
		<header class="demo-nav">
			<a class="brand-lockup" href="/" aria-label="TSRX home">
				<img class="header-logo" src="/images/tsrx-mark.svg?v=4" alt="TSRX logo" />
			</a>
			<nav class="nav-links">
				<a href="/getting-started">{'Getting Started'}</a>
				<a href="/docs">{'Docs'}</a>
				<a href="/playground" aria-current="page">{'Playground'}</a>
				<a
					href="https://github.com/Ripple-TS/ripple/tree/main/packages/tsrx"
					target="_blank"
					rel="noopener noreferrer"
				>
					{'GitHub'}
				</a>
			</nav>
		</header>

		<main class="demo-main">
			<CompilerDemo />
		</main>
	</div>

	<style>
		:global(*) {
			box-sizing: border-box;
		}

		:global(html) {
			scroll-behavior: smooth;
			overflow-x: hidden;
		}

		:global(body) {
			margin: 0;
			font-family:
				system-ui,
				-apple-system,
				BlinkMacSystemFont,
				'Segoe UI',
				Roboto,
				sans-serif;
			color: #1a1640;
			background:
				radial-gradient(circle at top, rgba(146, 92, 255, 0.14), transparent 28%),
				radial-gradient(circle at 80% 10%, rgba(111, 0, 255, 0.1), transparent 25%),
				linear-gradient(180deg, #ffffff 0%, #f6f3ff 46%, #f2f4fb 100%);
			min-height: 100vh;
			overflow-x: hidden;
		}

		:global(a) {
			color: inherit;
			text-decoration: none;
		}

		:global(button),
		:global(input),
		:global(textarea),
		:global(select) {
			font: inherit;
		}

		:global(code),
		:global(pre) {
			font-family: 'Spline Sans Mono', 'SFMono-Regular', monospace;
		}

		.demo-page {
			display: grid;
			grid-template-rows: auto 1fr;
			height: 100vh;
			width: 100%;
			overflow: hidden;
			padding-top: 1rem;
		}

		.demo-nav {
			display: flex;
			justify-content: space-between;
			align-items: center;
			gap: 1rem;
			width: min(1180px, calc(100vw - 2rem));
			margin: 0 auto;
			padding: 1rem 0 2rem;
			flex-wrap: wrap;
		}

		.brand-lockup {
			display: inline-flex;
			align-items: center;
		}

		.header-logo {
			display: block;
			width: 3.2rem;
			height: 3.2rem;
		}

		.nav-links {
			display: inline-flex;
			gap: 1rem;
			font-size: 0.95rem;
			color: rgba(26, 22, 64, 0.7);
		}

		.nav-links a:hover {
			color: #5e2cff;
		}

		.nav-links a[aria-current='page'] {
			color: #5e2cff;
			font-weight: 500;
		}

		.demo-main {
			padding: 0;
			width: 100%;
			max-width: 100%;
			display: flex;
			flex-direction: column;
			min-height: 0;
			overflow: hidden;
		}

		@media (max-width: 720px) {
			.demo-nav {
				padding: 1rem;
			}

			.demo-main {
				padding: 0;
			}
		}
	</style>
}
