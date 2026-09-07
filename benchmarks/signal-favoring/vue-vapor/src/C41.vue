<script setup vapor>
// Stateful chain link — same generated chain as the sibling fixtures (see
// gen.mjs). Vapor bodies run once; the registered bump closure mutates the
// shallowRef and only this component's {{ v }} text renderEffect re-fires —
// C42..C100 are untouched (fine-grained model, like solid/ripple).
import { shallowRef } from 'vue';
import { register } from './bumps.js';
import C42 from './C42.vue';

const v = shallowRef(0);
register(41, () => {
	v.value++;
});
</script>

<template>
	<div class="c">41:{{ v }} <C42 /></div>
</template>
