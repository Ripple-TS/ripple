import { describe, expect, it } from 'vitest';
import { get_linked_pathnames } from '../src/server/links.js';

describe('prerender link extraction', () => {
	it('ignores links and base URLs in nested inert templates', () => {
		const html =
			'<template><base href="/wrong/"><a href="hidden">hidden</a>' +
			'<template><a href="nested">nested</a></template>' +
			'<script>const end = "</template>";</script><a href="still-hidden">hidden</a>' +
			'</template><a href="visible">visible</a>';
		expect(get_linked_pathnames(html, new URL('http://localhost/posts/'))).toEqual([
			'/posts/visible',
		]);
	});

	it('uses the first duplicate href as the browser does', () => {
		expect(
			get_linked_pathnames(
				'<base href="/posts/" href="/wrong/"><a href="first" HREF="second">link</a>',
				new URL('http://localhost'),
			),
		).toEqual(['/posts/first']);
	});
});
