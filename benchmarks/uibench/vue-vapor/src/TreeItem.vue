<script setup vapor>
defineProps({ node: { type: Object, required: true } });
</script>

<template>
	<li :data-id="node.id" :class="node.children.length === 0 ? 'leaf' : 'container'">
		<span>{{ node.label }}</span>
		<ul v-if="node.children.length > 0">
			<TreeItem v-for="child of node.children" :key="child.id" :node="child" />
		</ul>
	</li>
</template>
