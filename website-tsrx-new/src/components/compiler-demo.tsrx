// TEMPORARY STUB for the ripple-new migration.
//
// The live multi-target compiler playground (Ripple `track`/`effect`/`bindValue`/
// `bindNode` + imperative CodeMirror lifecycle) is being ported to ripple-new's
// React-shape hooks (useState/useReducer/useEffect/useRef + controlled inputs).
// Until that port lands this placeholder keeps the rest of the site booting so
// the 10 static routes can be verified end-to-end on ripple-new. The original
// lives at website-tsrx/src/components/compiler-demo.tsrx for reference.
export function CompilerDemo() @{
	<section class="demo-shell" id="demo">
		<p class="demo-placeholder">
			The interactive compiler playground is being ported to the ripple-new renderer.
		</p>
		<style>
			.demo-shell {
				padding: 2rem;
				border: 1px solid rgba(94, 44, 255, 0.2);
				border-radius: 12px;
			}
			.demo-placeholder {
				margin: 0;
				color: rgba(26, 22, 64, 0.6);
			}
		</style>
	</section>
}
