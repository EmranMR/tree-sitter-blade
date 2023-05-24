module.exports = grammar({
    name: 'blade',
    extras: ($) => [$.comment, /\s+/],

    rules: {
        blade: ($) => repeat($._definition),
        _definition: ($) =>
            choice(
                $.text,
                $.extends,
                $.yield,
                $.keyword,
                $.fragment,
                $.component,
                $.subview,
                $.stack,
                $.switch_statements,
                $.loop,
                $.php_statement,
                $.html_statement
            ),

        comment: ($) => seq('{{--', optional($.text), '--}}'),
        extends: ($) => seq('@extends', $.directive_parameter),
        yield: ($) => seq('@yield', $.directive_parameter),
        subview: ($) =>
            choice(
                $.include,
                $.includeIf,
                $.includeWhen,
                $.includeUnless,
                $.includeFirst
            ),

        // !subview
        include: ($) => seq('@include', $.directive_parameter),
        includeIf: ($) => seq('@includeIf', $.directive_parameter),
        includeWhen: ($) =>
            seq('@includeWhen', $.directive_parameter),
        includeUnless: ($) =>
            seq('@includeUnless', $.directive_parameter),
        includeFirst: ($) =>
            seq('@includeFirst', $.directive_parameter),

        // ! once
        stack: ($) =>
            seq(
                /@(push|pushOnce|pushIf|prepend)/,
                $.directive_parameter,
                repeat($._definition),
                /@(endpush|endPushOnce|endPushIf|endprepend)/
            ),

        each: ($) => seq('@each', $.directive_parameter),
        // ! php Blocks
        php_statement: ($) => choice($._escaped, $._unescaped, $._raw),
        _escaped: ($) => seq('{{', optional($.text), '}}'),
        _unescaped: ($) => seq('{!!', optional($.text), '!!}'),
        _raw: ($) =>
            choice($.multi_line_raw, $.inline_raw, $.classic_raw),
        multi_line_raw: ($) =>
            seq('@php', optional($.text), '@endphp'),
        inline_raw: ($) => seq('@php', $.directive_parameter),
        classic_raw: ($) => seq('<?php', optional($.text), '?>'),

        // ! HTML blocks
        html_statement: ($) => choice($.conditional, $.section),

        // ! Javascript Blocks
        // TODO:Stuff that need JS injection

        // !Attributes
        // TODO: @class @style @checked @selected @disabled @readonly @required



        // !Conditionals
        conditional: ($) =>
            choice(
                $.if_statement,
                $.directive
            ),
        directive: $ => 
            seq(
                /@(auth|guest|env|production|unless|isset|empty|hasSection|sectionMissing|verbatim|error|disk|unlessdisk|once)/,
                optional($.directive_parameter),
                repeat($._definition),
                /@(endauth|endguest|endenv|endproduction|endunless|endisset|endempty|verbatim|enderror|enddisk|endonce)/
            ), 
        if_statement: ($) =>
            seq(
                "@if",
                $.directive_parameter,
                repeat(choice(
                    $._definition,
                    $.conditional_keyword,
                )),
                "@endif",
            ),
        conditional_keyword: $=> 
            seq(
                /@(else|elseif|elsedisk)/,
                optional($.directive_parameter)
            ), 

        // !switch //
        // REVIEW: injection for param as PHP for case as HTML
        switch_statements: ($) =>
            seq(
                '@switch',
                $.directive_parameter,
                repeat1($.case),
                optional(seq('@default', $._definition)),
                '@endswitch'
            ),
        case: ($) =>
            seq(
                '@case',
                $.directive_parameter,
                $._definition,
                '@break'
            ),

        // ! Loops
        loop: ($) =>
            seq(
                /@(for|foreach|forelse|while)/,
                $.directive_parameter,
                repeat1(choice($._definition, $.loop_operator)),
                optional(seq('@empty', repeat($._definition))),
                /@(endfor|endforeach|endforelse|endwhile)/
            ),
        // REVIEW: refactor name? or separate $.continue,$.break
        // FIXME: only works in the loop body NOT if_stemenets etc
        // maybe make universal? or put in def?
        loop_operator: ($) =>
            seq(/@(continue|break)/, optional($.directive_parameter)),

        // ! Javascript Statement //
        // ------------------------
        // REVIEW: This needs investigation with experienced users
        // create an issue when live
        // This is for Verbatim, @@blade_directives and @{{}} JS escapes
        // @verbatim currently defined in conditional rule
        //
        // js_statement: ($) => x ,

        // !section
        section: ($) =>
            seq(
                '@section',
                $.directive_parameter,
                optional(repeat($._definition)),
                '@endsection'
            ),
        // !fragment
        // TODO: double check
        fragment: ($) =>
            seq(
                '@fragment',
                $.directive_parameter,
                optional(repeat($._definition)),
                '@endfragment'
            ),

        // !component
        // TODO: make sure the attributes work
        component: ($) =>
            choice($._self_closing_component, $._parent_component),

        _self_closing_component: ($) => /<x-[a-zA-Z\-\.:\s]+\/>/,
        _parent_component: ($) =>
            seq(
                /<x-[a-zA-Z\-\.\s]+>/,
                optional(repeat($._definition)),
                /<\/x-[a-zA-Z\-\.]+>/
            ),
        // !keywords
        keyword: ($) =>
            choice($.props, $.csrf, $.method, $.inject),
        props: ($) => seq('@props(', $.text, ')'),
        csrf: ($) => '@csrf',
        method: ($) => seq('@method', $.directive_parameter),
        inject: ($) => seq('@inject', $.directive_parameter),

        //! Misc
        // text: ($) => /[^<>&\s@]([^<>&@{!}]*[^<>&\s@{!}])?/,
        text: ($) => /[^\s@]([^@{!}()\-]*[^\s@{!}()\-])?/,
        _open_parenthesis: ($) => /\([\'\"]?/,
        _close_parenthesis: ($) => /[\'\"]?\)/,
        // REVIEW: optional or not optional statement?
        directive_parameter: ($) =>
            seq(
                $._open_parenthesis,
                optional($.text),
                $._close_parenthesis
            ),
    },
})
