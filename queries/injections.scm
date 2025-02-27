; tree-sitter-comment injection
; if available
((comment) @injection.content
 (#set! injection.language "comment"))

; could be bash or zsh
; or whatever tree-sitter grammar you have.
((text) @injection.content
    (#has-ancestor? @injection.content "envoy")
    (#set! injection.combined)
    (#set! injection.language bash))


((php_only) @injection.content
    (#set! injection.language php_only))

((parameter) @injection.content                                                                                                 
    (#set! injection.include-children) ; You may need this, depending on your editor e.g Helix                                                                                          
    (#set! injection.language "php-only"))


; ; See #33
; ; AlpineJS attributes
((attribute
  (attribute_name) @_attr
    (#match? @_attr "^x-[a-z]+")
  (quoted_attribute_value
    (attribute_value) @injection.content))
  (#set! injection.language "javascript"))

; ; Apline Events
((attribute
  (attribute_name) @_attr
    (#match? @_attr "^@[a-z]+")
  (quoted_attribute_value
    (attribute_value) @injection.content))
  (#set! injection.language "javascript"))

; ; normal HTML element alpine attributes
(element
  (_
    (tag_name) @_tag
      (#match? @_tag "[^x][^-]")
  (attribute
    (attribute_name) @_attr
      (#match? @_attr "^:[a-z]+")
    (quoted_attribute_value
      (attribute_value) @injection.content)
    (#set! injection.language "javascript"))))

; ; ; Blade escaped JS attributes
; ; <x-foo ::bar="baz" />
(element
  (_
    (tag_name) @_tag
      (#match? @_tag "^x-[a-z]+")
  (attribute
    (attribute_name) @_attr
      (#match? @_attr "^::[a-z]+")
    (quoted_attribute_value
      (attribute_value) @injection.content)
    (#set! injection.language "javascript"))))

; ; ; Blade escaped JS attributes
; ; <htmlTag :class="baz" />
(element
  (_
  (attribute
    (attribute_name) @_attr
      (#match? @_attr "^:[a-z]+")
    (quoted_attribute_value
      (attribute_value) @injection.content)
    (#set! injection.language "javascript"))))

; Blade PHP attributes
; <x-foo :bar="$baz" />
(element
  (_
    (tag_name) @_tag
      (#match? @_tag "^x-[a-z]+")
    (attribute
      (attribute_name) @_attr
        (#match? @_attr "^:[a-z]+")
      (quoted_attribute_value
        (attribute_value) @injection.content)
      (#set! injection.language "php-only"))))


; from tree-sitter-html

((script_element
  (raw_text) @injection.content)
 (#set! injection.language "javascript"))

((style_element
  (raw_text) @injection.content)
 (#set! injection.language "css"))
