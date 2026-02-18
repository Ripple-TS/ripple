; Inject CSS into style elements
(style_element
  (raw_text) @injection.content
  (#set! injection.combined)
  (#set! injection.language "css"))

; Inject JavaScript/TypeScript into server blocks
; Note: statement is inlined, so we need to match specific statement types
; Commenting out for now as it requires matching all concrete statement types

; Template string interpolations
(template_substitution
  (expression) @injection.content
  (#set! injection.language "typescript"))

; Inject Ripple into JSX text blocks so statement-like template code
; (e.g. const/if lines in JSX children) is highlighted consistently.
((jsx_text) @injection.content
  (#set! injection.language "ripple"))
