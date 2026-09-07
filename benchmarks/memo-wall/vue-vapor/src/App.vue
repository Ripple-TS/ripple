<script setup vapor>
import Wall from './Wall.vue';
import { bindWallA, bindWallB, initialItemsA, initialItemsB } from './ops.js';
</script>

<template>
	<div class="walls">
		<Wall
			wall="A"
			title="wall A (keyed v-for) tick "
			:initial-items="initialItemsA()"
			:bind="bindWallA"
		/>
		<Wall
			wall="B"
			title="wall B (keyed v-for) tick "
			:initial-items="initialItemsB()"
			:bind="bindWallB"
		/>
	</div>
</template>
