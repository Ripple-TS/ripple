<script>
	import { ITEMS, sharedTarget, targetFor } from './data.js';
	import Tip from './Tip.svelte';

	let { secClass, tipClass, prefix, register, anchor = false } = $props();
	let open = $state(false);
	let tick = $state(0);
	let distinct = $state(false);

	const set = (current, next) => (typeof next === 'function' ? next(current) : next);
	$effect(() => {
		register(
			(next) => {
				open = set(open, next);
			},
			(next) => {
				tick = set(tick, next);
			},
			(next) => {
				distinct = set(distinct, next);
			},
		);
	});
</script>

<section class={secClass}>
	<h3 class="tick">{prefix + tick}</h3>
	<ul class="list">
		{#each ITEMS as item (item.id)}
			<li class="item">
				<span class="label">{item.label}</span>
				{#if open}
					{#if anchor}
						<span class="anchor">
							<Tip {item} {tipClass} target={distinct ? targetFor(item.id) : sharedTarget()} />
						</span>
					{:else}
						<Tip {item} {tipClass} target={distinct ? targetFor(item.id) : sharedTarget()} />
					{/if}
				{/if}
			</li>
		{/each}
	</ul>
</section>
