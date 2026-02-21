import { Marked } from 'marked';
import { createHighlighter } from 'shiki';

// Import the Ripple TextMate grammar directly (bundled by Vite at build time)
import ripple_grammar from '../../../grammars/textmate/ripple.tmLanguage.json';

// Import all doc markdown files as raw strings (bundled by Vite at build time).
// This ensures docs are available in production without runtime fs access.
const docs_files = import.meta.glob('../../docs/**/*.md', {
	query: '?raw',
	import: 'default',
	eager: true,
});

// Build a slug -> content map
const DOCS_GLOB_PREFIX = '../../docs/';
/** @type {Record<string, string>} */
const docs_map = {};
for (const [file_path, content] of Object.entries(docs_files)) {
	const slug = file_path.slice(DOCS_GLOB_PREFIX.length, -3);
	docs_map[slug] = /** @type {string} */ (content);
}
const modified_grammar = {
	...ripple_grammar,
	embeddedLangs: ['jsx', 'tsx', 'css'],
};

// Initialize Shiki highlighter (top-level await)
const highlighter = await createHighlighter({
	themes: ['github-dark'],
	langs: [
		'javascript',
		'typescript',
		'jsx',
		'tsx',
		'css',
		'html',
		'sh',
		'bash',
		'json',
		modified_grammar,
		{ ...modified_grammar, name: 'ripple' },
	],
});

/**
 * Parse YAML-like frontmatter from markdown content
 * @param {string} content
 * @returns {{ frontmatter: Record<string, string>, body: string }}
 */
function parse_frontmatter(content) {
	const match = content.match(/^---\n([\s\S]*?)\n---\n/);
	if (!match) return { frontmatter: {}, body: content };

	const frontmatter_str = match[1];
	/** @type {Record<string, string>} */
	const frontmatter = {};
	for (const line of frontmatter_str.split('\n')) {
		const colon = line.indexOf(':');
		if (colon !== -1) {
			const key = line.slice(0, colon).trim();
			const value = line.slice(colon + 1).trim();
			frontmatter[key] = value;
		}
	}

	return { frontmatter, body: content.slice(match[0].length) };
}

/**
 * Process VitePress-specific custom containers (::: info, ::: tip, etc.)
 * @param {string} content
 * @returns {string}
 */
function process_containers(content) {
	// Match ::: type Title\n...\n:::
	return content.replace(
		/^:::\s*(info|tip|warning|danger|details)\s*(.*?)\n([\s\S]*?)^:::/gm,
		(_, type, title, body) => {
			const title_html = title.trim() ? `<p class="custom-block-title">${title.trim()}</p>` : '';
			return `<div class="${type} custom-block">${title_html}\n${body}</div>`;
		},
	);
}

/**
 * Process <Code> wrappers (Code/Playground tabs around code blocks)
 * @param {string} content
 * @returns {string}
 */
function process_code_tabs(content) {
	return content.replace(/<Code>\s*\n([\s\S]*?)\n<\/Code>/g, (_, inner) => {
		// The inner content should contain a fenced code block
		return `<div class="code-tab-wrapper">\n${inner}\n</div>`;
	});
}

/**
 * Process <Badge> components
 * @param {string} content
 * @returns {string}
 */
function process_badges(content) {
	return content.replace(/<Badge\s+type="([^"]*?)"\s+text="([^"]*?)"\s*\/>/g, (_, type, text) => {
		return `<span class="badge ${type}">${text}</span>`;
	});
}

/**
 * Strip npm auto command syntax: // [!=npm auto]
 * @param {string} content
 * @returns {string}
 */
function strip_npm_commands(content) {
	return content.replace(/\s*\/\/\s*\[!=npm auto\]/g, '');
}

/**
 * Extract TOC headings from markdown content
 * @param {string} content
 * @returns {Array<{ href: string, text: string, level: number }>}
 */
function extract_toc(content) {
	/** @type {Array<{ href: string, text: string, level: number }>} */
	const toc = [];
	const heading_regex = /^(#{2,3})\s+(.+)$/gm;
	let match;

	while ((match = heading_regex.exec(content)) !== null) {
		const level = match[1].length;
		// Remove inline code, badges, and HTML from heading text
		let text = match[2]
			.replace(/<[^>]+>/g, '')
			.replace(/`([^`]*)`/g, '$1')
			.trim();
		const id = text
			.toLowerCase()
			.replace(/[^\w\s-]/g, '')
			.replace(/\s+/g, '-');
		toc.push({ href: `#${id}`, text, level });
	}

	return toc;
}

/**
 * Compute prev/next navigation links for a given slug
 * @param {string} slug
 * @returns {{ prev: { href: string, text: string } | null, next: { href: string, text: string } | null }}
 */
function get_prev_next(slug) {
	/** @type {Array<{ text: string, link: string }>} */
	const flat_items = [
		{ text: 'Introduction', link: 'introduction' },
		{ text: 'Quick Start', link: 'quick-start' },
		{ text: 'Creating an Application', link: 'guide/application' },
		{ text: 'Template Syntax', link: 'guide/syntax' },
		{ text: 'Components', link: 'guide/components' },
		{ text: 'Control Flow', link: 'guide/control-flow' },
		{ text: 'Reactivity', link: 'guide/reactivity' },
		{ text: 'Events', link: 'guide/events' },
		{ text: 'DOM References', link: 'guide/dom-refs' },
		{ text: 'State Management', link: 'guide/state-management' },
		{ text: 'Head Management', link: 'guide/head-management' },
		{ text: 'Styling', link: 'guide/styling' },
		{ text: 'Bindings', link: 'guide/bindings' },
		{ text: 'Comparison to Other Frameworks', link: 'comparison' },
		{ text: 'Best Practices', link: 'best-practices' },
		{ text: 'Libraries', link: 'libraries' },
		{ text: 'Troubleshooting', link: 'troubleshooting' },
	];

	const index = flat_items.findIndex((item) => item.link === slug);
	if (index === -1) return { prev: null, next: null };

	const prev =
		index > 0
			? {
					href: `/docs/${flat_items[index - 1].link}`,
					text: flat_items[index - 1].text,
				}
			: null;

	const next =
		index < flat_items.length - 1
			? {
					href: `/docs/${flat_items[index + 1].link}`,
					text: flat_items[index + 1].text,
				}
			: null;

	return { prev, next };
}

/**
 * Process a markdown file and return rendered HTML and metadata
 * @param {string} slug - The doc slug (e.g., "introduction", "guide/application")
 * @returns {{ html: string, title: string, toc: Array<{ href: string, text: string }>, editPath: string, prev: { href: string, text: string } | null, next: { href: string, text: string } | null }}
 */
export function get_doc(slug) {
	const content = docs_map[slug];

	if (!content) {
		return {
			html: '<p>Page not found.</p>',
			title: 'Not Found',
			toc: [],
			editPath: '',
			prev: null,
			next: null,
		};
	}
	const { frontmatter, body } = parse_frontmatter(content);

	// Pre-process content
	let processed = body;
	processed = process_containers(processed);
	processed = process_code_tabs(processed);
	processed = process_badges(processed);
	processed = strip_npm_commands(processed);

	// Extract TOC before processing
	const toc = extract_toc(body);

	// Configure marked
	const marked = new Marked({
		renderer: {
			heading({ tokens, depth }) {
				const text = this.parser.parseInline(tokens);
				// Strip HTML tags for ID generation
				const plain_text = text.replace(/<[^>]+>/g, '').trim();
				const id = plain_text
					.toLowerCase()
					.replace(/[^\w\s-]/g, '')
					.replace(/\s+/g, '-');

				return `<h${depth} id="${id}" class="doc-h${depth}">${text}<a class="header-anchor" href="#${id}" aria-label="Permalink to ${plain_text}"></a></h${depth}>\n`;
			},
			code({ text, lang }) {
				const language = lang || 'text';
				let highlighted;

				try {
					highlighted = highlighter.codeToHtml(text, {
						lang: language,
						theme: 'github-dark',
					});
				} catch {
					// Fallback for unsupported languages
					const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
					highlighted = `<pre class="shiki" style="background-color:#24292e"><code>${escaped}</code></pre>`;
				}

				// Check if this code block is inside a <Code> tab wrapper
				const is_tabbed = lang === 'ripple';

				if (is_tabbed) {
					return `<div class="language-${language}"><button title="Copy Code" class="copy"></button><span class="lang">${language}</span>${highlighted}</div>`;
				}

				return `<div class="language-${language}"><button title="Copy Code" class="copy"></button><span class="lang">${language}</span>${highlighted}</div>`;
			},
			codespan({ text }) {
				return `<code>${text}</code>`;
			},
			link({ href, title, tokens }) {
				const text = this.parser.parseInline(tokens);
				const title_attr = title ? ` title="${title}"` : '';
				const is_external = href.startsWith('http://') || href.startsWith('https://');
				const target = is_external ? ' target="_blank" rel="noopener noreferrer"' : '';
				return `<a href="${href}"${title_attr}${target}>${text}</a>`;
			},
		},
	});

	const html = /** @type {string} */ (marked.parse(processed));

	// Wrap code-tab-wrapper divs with tabs UI
	const final_html = html.replace(
		/<div class="code-tab-wrapper">\s*([\s\S]*?)\s*<\/div>/g,
		(_, inner) => {
			return `<div class="doc-code-group"><div class="tabs"><button class="tab active">Code</button><button class="tab">Playground</button></div><div class="blocks">${inner}</div></div>`;
		},
	);

	const { prev, next } = get_prev_next(slug);

	return {
		html: final_html,
		title: frontmatter.title || 'Docs',
		toc,
		editPath: `docs/${slug}.md`,
		prev,
		next,
	};
}
