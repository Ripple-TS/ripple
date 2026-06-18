export function BlogPage() @{
	<>
		<title>TSRX Blog</title>
		<meta
			name="description"
			content="Updates from the TSRX project: language changes, design notes, and release context."
		/>
		<div class="app-shell">
			<div class="page-shell">
				<header class="masthead">
					<a class="brand-lockup" href="/" aria-label="TSRX home">
						<img class="header-logo" src="/images/tsrx-mark.svg?v=4" alt="TSRX logo" />
					</a>
					<nav class="masthead-nav">
						<a href="/getting-started">Getting Started</a>
						<a href="/features">Features</a>
						<a href="/specification">Specification</a>
						<a href="/playground">Playground</a>
						<a href="/blog" aria-current="page">Blog</a>
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
				<main class="blog-shell">
					<h1>Blog</h1>
					<section class="post-list" aria-label="Blog posts">
						<article class="post-preview">
							<p class="post-date">June 7, 2026</p>
							<h2>
								<a href="/blog/rethinking-tsrx">Rethinking TSRX</a>
							</h2>
							<p>
								TSRX leans back into JSX: regular text, expression braces, comments,
								statement-container component bodies, and marked control flow only where templates
								need it.
							</p>
							<a class="read-link" href="/blog/rethinking-tsrx">Read the post</a>
						</article>
						<article class="post-preview">
							<p class="post-date">May 29, 2026</p>
							<h2>
								<a href="/blog/simplifying-tsrx-after-feedback">Simplifying TSRX after feedback</a>
							</h2>
							<p>
								We removed some early TSRX-only ideas and made the language feel closer to ordinary
								TypeScript and JSX.
							</p>
							<a class="read-link" href="/blog/simplifying-tsrx-after-feedback">Read the post</a>
						</article>
					</section>
				</main>
				<footer class="site-footer">
					<p>Released under the MIT License.</p>
					<p>Copyright © 2025-present Dominic Gannaway</p>
				</footer>
			</div>
		</div>
		<style>
			.page-shell {
				width: min(1040px, calc(100vw - 2rem));
				margin: 0 auto;
				padding: 1rem 0 4rem;
			}

			.blog-shell {
				width: min(780px, 100%);
				margin: 0;
				padding-top: 0.5rem;
			}

			h1 {
				margin: 0;
				font-size: clamp(2rem, 5vw, 3rem);
				line-height: 1.05;
				letter-spacing: 0;
			}

			.post-list {
				margin-top: 2rem;
			}

			.post-preview {
				padding: 1.5rem 0;
			}

			.post-date {
				margin: 0 0 0.5rem;
				font-size: 0.88rem;
				color: rgba(26, 22, 64, 0.52);
			}

			.post-preview h2 {
				margin: 0;
				font-size: clamp(1.6rem, 4vw, 2.25rem);
				line-height: 1.1;
				letter-spacing: 0;
			}

			.post-preview h2 a:hover,
			.read-link:hover {
				color: #5e2cff;
			}

			.post-preview p {
				max-width: 42rem;
				margin: 0.8rem 0 0;
				font-size: 1.05rem;
				line-height: 1.7;
				color: rgba(26, 22, 64, 0.72);
			}

			.read-link {
				display: inline-flex;
				margin-top: 1rem;
				font-weight: 700;
				color: #5e2cff;
			}

			@media (max-width: 720px) {
				.page-shell {
					width: calc(100vw - 1.5rem);
					padding: 0.5rem 0 2rem;
				}

				.masthead {
					padding: 0.75rem 0 1rem;
					align-items: flex-start;
					gap: 0.85rem;
				}

				.brand-lockup {
					width: 100%;
					justify-content: center;
				}

				.masthead-nav {
					display: flex;
					width: 100%;
					flex-wrap: wrap;
					justify-content: center;
					gap: 0.5rem;
					font-size: 0.82rem;
				}

				.masthead-nav a {
					display: inline-flex;
					align-items: center;
					min-height: 2rem;
					padding: 0.35rem 0.7rem;
					border: 1px solid rgba(94, 44, 255, 0.1);
					border-radius: 999px;
					background: rgba(94, 44, 255, 0.06);
					line-height: 1.1;
				}

				.masthead-nav a[aria-current='page'] {
					background: rgba(94, 44, 255, 0.12);
					border-color: rgba(94, 44, 255, 0.18);
				}

				.header-logo {
					width: 3.6rem;
					height: 3.6rem;
				}

				.post-preview p {
					font-size: 1rem;
				}
			}
		</style>
	</>
}
