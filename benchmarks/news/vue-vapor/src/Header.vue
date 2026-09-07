<script setup vapor>
// Vue Vapor analogue of the octane Header: local reactive state via a
// shallowRef. The theme toggle gives a visible interactivity proof after
// hydration (the harness clicks #theme and asserts the masthead class flips).
import { shallowRef } from 'vue';

const dark = shallowRef(false);
</script>

<template>
	<header :class="dark ? 'masthead dark' : 'masthead'">
		<h1 class="logo">The Octane Times</h1>
		<button id="theme" class="theme" @click="dark = !dark">
			{{ dark ? 'Light mode' : 'Dark mode' }}
		</button>
	</header>
</template>
