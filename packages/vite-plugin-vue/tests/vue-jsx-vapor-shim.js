import * as Vue from './vue-runtime-shim.js';
import {
	EffectScope,
	Fragment,
	defineVaporComponent as defineVaporComponentBase,
	getCurrentInstance,
} from './vue-runtime-shim.js';

/** @typedef {any} ShimValue */
/** @typedef {any} ShimNode */
/** @typedef {any} ShimFragment */
/** @typedef {{ props: Record<string, ShimValue>, key?: ShimValue, ref?: ShimValue }} ResolvedProps */

/**
 * @param {ShimValue} comp
 * @param {ShimValue} extraOptions
 * @returns {ShimValue}
 */
export function defineVaporSSRComponent(comp, extraOptions) {
	if (typeof comp === 'function') {
		return Object.assign({ name: comp.name }, extraOptions, {
			/**
			 * @param {ShimValue} props
			 * @param {ShimValue} ctx
			 */
			setup(props, ctx) {
				const result = comp(props, ctx);
				return () => result;
			},
			__vapor: true,
		});
	}

	const setup = comp.setup;
	if (setup) {
		/**
		 * @param {ShimValue} props
		 * @param {ShimValue} ctx
		 */
		comp.setup = (props, ctx) => {
			const result = setup(props, ctx);
			return () => result;
		};
	}
	comp.__vapor = true;
	return comp;
}

/**
 * @param {ShimValue} type
 * @param {...ShimValue} args
 * @returns {ShimValue}
 */
export const createComponent = (type, ...args) => {
	if (type === Fragment) {
		const slots = args[1];
		return slots && typeof slots.default === 'function' ? slots.default() : [];
	}

	return Vue.createComponentWithFallback(
		createProxyComponent(Vue.resolveDynamicComponent(type)),
		...args,
	);
};

const proxy_cache = new WeakMap();

/**
 * @param {ShimValue} type
 * @param {(node: ShimValue) => ShimValue} [normalizeNodeFn]
 * @returns {ShimValue}
 */
export function createProxyComponent(type, normalizeNodeFn) {
	if (typeof type === 'function') {
		const existing = proxy_cache.get(type);
		if (existing) return existing;

		const instance = Vue.currentInstance || getCurrentInstance();
		const proxy = new Proxy(type, {
			/**
			 * @param {any} target
			 * @param {any} ctx
			 * @param {any[]} args
			 * @returns {ShimValue}
			 */
			apply(target, ctx, args) {
				if (typeof target.__setup === 'function') {
					target.__setup.apply(ctx, args);
				}

				const node = Reflect.apply(target, ctx, args);
				return normalizeNodeFn ? normalizeNodeFn(node) : node;
			},
			/**
			 * @param {any} target
			 * @param {PropertyKey} property
			 * @param {any} receiver
			 * @returns {ShimValue}
			 */
			get(target, property, receiver) {
				if (instance && instance.appContext.vapor && property === '__vapor') return true;
				return Reflect.get(target, property, receiver);
			},
		});

		proxy_cache.set(type, proxy);
		return proxy;
	}

	return type;
}

/**
 * @param {ShimValue} node
 * @returns {ShimValue}
 */
export function normalizeNode(node) {
	if (node == null || typeof node === 'boolean') return document.createComment('');
	if (Array.isArray(node) && node.length) return node.map(normalizeNode);
	if (isBlock(node)) return node;
	if (typeof node === 'function') return resolveValues([node], undefined, true)[0];
	return document.createTextNode(String(node));
}

/**
 * @param {ShimValue} value
 * @returns {boolean}
 */
export function isBlock(value) {
	return (
		value instanceof Node ||
		Array.isArray(value) ||
		Vue.isVaporComponent(value) ||
		Vue.isFragment(value)
	);
}

/**
 * @param {ShimValue} nodes
 * @param {Node} [anchor]
 * @returns {ShimFragment}
 */
function createFragment(nodes, anchor = document.createTextNode('')) {
	const fragment = /** @type {ShimFragment} */ (new Vue.VaporFragment(nodes));
	fragment.anchor = anchor;
	return fragment;
}

/**
 * @param {ShimValue} node
 * @param {Node | undefined} anchor
 * @param {boolean} [processFunction=false]
 * @returns {ShimValue}
 */
function normalizeBlock(node, anchor, processFunction = false) {
	if (node instanceof Node || Vue.isFragment(node)) return node;
	if (Vue.isVaporComponent(node)) return createFragment(node, anchor);
	if (Array.isArray(node)) {
		return createFragment(
			node.map(
				/** @param {ShimValue} item */
				(item) => normalizeBlock(item, undefined, processFunction),
			),
			anchor,
		);
	}
	if (processFunction && typeof node === 'function') return resolveValues([node], anchor, true)[0];

	const result = node == null || typeof node === 'boolean' ? '' : String(node);
	if (anchor) {
		anchor.textContent = result;
		return anchor;
	}
	return document.createTextNode(result);
}

/**
 * @param {ShimValue} current
 * @param {ShimValue} value
 * @param {Node | undefined} anchor
 * @param {boolean} [processFunction=false]
 * @returns {ShimValue}
 */
function resolveValue(current, value, anchor, processFunction = false) {
	anchor = anchor || (current instanceof Node && current.nodeType === 3 ? current : undefined);
	const node = normalizeBlock(value, anchor, processFunction);

	if (current) {
		if (Vue.isFragment(current)) {
			const current_fragment = /** @type {ShimFragment} */ (current);
			if (current_fragment.anchor && current_fragment.anchor.parentNode) {
				Vue.remove(current_fragment.nodes, current_fragment.anchor.parentNode);
				Vue.insert(node, current_fragment.anchor.parentNode, current_fragment.anchor);
				if (!anchor) current_fragment.anchor.parentNode.removeChild(current_fragment.anchor);
				if (current_fragment.scope) current_fragment.scope.stop();
			}
		} else if (current instanceof Node) {
			if (current.nodeType === 3 && (!(node instanceof Node) || node.nodeType !== 3))
				current.textContent = '';
			if (Vue.isFragment(node) && current.parentNode) {
				/** @type {any} */ (Vue).insert(node, current.parentNode, current);
				if (!anchor || current.nodeType !== 3) current.parentNode.removeChild(current);
			} else if (node instanceof Node) {
				if (current.nodeType === 3 && node.nodeType === 3) {
					current.textContent = node.textContent;
					return current;
				}
				if (current.parentNode) current.parentNode.replaceChild(node, current);
			}
		}
	}

	return node;
}

/**
 * @param {ShimValue[]} [values=[]]
 * @param {Node | undefined} [anchor]
 * @param {boolean} [processFunction=false]
 * @returns {ShimValue[]}
 */
function resolveValues(values = [], anchor = undefined, processFunction = false) {
	/** @type {ShimValue[]} */
	const nodes = [];
	/** @type {Array<InstanceType<typeof EffectScope> | undefined>} */
	const scopes = [];

	for (const [index, value] of values.entries()) {
		const currentAnchor = index === values.length - 1 ? anchor : undefined;
		if (typeof value === 'function') {
			Vue.renderEffect(() => {
				if (scopes[index]) scopes[index].stop();
				scopes[index] = new EffectScope();
				nodes[index] = scopes[index].run(() =>
					resolveValue(nodes[index], value(), currentAnchor, processFunction),
				);
			});
		} else {
			nodes[index] = resolveValue(nodes[index], value, currentAnchor, processFunction);
		}
	}

	return nodes;
}

/**
 * @param {Node} anchor
 * @param {...ShimValue} values
 * @returns {void}
 */
export function setNodes(anchor, ...values) {
	const resolvedValues = resolveValues(values, anchor);
	if (anchor.parentNode) /** @type {any} */ (Vue).insert(resolvedValues, anchor.parentNode, anchor);
}

/**
 * @param {...ShimValue} values
 * @returns {ShimValue[]}
 */
export function createNodes(...values) {
	return resolveValues(values);
}

export const defineVaporComponent = defineVaporComponentBase;

export const VaporFor = defineVaporComponentBase(
	/**
	 * @param {{ in?: ShimValue, getKey?: (value: ShimValue, key: ShimValue, index?: number) => ShimValue }} props
	 * @param {{ slots: { default?: (...values: ShimValue[]) => ShimValue } }} context
	 * @returns {ShimValue}
	 */
	(props, { slots }) =>
		Vue.createFor(
			() => props.in,
			(item, key, index) =>
				slots.default
					? slots.default(props.getKey === undefined ? item.value : item, key, index)
					: [],
			props.getKey === undefined ? (item) => item : props.getKey,
		),
	{ props: ['in', 'getKey'] },
);

/**
 * @param {ShimValue} type
 * @param {ShimValue} props
 * @param {ShimValue} children
 * @returns {ShimValue}
 */
export function h(type, props, children) {
	const { props: resolvedProps, key, ref } = resolveProps(props);
	const render = () => {
		const component = createComponent(
			type,
			resolvedProps,
			children
				? typeof children === 'object' && !Array.isArray(children)
					? new Proxy(children, {
							/**
							 * @param {object} target
							 * @param {PropertyKey} slotKey
							 * @param {any} receiver
							 * @returns {ShimValue}
							 */
							get: (target, slotKey, receiver) =>
								createProxyComponent(Reflect.get(target, slotKey, receiver), normalizeNode),
						})
					: {
							default:
								typeof children === 'function'
									? createProxyComponent(children, normalizeNode)
									: () => normalizeNode(children),
						}
				: undefined,
		);

		if (ref) {
			const setRef = Vue.createTemplateRefSetter();
			Vue.renderEffect(() => setRef(component, ref));
		}

		return component;
	};

	return key ? Vue.createKeyedFragment(key, render) : render();
}

const event_regex = /^on[A-Z]/;

/**
 * @param {Record<string, ShimValue> | null | undefined} props
 * @returns {ResolvedProps}
 */
function resolveProps(props) {
	/** @type {ResolvedProps} */
	const resolved = { props: {} };
	if (!props) return resolved;

	for (const property in props) {
		const isFunction = typeof props[property] === 'function';
		if (property === 'key') resolved.key = isFunction ? props[property] : () => props[property];
		else if (property === 'ref') resolved.ref = props[property];
		else if (event_regex.test(property)) resolved.props[property] = () => props[property];
		else resolved.props[property] = props[property];
	}

	return resolved;
}
