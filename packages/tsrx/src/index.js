/**
 * @tsrx/core - Core compiler infrastructure for tsrx-based frameworks
 *
 * Re-exports key modules for convenience.
 */

// Parse
export {
	createParser,
	get_comment_handlers,
	convert_from_jsx,
	skipWhitespace,
	isWhitespaceTextNode,
	BINDING_TYPES,
	DestructuringErrors,
	acorn,
	tsPlugin,
} from './parse/index.js';
export { parse_style } from './parse/style.js';

// Scope
export { create_scopes, ScopeRoot, Scope } from './scope.js';

// Errors
export { error } from './errors.js';

// Constants
export {
	TEMPLATE_FRAGMENT,
	TEMPLATE_USE_IMPORT_NODE,
	IS_CONTROLLED,
	IS_INDEXED,
	TEMPLATE_SVG_NAMESPACE,
	TEMPLATE_MATHML_NAMESPACE,
	HYDRATION_START,
	HYDRATION_END,
	HYDRATION_ERROR,
	BLOCK_OPEN,
	BLOCK_CLOSE,
	EMPTY_COMMENT,
	ELEMENT_NODE,
	TEXT_NODE,
	COMMENT_NODE,
	DOCUMENT_FRAGMENT_NODE,
	DEFAULT_NAMESPACE,
} from './constants.js';

// Identifier utils
export {
	IDENTIFIER_OBFUSCATION_PREFIX,
	STYLE_IDENTIFIER,
	SERVER_IDENTIFIER,
	CSS_HASH_IDENTIFIER,
	obfuscate_identifier,
	is_identifier_obfuscated,
	deobfuscate_identifier,
} from './identifier-utils.js';

// Comment utils
export {
	is_ts_pragma,
	is_triple_slash_directive,
	is_jsdoc_ts_annotation,
	should_preserve_comment,
	format_comment,
} from './comment-utils.js';

// Generic utils
export {
	hash,
	is_void_element,
	is_reserved,
	is_boolean_attribute,
	is_dom_property,
} from './utils.js';

// AST utils
export {
	object,
	unwrap_pattern,
	extract_identifiers,
	extract_paths,
	build_fallback,
	build_assignment_value,
} from './utils/ast.js';

// Builders (namespace re-export)
export * as builders from './utils/builders.js';

// Also export individual builder utilities used directly
export { set_location } from './utils/builders.js';

// Event utils
export {
	is_non_delegated,
	is_event_attribute,
	is_capture_event,
	get_original_event_name,
	normalize_event_name,
	event_name_from_capture,
	get_attribute_event_name,
	is_passive_event,
} from './utils/events.js';

// Hashing (also available via utils.hash)
// Already exported via ./utils.js

// Patterns
export {
	regex_whitespace,
	regex_whitespaces,
	regex_starts_with_newline,
	regex_starts_with_whitespace,
	regex_starts_with_whitespaces,
	regex_ends_with_whitespace,
	regex_ends_with_whitespaces,
	regex_not_whitespace,
	regex_whitespaces_strict,
	regex_only_whitespaces,
	regex_newline_characters,
	regex_not_newline_characters,
	regex_is_valid_identifier,
	regex_invalid_identifier_chars,
	regex_starts_with_vowel,
	regex_heading_tags,
	regex_illegal_attribute_character,
} from './utils/patterns.js';

// Sanitize
export { sanitize_template_string } from './utils/sanitize_template_string.js';

// Escaping
export { escape } from './utils/escaping.js';

// Transform
export { render_stylesheets } from './transform/stylesheet.js';
export { convert_source_map_to_mappings } from './transform/segments.js';

// Analyze
export { analyze_css } from './analyze/css-analyze.js';
export { validate_nesting } from './analyze/validation.js';
