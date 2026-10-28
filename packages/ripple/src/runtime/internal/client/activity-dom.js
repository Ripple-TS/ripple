/** @import { Block } from '#client' */
import { createTrustedHTML } from '../../../csp.js';
import { DETACHED_BLOCK, HEAD_BLOCK } from './constants.js';
import { get_first_node, get_last_node } from './blocks.js';

/** @typedef {{ value: string, priority: string, owners: Set<Set<Node>> }} HiddenNode */
/** @type {WeakMap<Node, HiddenNode>} */
var hidden_nodes = new WeakMap();

/** @param {Node} node @param {Set<Node>} owner */
function hide(node, owner) {
	if (node.nodeType !== 1 && node.nodeType !== 3) return;
	var element = /** @type {HTMLElement} */ (node);
	var state = hidden_nodes.get(node);
	if (state === undefined) {
		state = {
			value: node.nodeType === 3 ? (node.nodeValue ?? '') : element.style.display,
			priority: node.nodeType === 3 ? '' : element.style.getPropertyPriority('display'),
			owners: new Set(),
		};
		hidden_nodes.set(node, state);
	} else if (
		node.nodeType === 3
			? node.nodeValue !== ''
			: element.style.display !== 'none' ||
				element.style.getPropertyPriority('display') !== 'important'
	) {
		state.value = node.nodeType === 3 ? (node.nodeValue ?? '') : element.style.display;
		state.priority = node.nodeType === 3 ? '' : element.style.getPropertyPriority('display');
	}
	state.owners.add(owner);
	owner.add(node);
	if (node.nodeType === 3) {
		if (node.nodeValue !== '') node.nodeValue = '';
	} else if (
		element.style.display !== 'none' ||
		element.style.getPropertyPriority('display') !== 'important'
	) {
		element.style.setProperty('display', 'none', 'important');
	}
}

/** @param {Set<Node>} owner @param {Node} node */
function show(owner, node) {
	owner.delete(node);
	var state = hidden_nodes.get(node);
	if (state === undefined) return;
	state.owners.delete(owner);
	if (state.owners.size !== 0) return;
	if (node.nodeType === 3) {
		node.nodeValue = state.value;
	} else {
		/** @type {HTMLElement} */ (node).style.setProperty('display', state.value, state.priority);
	}
	hidden_nodes.delete(node);
}

/** @param {Set<Node>} owner */
export function reveal_activity(owner) {
	for (var node of owner) show(owner, node);
}

/** Preserve authored display updates even when the author writes `none`. @param {Element} element @param {() => void} update */
export function update_activity_style(element, update) {
	var state = hidden_nodes.get(element);
	if (state === undefined) return update();
	var style = /** @type {HTMLElement} */ (element).style;
	style.setProperty('display', state.value, state.priority);
	update();
	state.value = style.display;
	state.priority = style.getPropertyPriority('display');
	style.setProperty('display', 'none', 'important');
}

/** Record every write, including the empty string used to hide root text. @param {Text} text @param {string} value */
export function update_activity_text(text, value) {
	var state = hidden_nodes.get(text);
	if (state === undefined) return false;
	state.value = value;
	if (text.nodeValue !== '') text.nodeValue = '';
	return true;
}

/** @param {Node | null} start @param {Node | null} end @param {Set<Node>} nodes */
function collect_range(start, end, nodes) {
	for (var node = start; node !== null; node = node.nextSibling) {
		if (node.nodeType === 1 || node.nodeType === 3) nodes.add(node);
		if (node === end) break;
	}
}

/** @param {Block} block @param {Set<Node>} nodes */
function collect_portals(block, nodes) {
	if ((block.f & HEAD_BLOCK) !== 0) return;
	if ((block.f & DETACHED_BLOCK) !== 0) {
		collect_range(get_first_node(block), get_last_node(block), nodes);
	}
	for (var child = block.first; child !== null; child = child.next) collect_portals(child, nodes);
}

/** @param {Block} block @param {Comment} start @param {Comment} end @param {Set<Node>} owner */
export function hide_activity(block, start, end, owner) {
	/** @type {Set<Node>} */
	var nodes = new Set();
	if (start.nextSibling !== end) collect_range(start.nextSibling, end.previousSibling, nodes);
	collect_portals(block, nodes);
	for (var node of owner) if (!nodes.has(node)) show(owner, node);
	for (var node of nodes) hide(node, owner);
}

/** Restore the server's authored styles before the client takes ownership. @param {Comment} start @param {Comment} end */
export function restore_activity_html(start, end) {
	var depth = 0;
	for (var node = start.nextSibling; node !== null && node !== end; node = node.nextSibling) {
		if (node.nodeType === 8) {
			var data = /** @type {Comment} */ (node).data;
			if (data.startsWith('[a') || (depth > 0 && data.startsWith('['))) depth++;
			else if (depth > 0 && data === ']') depth--;
		}
		if (depth > 0) continue;
		if (node.nodeType === 1) {
			var element = /** @type {HTMLElement} */ (node);
			var style = element.getAttribute('data-ripple-activity-style');
			if (style !== null) {
				element.setAttribute('style', style);
				element.removeAttribute('data-ripple-activity-style');
			}
		} else if (
			node.nodeType === 8 &&
			/** @type {Comment} */ (node).data.startsWith('ripple-text:')
		) {
			var template = document.createElement('template');
			template.innerHTML = /** @type {string} */ (
				createTrustedHTML(
					decodeURIComponent(/** @type {Comment} */ (node).data.slice(12)),
					'template',
				)
			);
			var text = document.createTextNode(template.content.textContent ?? '');
			node.replaceWith(text);
			node = text;
		}
	}
}
