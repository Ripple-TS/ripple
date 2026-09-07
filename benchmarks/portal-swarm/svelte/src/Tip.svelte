<script>
	import { hit } from './data.js';
	import { portalTo } from './portal.js';

	let { item, target, tipClass } = $props();
</script>

<div class={tipClass} {@attach portalTo(target)}>
	<span class="tip-label">{item.label}</span>
	<button class="tip-btn" onclick={hit}>hit</button>
</div>
