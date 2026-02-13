; Increase indentation inside block-like constructs.
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
  (style_element)
  (script_element)
  (server_block)
  (reactive_object)
  (reactive_array)
] @indent

; Decrease indentation on closing delimiters.
[
  "}"
  "]"
  ")"
] @outdent

; JSX closing tags should also outdent.
(jsx_closing_element) @outdent
