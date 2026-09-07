<script setup vapor>
// Vue Vapor twin of the memo-wall Leaf — same probe contract as the Solid
// fixture (see its rows.jsx for the full note): vapor component setups run
// ONCE, so the fine-grained analog of a "Leaf re-render" is the leaf's
// reactive TEXT INTERPOLATION re-running. The probe lives inside that
// interpolation's getter (NO setup increment — the initial run counts the
// mount): once at creation, once per theme bump, so ctx_through_wall_* shows
// exactly 1000 leaf runs and parent_rerender_equal_* shows 0.
import { inject } from 'vue';

const props = defineProps(['wall']);
const theme = inject('theme' + props.wall);

const probe = () => {
	window.__renders['leaf' + props.wall]++;
	return theme.value;
};
</script>

<template>
	<span class="leaf">{{ probe() }}</span>
</template>
