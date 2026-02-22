import { describe, it, expect } from 'vitest';
import { hydrateComponent, container } from '../setup-hydration.js';

// Import server-compiled components
import * as ServerComponents from './compiled/server/html.js';
// Import client-compiled components
import * as ClientComponents from './compiled/client/html.js';

describe('hydration > html tags', () => {
	it('hydrates static html content', async () => {
		await hydrateComponent(ServerComponents.StaticHtml, ClientComponents.StaticHtml);
		expect(container.innerHTML).toBeHtml('<div><p><strong>Bold</strong> text</p></div>');
	});

	it('hydrates dynamic html content', async () => {
		await hydrateComponent(ServerComponents.DynamicHtml, ClientComponents.DynamicHtml);
		expect(container.innerHTML).toBeHtml('<div><p>Dynamic <span>HTML</span> content</p></div>');
	});

	it('hydrates empty html content', async () => {
		await hydrateComponent(ServerComponents.EmptyHtml, ClientComponents.EmptyHtml);
		expect(container.innerHTML).toBeHtml('<div></div>');
	});

	it('hydrates complex nested html', async () => {
		await hydrateComponent(ServerComponents.ComplexHtml, ClientComponents.ComplexHtml);
		expect(container.innerHTML).toBeHtml(
			'<section><div class="nested"><span>Nested <em>content</em></span></div></section>',
		);
	});

	it('hydrates multiple html blocks', async () => {
		await hydrateComponent(ServerComponents.MultipleHtml, ClientComponents.MultipleHtml);
		expect(container.innerHTML).toBeHtml(
			'<div><p>First paragraph</p><p>Second paragraph</p></div>',
		);
	});

	it('hydrates html with reactivity', async () => {
		const { container } = await hydrateComponent(
			ServerComponents.HtmlWithReactivity,
			ClientComponents.HtmlWithReactivity,
		);
		expect(container.innerHTML).toBeHtml('<div><p>Count: 0</p><button>Increment</button></div>');
	});

	it('hydrates html content inside component children (DocsPage pattern)', async () => {
		await hydrateComponent(ServerComponents.HtmlInChildren, ClientComponents.HtmlInChildren);
		expect(container.innerHTML).toBeHtml(
			'<div class="wrapper"><div class="inner"><div class="vp-doc"><p><strong>Bold</strong> text</p></div></div></div>',
		);
	});

	it('hydrates html content in children with sibling elements', async () => {
		await hydrateComponent(
			ServerComponents.HtmlInChildrenWithSiblings,
			ClientComponents.HtmlInChildrenWithSiblings,
		);
		expect(container.innerHTML).toBeHtml(
			'<div class="wrapper"><div class="inner"><h1>Title</h1><div class="content"><p>Dynamic content</p></div></div></div>',
		);
	});

	it('hydrates multiple html blocks inside component children', async () => {
		await hydrateComponent(
			ServerComponents.MultipleHtmlInChildren,
			ClientComponents.MultipleHtmlInChildren,
		);
		expect(container.innerHTML).toBeHtml(
			'<div class="wrapper"><div class="inner"><div class="doc"><p>First</p><p>Second</p></div></div></div>',
		);
	});

	it('hydrates html content containing HTML comments', async () => {
		await hydrateComponent(ServerComponents.HtmlWithComments, ClientComponents.HtmlWithComments);
		expect(container.innerHTML).toBeHtml(
			'<div><p>Before comment</p><!-- TODO: Elaborate --><p>After comment</p></div>',
		);
	});

	it('hydrates html content containing an empty comment', async () => {
		await hydrateComponent(
			ServerComponents.HtmlWithEmptyComment,
			ClientComponents.HtmlWithEmptyComment,
		);
		// The raw innerHTML should contain the empty comment from user content
		// plus hydration markers. After stripping only hydration-specific markers,
		// the user's empty comment should remain.
		// Check that content before AND after the empty comment is present
		const html = container.innerHTML;
		expect(html).toContain('<p>Before</p>');
		expect(html).toContain('<p>After</p>');
	});

	it('hydrates html with comments inside component children (docs pattern)', async () => {
		await hydrateComponent(
			ServerComponents.HtmlWithCommentsInChildren,
			ClientComponents.HtmlWithCommentsInChildren,
		);
		expect(container.innerHTML).toBeHtml(
			'<div class="wrapper"><div class="inner"><div class="vp-doc"><h2 id="intro">Introduction</h2><p>Some text</p><!-- TODO --><p>More text</p></div></div></div>',
		);
	});

	it('hydrates html when server and client have matching data (DocsPage pattern)', async () => {
		// When server and client have same data, hydration should work fine
		await hydrateComponent(
			ServerComponents.HtmlWithServerData,
			ClientComponents.HtmlWithServerData,
		);
		const html = container.innerHTML;
		expect(html).toContain('Introduction');
		expect(html).toContain('edit-link');
		expect(html).toContain('prev-next');
		expect(html).toContain('Footer content');
		expect(html).toContain('toc');
	});

	it('reproduces hydration mismatch when client has default props (DocsPage #server pattern)', async () => {
		// This test reproduces the DocsPage hydration issue:
		// Server renders with real data (editPath, nextLink, toc all truthy)
		// Client hydrates with default values (editPath='', nextLink=null, toc=[])
		// The if-block conditions evaluate differently, and the hydration walker
		// doesn't skip past server-rendered content inside <!--[-->...<!--]-->.
		// When the footer element (a sibling AFTER the if blocks) tries to hydrate,
		// it finds the wrong DOM node, causing a HYDRATION_ERROR.
		await hydrateComponent(
			ServerComponents.HtmlWithServerData,
			ClientComponents.HtmlWithClientDefaults,
		);
		const html = container.innerHTML;
		// After hydration, the html content should still be present (not "undefined")
		expect(html).toContain('Introduction');
		expect(html).toContain('Ripple is a framework');
		// The footer should still be present
		expect(html).toContain('Footer content');
		expect(html).not.toContain('undefined');
	});

	it('reproduces hydration mismatch with undefined html content', async () => {
		// This simulates the actual DocsPage issue where doc.html is undefined
		// because doc is a Promise from #server.load_doc().
		// html() receives undefined, and get_html() + '' produces 'undefined' string.
		// The server rendered valid HTML content, but the client sees 'undefined'.
		await hydrateComponent(
			ServerComponents.HtmlWithServerData,
			ClientComponents.HtmlWithUndefinedContent,
		);
		const html = container.innerHTML;
		// The server-rendered HTML content should be preserved during hydration
		// html() should claim the DOM without replacing it with 'undefined' text
		expect(html).toContain('Introduction');
		expect(html).toContain('Ripple is a framework');
		expect(html).not.toContain('undefined');
	});

	it('hydrates html block after switch-based component in children', async () => {
		// Reproduces DocCodeGroup hydration bug:
		// When a switch-based component (DynamicHeading) renders inside children,
		// it produces <!--[-->...<h1>...<!--]--> markers. The fragment template
		// walker may mishandle these markers, causing the hydration cursor to be
		// mispositioned for subsequent components like CodeBlock ({html ...}).
		await hydrateComponent(
			ServerComponents.HtmlAfterSwitchInChildren,
			ClientComponents.HtmlAfterSwitchInChildren,
		);
		const html = container.innerHTML;
		expect(html).toContain('Title');
		expect(html).toContain('First paragraph');
		expect(html).toContain('Second paragraph');
		expect(html).toContain('const x = 1;');
		expect(html).toContain('After code');
	});
});
