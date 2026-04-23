export component Layout({ children }: { children: any }) {
	<main class="shell">{children}</main>

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
			color: #eef2ff;
			background:
				radial-gradient(circle at top, rgba(119, 148, 255, 0.3), transparent 34%),
				radial-gradient(circle at 80% 20%, rgba(135, 93, 246, 0.22), transparent 28%),
				linear-gradient(180deg, #07111f 0%, #0b162d 45%, #0f1832 100%);
			min-height: 100vh;
			overflow-x: hidden;
		}

		:global(a) {
			color: inherit;
			text-decoration: none;
		}

		:global(button),
		:global(input),
		:global(textarea) {
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
}
