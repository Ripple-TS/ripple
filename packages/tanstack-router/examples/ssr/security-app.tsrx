import { Await } from '@ripple-ts/tanstack-router';
import { Fragment, bindInnerHTML, effect, track } from 'ripple';
import { approvedHTML, inlineScript } from './security-policy.js';
import { connectVendor } from './security-vendor.js';

function Vendor() @{
	effect(() => connectVendor());
	<p data-vendor>Vendor component mounted</p>
}

function Details() @{
	const html = track(approvedHTML('<b>Approved HTML</b>'));
	const editor = track(approvedHTML('<b>Approved HTML</b>'));
	const scriptSource = track('/app/security/compiled.js');
	<>
		<head>
			<script innerHTML={inlineScript} />
			<script id="compiled-external" src={scriptSource.value} />
		</head>
		<button onClick={() => (html.value = approvedHTML('<i>Updated HTML</i>'))}>Update HTML</button>
		<button onClick={() => (html.value = '<b>Unapproved HTML</b>')}>Try unapproved HTML</button>
		<div data-html innerHTML={html.value} />
		<section data-fragment>
			<Fragment innerHTML={html.value} />
		</section>
		<div data-spread {...{ innerHTML: html.value }} />
		<div data-editor contentEditable ref={bindInnerHTML(editor)} />
		<svg>
			<Fragment innerHTML={approvedHTML('<circle cx="5" cy="5" r="4"></circle>')} />
		</svg>
		<math>
			<Fragment innerHTML={approvedHTML('<mi>x</mi>')} />
		</math>
		<template id="user-template">
			<strong>Template content</strong>
		</template>
	</>
}

export function SecurityError({ error }: { error: unknown }) {
	return <p data-html-rejected>
		{error instanceof Error ? error.message : String(error)}
	</p>;
}

export function SecurityApp() @{
	const count = track(0);
	const details = track(false);
	const vendor = track(false);
	const pending = new Promise<string>((resolve) => setTimeout(
		() => resolve('Deferred ready'),
		100,
	));
	<>
		<style>
			h1 {
				color: rgb(31, 63, 95);
			}
		</style>
		<h1>CSP contracts</h1>
		<button onClick={() => count.value++}>Count: {count.value}</button>
		<button onClick={() => (details.value = !details.value)}>Toggle details</button>
		<button onClick={() => (vendor.value = !vendor.value)}>Toggle vendor</button>
		@if (details.value) {
			<Details />
		}
		@if (vendor.value) {
			<Vendor />
		}
		<div contentEditable data-stream-editor>
			<Await
				promise={pending}
				fallback={<p data-pending>Deferred pending</p>}
				render={(value) => <p data-deferred>{value}</p>}
			/>
		</div>
	</>
}
