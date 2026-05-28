// Test case for hydration error with innerHTML inside template elements
// Reproduces issue from website-new/src/pages/docs/comparison.tsrx

export function SimpleTemplateHtml() {
	return <>
		const data = 'test data';
		<template id="data1" innerHTML={data} />
	</>;
}

export function TemplateWithJSON() {
	return <>
		const jsonData = JSON.stringify({ message: 'hello', count: 42 });
		<template id="data2" innerHTML={jsonData} />
	</>;
}

export function TemplateAroundIfBlock() {
	return <>
		const show = true;
		<div>
			<template id="before" innerHTML="before" />
			if (show) {
				<span class="inside">{'inside'}</span>
			}
			<template id="after" innerHTML="after" />
		</div>
	</>;
}
