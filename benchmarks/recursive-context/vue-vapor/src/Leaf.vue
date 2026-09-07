<script setup vapor>
// Leaf: injects both counters and reads them in its text expression — the
// template auto-unrefs, so reading the shallowRefs subscribes this leaf's
// text renderEffect fine-grained (like solid's root()/local() getters). The
// inject DEFAULT for LocalKey is the plain number 0 — non-Mid leaves get a
// non-reactive constant and never subscribe, so __updatePartial re-fires
// only the 32 leaves under Mid.
import { inject } from 'vue';
import { RootKey, LocalKey } from './state.js';

const props = defineProps({ path: String });

const root = inject(RootKey);
const local = inject(LocalKey, 0);
</script>

<template>
	<span class="leaf">{{ path + '|' + root + ':' + local }}</span>
</template>
