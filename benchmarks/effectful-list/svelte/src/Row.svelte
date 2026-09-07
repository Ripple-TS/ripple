<script>
	import { fx, rowRef } from './fx.js';

	let { id, label, value, probe } = $props();
	let cell;

	// The keyed row's id is immutable for its lifetime, so an untracked effect
	// is the lifecycle-equivalent of useEffect(..., [id]): once on creation,
	// with its cleanup once when this keyed row is removed.
	$effect(() => {
		fx.mounts++;
		return () => {
			fx.cleanups++;
		};
	});

	$effect(() => {
		void value;
		if (probe) {
			fx.h += cell.offsetHeight;
			fx.layouts++;
		}
	});
</script>

<tr {@attach rowRef}>
	<td class="col-id" bind:this={cell}>{id}</td>
	<td class="col-label">{label}</td>
	<td class="col-value">{value}</td>
</tr>
