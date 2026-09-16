<script setup>
defineProps({ isVisible: { type: Boolean, required: true } });
</script>

<template>
	<div class="loading" data-testid="loading" :hidden="!isVisible">
		<div class="loading__spinner"></div>
		<p>Loading weather data...</p>
	</div>
</template>
