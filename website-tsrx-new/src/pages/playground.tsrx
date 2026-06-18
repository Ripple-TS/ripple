import { CompilerDemo } from '../components/compiler-demo.tsrx';

export function PlaygroundPage() @{
	<>
		<title>TSRX | Playground</title>
		<meta
			name="description"
			content="Try TSRX in the browser. Write component code and see the compiled code in real time."
		/>
		<div class="demo-page">
			<header class="demo-nav">
				<a class="brand-lockup" href="/" aria-label="TSRX home">
					<img class="header-logo" src="/images/tsrx-mark.svg?v=4" alt="TSRX logo" />
				</a>
				<nav class="nav-links">
					<a href="/getting-started">Getting Started</a>
					<a href="/features">Features</a>
					<a href="/specification">Specification</a>
					<a href="/playground" aria-current="page">Playground</a>
					<a href="/blog">Blog</a>
					<a href="https://discord.gg/HCYpT5QHQR" target="_blank" rel="noopener noreferrer">
						Discord
					</a>
					<a
						href="https://github.com/Ripple-TS/ripple/tree/main/packages/tsrx"
						target="_blank"
						rel="noopener noreferrer"
					>GitHub</a>
					<a href="/llms.txt" target="_blank" rel="noopener noreferrer">llms.txt</a>
				</nav>
			</header>

			<main class="demo-main">
				<CompilerDemo />
			</main>
		</div>
		<style>
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

			.nav-links {
				display: inline-flex;
				gap: 1rem;
				font-size: 0.95rem;
				color: rgba(26, 22, 64, 0.7);
			}

			.nav-links a {
				white-space: nowrap;
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
				.demo-page {
					padding-top: 0.5rem;
				}

				.demo-nav {
					padding: 0.75rem 0 1rem;
					flex-direction: column;
					justify-content: flex-start;
					align-items: stretch;
					gap: 0.85rem;
				}

				.brand-lockup {
					width: 100%;
					justify-content: center;
				}

				.nav-links {
					width: 100%;
					flex-wrap: wrap;
					justify-content: center;
					gap: 0.5rem;
					font-size: 0.82rem;
				}

				.nav-links a {
					display: inline-flex;
					align-items: center;
					min-height: 2rem;
					padding: 0.35rem 0.7rem;
					border: 1px solid rgba(94, 44, 255, 0.1);
					border-radius: 999px;
					background: rgba(94, 44, 255, 0.06);
					line-height: 1.1;
				}

				.nav-links a[aria-current='page'] {
					background: rgba(94, 44, 255, 0.12);
					border-color: rgba(94, 44, 255, 0.18);
				}

				.header-logo {
					width: 3.6rem;
					height: 3.6rem;
				}

				.demo-main {
					padding: 0;
				}
			}
		</style>
	</>
}
