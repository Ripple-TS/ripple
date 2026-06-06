; Folds for code blocks
[
  (statement_block)
  (component_body)
  (class_body)
  (object)
  (jsx_statement_container)
  (jsx_template_block)
  (jsx_switch_body)
  (object_pattern)
  (array)
  (array_pattern)
  (switch_body)
] @fold

; Fold multi-line JSX elements
(jsx_element) @fold
(jsx_fragment) @fold

; Fold style elements
(style_element) @fold

; Fold submodules
(module_declaration) @fold

; Fold comments
(comment) @fold

; Fold template strings
(template_string) @fold
