<script setup vapor>
// The one mid-tree provider. provide() is component-scoped in Vue (not
// template-position-scoped like the sibling fixtures' <LocalCtx> wrappers),
// but the semantics match: only the subtree under Mid can inject LocalKey,
// and that subtree is exactly the v-if div below. __partialUnmount flips
// `visible` off — the div + 32-leaf subtree unmounts while Mid itself stays
// mounted, so its setVisible handle remains valid for re-show.
import { shallowRef, provide } from 'vue';
import TreeNode from './TreeNode.vue';
import { LocalKey, bindLocal, bindVisible } from './state.js';

const props = defineProps({ depth: Number, path: String });

const local = shallowRef(0);
const visible = shallowRef(true);
provide(LocalKey, local);
bindLocal(() => {
	local.value++;
});
bindVisible((v) => {
	visible.value = v;
});
</script>

<template>
	<div v-if="visible" class="mid">
		<TreeNode :depth="depth - 1" :path="path + 'L'" />
		<TreeNode :depth="depth - 1" :path="path + 'R'" />
	</div>
</template>
