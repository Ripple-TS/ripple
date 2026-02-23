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
		await hydrateComponent(
			ServerComponents.HtmlWithServerData,
			ClientComponents.HtmlWithClientDefaults,
		);
		const html = container.innerHTML;
		expect(html).toContain('Introduction');
		expect(html).toContain('Ripple is a framework');
		expect(html).toContain('Footer content');
		expect(html).not.toContain('undefined');
	});

	it('reproduces hydration mismatch with undefined html content', async () => {
		await hydrateComponent(
			ServerComponents.HtmlWithServerData,
			ClientComponents.HtmlWithUndefinedContent,
		);
		const html = container.innerHTML;
		expect(html).toContain('Introduction');
		expect(html).toContain('Ripple is a framework');
		expect(html).not.toContain('undefined');
	});

	it('hydrates html block after switch-based component in children', async () => {
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

	it('hydrates layout with sidebar (if-blocks) followed by main sibling', async () => {
		await hydrateComponent(
			ServerComponents.LayoutWithSidebarAndMain,
			ClientComponents.LayoutWithSidebarAndMain,
		);
		const html = container.innerHTML;
		expect(html).toContain('MyApp');
		expect(html).toContain('Introduction');
		expect(html).toContain('Quick Start');
		expect(html).toContain('Welcome to the docs.');
	});

	it('hydrates article with composite children followed by if-block siblings', async () => {
		await hydrateComponent(
			ServerComponents.ArticleWithChildrenThenSibling,
			ClientComponents.ArticleWithChildrenThenSibling,
		);
		const html = container.innerHTML;
		expect(html).toContain('Title');
		expect(html).toContain('Content goes here.');
		expect(html).toContain('Edit');
		expect(html).toContain('Previous');
		expect(html).toContain('Footer');
	});

	it('hydrates article with {html} child then sibling (StylingPage pattern)', async () => {
		await hydrateComponent(
			ServerComponents.ArticleWithHtmlChildThenSibling,
			ClientComponents.ArticleWithHtmlChildThenSibling,
		);
		const html = container.innerHTML;
		expect(html).toContain('const x = 1;');
		expect(html).toContain('Edit');
		expect(html).toContain('Footer');
	});

	it('hydrates INLINE article with {html} child then sibling (exact DocsLayout)', async () => {
		await hydrateComponent(
			ServerComponents.InlineArticleWithHtmlChild,
			ClientComponents.InlineArticleWithHtmlChild,
		);
		const html = container.innerHTML;
		expect(html).toContain('const x = 1;');
		expect(html).toContain('Edit');
		expect(html).toContain('Footer');
	});

	it('hydrates full DocsLayout with data mismatch (StylingPage exact reproduction)', async () => {
		await hydrateComponent(
			ServerComponents.DocsLayoutWithData,
			ClientComponents.DocsLayoutWithoutData,
		);
		const html = container.innerHTML;
		// Should preserve server-rendered content even with data mismatch
		expect(html).toContain('Header');
		expect(html).toContain('Sidebar');
		expect(html).toContain('Title');
		expect(html).toContain('Content');
		expect(html).toContain('Footer');
	});

	it('hydrates exact DocsLayout with all conditions and data mismatch', async () => {
		await hydrateComponent(
			ServerComponents.DocsLayoutExactWithData,
			ClientComponents.DocsLayoutExactWithoutData,
		);
		const html = container.innerHTML;
		expect(html).toContain('Header');
		expect(html).toContain('Sidebar');
		expect(html).toContain('Footer');
	});

	it('hydrates template element with {html} content', async () => {
		await hydrateComponent(
			ServerComponents.TemplateWithHtmlContent,
			ClientComponents.TemplateWithHtmlContent,
		);
		const html = container.innerHTML;
		expect(html).toContain('<template id="t1">');
		expect(html).toContain('Main content');
	});

	it('hydrates template element with {html} and siblings', async () => {
		await hydrateComponent(
			ServerComponents.TemplateWithHtmlAndSiblings,
			ClientComponents.TemplateWithHtmlAndSiblings,
		);
		const html = container.innerHTML;
		expect(html).toContain('Title');
		expect(html).toContain('<template id="data-template">');
		expect(html).toContain('Content after template');
	});

	it('hydrates nested template in layout component', async () => {
		await hydrateComponent(
			ServerComponents.NestedTemplateInLayout,
			ClientComponents.NestedTemplateInLayout,
		);
		const html = container.innerHTML;
		expect(html).toContain('<template id="page-data">');
		expect(html).toContain('<p>Content</p>');
	});
});
