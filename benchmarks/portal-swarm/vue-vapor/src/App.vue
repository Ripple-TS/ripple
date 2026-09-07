<script setup vapor>
// Vue Vapor portal-swarm twin — see Section.vue for the model notes. The
// shared ops driver (./ops.js, vendored verbatim) binds each section's
// setters; ./main.js wires them to the window.__* adapter hooks.
import Section from './Section.vue';
import { ITEMS } from './data.js';
import { bindA, bindB, bindBS } from './ops.js';
</script>

<template>
	<div class="app">
		<Section sec-class="secA" tip-class="tip tipA" prefix="A:" :bind="bindA" />
		<Section sec-class="secB" tip-class="tip tipB" prefix="B:" :bind="bindB" />
		<Section sec-class="secBS" tip-class="tip tipBS" prefix="BS:" :bind="bindBS" />
		<div class="targets">
			<div v-for="item of ITEMS" :key="item.id" class="pt" :id="'pt-' + item.id"></div>
		</div>
	</div>
</template>
