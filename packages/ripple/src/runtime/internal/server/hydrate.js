import { defer_hydration, get, regular_block, render_expression, tsrx_element } from './index.js';

/**
 * @param {import('#public').HydrateOptions} props
 */
export function Hydrate(props) {
	return tsrx_element(() => {
		var when = get(props.when);
		if (
			when == null ||
			(typeof when !== 'function' && !['l', 'i', 'v', 'e', 'm', 'c', 'n'].includes(when.t))
		)
			throw new Error('Hydrate requires a synchronous when strategy or factory');
		// Factories are client-only. Only intent and static-policy metadata is
		// needed before parents initialize; reuse the expression's comment pair.
		var policy = typeof when === 'function' ? 'd' : when.t;
		var marker = '[h' + policy;
		if (policy === 'e') marker += ':' + encodeURIComponent(when.v).replace(/-/g, '%2D');
		regular_block(() => {
			defer_hydration();
			render_expression(get(props.children), '<!--' + marker + '-->');
		});
	});
}
