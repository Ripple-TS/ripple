<script setup vapor>
// Balanced binary tree: depth D=10 → 1024 leaves, 2047 components — the Vue
// Vapor analogue of the sibling fixtures. Context is provide/inject: App
// provides the ROOT counter as a shallowRef; every leaf injects it and reads
// it in its text expression, so a root bump re-fires only the 1024 leaf text
// renderEffects (fine-grained, like solid) — no tree re-render.
import { shallowRef, provide } from 'vue';
import TreeNode from './TreeNode.vue';
import { RootKey, bindRoot } from './state.js';

const props = defineProps({ depth: Number });

const root = shallowRef(0);
provide(RootKey, root);
bindRoot(() => {
	root.value++;
});
</script>

<template>
	<TreeNode :depth="depth" path="" />
</template>
