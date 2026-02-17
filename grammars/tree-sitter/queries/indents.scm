; Helix indentation rules.
[
  (statement_block)
  (component_body)
  (class_body)
  (switch_body)
  (object)
  (object_pattern)
  (array)
  (array_pattern)
  (arguments)
  (formal_parameters)
  (parenthesized_expression)
  (jsx_element)
  (jsx_self_closing_element)
  (style_element)
  (server_block)
  (reactive_object)
  (reactive_array)
] @indent

[
  "}"
  "]"
  ")"
  "</style>"
] @outdent

(jsx_closing_element) @outdent
