import { Fragment, track } from 'ripple';

export function StaticHtml() @{
	const html = '<p><strong>Bold</strong> text</p>';
	<div innerHTML={html} />
}

export function DynamicHtml() @{
	const content = '<p>Dynamic <span>HTML</span> content</p>';
	<div innerHTML={content} />
}

export function EmptyHtml() @{
	const html = '';
	<div innerHTML={html} />
}

export function ComplexHtml() @{
	const html = '<div class="nested"><span>Nested <em>content</em></span></div>';
	<section innerHTML={html} />
}

export function MultipleHtml() @{
	const html1 = '<p>First paragraph</p>';
	const html2 = '<p>Second paragraph</p>';
	<div>
		<Fragment innerHTML={html1} />
		<Fragment innerHTML={html2} />
	</div>
}

export function HtmlWithReactivity() @{
	<div>
		<Fragment innerHTML="<p>Count: 0</p>" />
		<button>{'Increment'}</button>
	</div>
}

export function HtmlWrapper({ children }: { children: any }) @{
	<div class="wrapper">
		<div class="inner">{children}</div>
	</div>
}

export function HtmlInChildren() @{
	const content = '<p><strong>Bold</strong> text</p>';
	<HtmlWrapper>
		<div class="vp-doc" innerHTML={content} />
	</HtmlWrapper>
}

export function HtmlInChildrenWithSiblings() @{
	const content = '<p>Dynamic content</p>';
	<HtmlWrapper>
		<h1>{'Title'}</h1>
		<div class="content" innerHTML={content} />
	</HtmlWrapper>
}

export function MultipleHtmlInChildren() @{
	const html1 = '<p>First</p>';
	const html2 = '<p>Second</p>';
	<HtmlWrapper>
		<div class="doc">
			<Fragment innerHTML={html1} />
			<Fragment innerHTML={html2} />
		</div>
	</HtmlWrapper>
}

export function HtmlWithComments() @{
	const content = '<p>Before comment</p><!-- TODO: Elaborate --><p>After comment</p>';
	<div innerHTML={content} />
}

export function HtmlWithEmptyComment() @{
	const content = '<p>Before</p><!----><p>After</p>';
	<div innerHTML={content} />
}

export function HtmlWithCommentsInChildren() @{
	const content = '<h2 id="intro">Introduction</h2><p>Some text</p><!-- TODO --><p>More text</p>';
	<HtmlWrapper>
		<div class="vp-doc" innerHTML={content} />
	</HtmlWrapper>
}

function DocFooter() @{
	<footer class="doc-footer">{'Footer content'}</footer>
}

export function DocLayout(&{
	children,
	editPath = '',
	nextLink = null,
	toc = [],
}: {
	children: any;
	editPath?: string;
	nextLink?: { href: string; text: string } | null;
	toc?: { href: string; text: string }[];
}) @{
	<div class="layout">
		<div class="content-container">
			<article>
				<div>{children}</div>
			</article>
			@if (editPath) {
				<div class="edit-link">
					<a href={`https://github.com/edit/${editPath}`}>{'Edit'}</a>
				</div>
			}
			@if (nextLink) {
				<nav class="prev-next">
					<a href={nextLink.href}>{nextLink.text}</a>
				</nav>
			}
			<DocFooter />
		</div>
		<aside>
			@if (toc.length > 0) {
				<div class="toc">
					<ul>
						@for (const item of toc) {
							<li>
								<a href={item.href}>{item.text}</a>
							</li>
						}
					</ul>
				</div>
			}
		</aside>
	</div>
}

export function HtmlWithServerData() @{
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
}

export function HtmlWithClientDefaults() @{
	const content = '<h1 id="intro" class="doc-h1">Introduction</h1><p>Ripple is a framework.</p>';
	<DocLayout>
		<div class="vp-doc" innerHTML={content} />
	</DocLayout>
}

export function HtmlWithUndefinedContent() @{
	const content: string | undefined = undefined;
	<DocLayout>
		<div class="vp-doc" innerHTML={content} />
	</DocLayout>
}

function DynamicHeading({ level, children }: { level: number; children: any }) @{
	@switch (level) {
		@case 1: {
			<h1 class="heading">{children}</h1>
		}
		@case 2: {
			<h2 class="heading">{children}</h2>
		}
	}
}

function CodeBlock({ code }: { code: string }) @{
	const highlighted = `<pre class="shiki"><code>${code}</code></pre>`;
	<div class="code-block">
		<div class="header">
			<button>{'Copy'}</button>
			<span class="lang">{'js'}</span>
		</div>
		<div class="content" innerHTML={highlighted} />
	</div>
}

function ContentWrapper({ children }: { children: any }) @{
	<div class="wrapper">
		<div class="inner">{children}</div>
	</div>
}

export function HtmlAfterSwitchInChildren() @{
	<ContentWrapper>
		<DynamicHeading level={1}>{'Title'}</DynamicHeading>
		<p>{'First paragraph'}</p>
		<p>{'Second paragraph'}</p>
		<CodeBlock code="const x = 1;" />
		<p>{'After code'}</p>
	</ContentWrapper>
}

// A component whose root is a single @if (root-controlled: no `<!>` wrapper),
// used as the first child of a composite slot with following siblings — exercises
// the hydration boundary advance for a root-controlled block inside a composite.
function IfHeading({ primary, children }: { primary: boolean; children: any }) @{
	@if (primary) {
		<h1 class="heading">{children}</h1>
	} @else {
		<h2 class="heading">{children}</h2>
	}
}

export function HtmlAfterIfInChildren() @{
	<ContentWrapper>
		<IfHeading primary={true}>{'Title'}</IfHeading>
		<p>{'First paragraph'}</p>
		<p>{'Second paragraph'}</p>
		<CodeBlock code="const x = 1;" />
		<p>{'After code'}</p>
	</ContentWrapper>
}

// Root-controlled @for (sibling semantics via the ROOT_CONTROLLED flag) as a
// composite child with following siblings.
function ForList({ items }: { items: string[] }) @{
	@for (const item of items) {
		<span class="for-item">{item}</span>
	}
}

export function HtmlAfterForInChildren() @{
	<ContentWrapper>
		<ForList items={['Title', 'Subtitle']} />
		<p>{'First paragraph'}</p>
		<CodeBlock code="const x = 1;" />
		<p>{'After code'}</p>
	</ContentWrapper>
}

// Root-controlled @try (async branches) as a composite child with siblings.
function TryBox({ value }: { value: string }) @{
	@try {
		<div class="try-box">{value}</div>
	} @catch (e) {
		<span>{'error'}</span>
	}
}

export function HtmlAfterTryInChildren() @{
	<ContentWrapper>
		<TryBox value="Title" />
		<p>{'First paragraph'}</p>
		<CodeBlock code="const x = 1;" />
		<p>{'After code'}</p>
	</ContentWrapper>
}

// Root-controlled single component: a component whose body is a single child
// component (no `<!>` wrapper), used as a composite child with siblings.
function Boxed({ children }: { children: any }) @{
	<span class="boxed">{children}</span>
}

function IndirectHeading({ text }: { text: string }) @{
	<Boxed>{text}</Boxed>
}

export function HtmlAfterComponentInChildren() @{
	<ContentWrapper>
		<IndirectHeading text="Title" />
		<p>{'First paragraph'}</p>
		<CodeBlock code="const x = 1;" />
		<p>{'After code'}</p>
	</ContentWrapper>
}

function NavItem(&{
	href,
	text: label,
	active = false,
}: {
	href: string;
	text: string;
	active?: boolean;
}) @{
	<div class={`nav-item${active ? ' active' : ''}`}>
		@if (active) {
			<div class="indicator" />
		}
		<a {href}>
			<span>{label}</span>
		</a>
	</div>
}

function SidebarSection({ title, children }: { title: string; children: any }) @{
	let &[expanded] = track(true);
	<section class="sidebar-section">
		<div class="section-header">
			<h2>{title}</h2>
			<button onClick={() => (expanded = !expanded)}>{'Toggle'}</button>
		</div>
		@if (expanded) {
			<div class="section-items">{children}</div>
		}
	</section>
}

function SideNav({ currentPath }: { currentPath: string }) @{
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
}

function PageHeader() @{
	<header class="page-header">
		<div class="logo">{'MyApp'}</div>
	</header>
}

export function LayoutWithSidebarAndMain() @{
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
				@if (true) {
					<div class="edit-link">
						<a href="/edit">{'Edit'}</a>
					</div>
				}
				<PageHeader />
			</main>
		</div>
	</div>
}

function ArticleWrapper({ children }: { children: any }) @{
	<article class="doc-content">
		<div>{children}</div>
	</article>
}

function SimpleFooter() @{
	<footer class="doc-footer">{'Footer'}</footer>
}

export function ArticleWithChildrenThenSibling() @{
	<div class="content-container">
		<ArticleWrapper>
			<h1>{'Title'}</h1>
			<p>{'Content goes here.'}</p>
		</ArticleWrapper>
		@if (true) {
			<div class="edit-link">
				<a href="/edit">{'Edit'}</a>
			</div>
		}
		@if (true) {
			<nav class="prev-next">
				<a href="/prev">{'Previous'}</a>
			</nav>
		}
		<SimpleFooter />
	</div>
}

export function ArticleWithHtmlChildThenSibling() @{
	const htmlContent = '<pre><code>const x = 1;</code></pre>';
	<div class="content-container">
		<ArticleWrapper>
			<div class="doc-content" innerHTML={htmlContent} />
		</ArticleWrapper>
		@if (true) {
			<div class="edit-link">
				<a href="/edit">{'Edit'}</a>
			</div>
		}
		<SimpleFooter />
	</div>
}

function InlineArticleLayout({ children }: { children: any }) @{
	<div class="content-container">
		<article class="doc-content">
			<div>{children}</div>
		</article>
		@if (true) {
			<div class="edit-link">
				<a href="/edit">{'Edit'}</a>
			</div>
		}
		<SimpleFooter />
	</div>
}

export function InlineArticleWithHtmlChild() @{
	const htmlContent = '<pre><code>const x = 1;</code></pre>';
	<InlineArticleLayout>
		<div class="doc-content" innerHTML={htmlContent} />
	</InlineArticleLayout>
}

function HeaderStub() @{
	<header class="header">{'Header'}</header>
}

function SidebarStub() @{
	<aside class="sidebar">{'Sidebar'}</aside>
}

function FooterStub() @{
	<footer class="footer">{'Footer'}</footer>
}

function DocsLayoutInner(&{
	children,
	editPath = '',
	nextLink = null,
}: {
	children: any;
	editPath?: string;
	nextLink?: { href: string; text: string } | null;
}) @{
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
							@if (editPath) {
								<div class="edit-link">
									<a href="/edit">{'Edit on GitHub'}</a>
								</div>
							}
							@if (nextLink) {
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
}

export function DocsLayoutWithData() @{
	const htmlContent = '<h1>Title</h1><p>Content</p>';
	<DocsLayoutInner editPath="docs/styling.md" nextLink={{ href: '/next', text: 'Next' }}>
		<div class="doc-content" innerHTML={htmlContent} />
	</DocsLayoutInner>
}

export function DocsLayoutWithoutData() @{
	const htmlContent: string | undefined = undefined;
	<DocsLayoutInner>
		<div class="doc-content" innerHTML={htmlContent} />
	</DocsLayoutInner>
}

function DocsLayoutExact(&{
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
}) @{
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
							@if (editPath) {
								<div class="edit-link">
									<a href={`/edit/${editPath}`}>{'Edit on GitHub'}</a>
								</div>
							}
							@if (prevLink || nextLink) {
								<nav class="prev-next">
									@if (prevLink) {
										<a href={prevLink.href} class="pager prev">
											<span class="title">{prevLink.text}</span>
										</a>
									} @else {
										<span />
									}
									@if (nextLink) {
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
						@if (toc.length > 0) {
							<div class="aside-content">
								<nav class="outline">
									@for (const item of toc) {
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
}

export function DocsLayoutExactWithData() @{
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
}

export function DocsLayoutExactWithoutData() @{
	const htmlContent: string | undefined = undefined;
	const editPath: string | undefined = undefined;
	const prevLink: { href: string; text: string } | null | undefined = undefined;
	const nextLink: { href: string; text: string } | null | undefined = undefined;
	const toc: { href: string; text: string }[] | undefined = undefined;
	<DocsLayoutExact {editPath} {prevLink} {nextLink} {toc}>
		<div class="doc-content" innerHTML={htmlContent} />
	</DocsLayoutExact>
}

export function TemplateWithHtmlContent() @{
	const data = { title: 'Test', value: 42 };
	<div>
		<template id="t1" innerHTML={JSON.stringify(data)} />
		<p class="content">{'Main content'}</p>
	</div>
}

export function TemplateWithHtmlAndSiblings() @{
	const data = { name: 'Ripple', version: '1.0' };
	<div class="wrapper">
		<h1>{'Title'}</h1>
		<template id="data-template" innerHTML={JSON.stringify(data)} />
		<p class="after-template">{'Content after template'}</p>
	</div>
}

function LayoutWithTemplate({ children, data }: { children: any; data: object }) @{
	<div class="layout">
		<template id="page-data" innerHTML={JSON.stringify(data)} />
		<main>{children}</main>
	</div>
}

export function NestedTemplateInLayout() @{
	const doc = { title: 'Comparison', html: '<p>Content</p>' };
	<LayoutWithTemplate data={doc}>
		<div class="doc-content" innerHTML={doc.html} />
	</LayoutWithTemplate>
}

export function HtmlCodeBlocksWithSiblingChain() @{
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
}
