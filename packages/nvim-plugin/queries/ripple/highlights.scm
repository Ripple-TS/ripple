; Keywords
(component_declaration "component" @keyword)
(fragment_declaration "fragment" @keyword)
(server_block "#server" @keyword)
(defer_block "#defer" @keyword)

; Reserved identifiers
[
  "track"
  "untrack"
] @function.builtin

; Functions
(component_declaration
  name: (identifier) @function)

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

(jsx_closing_element
  "</" @tag.delimiter
  name: (jsx_element_name) @tag
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

; Dynamic element names (unbox expressions)
(jsx_opening_element
  name: (jsx_element_name
    (unbox_expression (identifier) @tag)))

(jsx_closing_element
  name: (jsx_element_name
    (unbox_expression (identifier) @tag)))

(jsx_self_closing_element
  name: (jsx_non_namespaced_element_name
    (unbox_expression (identifier) @tag)))

(jsx_attribute
  name: [(identifier) (jsx_namespace_name)] @attribute)

(jsx_expression
  "{" @punctuation.bracket
  "}" @punctuation.bracket)

; Style elements
(style_element
  "<style" @tag
  ">" @tag.delimiter
  "</style>" @tag)

(style_element
  (raw_text) @string.special)

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

; Reactive constructs (placed after generic punctuation so special tokens win)
(unbox_expression "@" @operator.special)
(reactive_array
  "#[" @punctuation.special
  "]" @punctuation.special)

(reactive_object
  "#{" @punctuation.special
  "}" @punctuation.special)

(template_substitution
  "${" @punctuation.special
  "}" @punctuation.special)

; Special: Arrow function
"=>" @operator

; Hash bang
(hash_bang_line) @comment
