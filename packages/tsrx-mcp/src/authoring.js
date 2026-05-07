/**
 * @typedef {{
 *   kind: string,
 *   severity: 'error' | 'warning' | 'info',
 *   title: string,
 *   message: string,
 *   snippet: string | null,
 *   recommendation: string,
 *   documentation: string[],
 * }} AuthoringIssue
 */

const DEFAULT_FILENAME = 'Component.tsrx';

/**
 * @param {string | undefined} filename
 */
function normalize_filename(filename) {
	return filename?.trim() || DEFAULT_FILENAME;
}

/**
 * @param {string | undefined} target
 */
function normalize_target(target) {
	return target?.trim() || null;
}

/**
 * @param {string} value
 */
function escape_regexp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * @param {string} attrs
 * @param {string} name
 */
function has_attribute(attrs, name) {
	return new RegExp(`\\b${escape_regexp(name)}\\s*=`).test(attrs);
}

/**
 * @param {string} attrs
 * @param {string} name
 */
function get_attribute(attrs, name) {
	const match = attrs.match(
		new RegExp(`\\b${escape_regexp(name)}\\s*=\\s*("[^"]*"|'[^']*'|\\{[^}]+\\})`),
	);
	if (!match) return null;
	const value = match[1];
	if (
		(value.startsWith('"') && value.endsWith('"')) ||
		(value.startsWith("'") && value.endsWith("'"))
	) {
		return value.slice(1, -1);
	}
	return value;
}

/**
 * @param {string} text
 */
function line_snippet(text) {
	return (
		text
			.split('\n')
			.map((line) => line.trim())
			.find(Boolean)
			?.slice(0, 240) ?? null
	);
}

/**
 * @param {string} inner
 */
function has_expression_text(inner) {
	return (
		/\{\s*(['"`])[\s\S]*?\1\s*\}/.test(inner) || /\{[A-Za-z0-9_$.[\]?!:'"`\s+-]+\}/.test(inner)
	);
}

/**
 * @param {string} inner
 */
function has_direct_quoted_text(inner) {
	return /(^|>)\s*"[^"]+"\s*(<|$)/.test(inner);
}

/**
 * @param {string} inner
 */
function has_visible_label_text(inner) {
	const without_tags = inner.replace(/<[^>]+>/g, ' ');
	return has_expression_text(inner) || /[A-Za-z0-9]/.test(without_tags.replace(/"[^"]*"/g, ''));
}

/**
 * @param {string} code
 * @param {string} id
 */
function find_label_for_id(code, id) {
	const quoted = escape_regexp(id);
	const label_pattern = new RegExp(
		`<label\\b([^>]*)\\bhtmlFor\\s*=\\s*["']${quoted}["']([^>]*)>([\\s\\S]*?)<\\/label>`,
		'g',
	);
	const match = label_pattern.exec(code);
	return match ? match[0] : null;
}

/**
 * @param {string} attrs
 */
function get_input_type(attrs) {
	return (get_attribute(attrs, 'type') ?? 'text').replace(/[{}'"`]/g, '').toLowerCase();
}

/**
 * @param {string} code
 */
function collect_direct_quoted_text_issues(code) {
	/** @type {AuthoringIssue[]} */
	const issues = [];
	const direct_text_regex = /<([a-z][\w.-]*)(\s[^>]*)?>\s*"([^"]+)"\s*<\/\1>/g;
	for (const match of code.matchAll(direct_text_regex)) {
		issues.push({
			kind: 'direct-quoted-text',
			severity: match[1] === 'button' ? 'error' : 'warning',
			title: 'Use expression text for visible TSRX text',
			message:
				'Direct quoted text inside TSRX elements can be treated as a JavaScript string statement instead of rendered text in some target output.',
			snippet: line_snippet(match[0]),
			recommendation: `Replace it with expression text, for example <${match[1]}>{'${match[3].replace(/'/g, "\\'")}'}</${match[1]}>.`,
			documentation: ['tsrx://docs/text-and-template-expressions.md'],
		});
	}
	return issues;
}

/**
 * Reviews generated TSRX source for common accessibility mistakes that are cheap
 * to catch before a browser-based Axe run.
 *
 * @param {{ code: string, filename?: string, target?: string }} input
 */
export function review_tsrx_accessibility(input) {
	const filename = normalize_filename(input.filename);
	const target = normalize_target(input.target);
	/** @type {AuthoringIssue[]} */
	const issues = [...collect_direct_quoted_text_issues(input.code)];

	const button_regex = /<button\b([^>]*)>([\s\S]*?)<\/button>/g;
	for (const match of input.code.matchAll(button_regex)) {
		const attrs = match[1] ?? '';
		const inner = match[2] ?? '';
		const has_name =
			has_attribute(attrs, 'aria-label') ||
			has_attribute(attrs, 'aria-labelledby') ||
			has_attribute(attrs, 'title') ||
			(has_expression_text(inner) && !/^\s*\{\s*['"`]\s*['"`]\s*\}\s*$/.test(inner));

		if (!has_name || has_direct_quoted_text(inner)) {
			issues.push({
				kind: 'button-accessible-name',
				severity: 'error',
				title: 'Give every button a stable accessible name',
				message:
					'Buttons must expose a visible label or an aria-label. This is especially important for disabled submit buttons and icon-only controls.',
				snippet: line_snippet(match[0]),
				recommendation:
					"Use visible expression text such as {'Add task'} or add aria-label for icon-only buttons.",
				documentation: ['tsrx://docs/text-and-template-expressions.md'],
			});
		}
	}

	const input_regex = /<input\b([^>]*)\/?>/g;
	for (const match of input.code.matchAll(input_regex)) {
		const attrs = match[1] ?? '';
		const type = get_input_type(attrs);
		if (type === 'hidden' || type === 'submit' || type === 'button') continue;

		const has_direct_name =
			has_attribute(attrs, 'aria-label') ||
			has_attribute(attrs, 'aria-labelledby') ||
			has_attribute(attrs, 'title');
		if (has_direct_name) continue;

		const id = get_attribute(attrs, 'id');
		const label = id && !id.startsWith('{') ? find_label_for_id(input.code, id) : null;
		const has_text_label = label ? has_visible_label_text(label) : false;
		const needs_direct_name = type === 'checkbox' || type === 'radio' || !has_text_label;

		if (needs_direct_name) {
			issues.push({
				kind: 'input-accessible-name',
				severity: 'error',
				title: 'Give every form control a readable label',
				message:
					type === 'checkbox' || type === 'radio'
						? 'Checkboxes and radios used as visual toggles still need an accessible name. A decorative checkmark is not a label.'
						: 'Inputs need a text label, aria-label, aria-labelledby, or title that remains in the rendered DOM.',
				snippet: line_snippet(match[0]),
				recommendation:
					type === 'checkbox' || type === 'radio'
						? "Add aria-label={todo.completed ? 'Mark task as incomplete' : 'Mark task as complete'} or include visible label text."
						: 'Add a matching text label with htmlFor, or add aria-label when a visible label is not appropriate.',
				documentation: ['tsrx://docs/components.md'],
			});
		}
	}

	return {
		ok: issues.every((issue) => issue.severity !== 'error'),
		filename,
		target,
		summary:
			issues.length === 0
				? 'No source-level TSRX accessibility issues were found. Still run browser-based Axe for final verification.'
				: `Found ${issues.length} source-level accessibility issue${issues.length === 1 ? '' : 's'} to fix before final Axe verification.`,
		issues,
		nextSteps:
			issues.length === 0
				? ['Run browser-based Axe or the benchmark validation loop.']
				: [
						'Fix error-severity issues before returning code.',
						'Prefer expression text for visible labels.',
						'Run review-tsrx-accessibility again, then compile-tsrx and browser-based Axe.',
					],
	};
}

/**
 * @param {string} hex
 */
function hex_to_rgb(hex) {
	const value = hex.replace('#', '');
	const expanded =
		value.length === 3
			? value
					.split('')
					.map((char) => char + char)
					.join('')
			: value;
	if (!/^[0-9a-f]{6}$/i.test(expanded)) return null;
	const int_value = Number.parseInt(expanded, 16);
	return {
		r: (int_value >> 16) & 255,
		g: (int_value >> 8) & 255,
		b: int_value & 255,
	};
}

/**
 * @param {number} channel
 */
function relative_channel(channel) {
	const value = channel / 255;
	return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

/**
 * @param {{ r: number, g: number, b: number }} rgb
 */
function luminance(rgb) {
	return (
		0.2126 * relative_channel(rgb.r) +
		0.7152 * relative_channel(rgb.g) +
		0.0722 * relative_channel(rgb.b)
	);
}

/**
 * @param {string} foreground
 * @param {string} background
 */
function contrast_ratio(foreground, background) {
	const fg = hex_to_rgb(foreground);
	const bg = hex_to_rgb(background);
	if (!fg || !bg) return null;
	const lighter = Math.max(luminance(fg), luminance(bg));
	const darker = Math.min(luminance(fg), luminance(bg));
	return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Reviews TSRX scoped style authoring for patterns that commonly produce invalid
 * CSS, missing root styling, or preventable contrast failures.
 *
 * @param {{ code: string, filename?: string, target?: string }} input
 */
export function review_tsrx_styles(input) {
	const filename = normalize_filename(input.filename);
	const target = normalize_target(input.target);
	/** @type {AuthoringIssue[]} */
	const issues = [];
	const style_blocks = [...input.code.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)];

	if (style_blocks.length === 0) {
		issues.push({
			kind: 'missing-style-block',
			severity: 'warning',
			title: 'Prefer component-scoped styles',
			message:
				'Non-trivial TSRX components should usually keep component styles in a scoped <style> block next to the component template.',
			snippet: null,
			recommendation:
				'Add a <style> block in the component and reserve global CSS for document-level resets.',
			documentation: ['tsrx://docs/style-and-server.md'],
		});
	}

	for (const style_match of style_blocks) {
		const css = style_match[1] ?? '';
		if (/^\s*\{/.test(css)) {
			issues.push({
				kind: 'style-expression-body',
				severity: 'error',
				title: 'Write CSS directly inside <style>',
				message:
					'A TSRX <style> block should contain CSS text, not a JavaScript template literal expression.',
				snippet: line_snippet(style_match[0]),
				recommendation: 'Replace <style>{`...`}</style> with <style> ...CSS... </style>.',
				documentation: ['tsrx://docs/style-and-server.md'],
			});
		}

		if (/(^|[{};,\s])(:global\(\*\)|\*)\s*\{/.test(css)) {
			issues.push({
				kind: 'universal-selector',
				severity: 'warning',
				title: 'Avoid universal selectors in scoped styles',
				message:
					'Universal selectors make generated examples harder to reason about and can leak broad styling assumptions into nested UI.',
				snippet: line_snippet(css.match(/(:global\(\*\)|\*)\s*\{[^}]*\}/)?.[0] ?? css),
				recommendation: 'Style the component root and named classes instead.',
				documentation: ['tsrx://docs/style-and-server.md'],
			});
		}

		if (/:scope\s*\{/.test(css)) {
			issues.push({
				kind: 'scope-root-style',
				severity: /:scope\s*\{[\s\S]*\b(background|color|min-height|padding|display)\s*:/.test(css)
					? 'error'
					: 'warning',
				title: 'Put app-level visuals on an explicit root class',
				message:
					'For generated app examples, app background, text color, and layout are more robust when attached to the rendered root class, such as .app-shell, rather than only :scope.',
				snippet: line_snippet(css.match(/:scope\s*\{[^}]*\}/)?.[0] ?? ':scope'),
				recommendation:
					'Move root layout/background/color declarations onto the top-level rendered element class.',
				documentation: ['tsrx://docs/style-and-server.md'],
			});
		}

		if (/:scope\s*\{[\s\S]*background/.test(css)) {
			const low_contrast_on_white = [...css.matchAll(/color\s*:\s*(#[0-9a-fA-F]{3,6})\b/g)]
				.map((match) => ({ color: match[1], ratio: contrast_ratio(match[1], '#ffffff') }))
				.filter((entry) => entry.ratio !== null && entry.ratio < 4.5);
			if (low_contrast_on_white.length > 0) {
				issues.push({
					kind: 'contrast-risk-with-scope-background',
					severity: 'error',
					title: 'Avoid contrast depending only on :scope background',
					message:
						'Some text colors in this style block would fail contrast on a default light background if the :scope background does not apply to the rendered root.',
					snippet: `Low-contrast-on-white colors: ${low_contrast_on_white
						.map((entry) => `${entry.color} (${entry.ratio?.toFixed(2)}:1)`)
						.join(', ')}`,
					recommendation:
						'Place the dark background and base text color on the explicit root class, and choose secondary text colors that pass WCAG contrast there.',
					documentation: ['tsrx://docs/style-and-server.md'],
				});
			}
		}
	}

	return {
		ok: issues.every((issue) => issue.severity !== 'error'),
		filename,
		target,
		summary:
			issues.length === 0
				? 'No source-level TSRX style issues were found.'
				: `Found ${issues.length} source-level style issue${issues.length === 1 ? '' : 's'} to review.`,
		issues,
		nextSteps:
			issues.length === 0
				? ['Run compile-tsrx and browser validation for final CSS behavior.']
				: [
						'Fix error-severity style issues first.',
						'Put root layout, background, and text color on an explicit rendered class.',
						'Run review-tsrx-styles again, then validate in a browser.',
					],
	};
}

/**
 * @param {string} code
 */
function get_component_body_line_count(code) {
	const match = code.match(/export\s+component\s+\w+[^{]*\{([\s\S]*)\}\s*$/);
	if (!match) return code.split('\n').length;
	return match[1].split('\n').length;
}

/**
 * Reviews TSRX source for component decomposition opportunities.
 *
 * @param {{ code: string, filename?: string, target?: string }} input
 */
export function review_tsrx_components(input) {
	const filename = normalize_filename(input.filename);
	const target = normalize_target(input.target);
	/** @type {AuthoringIssue[]} */
	const issues = [];
	const body_lines = get_component_body_line_count(input.code);
	const control_flow_count = (input.code.match(/\b(if|for|switch)\s*\(/g) ?? []).length;
	const element_count = (input.code.match(/<[a-z][\w.-]*(\s|>|\/)/g) ?? []).length;
	const style_line_count = [...input.code.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].reduce(
		(total, match) => total + (match[1] ?? '').split('\n').length,
		0,
	);

	if (body_lines > 180 || element_count > 45) {
		issues.push({
			kind: 'large-component',
			severity: 'warning',
			title: 'Split large TSRX components into focused subcomponents',
			message:
				'The component is large enough that generated code is likely to become harder to repair, test, and review.',
			snippet: `${body_lines} component-body lines, ${element_count} template elements.`,
			recommendation:
				'Extract cohesive pieces such as Header, StatsSummary, TodoComposer, TodoList, TodoItem, and EmptyState.',
			documentation: ['tsrx://docs/components.md', 'tsrx://docs/control-flow.md'],
		});
	}

	if (control_flow_count >= 4) {
		issues.push({
			kind: 'control-flow-depth',
			severity: 'info',
			title: 'Use subcomponents around repeated or branching UI',
			message:
				'Multiple control-flow blocks are fine in TSRX, but deeply branching generated examples become more reliable when repeated item UI is moved into a named component.',
			snippet: `${control_flow_count} control-flow blocks detected.`,
			recommendation:
				'When a for-loop item contains buttons, labels, conditionals, or several nested elements, extract an item component and pass typed props/callbacks.',
			documentation: ['tsrx://docs/components.md', 'tsrx://docs/control-flow.md'],
		});
	}

	if (style_line_count > 180) {
		issues.push({
			kind: 'large-style-block',
			severity: 'info',
			title: 'Keep style blocks navigable',
			message:
				'Very large style blocks make generated components harder to audit for accessibility and responsive behavior.',
			snippet: `${style_line_count} style lines detected.`,
			recommendation:
				'Group styles by extracted component or reduce decorative styling before adding more behavior.',
			documentation: ['tsrx://docs/style-and-server.md'],
		});
	}

	return {
		ok: true,
		filename,
		target,
		summary:
			issues.length === 0
				? 'No component decomposition issues were found.'
				: `Found ${issues.length} component-structure recommendation${issues.length === 1 ? '' : 's'}.`,
		issues,
		nextSteps:
			issues.length === 0
				? ['Keep related hooks, handlers, and template branches co-located.']
				: [
						'Extract repeated list items and major page regions into named TSRX components.',
						'Keep hooks and handlers near the branch or component that uses them.',
						'Compile after extracting components to confirm target output.',
					],
	};
}
