// Editor-only shims — the bench builds through vite/esbuild (no typecheck).
declare module '*.vue' {
	const component: unknown;
	export default component;
}
