import {
	get,
	regular_block,
	render_tsrx_element,
	transform_output,
	tsrx_element,
} from './index.js';
import { map_root_html } from './root-html.js';
import { valid_name, resolve_class, scope_class } from '../../view-transition-style.js';

/** @param {import('#public').ViewTransitionProps} props */
export function ViewTransition(props) {
	return tsrx_element(() => {
		regular_block(() => {
			var name = get(/** @type {any} */ (props.name));
			if (valid_name(name)) {
				var value =
					resolve_class(get(/** @type {any} */ (props.share)), []) ??
					resolve_class(get(/** @type {any} */ (props.default)), []) ??
					'auto';
				value = scope_class(
					value,
					/** @type {import('#public').ViewTransitionProps & { $v?: string }} */ (props).$v,
				);
				transform_output((html) => {
					var index = 0;
					return map_root_html(html, (tag) => {
						if (/^<(script|style|link|meta|title|template|head|noscript)\b/i.test(tag)) return tag;
						var suffix = index++;
						var css =
							'view-transition-name:' +
							(value === 'none' ? 'none' : name + (suffix ? '--ripple-' + suffix : ''));
						if (
							value !== 'auto' &&
							value !== 'none' &&
							/^-?[_a-zA-Z][\w-]*(?:\s+-?[_a-zA-Z][\w-]*)*$/.test(value)
						)
							css += ';view-transition-class:' + value;
						var styled = false;
						tag = tag.replace(
							/(\s+)([^\s=/>]+)(\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/g,
							(attribute, space, key, assignment) => {
								if (key.toLowerCase() !== 'style') return attribute;
								styled = true;
								var raw = assignment ? assignment.replace(/^\s*=\s*/, '') : '""';
								var quote = raw[0] === '"' || raw[0] === "'" ? raw[0] : '"';
								var style = raw[0] === '"' || raw[0] === "'" ? raw.slice(1, -1) : raw;
								// Inner named boundaries and authored native names retain ownership.
								if (/(?:^|;)\s*view-transition-name\s*:/i.test(style)) return attribute;
								return space + 'style=' + quote + style + ';' + css + quote;
							},
						);
						return styled ? tag : tag.replace(/^<[\w:-]+/, '$& style="' + css + '"');
					});
				});
			}
			render_tsrx_element(tsrx_element(() => props.children));
		});
	});
}
