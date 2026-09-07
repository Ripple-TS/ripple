<script setup vapor>
import { shallowRef } from 'vue';
import { bindSetter } from '../../shared/bridge.js';
import { INITIAL_SNAPSHOT } from '../../shared/workloads.js';
import TreeItem from './TreeItem.vue';

const snapshot = shallowRef(INITIAL_SNAPSHOT);
bindSetter((next) => {
	snapshot.value = next;
});
</script>

<template>
	<table v-if="snapshot.kind === 'table'" class="uibench-table" data-kind="table">
		<tbody>
			<tr
				v-for="row of snapshot.rows"
				:key="row.id"
				:data-id="row.id"
				:class="row.active ? 'active' : 'inactive'"
			>
				<th>{{ row.label }}</th>
				<td v-for="cell of row.cells" :key="cell.id">{{ cell.text }}</td>
			</tr>
		</tbody>
	</table>
	<div v-else-if="snapshot.kind === 'anim'" class="uibench-anim" data-kind="anim">
		<div
			v-for="box of snapshot.boxes"
			:key="box.id"
			class="box"
			:data-id="box.id"
			:style="{ transform: box.transform }"
		></div>
	</div>
	<ul v-else class="uibench-tree" data-kind="tree">
		<TreeItem v-for="node of snapshot.nodes" :key="node.id" :node="node" />
	</ul>
</template>
