; Sample until confirmed by neovim users
((html) @injection.content
    (#set! injection.combined)
    (#set! injection.language html))

((php) @injection.content
    (#set! injection.combined)
    (#set! injection.language php))
; directive parameters
((parameter) @injection.content
    (#set! injection.language php))