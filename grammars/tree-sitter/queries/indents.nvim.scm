; Neovim (nvim-treesitter) indentation rules.
[
  (statement_block "}" @indent.end)
  (component_body "}" @indent.end)
  (class_body "}" @indent.end)
  (switch_body "}" @indent.end)
  (object "}" @indent.end)
  (object_pattern "}" @indent.end)
  (array "]" @indent.end)
  (array_pattern "]" @indent.end)
  (arguments ")" @indent.end)
  (formal_parameters ")" @indent.end)
  (parenthesized_expression ")" @indent.end)
  (jsx_expression "}" @indent.end)
  (style_element "</style>" @indent.end)
  (server_block "}" @indent.end)
  (reactive_object "}" @indent.end)
  (reactive_array "]" @indent.end)
] @indent.begin

[
  (jsx_element)
  (jsx_self_closing_element)
] @indent.begin

((jsx_opening_element) @indent.begin
  (#set! indent.immediate)
  (#set! indent.start_at_same_line))

(jsx_closing_element ">" @indent.end)
(jsx_self_closing_element "/>" @indent.end)

[
  "}"
  "]"
  ")"
  "</style>"
  (jsx_closing_element)
] @indent.branch

(jsx_self_closing_element "/>" @indent.branch)
