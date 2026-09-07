<script setup vapor>
// Recursive tree node (explicit self-import — an SFC is one component, so the
// recursion goes through the module graph). props.depth/path are static after
// mount, so the v-if chain picks its branch once and never re-fires.
import TreeNode from './TreeNode.vue';
import Mid from './Mid.vue';
import Leaf from './Leaf.vue';
import { MID_PATH } from './state.js';

const props = defineProps({ depth: Number, path: String });
</script>

<template>
	<Mid v-if="depth > 0 && path === MID_PATH" :depth="depth" :path="path" />
	<div v-else-if="depth > 0" class="n">
		<TreeNode :depth="depth - 1" :path="path + 'L'" />
		<TreeNode :depth="depth - 1" :path="path + 'R'" />
	</div>
	<Leaf v-else :path="path" />
</template>
