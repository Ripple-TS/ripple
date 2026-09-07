<script>
	import Wall from './Wall.svelte';
	import { bindWallA, bindWallB, initialItemsA, initialItemsB } from './ops.js';
</script>

<div class="walls">
	<Wall
		wall="A"
		title="wall A (keyed each) tick "
		initialItems={initialItemsA()}
		bindWall={bindWallA}
	/>
	<Wall
		wall="B"
		title="wall B (keyed each) tick "
		initialItems={initialItemsB()}
		bindWall={bindWallB}
	/>
</div>
