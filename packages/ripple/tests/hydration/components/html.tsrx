import { Fragment, track } from 'ripple';

export function StaticHtml() {
	return <>
		const html = '<p><strong>Bold</strong> text</p>';
		<div innerHTML={html} />
	</>;
}

export function DynamicHtml() {
	return <>
		const content = '<p>Dynamic <span>HTML</span> content</p>';
		<div innerHTML={content} />
	</>;
}

export function EmptyHtml() {
	return <>
		const html = '';
		<div innerHTML={html} />
	</>;
}

export function ComplexHtml() {
	return <>
		const html = '<div class="nested"><span>Nested <em>content</em></span></div>';
		<section innerHTML={html} />
	</>;
}

export function MultipleHtml() {
	return <>
		const html1 = '<p>First paragraph</p>';
		const html2 = '<p>Second paragraph</p>';
		<div>
			<Fragment innerHTML={html1} />
			<Fragment innerHTML={html2} />
		</div>
	</>;
}

export function HtmlWithReactivity() {
	return <>
		<div>
			<Fragment innerHTML="<p>Count: 0</p>" />
			<button>{'Increment'}</button>
		</div>
	</>;
}

export function HtmlWrapper({ children }: { children: any }) {
	return <>
		<div class="wrapper">
			<div class="inner">{children}</div>
		</div>
	</>;
}

export function HtmlInChildren() {
	return <>
		const content = '<p><strong>Bold</strong> text</p>';
		<HtmlWrapper>
			<div class="vp-doc" innerHTML={content} />
		</HtmlWrapper>
	</>;
}

export function HtmlInChildrenWithSiblings() {
	return <>
		const content = '<p>Dynamic content</p>';
		<HtmlWrapper>
			<h1>{'Title'}</h1>
			<div class="content" innerHTML={content} />
		</HtmlWrapper>
	</>;
}

export function MultipleHtmlInChildren() {
	return <>
		const html1 = '<p>First</p>';
		const html2 = '<p>Second</p>';
		<HtmlWrapper>
			<div class="doc">
				<Fragment innerHTML={html1} />
				<Fragment innerHTML={html2} />
			</div>
		</HtmlWrapper>
	</>;
}

export function HtmlWithComments() {
	return <>
		const content = '<p>Before comment</p><!-- TODO: Elaborate --><p>After comment</p>';
		<div innerHTML={content} />
	</>;
}

export function HtmlWithEmptyComment() {
	return <>
		const content = '<p>Before</p><!----><p>After</p>';
		<div innerHTML={content} />
	</>;
}

export function HtmlWithCommentsInChildren() {
	return <>
		const content = '<h2 id="intro">Introduction</h2><p>Some text</p><!-- TODO --><p>More text</p>';
		<HtmlWrapper>
			<div class="vp-doc" innerHTML={content} />
		</HtmlWrapper>
	</>;
}

function DocFooter() {
	return <><footer class="doc-footer">{'Footer content'}</footer></>;
}

export function DocLayout({
	children,
	editPath = '',
	nextLink = null,
	toc = [],
}: {
	children: any;
	editPath?: string;
	nextLink?: { href: string; text: string } | null;
	toc?: { href: string; text: string }[];
}) {
	return <>
		<div class="layout">
			<div class="content-container">
				<article>
					<div>{children}</div>
				</article>
				if (editPath) {
					<div class="edit-link">
						<a href={`https://github.com/edit/${editPath}`}>{'Edit'}</a>
					</div>
				}
				if (nextLink) {
					<nav class="prev-next">
						<a href={nextLink.href}>{nextLink.text}</a>
					</nav>
				}
				<DocFooter />
			</div>
			<aside>
				if (toc.length > 0) {
					<div class="toc">
						<ul>
							for (const item of toc) {
								<li>
									<a href={item.href}>{item.text}</a>
								</li>
							}
						</ul>
					</div>
				}
			</aside>
		</div>
	</>;
}

export function HtmlWithServerData() {
	return <>
		const content = '<h1 id="intro" class="doc-h1">Introduction</h1><p>Ripple is a framework.</p>';
		<DocLayout
			editPath="docs/introduction.md"
			nextLink={{ href: '/docs/quick-start', text: 'Quick Start' }}
			toc={[
				{ href: '#intro', text: 'Introduction' },
				{ href: '#features', text: 'Features' },
			]}
		>
			<div class="vp-doc" innerHTML={content} />
		</DocLayout>
	</>;
}

export function HtmlWithClientDefaults() {
	return <>
		const content = '<h1 id="intro" class="doc-h1">Introduction</h1><p>Ripple is a framework.</p>';
		<DocLayout>
			<div class="vp-doc" innerHTML={content} />
		</DocLayout>
	</>;
}

export function HtmlWithUndefinedContent() {
	return <>
		const content: string | undefined = undefined;
		<DocLayout>
			<div class="vp-doc" innerHTML={content} />
		</DocLayout>
	</>;
}

function DynamicHeading({ level, children }: { level: number; children: any }) {
	return <>
		switch (level) {
			case 1:
				<h1 class="heading">{children}</h1>
				break;
			case 2:
				<h2 class="heading">{children}</h2>
				break;
		}
	</>;
}

function CodeBlock({ code }: { code: string }) {
	return <>
		const highlighted = `<pre class="shiki"><code>${code}</code></pre>`;
		<div class="code-block">
			<div class="header">
				<button>{'Copy'}</button>
				<span class="lang">{'js'}</span>
			</div>
			<div class="content" innerHTML={highlighted} />
		</div>
	</>;
}

function ContentWrapper({ children }: { children: any }) {
	return <>
		<div class="wrapper">
			<div class="inner">{children}</div>
		</div>
	</>;
}

export function HtmlAfterSwitchInChildren() {
	return <>
		<ContentWrapper>
			<DynamicHeading level={1}>{'Title'}</DynamicHeading>
			<p>{'First paragraph'}</p>
			<p>{'Second paragraph'}</p>
			<CodeBlock code="const x = 1;" />
			<p>{'After code'}</p>
		</ContentWrapper>
	</>;
}

function NavItem({
	href,
	text: label,
	active = false,
}: {
	href: string;
	text: string;
	active?: boolean;
}) {
	return <>
		<div class={`nav-item${active ? ' active' : ''}`}>
			if (active) {
				<div class="indicator" />
			}
			<a {href}>
				<span>{label}</span>
			</a>
		</div>
	</>;
}

function SidebarSection({ title, children }: { title: string; children: any }) {
	return <>
		let &[expanded] = track(true);
		<section class="sidebar-section">
			<div class="section-header">
				<h2>{title}</h2>
				<button onClick={() => (expanded = !expanded)}>{'Toggle'}</button>
			</div>
			if (expanded) {
				<div class="section-items">{children}</div>
			}
		</section>
	</>;
}

function SideNav({ currentPath }: { currentPath: string }) {
	return <>
		<aside class="sidebar">
			<nav>
				<div class="group">
					<SidebarSection title="Getting Started">
						<NavItem href="/intro" text="Introduction" active={currentPath === '/intro'} />
						<NavItem href="/start" text="Quick Start" active={currentPath === '/start'} />
					</SidebarSection>
				</div>
				<div class="group">
					<SidebarSection title="Guide">
						<NavItem href="/guide/app" text="Application" active={currentPath === '/guide/app'} />
						<NavItem href="/guide/syntax" text="Syntax" active={currentPath === '/guide/syntax'} />
					</SidebarSection>
				</div>
			</nav>
		</aside>
	</>;
}

function PageHeader() {
	return <>
		<header class="page-header">
			<div class="logo">{'MyApp'}</div>
		</header>
	</>;
}

export function LayoutWithSidebarAndMain() {
	return <>
		<div class="layout">
			<PageHeader />
			<div class="content-wrapper">
				<SideNav currentPath="/intro" />
				<main class="main-content">
					<div class="article">
						<div>
							<h1>{'Introduction'}</h1>
							<p>{'Welcome to the docs.'}</p>
						</div>
					</div>
					if (true) {
						<div class="edit-link">
							<a href="/edit">{'Edit'}</a>
						</div>
					}
					<PageHeader />
				</main>
			</div>
		</div>
	</>;
}

function ArticleWrapper({ children }: { children: any }) {
	return <>
		<article class="doc-content">
			<div>{children}</div>
		</article>
	</>;
}

function SimpleFooter() {
	return <><footer class="doc-footer">{'Footer'}</footer></>;
}

export function ArticleWithChildrenThenSibling() {
	return <>
		<div class="content-container">
			<ArticleWrapper>
				<h1>{'Title'}</h1>
				<p>{'Content goes here.'}</p>
			</ArticleWrapper>
			if (true) {
				<div class="edit-link">
					<a href="/edit">{'Edit'}</a>
				</div>
			}
			if (true) {
				<nav class="prev-next">
					<a href="/prev">{'Previous'}</a>
				</nav>
			}
			<SimpleFooter />
		</div>
	</>;
}

export function ArticleWithHtmlChildThenSibling() {
	return <>
		const htmlContent = '<pre><code>const x = 1;</code></pre>';
		<div class="content-container">
			<ArticleWrapper>
				<div class="doc-content" innerHTML={htmlContent} />
			</ArticleWrapper>
			if (true) {
				<div class="edit-link">
					<a href="/edit">{'Edit'}</a>
				</div>
			}
			<SimpleFooter />
		</div>
	</>;
}

function InlineArticleLayout({ children }: { children: any }) {
	return <>
		<div class="content-container">
			<article class="doc-content">
				<div>{children}</div>
			</article>
			if (true) {
				<div class="edit-link">
					<a href="/edit">{'Edit'}</a>
				</div>
			}
			<SimpleFooter />
		</div>
	</>;
}

export function InlineArticleWithHtmlChild() {
	return <>
		const htmlContent = '<pre><code>const x = 1;</code></pre>';
		<InlineArticleLayout>
			<div class="doc-content" innerHTML={htmlContent} />
		</InlineArticleLayout>
	</>;
}

function HeaderStub() {
	return <><header class="header">{'Header'}</header></>;
}

function SidebarStub() {
	return <><aside class="sidebar">{'Sidebar'}</aside></>;
}

function FooterStub() {
	return <><footer class="footer">{'Footer'}</footer></>;
}

function DocsLayoutInner({
	children,
	editPath = '',
	nextLink = null,
}: {
	children: any;
	editPath?: string;
	nextLink?: { href: string; text: string } | null;
}) {
	return <>
		<div class="layout">
			<HeaderStub />
			<div class="docs-wrapper">
				<SidebarStub />
				<main class="docs-main">
					<div class="docs-container">
						<div class="content">
							<div class="content-container">
								<article class="doc-content">
									<div>{children}</div>
								</article>
								if (editPath) {
									<div class="edit-link">
										<a href="/edit">{'Edit on GitHub'}</a>
									</div>
								}
								if (nextLink) {
									<nav class="prev-next">
										<a href={nextLink.href}>{nextLink.text}</a>
									</nav>
								}
								<FooterStub />
							</div>
						</div>
					</div>
				</main>
			</div>
		</div>
	</>;
}

export function DocsLayoutWithData() {
	return <>
		const htmlContent = '<h1>Title</h1><p>Content</p>';
		<DocsLayoutInner editPath="docs/styling.md" nextLink={{ href: '/next', text: 'Next' }}>
			<div class="doc-content" innerHTML={htmlContent} />
		</DocsLayoutInner>
	</>;
}

export function DocsLayoutWithoutData() {
	return <>
		const htmlContent: string | undefined = undefined;
		<DocsLayoutInner>
			<div class="doc-content" innerHTML={htmlContent} />
		</DocsLayoutInner>
	</>;
}

function DocsLayoutExact({
	children,
	editPath = '',
	prevLink = null,
	nextLink = null,
	toc = [],
}: {
	children: any;
	editPath?: string;
	prevLink?: { href: string; text: string } | null;
	nextLink?: { href: string; text: string } | null;
	toc?: { href: string; text: string }[];
}) {
	return <>
		<div class="layout">
			<HeaderStub />
			<div class="docs-wrapper">
				<SidebarStub />
				<main class="docs-main">
					<div class="docs-container">
						<div class="content">
							<div class="content-container">
								<article class="doc-content">
									<div>{children}</div>
								</article>
								if (editPath) {
									<div class="edit-link">
										<a href={`/edit/${editPath}`}>{'Edit on GitHub'}</a>
									</div>
								}
								if (prevLink || nextLink) {
									<nav class="prev-next">
										if (prevLink) {
											<a href={prevLink.href} class="pager prev">
												<span class="title">{prevLink.text}</span>
											</a>
										} else {
											<span />
										}
										if (nextLink) {
											<a href={nextLink.href} class="pager next">
												<span class="title">{nextLink.text}</span>
											</a>
										}
									</nav>
								}
								<FooterStub />
							</div>
						</div>
						<aside class="aside">
							if (toc.length > 0) {
								<div class="aside-content">
									<nav class="outline">
										for (const item of toc) {
											<a href={item.href}>{item.text}</a>
										}
									</nav>
								</div>
							}
						</aside>
					</div>
				</main>
			</div>
		</div>
	</>;
}

export function DocsLayoutExactWithData() {
	return <>
		const htmlContent = '<h1>Styling Guide</h1><p>Content</p>';
		<DocsLayoutExact
			editPath="docs/guide/styling.md"
			prevLink={{ href: '/prev', text: 'Previous' }}
			nextLink={{ href: '/next', text: 'Next' }}
			toc={[
				{ href: '#intro', text: 'Introduction' },
				{ href: '#usage', text: 'Usage' },
			]}
		>
			<div class="doc-content" innerHTML={htmlContent} />
		</DocsLayoutExact>
	</>;
}

export function DocsLayoutExactWithoutData() {
	return <>
		const htmlContent: string | undefined = undefined;
		const editPath: string | undefined = undefined;
		const prevLink: { href: string; text: string } | null | undefined = undefined;
		const nextLink: { href: string; text: string } | null | undefined = undefined;
		const toc: { href: string; text: string }[] | undefined = undefined;
		<DocsLayoutExact {editPath} {prevLink} {nextLink} {toc}>
			<div class="doc-content" innerHTML={htmlContent} />
		</DocsLayoutExact>
	</>;
}

export function TemplateWithHtmlContent() {
	return <>
		const data = { title: 'Test', value: 42 };
		<div>
			<template id="t1" innerHTML={JSON.stringify(data)} />
			<p class="content">{'Main content'}</p>
		</div>
	</>;
}

export function TemplateWithHtmlAndSiblings() {
	return <>
		const data = { name: 'Ripple', version: '1.0' };
		<div class="wrapper">
			<h1>{'Title'}</h1>
			<template id="data-template" innerHTML={JSON.stringify(data)} />
			<p class="after-template">{'Content after template'}</p>
		</div>
	</>;
}

function LayoutWithTemplate({ children, data }: { children: any; data: object }) {
	return <>
		<div class="layout">
			<template id="page-data" innerHTML={JSON.stringify(data)} />
			<main>{children}</main>
		</div>
	</>;
}

export function NestedTemplateInLayout() {
	return <>
		const doc = { title: 'Comparison', html: '<p>Content</p>' };
		<LayoutWithTemplate data={doc}>
			<div class="doc-content" innerHTML={doc.html} />
		</LayoutWithTemplate>
	</>;
}

export function HtmlCodeBlocksWithSiblingChain() {
	return <>
		const html1 = '<span class="kw">const</span> <span class="id">a</span> = 1;';
		const html2 = '<span class="kw">const</span> <span class="id">b</span> = 2;';
		const html3 = '<span class="kw">const</span> <span class="id">c</span> = 3;';
		<section class="readable-section">
			<p>{'Ergonomics'}</p>
			<h2>{'Sibling traversal pattern'}</h2>
			<p>{'Before first block'}</p>
			<p>{'Before second block'}</p>
			<pre class="code-block">
				<code innerHTML={html1} />
			</pre>
			<p>{'Between one and two'}</p>
			<pre class="code-block">
				<code innerHTML={html2} />
			</pre>
			<p>{'Between two and three'}</p>
			<pre class="code-block">
				<code innerHTML={html3} />
			</pre>
		</section>
	</>;
}
