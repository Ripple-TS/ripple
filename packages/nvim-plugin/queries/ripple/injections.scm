; Inject CSS into style elements
(style_element
  (raw_text) @injection.content
  (#set! injection.combined)
  (#set! injection.language "css"))

; Inject TypeScript only into static raw-text script bodies. Whole-body
; `{= expression}` content is a `jsx_expression` in the host TSRX grammar and
; therefore deliberately does not match this query. TypeScript is used for
; plain static `<script>` bodies too — the TS grammar highlights JavaScript
; identically, and injection languages cannot depend on the `type` attribute.
(script_element
  (raw_text) @injection.content
  (#set! injection.language "typescript"))

; Inject JavaScript/TypeScript into submodules
; Note: statement is inlined, so we need to match specific statement types
; Commenting out for now as it requires matching all concrete statement types

; Template string interpolations
(template_substitution
  (expression) @injection.content
  (#set! injection.language "typescript"))
