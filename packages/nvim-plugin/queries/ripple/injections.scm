; Inject CSS into style elements
(style_element
  (raw_text) @injection.content
  (#set! injection.combined)
  (#set! injection.language "css"))

; Inject JavaScript/TypeScript into submodules
; Note: statement is inlined, so we need to match specific statement types
; Commenting out for now as it requires matching all concrete statement types

; Template string interpolations
(template_substitution
  (expression) @injection.content
  (#set! injection.language "typescript"))

; TSX expression islands. Shorthand fragments and <tsx> blocks use TSX syntax
; rather than Ripple template statements.
((jsx_fragment) @injection.content
  (#set! injection.language "tsx"))

((jsx_element
  open_tag: (jsx_opening_element
    name: (jsx_element_name (identifier) @_tsx_name))) @injection.content
  (#eq? @_tsx_name "tsx")
  (#set! injection.language "tsx"))

; TSRX islands keep Ripple syntax, including when nested inside a TSX island.
((jsx_element
  open_tag: (jsx_opening_element
    name: (jsx_element_name (identifier) @_tsrx_name))) @injection.content
  (#eq? @_tsrx_name "tsrx")
  (#set! injection.language "ripple"))

((jsx_element
  open_tag: (jsx_opening_element
    name: (jsx_element_name
      (jsx_namespace_name
        (identifier) @_tsx_namespace
        (identifier) @_tsx_name)))) @injection.content
  (#eq? @_tsx_namespace "tsx")
  (#eq? @_tsx_name "react")
  (#set! injection.language "tsx"))

; Inject Ripple into JSX text blocks so statement-like template code
; (e.g. const/if lines in JSX children) is highlighted consistently.
((jsx_text) @injection.content
  (#set! injection.language "ripple"))
