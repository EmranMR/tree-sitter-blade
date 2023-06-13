module.exports = grammar({
    name: 'blade',
    extras: ($) => [$.comment, /\s+/],

    rules: {
        blade: ($) => repeat($._definition),
        _definition: ($) =>
            choice(
                $.section,
                $.inline_directives,
                $.keyword,
                $.conditional,
                $.fragment,
                $.attribute,
                $.stack,
                $.switch_statements,
                $.loop,
                $.loop_operator,
                $.php_statement,
                $.text,
                // $.component,
            ),

        comment: ($) => seq('{{--', optional(repeat($.text)), '--}}'),

        // !section
        section: ($) =>
            seq(
                '@section',
                $._directive_parameter,
                optional(repeat($._definition)),
                '@endsection'
            ),

        // !inline directives
        inline_directives: $ =>
            seq(
                /@(extends|yield|include|includeIf|includeWhen|includeUnless|includeFirst|props|method|inject|each)/,
                $._directive_parameter,
            ),

        // !keywords
        keyword: ($) => choice($.csrf),
        csrf: ($) => '@csrf',

        // ! once
        stack: ($) =>
            seq(
                /@(push|pushOnce|pushIf|prepend)/,
                $._directive_parameter,
                repeat($._definition),
                /@(endpush|endPushOnce|endPushIf|endprepend)/
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

        // ! Javascript Blocks
        // TODO:Stuff that need JS injection such as alpineJS?

        // !Conditionals
        conditional: ($) => choice($.if_statement, $.directive),
        directive: ($) =>
            seq(
                /@(auth|guest|env|production|unless|isset|empty|hasSection|sectionMissing|verbatim|error|disk|unlessdisk|once)/,
                optional($._directive_parameter),
                repeat($._definition),
                /@(endauth|endguest|endenv|endproduction|endunless|endisset|endempty|endverbatim|enderror|enddisk|endonce|endif)/
            ),
        if_statement: ($) =>
            seq(
                '@if',
                $._directive_parameter,
                repeat(choice($._definition, $.conditional_keyword)),
                '@endif'
            ),
        conditional_keyword: ($) =>
            seq(
                /@(else|elseif|elsedisk)/,
                optional($._directive_parameter)
            ),

        // ! Conditional Attributes
        // TODO: @class @style @checked @selected @disabled @readonly @required
        // check this out in regards to injections
        // check out the hrml treesitter for attribute position
        // or just make these universal stand_alone like loop_operators
        // use directive parameter, and inject php. see if it works
        //  with html injection if set as general directive in _definition
        attribute: ($) =>
            seq(
                /@(class|style|checked|selected|disabled|readonly|required|)/,
                $._directive_parameter
            ),

        // !switch //
        // REVIEW: injection for param as PHP for case as HTML
        switch_statements: ($) =>
            seq(
                '@switch',
                $._directive_parameter,
                repeat1($.case),
                optional(seq('@default', repeat($._definition))),
                '@endswitch'
            ),
        case: ($) =>
            seq(
                '@case',
                $._directive_parameter,
                optional(repeat($._definition)),
                '@break'
            ),

        // ! Loops
        loop: ($) =>
            seq(
                /@(for|foreach|forelse|while)/,
                $._directive_parameter,
                repeat($._definition),
                /@(endfor|endforeach|endforelse|endwhile)/
            ),
        loop_operator: ($) =>
            seq(/@(continue|break)/, optional($._directive_parameter)),

        // !fragment
        fragment: ($) =>
            seq(
                '@fragment',
                $._directive_parameter,
                optional(repeat($._definition)),
                '@endfragment'
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
