; Keywords
(fragment_declaration "fragment" @keyword)
(module_declaration
  "module" @keyword
  name: (identifier) @namespace)

; Lazy destructuring
(lazy_object_pattern "&" @operator)
(lazy_array_pattern "&" @operator)

; Reserved identifiers
[
  "track"
  "untrack"
] @function.builtin

; Functions
(fragment_declaration
  name: (identifier) @function)

(function_declaration
  name: (identifier) @function)

(class_declaration
  name: (identifier) @type)

(method_definition
  name: (property_name) @function.method)

(field_definition
  property: (property_name) @property)

(call_expression
  function: (identifier) @function.call)

(call_expression
  function: (member_expression
    property: (identifier) @function.method.call))

; Variables
(identifier) @variable

; Parameters
(required_parameter
  pattern: (identifier) @variable.parameter)

(rest_parameter
  (identifier) @variable.parameter)

; JSX/Components
(jsx_opening_element
  "<" @tag.delimiter
  name: (jsx_element_name) @tag
  ">" @tag.delimiter)

(jsx_opening_fragment
  "<" @tag.delimiter
  ">" @tag.delimiter)

(jsx_closing_element
  "</" @tag.delimiter
  name: (jsx_element_name) @tag
  ">" @tag.delimiter)

(jsx_closing_fragment
  "</" @tag.delimiter
  ">" @tag.delimiter)

(jsx_self_closing_element
  "<" @tag.delimiter
  name: (jsx_non_namespaced_element_name) @tag
  "/>" @tag.delimiter)

; Override identifier coloring for JSX element names
; These must come after the general (identifier) @variable pattern to have higher priority

; Regular element names (plain identifiers)
(jsx_opening_element
  name: (jsx_element_name (identifier) @tag))

(jsx_closing_element
  name: (jsx_element_name (identifier) @tag))

(jsx_self_closing_element
  name: (jsx_non_namespaced_element_name (identifier) @tag))

(jsx_attribute
  name: [(identifier) (jsx_namespace_name) (jsx_hyphenated_name)] @attribute)

(jsx_expression
  "{" @punctuation.bracket
  "}" @punctuation.bracket)

; Dynamic tags (`<{expr}>`): braces take the tag delimiter color while the
; expression inside keeps regular expression highlighting.
(jsx_opening_element
  name: (jsx_element_name
    (jsx_expression
      "{" @tag.delimiter
      "}" @tag.delimiter)))

(jsx_closing_element
  name: (jsx_element_name
    (jsx_expression
      "{" @tag.delimiter
      "}" @tag.delimiter)))

(jsx_self_closing_element
  name: (jsx_non_namespaced_element_name
    (jsx_expression
      "{" @tag.delimiter
      "}" @tag.delimiter)))

; Capitalized dynamic tag names read as components.
(jsx_opening_element
  name: (jsx_element_name
    (jsx_expression
      (identifier) @tag
      (#match? @tag "^[A-Z]"))))

(jsx_closing_element
  name: (jsx_element_name
    (jsx_expression
      (identifier) @tag
      (#match? @tag "^[A-Z]"))))

(jsx_self_closing_element
  name: (jsx_non_namespaced_element_name
    (jsx_expression
      (identifier) @tag
      (#match? @tag "^[A-Z]"))))

; Leave jsx_text uncaptured so text children use the editor's regular text color.

; Style elements
(style_element
  "<style" @tag
  ">" @tag.delimiter
  "</style>" @tag)

(style_element
  (raw_text) @string.special)

(jsx_if_expression
  "@" @keyword.control
  "if" @keyword.control)

(jsx_else_if_clause
  "if" @keyword.control)

(jsx_else_clause
  "@else" @keyword.control)

(jsx_for_expression
  "@" @keyword.control
  "for" @keyword.control)

(jsx_empty_clause
  "@empty" @keyword.control)

(jsx_switch_expression
  "@" @keyword.control
  "switch" @keyword.control)

(jsx_switch_case
  "@case" @keyword.control)

(jsx_switch_default
  "@default" @keyword.control)

(jsx_try_expression
  "@" @keyword.control
  "try" @keyword.control)

(jsx_pending_clause
  "@pending" @keyword.control)

(jsx_catch_clause
  "@catch" @keyword.control)

; Types
(type_identifier) @type
(predefined_type) @type.builtin
(type_parameter (identifier) @type.parameter)

; Type annotations (commented out - _type_annotation is hidden)
; The colon will be captured as punctuation.delimiter via other rules

; Literals
(string) @string
(template_string) @string

(number) @number
(true) @constant.builtin.boolean
(false) @constant.builtin.boolean
(null) @constant.builtin
(undefined) @constant.builtin

; Regex
(regex) @string.regexp
(regex_pattern) @string.regexp
(regex_flags) @string.regexp

; Comments
(comment) @comment

; Operators
(unary_expression operator: _ @operator)
(binary_expression operator: _ @operator)
(augmented_assignment_expression operator: _ @operator)
(update_expression operator: _ @operator)

; Control flow keywords
[
  "if"
  "else"
  "switch"
  "case"
  "default"
  "for"
  "while"
  "do"
  "break"
  "continue"
  "return"
  "throw"
  "try"
  "pending"
  "catch"
  "finally"
] @keyword.control

[
  "await"
  "async"
] @keyword.control.flow

[
  "import"
  "export"
  "from"
  "as"
] @keyword.control.import

; Other keywords
[
  "function"
  "class"
  "extends"
  "implements"
  "new"
  "typeof"
  "instanceof"
  "in"
  "of"
  "void"
  "delete"
  "yield"
  "static"
  "get"
  "set"
  "abstract"
  "readonly"
  "declare"
  "override"
] @keyword

[
  "let"
  "const"
  "var"
] @keyword.storage

; Special identifiers
[
  (this)
  (super)
] @variable.builtin

; Properties
(property_signature
  name: (property_name) @property)

(pair
  key: (property_name) @property)

(member_expression
  property: (identifier) @property)

(shorthand_property_identifier) @property
(shorthand_property_identifier_pattern) @property

; Private properties
(private_property_identifier) @property.private

; Punctuation
["(" ")" "[" "]" "{" "}"] @punctuation.bracket
["." "," ";" ":" "..."] @punctuation.delimiter
; Note: < and > are handled separately in JSX contexts as @tag.delimiter

; JSX statement container fences should keep directive coloring over generic brackets.
(jsx_statement_container
  "@{" @keyword.control
  "}" @keyword.control)

(template_substitution
  "${" @punctuation.special
  "}" @punctuation.special)

; Special: Arrow function
"=>" @operator

; Hash bang
(hash_bang_line) @comment
