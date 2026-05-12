/**
 * Generic compiler utilities for tsrx-based frameworks.
 * Framework-specific utilities should be in the framework package.
 */

export { simple_hash, strong_hash } from './utils/hashing.js';
export {
	is_boolean_attribute,
	is_dom_property,
	is_reserved,
	is_void_element,
} from './utils/dom.js';
