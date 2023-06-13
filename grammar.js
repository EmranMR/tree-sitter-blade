module.exports = grammar({
    name: 'blade',
    extras: ($) => [$.comment, /\s+/],

    rules: {
        blade: ($) => repeat($._definition),
        _definition: ($) =>
            choice(
                $.inline_directive,
                $.nested_directive,
                $.keyword,
                $.attribute,
                $.switch_statements,
                $.loop_operator,
                $.php_statement,
                $.text,
                // $.component,
            ),

        comment: ($) => seq('{{--', optional(repeat($.text)), '--}}'),

        // !keywords
        keyword: ($) => choice($.csrf),
        csrf: ($) => '@csrf',


        // !inline directives
        inline_directive: $ =>
            seq(
                alias(
                    /@(extends|yield|include|includeIf|includeWhen|includeUnless|includeFirst|props|method|inject|each)/,
                    $.directive
                ),
                $._directive_parameter,
            ),
        // !nested directives
        nested_directive: $ =>
            choice(
                $.conditional,
                $.fragment,
                $.section,
                $.stack,
                $.loop
            ),

        // !fragment
        fragment: ($) =>
            seq(
                alias('@fragment', $.directive),
                $._directive_body_with_parameter,
                alias('@endfragment', $.endDirective)
            ),

        // !section
        section: ($) =>
            seq(
                alias('@section', $.directive),
                $._directive_body_with_parameter,
                alias('@endsection', $.endDirective)
            ),

        // once
        once: ($) =>
            seq(
                alias('@once', $.directive),
                optional($._directive_body),
                alias('@endonce', $.endDirective)
            ),

        // !verbatim
        verbatim: ($) =>
            seq(
                alias('@verbatim', $.directive),
                optional($._directive_body),
                alias('@endverbatim', $.endDirective)
            ),



        // ! stacks
        stack: ($) =>
            choice(
                $.push,
                $.pushOnce,
                $.pushIf,
                $.prepend
            ),

        push: $ =>
            seq(
                alias('@push', $.directive),
                $._directive_body_with_parameter,
                alias('@endpush', $.endDirective),
            ),

        pushOnce: $ =>
            seq(
                alias('@pushOnce', $.directive),
                $._directive_body_with_parameter,
                alias('@endPushOnce', $.endDirective),
            ),

        pushIf: $ =>
            seq(
                alias('@pushIf', $.directive),
                $._directive_body_with_parameter,
                alias('@endPushIf', $.endDirective),
            ),

        prepend: $ =>
            seq(
                alias('@prepend', $.directive),
                $._directive_body_with_parameter,
                alias('@endprepend', $.endDirective),
            ),




        // ! php Blocks
        php_statement: ($) =>
            choice($._escaped, $._unescaped, $._raw),
        _escaped: ($) => seq('{{', optional(repeat($.text)), '}}'),
        _unescaped: ($) => seq('{!!', optional(repeat($.text)), '!!}'),

        //! raw php
        _raw: ($) =>
            choice($._inline_raw, $._multi_line_raw, $._classic_raw),

        _inline_raw: ($) => seq('@php', $._directive_parameter),

        _multi_line_raw: ($) =>
            seq('@php', optional(repeat($.text)), '@endphp'),
        _classic_raw: ($) => seq('<?php', optional(repeat($.text)), '?>'),

        // !Conditionals
        conditional: ($) =>
            choice(
                $.if,
                $.unless,
                $.isset,
                $.empty,
                $.auth,
                $.guest,
                $.production,
                $.env,
                $.hasSection,
                $.sectionMissing
            ),
        conditional_keyword: ($) =>
            seq(
                alias(/@(else|elseif|elsedisk)/, $.directive),
                optional($._directive_parameter)
            ),

        if: ($) =>
            seq(
                alias('@if', $.directive),
                $._if_statement_directive_body,
                alias('@endif', $.endDirective),
            ),

        unless: ($) =>
            seq(
                alias('@unless', $.directive),
                $._if_statement_directive_body,
                alias('@endunless', $.endDirective),
            ),

        isset: ($) =>
            seq(
                alias('@isset', $.directive),
                $._if_statement_directive_body,
                alias('@endisset', $.endDirective),
            ),

        empty: ($) =>
            seq(
                alias('@empty', $.directive),
                $._if_statement_directive_body,
                alias('@endempty', $.endDirective),
            ),

        auth: ($) =>
            seq(
                alias('@auth', $.directive),
                $._if_statement_directive_body_with_optional_parameter,
                alias('@endauth', $.endDirective),
            ),

        guest: ($) =>
            seq(
                alias('@guest', $.directive),
                $._if_statement_directive_body_with_optional_parameter,
                alias('@endguest', $.endDirective),
            ),

        production: ($) =>
            seq(
                alias('@production', $.directive),
                $._if_statement_directive_body_with_no_parameter,
                alias('@endproduction', $.endDirective),
            ),

        env: ($) =>
            seq(
                alias('@env', $.directive),
                $._if_statement_directive_body,
                alias('@endenv', $.endDirective),
            ),

        hasSection: ($) =>
            seq(
                alias('@hasSection', $.directive),
                $._if_statement_directive_body,
                alias('@endif', $.endDirective),
            ),

        sectionMissing: ($) =>
            seq(
                alias('@sectionMissing', $.directive),
                $._if_statement_directive_body,
                alias('@endif', $.endDirective),
            ),

        error: ($) =>
            seq(
                alias('@error', $.directive),
                $._if_statement_directive_body,
                alias('@enderror', $.endDirective),
            ),




        // ! Conditional Attributes
        attribute: ($) =>
            seq(
                /@(class|style|checked|selected|disabled|readonly|required|)/,
                $._directive_parameter
            ),

        // !switch
        // REVIEW: injection for param as PHP for case as HTML
        switch_statements: ($) =>
            seq(
                alias('@switch', $.directive),
                $._directive_parameter,
                repeat($.case),
                optional(
                    seq(
                        alias('@default', $.directive),
                        repeat($._definition)
                    )
                ),
                alias('@endswitch', $.endDirective)
            ),
        case: ($) =>
            seq(
                alias('@case', $.directive),
                $._directive_body_with_parameter,
                alias('@break', $.directive)
            ),

        // !Loops
        loop: ($) =>
            choice(
                $.for,
                $.foreach,
                $.forelse,
                $.while
            ),
        loop_operator: ($) =>
            seq(/@(continue|break)/, optional($._directive_parameter)),

        for: ($) =>
            seq(
                alias('@for', $.directive),
                $._directive_body_with_parameter,
                alias('@endfor', $.endDirective),
            ),

        foreach: ($) =>
            seq(
                alias('@foreach', $.directive),
                $._directive_body_with_parameter,
                alias('@endforeach', $.endDirective),
            ),

        forelse: ($) =>
            seq(
                alias('@forelse', $.directive),
                $._directive_body_with_parameter,
                alias('@endforelse', $.endDirective),
            ),

        while: ($) =>
            seq(
                alias('@while', $.directive),
                $._directive_body_with_parameter,
                alias('@endwhile', $.endDirective),
            ),

        /*----------------------------------
        /  Do NOT change below this line    
        /  without running tests            
        /  This is basically the engine     
        /-----------------------------------*/

        // !directive body
        _directive_body: $ => repeat1($._definition),
        _directive_body_with_parameter: $ =>
            seq(
                $._directive_parameter,
                optional($._directive_body)
            ),
        _directive_body_with_optional_parameter: $ =>
            seq(
                optional($._directive_parameter),
                optional($._directive_body),
            ),
        //!if statements body
        _if_statement_directive_body: $ =>
            seq(
                $._directive_parameter,
                optional(
                    repeat(
                        choice(
                            $._definition,
                            $.conditional_keyword
                        )
                    )
                )
            ),
        _if_statement_directive_body_with_optional_parameter: $ =>
            seq(
                optional($._directive_parameter),
                repeat1(
                    choice(
                        $._definition,
                        $.conditional_keyword
                    )
                )
            ),
        _if_statement_directive_body_with_no_parameter: $ =>
            repeat1(
                choice(
                    $._definition,
                    $.conditional_keyword
                )
            ),

        //! Misc
        _directive_parameter: ($) =>
            seq(
                token(prec(1, '(')),
                optional(repeat($.parameters)),
                token(prec(1, ')'))
            ),
        // parenthesis balancing
        parameters: $ =>
            choice(
                /[^()]+/,
                $._text_with_parenthesis
            ),
        _text_with_parenthesis: $ => seq(
            /[^()]+/,
            '(',
            repeat($.parameters),
            ')'

        ),
        text: ($) => choice(
            token(prec(-1, /[{}!@()-]/)),
            /[^\s(){!}@-]([^(){!}@]*[^\s{!}()@-])?/),

        // ! Javascript Statement //
        // ------------------------
        /*
        // REVIEW: This needs investigation with experienced users
        // create an issue when live
        // This is for Verbatim, @@blade_directives and @{{}} JS escapes
        // @verbatim currently defined in conditional rule
        //
        // js_statement: ($) => x ,
        */


        // !component
        /*
        // TODO: make sure the attributes work
        // <x-alert type="error" :message="$message"/>
        // Could possibly mix self and parent into one
        // by making the end tag optional and changing the start tag to <x-[a-zA-Z\-\.:\s]+\/?>
        // but the syntax highlighting will pick the error better in <x-test/>error</x-test>

        //!REFACTOR
        //----------
        // Component is not necessary atm. focus on the special attributes like alpinejs etc.
        // injecting javascript.
        // better autocompletion with HTML injection in the text!

        // component: ($) =>
        /* choice($.self_closing_component, $.parent_component),

    self_closing_component: ($) =>
        seq(/<x-[a-zA-Z\-\.:]+/, repeat($.text), '/>'),
    parent_component: ($) =>
        seq(
            seq(/<x-[a-zA-Z\-\.:]+/, repeat($.text), '>'),
            optional(repeat($._definition)),
            /<\/x-[a-zA-Z\-\.:]+>/
        ),
*/
    },
})
