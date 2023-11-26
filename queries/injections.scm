((php) @injection.content
    (#set! injection.combined)
    (#set! injection.language php))



; ((php_only) @injection.content
;    (#set! injection.combined)
;    (#set! injection.language php_only))

; directive parameters
; ((parameter) @injection.content
;    (#set! injection.language php_only))

; The following is for Laravel Envoy, as it includes bash scripting
; you could use whatever tree-sitter you want
; bash/sh, zsh etc. this is just an example
((shell) @injection.content
   (#set! injection.combined)
   (#set! injection.language sh))
