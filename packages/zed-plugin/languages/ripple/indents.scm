; Zed indents use @indent plus @end markers.
[
  (statement_block "}" @end)
  (component_body "}" @end)
  (class_body "}" @end)
  (switch_body "}" @end)
  (object "}" @end)
  (object_pattern "}" @end)
  (array "]" @end)
  (array_pattern "]" @end)
  (arguments ")" @end)
  (formal_parameters ")" @end)
  (parenthesized_expression ")" @end)
  (jsx_expression "}" @end)
  (style_element "</style>" @end)
  (server_block "}" @end)
  (reactive_object "}" @end)
  (reactive_array "]" @end)
  (jsx_self_closing_element "/>" @end)
] @indent

(_ "[" "]" @end) @indent
(_ "{" "}" @end) @indent
(_ "(" ")" @end) @indent

(jsx_opening_element ">" @end) @indent

(jsx_element
  (jsx_opening_element) @start
  (jsx_closing_element)? @end) @indent
