(directive) @tag
(directive_start) @tag
(directive_end) @tag
(comment) @comment

; from tree-sitter-html
(tag_name) @tag
(erroneous_end_tag_name) @tag.error
(doctype) @constant
(attribute_name) @attribute
(attribute_value) @string
(comment) @comment

[
  "<"
  ">"
  "</"
  "/>"
] @punctuation.bracket
