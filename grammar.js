module.exports = grammar({
    name: 'blade',
    extras: ($) => [$.comment, /\s+/],

    rules: {
        blade: ($) => repeat($._definition),
        _definition: ($) =>
            choice(
                $.keyword,
                $.php_statement,
                $._inline_directive,
                $._nested_directive,
                $.attribute,
                $.loop_operator,
                alias($.text, $.html)
            ),

        comment: ($) =>
            seq(
                alias('{{--', $.bracket),
                optional(repeat($.text)),
                alias('--}}', $.bracket)
            ),

        // !keywords
        keyword: ($) => choice($._csrf),
        _csrf: ($) => '@csrf',
        // ! php Blocks
        php_statement: ($) =>
            choice($._escaped, $._unescaped, $._raw),
        _escaped: ($) =>
            seq(
                alias('{{', $.bracket),
                optional(repeat(alias($.text, $.php))),
                alias('}}', $.bracket)
            ),
        _unescaped: ($) =>
            seq(
                alias('{!!', $.bracket),
                optional(repeat(alias($.text, $.php))),
                alias('!!}', $.bracket)
            ),

        //! raw php
        _raw: ($) =>
            choice($._inline_raw, $._multi_line_raw, $._classic_raw),

        _inline_raw: ($) =>
            seq(alias('@php', $.directive), $._directive_parameter),

        _multi_line_raw: ($) =>
            seq(
                alias('@php', $.directive_start),
                optional(repeat(alias($.text, $.php))),
                alias('@endphp', $.directive_end)
            ),
        _classic_raw: ($) =>
            seq(
                alias('<?php', $.directive_start),
                optional(repeat(alias($.text, $.php))),
                alias('?>', $.directive_end)
            ),

        // !inline directives
        _inline_directive: ($) =>
            seq(
                alias(
                    /@(extends|yield|include|includeIf|includeWhen|includeUnless|includeFirst|props|method|inject|each)/,
                    $.directive
                ),
                $._directive_parameter
            ),
        // !nested directives
        _nested_directive: ($) =>
            choice(
                $.fragment,
                $.section,
                $.once,
                $.verbatim,
                $.stack,
                $.conditional,
                $.switch,
                $.loop
            ),

        // !fragment
        fragment: ($) =>
            seq(
                alias('@fragment', $.directive_start),
                $._directive_body_with_parameter,
                alias('@endfragment', $.directive_end)
            ),

        // !section
        section: ($) =>
            seq(
                alias('@section', $.directive_start),
                $._directive_body_with_parameter,
                alias('@endsection', $.directive_end)
            ),

        // once
        once: ($) =>
            seq(
                alias('@once', $.directive_start),
                optional($._directive_body),
                alias('@endonce', $.directive_end)
            ),

        // !verbatim
        verbatim: ($) =>
            seq(
                alias('@verbatim', $.directive_start),
                optional($._directive_body),
                alias('@endverbatim', $.directive_end)
            ),

        // ! stacks
        stack: ($) =>
            choice($._push, $._pushOnce, $._pushIf, $._prepend),

        _push: ($) =>
            seq(
                alias('@push', $.directive_start),
                $._directive_body_with_parameter,
                alias('@endpush', $.directive_end)
            ),

        _pushOnce: ($) =>
            seq(
                alias('@pushOnce', $.directive_start),
                $._directive_body_with_parameter,
                alias('@endPushOnce', $.directive_end)
            ),

        _pushIf: ($) =>
            seq(
                alias('@pushIf', $.directive_start),
                $._directive_body_with_parameter,
                alias('@endPushIf', $.directive_end)
            ),

        _prepend: ($) =>
            seq(
                alias('@prepend', $.directive_start),
                $._directive_body_with_parameter,
                alias('@endprepend', $.directive_end)
            ),

        // !Conditionals
        conditional: ($) =>
            choice(
                $._if,
                $._unless,
                $._isset,
                $._empty,
                $._auth,
                $._guest,
                $._production,
                $._env,
                $._hasSection,
                $._sectionMissing,
                $._custom
            ),
        // see if statement body bookmark
        conditional_keyword: ($) =>
            choice(
                '@else',
                seq(
                    alias(/@(elseif|else[a-zA-Z]+)/, $.directive),
                    optional($._directive_parameter)
                )
            ),

        _if: ($) =>
            seq(
                alias('@if', $.directive_start),
                $._if_statement_directive_body,
                alias('@endif', $.directive_end)
            ),

        _unless: ($) =>
            seq(
                alias('@unless', $.directive_start),
                $._if_statement_directive_body,
                alias('@endunless', $.directive_end)
            ),

        _isset: ($) =>
            seq(
                alias('@isset', $.directive_start),
                $._if_statement_directive_body,
                alias('@endisset', $.directive_end)
            ),

        _empty: ($) =>
            seq(
                alias('@empty', $.directive_start),
                $._if_statement_directive_body,
                alias('@endempty', $.directive_end)
            ),

        _auth: ($) =>
            seq(
                alias('@auth', $.directive_start),
                $._if_statement_directive_body_with_optional_parameter,
                alias('@endauth', $.directive_end)
            ),

        _guest: ($) =>
            seq(
                alias('@guest', $.directive_start),
                $._if_statement_directive_body_with_optional_parameter,
                alias('@endguest', $.directive_end)
            ),

        _production: ($) =>
            seq(
                alias('@production', $.directive_start),
                $._if_statement_directive_body_with_no_parameter,
                alias('@endproduction', $.directive_end)
            ),

        _env: ($) =>
            seq(
                alias('@env', $.directive_start),
                $._if_statement_directive_body,
                alias('@endenv', $.directive_end)
            ),

        _hasSection: ($) =>
            seq(
                alias('@hasSection', $.directive_start),
                $._if_statement_directive_body,
                alias('@endif', $.directive_end)
            ),

        _sectionMissing: ($) =>
            seq(
                alias('@sectionMissing', $.directive_start),
                $._if_statement_directive_body,
                alias('@endif', $.directive_end)
            ),

        _error: ($) =>
            seq(
                alias('@error', $.directive_start),
                $._if_statement_directive_body,
                alias('@enderror', $.directive_end)
            ),
        // BUG: lookbehind is not supported so we can't /@(?!end)[a-z]+/
        // This is the best that can be achieved without externals
        // Only problem will be character "e" can not be used as the first character
        // @exxx
        _custom: ($) =>
            seq(
                alias(/@[^e][a-zA-Z]+/, $.directive_start),
                $._if_statement_directive_body,
                alias(
                    token(prec(1, /@end[a-zA-Z]+/)),
                    $.directive_end
                )
            ),

        // ! Conditional Attributes
        attribute: ($) =>
            seq(
                alias(
                    /@(class|style|checked|selected|disabled|readonly|required)/,
                    $.directive
                ),
                $._directive_parameter
            ),

        // !switch
        // REVIEW: injection for param as PHP for case as HTML
        switch: ($) =>
            seq(
                alias('@switch', $.directive_start),
                $._directive_parameter,
                repeat($._case),
                optional(
                    seq(
                        alias('@default', $.directive),
                        repeat($._definition)
                    )
                ),
                alias('@endswitch', $.directive_end)
            ),
        _case: ($) =>
            seq(
                alias('@case', $.directive),
                $._directive_body_with_parameter,
                alias('@break', $.directive)
            ),

        // !Loops
        loop: ($) => choice($._for, $._foreach, $._forelse, $._while),
        loop_operator: ($) =>
            seq(
                alias(/@(continue|break)/, $.directive),
                optional($._directive_parameter)
            ),

        _for: ($) =>
            seq(
                alias('@for', $.directive_start),
                $._directive_body_with_parameter,
                alias('@endfor', $.directive_end)
            ),

        _foreach: ($) =>
            seq(
                alias('@foreach', $.directive_start),
                $._directive_body_with_parameter,
                alias('@endforeach', $.directive_end)
            ),

        _forelse: ($) =>
            seq(
                alias('@forelse', $.directive_start),
                $._directive_body_with_parameter,
                alias('@endforelse', $.directive_end)
            ),

        _while: ($) =>
            seq(
                alias('@while', $.directive_start),
                $._directive_body_with_parameter,
                alias('@endwhile', $.directive_end)
            ),

        /*------------------------------------
        /  Do NOT change below this line   /
        /  without running tests           /
        /  This is basically the engine    /
        /-----------------------------------*/

        // !directive body
        _directive_body: ($) => repeat1($._definition),
        _directive_body_with_parameter: ($) =>
            seq($._directive_parameter, optional($._directive_body)),
        _directive_body_with_optional_parameter: ($) =>
            seq(
                optional($._directive_parameter),
                optional($._directive_body)
            ),
        //!if statements body
        _if_statement_directive_body: ($) =>
            seq(
                $._directive_parameter,
                optional(
                    repeat(
                        choice($._definition, $.conditional_keyword)
                    )
                )
            ),
        _if_statement_directive_body_with_optional_parameter: ($) =>
            seq(
                optional($._directive_parameter),
                repeat1(choice($._definition, $.conditional_keyword))
            ),
        _if_statement_directive_body_with_no_parameter: ($) =>
            repeat1(choice($._definition, $.conditional_keyword)),

        // !directive parameter
        _directive_parameter: ($) =>
            seq(
                token(prec(1, '(')),
                optional(repeat($.parameter)),
                token(prec(1, ')'))
            ),
        // parenthesis balancing
        parameter: ($) => choice(/[^()]+/, $._text_with_parenthesis),
        _text_with_parenthesis: ($) =>
            seq(/[^()]+/, '(', repeat($.parameter), ')'),
        text: ($) =>
            choice(
                token(prec(-1, /[{}!@()-]/)),
                /[^\s(){!}@-]([^(){!}@]*[^\s{!}()@-])?/
            ),
    },
})
