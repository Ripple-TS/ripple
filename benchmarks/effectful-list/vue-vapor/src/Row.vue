<script setup vapor>
// Vue Vapor Row — the fine-grained equivalent of the hook-based rows:
//
//   * mount/cleanup: onMounted/onUnmounted run exactly once per row lifetime —
//     the useEffect-[item.id] equivalent (keyed rows never change id in place,
//     so that effect is a mount/cleanup pair in every target).
//   * useLayoutEffect-[item.value] equivalent: watchPostEffect runs after the
//     DOM update, before paint (Vue's post-flush queue — the layout-effect
//     timing slot). It tracks the reactive `item` prop: the keyed v-for hands
//     a same-id row a NEW item object only on update_deps, so the effect
//     refires exactly when the React deps [item.value] would. The untracked
//     layout read happens on probe rows only.
//   * :ref="rowRef" — the shared module-level function ref (see fx.js for the
//     null-on-unmount counting divergence).
//
// The row body runs ONCE per row lifetime — parent re-renders don't exist in
// the fine-grained model, which is why update_nodeps is a ~zero for Vapor.
import { onMounted, onUnmounted, watchPostEffect, useTemplateRef } from 'vue';
import { fx, rowRef } from './fx.js';

const props = defineProps({ item: Object });
const cell = useTemplateRef('cell');

onMounted(() => {
	fx.mounts++;
});
onUnmounted(() => {
	fx.cleanups++;
});

watchPostEffect(() => {
	const item = props.item; // reactive prop read — the effect's only dependency
	if (item.probe) {
		fx.h += cell.value.offsetHeight;
		fx.layouts++;
	}
});
</script>

<template>
	<tr :ref="rowRef">
		<td class="col-id" ref="cell">{{ item.id }}</td>
		<td class="col-label">{{ item.label }}</td>
		<td class="col-value">{{ item.value }}</td>
	</tr>
</template>
