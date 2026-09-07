<script setup vapor>
// dbmon table authored idiomatically for Vue Vapor (3.6): the rows live in a
// `shallowRef` that the shared ops driver replaces wholesale each tick (the
// same immutable-newArray + keyed-reconcile model as octane/react/ripple), and
// a keyed `v-for` (`:key="db.id"`) reconciles the fresh dataset in place —
// same ids ⇒ every <tr> survives and only the per-cell vapor renderEffects
// (text + threshold class) re-fire. The shared ops driver feeds the same
// seeded data as every other fixture, so the rendered DOM matches exactly.
import { shallowRef } from 'vue';
import { bindSetData, initialData } from './ops.js';

// Seed value-identical to the shared ops `_current` (same makeData(…, 0, 1)).
const rows = shallowRef(initialData());
bindSetData((d) => {
	rows.value = d;
});
</script>

<template>
	<table class="dbmon">
		<tbody>
			<tr v-for="db of rows" :key="db.id">
				<td class="dbname">{{ db.name }}</td>
				<td :class="db.countClass">{{ db.count }}</td>
				<td :class="db.queries[0].className">{{ db.queries[0].elapsed }}</td>
				<td :class="db.queries[1].className">{{ db.queries[1].elapsed }}</td>
				<td :class="db.queries[2].className">{{ db.queries[2].elapsed }}</td>
				<td :class="db.queries[3].className">{{ db.queries[3].elapsed }}</td>
				<td :class="db.queries[4].className">{{ db.queries[4].elapsed }}</td>
			</tr>
		</tbody>
	</table>
</template>
