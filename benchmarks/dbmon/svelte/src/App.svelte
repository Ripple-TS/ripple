<script>
	import { bindSetData, initialData } from './ops.js';

	let data = $state.raw(initialData());
	bindSetData((next) => {
		data = next;
	});
</script>

<table class="dbmon">
	<tbody>
		{#each data as db (db.id)}
			<tr>
				<td class="dbname">{db.name}</td>
				<td class={db.countClass}>{db.count}</td>
				<td class={db.queries[0].className}>{db.queries[0].elapsed}</td>
				<td class={db.queries[1].className}>{db.queries[1].elapsed}</td>
				<td class={db.queries[2].className}>{db.queries[2].elapsed}</td>
				<td class={db.queries[3].className}>{db.queries[3].elapsed}</td>
				<td class={db.queries[4].className}>{db.queries[4].elapsed}</td>
			</tr>
		{/each}
	</tbody>
</table>
