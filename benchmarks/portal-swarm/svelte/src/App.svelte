<script>
	import { ITEMS } from './data.js';
	import { bindA, bindB, bindBS } from './ops.js';
	import Section from './Section.svelte';
</script>

<div class="app">
	<Section secClass="secA" tipClass="tip tipA" prefix="A:" register={bindA} anchor />
	<Section secClass="secB" tipClass="tip tipB" prefix="B:" register={bindB} />
	<Section secClass="secBS" tipClass="tip tipBS" prefix="BS:" register={bindBS} />
	<div class="targets">
		{#each ITEMS as item (item.id)}
			<div class="pt" id={'pt-' + item.id}></div>
		{/each}
	</div>
</div>
