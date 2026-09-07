<script>
	let { item, selected, select, remove } = $props();
</script>

<tr class:danger={selected}>
	<td class="col-md-1">{item.id}</td>
	<td class="col-md-4">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_missing_attribute -->
		<a onclick={() => select(item.id)}>{item.label}</a>
	</td>
	<td class="col-md-1">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_consider_explicit_label -->
		<!-- svelte-ignore a11y_missing_attribute -->
		<a onclick={() => remove(item.id)}>
			<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
		</a>
	</td>
	<td class="col-md-6"></td>
</tr>
