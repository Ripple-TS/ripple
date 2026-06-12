export function Layout({ children }: { children: any }) @{
	<>
		{children}
		<style>
			:global(*) {
				box-sizing: border-box;
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

			/* Shared page chrome: header, nav, footer, docs side nav, and common
			   typography used across routes. Pages override with scoped rules. */
			:global(html) {
				scroll-behavior: smooth;
				overflow-x: clip;
				scrollbar-gutter: stable;
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
					radial-gradient(circle at top, rgba(146, 92, 255, 0.14), transparent 15%),
					radial-gradient(circle at 80% 10%, rgba(111, 0, 255, 0.1), transparent 15%),
					linear-gradient(180deg, #ffffff 0%, #f6f3ff 46%, #f2f4fb 100%);
				background-repeat: no-repeat;
				background-size:
					100% 100vh,
					100% 100vh,
					100% 100%;
				min-height: 100vh;
				overflow-x: clip;
			}

			:global(.app-shell) {
				position: relative;
				z-index: 1;
				width: 100%;
			}

			:global(.masthead) {
				display: flex;
				justify-content: space-between;
				align-items: center;
				gap: 1rem;
				padding: 1rem 0 2rem;
				flex-wrap: wrap;
			}

			:global(.masthead-nav) {
				display: inline-flex;
				gap: 1rem;
				font-size: 0.95rem;
				color: rgba(26, 22, 64, 0.7);
			}

			:global(.masthead-nav a) {
				white-space: nowrap;
			}

			:global(.masthead-nav a[aria-current='page']) {
				color: #5e2cff;
				font-weight: 500;
			}

			:global(.masthead-nav a:hover) {
				color: #5e2cff;
			}

			:global(.header-logo) {
				display: block;
				width: 3.2rem;
				height: 3.2rem;
			}

			:global(.brand-lockup) {
				display: inline-flex;
				align-items: center;
			}

			:global(.site-footer) {
				margin-top: 4rem;
				padding: 2rem 0;
				border-top: 1px solid rgba(26, 22, 64, 0.1);
				text-align: center;
			}

			:global(.site-footer p) {
				margin: 0;
				font-size: 0.88rem;
				line-height: 1.6;
				color: rgba(26, 22, 64, 0.5);
			}

			:global(.inline-code) {
				display: inline-block;
				background: rgba(94, 44, 255, 0.1);
				color: #5e2cff;
				padding: 0.16em 0.48em;
				margin: 0 0.18em;
				border-radius: 4px;
				font-size: 0.92em;
			}

			:global(.side-nav) {
				position: sticky;
				top: 1.5rem;
				padding-top: 0.5rem;
			}

			:global(.side-nav-dropdown) {
				display: none;
			}

			:global(.side-nav-dropdown-label) {
				display: block;
				margin: 0 0 0.45rem;
				font-size: 0.72rem;
				font-weight: 600;
				text-transform: uppercase;
				letter-spacing: 0.06em;
				color: rgba(26, 22, 64, 0.45);
			}

			:global(.side-nav-select) {
				width: 100%;
				padding: 0.75rem 3rem 0.75rem 1.2rem;
				border: 1px solid rgba(94, 44, 255, 0.12);
				border-radius: 0.9rem;
				background-color: rgba(255, 255, 255, 0.92);
				color: #1a1640;
				appearance: none;
				-webkit-appearance: none;
				-moz-appearance: none;
				background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M6 8l4 4 4-4' stroke='%231a1640' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
				background-repeat: no-repeat;
				background-size: 0.95rem;
				background-position: right 1.2rem center;
			}

			:global(.side-nav-heading) {
				margin: 0 0 0.75rem;
				font-size: 0.78rem;
				font-weight: 600;
				text-transform: uppercase;
				letter-spacing: 0.06em;
				color: rgba(26, 22, 64, 0.45);
			}

			:global(.side-nav-link) {
				display: block;
				padding: 0.3rem 0;
				font-size: 0.9rem;
				color: rgba(26, 22, 64, 0.6);
				transition: color 0.15s;
			}

			:global(.side-nav-link:hover) {
				color: #5e2cff;
			}

			:global(.docs-content) {
				min-width: 0;
			}

			/* Shared code example styling. Pages may override spacing (margin,
			   border-radius) with their own scoped .code-block rules. */
			:global(.code-block) {
				margin: 0.75rem 0 0;
				padding: 1.25rem 1.4rem;
				overflow-x: auto;
				background: #0e1528;
				color: #e7ecff;
				font-size: 0.88rem;
				line-height: 1.65;
				white-space: pre;
				-webkit-font-smoothing: antialiased;
			}

			/* Token colors emitted by lib/code-highlight.ts, matching the
			   playground's Dark+ (dark-plus) shiki theme. */
			:global(.code-block .ln) {
				color: rgba(255, 255, 255, 0.25);
				display: inline-block;
				width: 1.4rem;
				text-align: right;
				margin-right: 0.85rem;
				user-select: none;
			}

			:global(.code-block .kw) {
				color: #569cd6;
			}
			:global(.code-block .kw-export) {
				color: #c586c0;
			}
			:global(.code-block .kw-ctrl) {
				color: #c586c0;
			}
			:global(.code-block .kw-ctrl-br) {
				color: #c586c0;
			}
			:global(.code-block .fn) {
				color: #dcdcaa;
			}
			:global(.code-block .type) {
				color: #4ec9b0;
			}
			:global(.code-block .prop) {
				color: #9cdcfe;
			}
			:global(.code-block .str) {
				color: #ce9178;
			}
			:global(.code-block .comment),
			:global(.code-block .cmt) {
				color: #6a9955;
			}
			:global(.code-block .val) {
				color: #b5cea8;
			}
			:global(.code-block .el) {
				color: #569cd6;
			}
			:global(.code-block .tag) {
				color: #808080;
			}
			:global(.code-block .attr) {
				color: #9cdcfe;
			}
			:global(.code-block .br) {
				color: #d4d4d4;
			}
			:global(.code-block .tbr) {
				color: #569cd6;
			}
			:global(.code-block .css-sel) {
				color: #d7ba7d;
			}
			:global(.code-block .css-br) {
				color: #d4d4d4;
			}
			:global(.code-block .reactive) {
				color: #4fc1ff;
			}

			@media (max-width: 720px) {
				:global(.code-block) {
					padding: 1rem 0.75rem;
					font-size: 0.75rem;
					line-height: 1.55;
				}
			}
		</style>
	</>
}
