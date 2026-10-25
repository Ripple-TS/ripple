import { track } from 'ripple';

export function Scripts({ nonce }: { nonce: string }) @{
	const version = track(0);
	<>
		<head>
			<script id="first-script" nonce={nonce} data-version={version.value}>
				window.__ripple_script_runs = (window.__ripple_script_runs || 0) + 1;
				window.__ripple_script_nonce = document.currentScript.nonce;
				window.__ripple_script_version = document.currentScript.dataset.version;
			</script>
			<meta name="between-scripts" content="preserved" />
			<script type="module" id="module-script" nonce={nonce}>
				window.__ripple_script_meta = typeof import.meta;
				window.__ripple_module_script_runs = (window.__ripple_module_script_runs || 0) + 1;
			</script>
			<script id="last-script" nonce="static-nonce">
				window.__ripple_last_script_runs = (window.__ripple_last_script_runs || 0) + 1;
			</script>
		</head>
		<button onClick={() => version.value++}>{version.value}</button>
	</>
}

export function DynamicType({
	type,
	nonce,
	onRef,
}: {
	type: string;
	nonce: string;
	onRef: (script: HTMLScriptElement) => void;
}) @{
	<head>
		<script type={type} id="dynamic-script" nonce={nonce} ref={onRef}>
			window.__ripple_dynamic_script_runs = (window.__ripple_dynamic_script_runs || 0) + 1;
		</script>
	</head>
}

export function SpreadAttributes({ attrs }: { attrs: Record<string, string> }) @{
	<head>
		<script {...attrs}>
			window.__ripple_dynamic_script_runs = (window.__ripple_dynamic_script_runs || 0) + 1;
		</script>
	</head>
}

export function EmptyScripts() @{
	<head>
		<script type="application/json" id="empty-head-data" />
		<script type="module" src="/example.js" id="external-script" async nonce="static-nonce" />
	</head>
}

export function OrderedExternalScripts() @{
	<head>
		<script src="/slow-first.js" id="first-external-script" />
		<script src="/fast-second.js" id="second-external-script" />
	</head>
}

export function AsyncExternalScripts() @{
	<head>
		<script src="/slow-first.js" id="first-external-script" async />
		<script src="/fast-second.js" id="second-external-script" async />
	</head>
}
