; Functions / components
(function_declaration) @function.around
(function_declaration) @function.outer
(function_declaration body: (statement_block) @function.inside)
(function_declaration body: (statement_block) @function.inner)

(component_declaration) @function.around
(component_declaration) @function.outer
(component_declaration body: (component_body) @function.inside)
(component_declaration body: (component_body) @function.inner)

(fragment_declaration) @function.around
(fragment_declaration) @function.outer
(fragment_declaration body: (component_body) @function.inside)
(fragment_declaration body: (component_body) @function.inner)

(method_definition) @function.around
(method_definition) @function.outer
(method_definition body: (statement_block) @function.inside)
(method_definition body: (statement_block) @function.inner)

; Classes / interfaces
(class_declaration) @class.around
(class_declaration) @class.outer
(class_declaration body: (class_body) @class.inside)
(class_declaration body: (class_body) @class.inner)

; Parameters
(required_parameter) @parameter.around
(required_parameter) @parameter.outer
(required_parameter pattern: (_) @parameter.inside)
(required_parameter pattern: (_) @parameter.inner)

(rest_parameter) @parameter.around
(rest_parameter) @parameter.outer
(rest_parameter (identifier) @parameter.inside)
(rest_parameter (identifier) @parameter.inner)

; Comments
(comment) @comment.around
(comment) @comment.outer
(comment) @comment.inside
(comment) @comment.inner

; Object entries
(pair) @entry.around
(pair) @entry.outer
(pair key: (_) @entry.inside)
(pair key: (_) @entry.inner)
