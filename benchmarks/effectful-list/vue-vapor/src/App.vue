<script setup vapor>
// Vue Vapor parent — rows live in a `shallowRef` the shared ops driver
// replaces wholesale (the same immutable-newArray model as the other
// targets); the keyed `v-for` (`:key="item.id"`) reconciles each fresh array
// in place, so same-id rows keep their component instance (only the `item`
// prop updates — per-binding renderEffects re-fire) while new/removed ids
// mount/unmount Rows. That preserves the suite's analytic __fx expectations:
// mounts/cleanups count row lifetimes, exactly like the keyed VDOM targets.
// `tick` is unrelated state read only in the parent text — update_nodeps
// touches no row (fine-grained model, like solid).
import { shallowRef } from 'vue';
import Row from './Row.vue';
import { bindHandlers, initialItems } from './ops.js';

const items = shallowRef(initialItems());
const tick = shallowRef(0);
bindHandlers({
	setItems: (next) => {
		items.value = next;
	},
	setTick: (up) => {
		tick.value = up(tick.value);
	},
});
</script>

<template>
	<div>
		<div class="tick">{{ tick }}</div>
		<table class="test-data">
			<tbody>
				<Row v-for="item of items" :key="item.id" :item="item" />
			</tbody>
		</table>
	</div>
</template>
