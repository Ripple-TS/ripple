// Test case for hydration error with {html} inside template elements
// Reproduces issue from website-new/src/pages/docs/comparison.tsrx

export function SimpleTemplateHtml() { return <>
	const data = 'test data';
	<template id="data1">{html data}</template>
</>; }

export function TemplateWithJSON() { return <>
	const jsonData = JSON.stringify({ message: 'hello', count: 42 });
	<template id="data2">{html jsonData}</template>
</>; }

export function TemplateAroundIfBlock() { return <>
	const show = true;

	<div>
		<template id="before">{html 'before'}</template>
		if (show) {
			<span class="inside">{'inside'}</span>
		}
		<template id="after">{html 'after'}</template>
	</div>
</>; }
