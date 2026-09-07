<script setup vapor>
import Leaf from './Leaf.vue';

const props = defineProps(['value', 'wall']);
window.__renders['inner' + props.wall]++;
</script>

<template>
	<span class="inner">{{ value }}<Leaf :wall="wall" /></span>
</template>
