/** @import { AppendIntoAnchor } from '#client' */
import { HYDRATION } from 'ripple/internal/client/hydration-enabled';
import { tsrx_element } from '../../element.js';
import { hydrating } from './hydration.js';
import { expression } from './expression.js';
import { get, is_tracked } from './runtime.js';
import { resolve_anchor } from './operations.js';
import { own_anchor } from './blocks.js';
import { hydrate_component } from './hydrate-boundary.js';
import { enable_hydration_intent } from './hydration-intent.js';

if (HYDRATION) enable_hydration_intent();

/**
 * @param {import('#public').HydrateOptions} props
 */
export function Hydrate(props) {
	return tsrx_element((/** @type {ChildNode | AppendIntoAnchor} */ anchor) => {
		if (HYDRATION && hydrating) hydrate_component(anchor, props);
		else if (is_tracked(props.children)) {
			var node = resolve_anchor(anchor);
			expression(node, () => get(/** @type {any} */ (props.children)));
			own_anchor(anchor, node);
		} else return props.children;
	});
}
