import { track } from 'ripple';

// Preserve exact raw text, including whitespace and escapes.
// prettier-ignore
export function Card({ id, nonce }: { id: string; nonce: string }) @{
	const count = track(0);
	<article>
		<script type="application/json" id={id} nonce={nonce} data-count={count.value}>
  {"count":1,"text":"<tag> &amp; > ` ${value} café","escaped":"\u003c/script>"}
		</script>
		<button onClick={() => count.value++}>{count.value}</button>
	</article>
}

// prettier-ignore
export function RootData() {
	return <script type="application/ld+json" id="root-data">
		{"count":1}
	</script>;
}

// prettier-ignore
export function EmptyData() @{
	<>
		<script type="application/json" id="empty-data" />
		<script type="application/json" id="whitespace-data"> 	 </script>
		<p>after</p>
	</>
}

export function InertData() @{
	<>
		<script type="text/plain" id="inert-data">
			window.__ripple_data_script_runs = (window.__ripple_data_script_runs || 0) + 1;
		</script>
		<p>after</p>
	</>
}

// prettier-ignore
export function ConditionalData() @{
	const visible = track(true);
	<article>
		@if (visible.value) {
			<script type="application/json" id="conditional-data">
				{"visible":true}
			</script>
		}
		<button onClick={() => (visible.value = !visible.value)}>toggle</button>
	</article>
}

// prettier-ignore
export function HeadData() @{
	<>
		<head>
			<script type="application/json" id="head-data">
				{"text":"<tag> &amp;"}
			</script>
		</head>
		<p>body</p>
	</>
}
