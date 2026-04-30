/**
 * @tsrx/core - Core compiler infrastructure for tsrx-based frameworks
 *
 * Public API surface uses camelCase. Internal modules retain snake_case per
 * the project's code conventions; the exports below alias them at the boundary.
 */

// Parse
export { parse_module as parseModule } from './parse/parse-module.js';
export {
	get_comment_handlers as getCommentHandlers,
	convert_from_jsx as convertFromJsx,
	skipWhitespace,
	isWhitespaceTextNode,
	BINDING_TYPES,
	DestructuringErrors,
	acorn,
	tsPlugin,
} from './parse/index.js';
export { parse_style as parseStyle } from './parse/style.js';

// Scope
export { create_scopes as createScopes, ScopeRoot, Scope } from './scope.js';

// Errors
export { error } from './errors.js';
export { DIAGNOSTIC_CODES } from './diagnostics.js';

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
	obfuscate_identifier as obfuscateIdentifier,
	is_identifier_obfuscated as isIdentifierObfuscated,
	deobfuscate_identifier as deobfuscateIdentifier,
} from './identifier-utils.js';

// Comment utils
export {
	is_ts_pragma as isTsPragma,
	is_triple_slash_directive as isTripleSlashDirective,
	is_jsdoc_ts_annotation as isJsdocTsAnnotation,
	should_preserve_comment as shouldPreserveComment,
	format_comment as formatComment,
} from './comment-utils.js';

// Generic utils
export {
	simple_hash as simpleHash,
	strong_hash as strongHash,
	is_void_element as isVoidElement,
	is_reserved as isReserved,
	is_boolean_attribute as isBooleanAttribute,
	is_dom_property as isDomProperty,
} from './utils.js';

// AST utils
export {
	get_component_from_path as getComponentFromPath,
	object,
	unwrap_pattern as unwrapPattern,
	extract_identifiers as extractIdentifiers,
	extract_paths as extractPaths,
	build_fallback as buildFallback,
	build_assignment_value as buildAssignmentValue,
	is_class_node as isClassNode,
	is_component_node as isComponentNode,
	is_function_node as isFunctionNode,
	is_inside_component as isInsideComponent,
} from './utils/ast.js';

// Builders (namespace re-export — members mirror AST node kinds)
export * as builders from './utils/builders.js';

// Also export individual builder utilities used directly
export { set_location as setLocation } from './utils/builders.js';

// Event utils
export {
	is_non_delegated as isNonDelegated,
	is_event_attribute as isEventAttribute,
	is_capture_event as isCaptureEvent,
	get_original_event_name as getOriginalEventName,
	normalize_event_name as normalizeEventName,
	event_name_from_capture as eventNameFromCapture,
	get_attribute_event_name as getAttributeEventName,
	is_passive_event as isPassiveEvent,
} from './utils/events.js';

// Patterns
export {
	regex_whitespace as regexWhitespace,
	regex_whitespaces as regexWhitespaces,
	regex_starts_with_newline as regexStartsWithNewline,
	regex_starts_with_whitespace as regexStartsWithWhitespace,
	regex_starts_with_whitespaces as regexStartsWithWhitespaces,
	regex_ends_with_whitespace as regexEndsWithWhitespace,
	regex_ends_with_whitespaces as regexEndsWithWhitespaces,
	regex_not_whitespace as regexNotWhitespace,
	regex_whitespaces_strict as regexWhitespacesStrict,
	regex_only_whitespaces as regexOnlyWhitespaces,
	regex_newline_characters as regexNewlineCharacters,
	regex_not_newline_characters as regexNotNewlineCharacters,
	regex_is_valid_identifier as regexIsValidIdentifier,
	regex_invalid_identifier_chars as regexInvalidIdentifierChars,
	regex_starts_with_vowel as regexStartsWithVowel,
	regex_heading_tags as regexHeadingTags,
	regex_illegal_attribute_character as regexIllegalAttributeCharacter,
} from './utils/patterns.js';

// Sanitize
export { sanitize_template_string as sanitizeTemplateString } from './utils/sanitize_template_string.js';

// Escaping
export { escape } from './utils/escaping.js';

// Transform
export {
	createJsxTransform,
	merge_duplicate_refs as mergeDuplicateRefs,
	to_jsx_attribute as toJsxAttribute,
	validate_at_most_one_ref_attribute as validateAtMostOneRefAttribute,
	component_to_function_declaration as componentToFunctionDeclaration,
} from './transform/jsx/index.js';
export {
	ensure_function_metadata as ensureFunctionMetadata,
	in_jsx_child_context as inJsxChildContext,
	tsx_node_to_jsx_expression as tsxNodeToJsxExpression,
	tsx_with_ts_locations as tsxWithTsLocations,
} from './transform/jsx/helpers.js';
export {
	clone_expression_node,
	clone_identifier,
	clone_jsx_name,
	create_compile_error,
	create_generated_identifier,
	create_null_literal,
	flatten_switch_consequent,
	get_for_of_iteration_params,
	identifier_to_jsx_name,
	is_dynamic_element_id,
	is_jsx_child,
	set_loc,
	to_text_expression,
} from './transform/jsx/ast-builders.js';
export { render_stylesheets as renderStylesheets } from './transform/stylesheet.js';
export {
	prepare_stylesheet_for_render as prepareStylesheetForRender,
	is_style_element as isStyleElement,
	is_composite_element as isCompositeElement,
	annotate_with_hash as annotateWithHash,
	annotate_component_with_hash as annotateComponentWithHash,
	add_hash_class as addHashClass,
} from './transform/scoping.js';
export {
	convert_source_map_to_mappings as convertSourceMapToMappings,
	create_volar_mappings_result as createVolarMappingsResult,
	dedupe_mappings as dedupeMappings,
	serialize_mapping_value as serializeMappingValue,
} from './transform/segments.js';
export {
	create_lazy_context as createLazyContext,
	collect_lazy_bindings as collectLazyBindings,
	collect_lazy_bindings_from_component as collectLazyBindingsFromComponent,
	collect_lazy_bindings_from_statements as collectLazyBindingsFromStatements,
	preallocate_lazy_ids as preallocateLazyIds,
	apply_lazy_transforms as applyLazyTransforms,
	replace_lazy_params as replaceLazyParams,
} from './transform/lazy.js';
export {
	find_first_top_level_await as findFirstTopLevelAwait,
	find_first_top_level_await_in_component_body as findFirstTopLevelAwaitInComponentBody,
} from './transform/await.js';
export {
	is_interleaved_body as isInterleavedBody,
	is_capturable_jsx_child as isCapturableJsxChild,
	capture_jsx_child as captureJsxChild,
} from './transform/jsx-interleave.js';
export {
	is_static_literal as isStaticLiteral,
	is_hoist_safe_expression as isHoistSafeExpression,
	is_hoist_safe_jsx_child as isHoistSafeJsxChild,
	is_hoist_safe_jsx_attribute as isHoistSafeJsxAttribute,
	is_hoist_safe_jsx_node as isHoistSafeJsxNode,
} from './transform/jsx-hoist.js';

// Analyze
export { analyze_css as analyzeCss } from './analyze/css-analyze.js';
export {
	COMPONENT_RETURN_VALUE_ERROR,
	get_return_keyword_node as getReturnKeywordNode,
	validate_component_return_statement as validateComponentReturnStatement,
	validate_nesting as validateNesting,
} from './analyze/validation.js';
