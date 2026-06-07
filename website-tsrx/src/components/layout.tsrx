export function Layout({ children }: { children: any }) {
	return <>
		<div class="shell">{children}</div>
		<style>
			:global(*) {
				box-sizing: border-box;
			}

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

			.shell {
				position: relative;
				z-index: 1;
				width: 100%;
				max-width: 100%;
			}
		</style>
	</>;
}
