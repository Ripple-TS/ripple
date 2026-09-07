<script setup vapor>
import Inner from './Inner.vue';

const props = defineProps(['id', 'label', 'value', 'wall', 'onSelect']);
window.__renders['row' + props.wall]++;
</script>

<template>
	<div class="item">
		<span class="id" @click="onSelect">{{ id }}</span>
		<span class="label">{{ label }}</span>
		<Inner :value="value" :wall="wall" />
	</div>
</template>
