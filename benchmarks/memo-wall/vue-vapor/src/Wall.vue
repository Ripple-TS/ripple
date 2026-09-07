<script setup vapor>
// One memo-wall wall. Vue Vapor has no memo walls and no value-position
// descriptor mechanism, so the A/B distinction collapses structurally (both
// walls are the same keyed v-for); both are kept so the op list and DOM stay
// identical across all targets. The v-for keys by row-object IDENTITY
// (`:key="it"`): one_change_* replaces exactly one item object, so exactly one
// row is disposed + recreated (the fine-grained equivalent of React's single
// re-render — see Leaf.vue / the solid fixture for the full probe contract).
// The theme is provided as a shallowRef so leaf interpolations subscribe
// individually.
import { shallowRef, provide } from 'vue';
import Row from './Row.vue';
import { selectRow } from './ops.js';

const props = defineProps(['wall', 'title', 'initialItems', 'bind']);

const items = shallowRef(props.initialItems);
const tick = shallowRef(0);
const theme = shallowRef('t0');
provide('theme' + props.wall, theme);
props.bind({
	setItems: (v) => (items.value = v),
	setTick: (v) => (tick.value = v),
	setTheme: (v) => (theme.value = v),
});
</script>

<template>
	<section class="wall" :id="'wall-' + wall.toLowerCase()">
		<h2>
			{{ title }}<span class="tick">{{ tick }}</span>
		</h2>
		<div class="rows">
			<Row
				v-for="it of items"
				:key="it"
				:id="it.id"
				:label="it.label"
				:value="it.value"
				:wall="wall"
				:on-select="selectRow"
			/>
		</div>
	</section>
</template>
