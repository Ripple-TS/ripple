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

; TSX expression islands. Bare fragments now use native TSRX syntax by default,
; so only explicit <tsx> / <tsx:react> blocks inject TSX.
((jsx_element
  open_tag: (jsx_opening_element
    name: (jsx_element_name (identifier) @_tsx_name))) @injection.content
  (#eq? @_tsx_name "tsx")
  (#set! injection.language "tsx"))

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
