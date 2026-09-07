<script setup vapor>
// One portal-swarm section (A / B / B_stable). Vue's only portal mechanism is
// Teleport — like Solid, the A/B/B_stable distinction collapses structurally
// (there is no value-position portal descriptor to build), but the three
// sections still exist with the same DOM + window contract so the harness
// drives every target identically. For Vue the rerender ops measure the
// fine-grained bypass (one text-node renderEffect; open teleports are never
// re-rendered) — that IS Vue's honest number for "parent state changed while
// 200 portals are open".
//
// VaporTeleport inserts the tooltip div DIRECTLY into the target (plus its own
// comment anchors, which the harness's `.tip` census never sees), matching the
// other fixtures' tooltip placement. The tip button's @click is a delegated
// vapor event — the document-level delegated listener reaches teleported
// content, so dispatch_through_portal exercises the delegation lookup.
import { shallowRef, VaporTeleport } from 'vue';
import { ITEMS, sharedTarget, targetFor, hit } from './data.js';

const props = defineProps(['secClass', 'tipClass', 'prefix', 'bind']);

const open = shallowRef(false);
const tick = shallowRef(0);
const distinct = shallowRef(false);
props.bind(
	(v) => (open.value = v),
	(v) => (tick.value = v),
	(v) => (distinct.value = v),
);
</script>

<template>
	<section :class="secClass">
		<h3 class="tick">{{ prefix + tick }}</h3>
		<ul class="list">
			<li v-for="item of ITEMS" :key="item.id" class="item">
				<span class="label">{{ item.label }}</span>
				<VaporTeleport v-if="open" :to="distinct ? targetFor(item.id) : sharedTarget()">
					<div :class="tipClass">
						<span class="tip-label">{{ item.label }}</span>
						<button class="tip-btn" @click="hit">hit</button>
					</div>
				</VaporTeleport>
			</li>
		</ul>
	</section>
</template>
