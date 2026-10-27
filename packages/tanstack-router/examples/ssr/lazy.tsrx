import { useRouter } from '@ripple-ts/tanstack-router';

export default function LazyPage() @{
	const nonce = useRouter().options.ssr?.nonce;
	<>
		<head>
			<script id="lazy-template-script" nonce={nonce}>
				window.lazyTemplateRuns = (window.lazyTemplateRuns || 0) + 1;
			</script>
		</head>
		<style>
			h1 {
				color: rgb(12, 34, 56);
			}
		</style>
		<h1>Explicitly lazy page</h1>
		<p>This component is loaded from a separate production chunk.</p>
		<p class="route-style">Route style</p>
	</>
}
