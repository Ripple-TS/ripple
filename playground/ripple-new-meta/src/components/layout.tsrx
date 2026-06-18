// The website-tsrx Layout shape: a FRAGMENT whose only body root is
// `{children}` (+ global `<style>` → CSS). Hydrates via childSlot's cursor-adopt
// (single body root); each route's hoisted <title>/<meta> live in the pages.
export function Layout({ children }: { children: any }) @{
	<>
		{children}
		<style>
			:global(body) {
				margin: 0;
				font:
					15px/1.6 system-ui,
					-apple-system,
					'Segoe UI',
					sans-serif;
				color: #1a1640;
			}
			:global(a) {
				color: #5e2cff;
				text-decoration: none;
			}
		</style>
	</>
}
