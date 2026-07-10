; Helix indentation rules.
[
  (statement_block)
  (component_body)
  (class_body)
  (switch_body)
  (jsx_switch_body)
  (jsx_template_block)
  (object)
  (object_pattern)
  (array)
  (array_pattern)
  (arguments)
  (formal_parameters)
  (parenthesized_expression)
  (jsx_element)
  (jsx_fragment)
  (jsx_self_closing_element)
  (style_element)
  (script_element)
  (jsx_statement_container)
  (module_body)
] @indent

[
  "}"
  "]"
  ")"
  "</style>"
] @outdent

(script_element "</" @outdent)

(jsx_closing_element) @outdent
(jsx_closing_fragment) @outdent
