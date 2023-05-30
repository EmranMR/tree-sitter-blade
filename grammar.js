module.exports = grammar({
    name: 'blade',
    extras: ($) => [$.comment, /\s+/],

    rules: {
        blade: ($) => repeat($._definition),
        _definition: ($) =>
            choice(
                $.extends,
                $.section,
                $.conditional,
                $.yield,
                $.keyword,
                $.fragment,
                $.attribute,
                $.component,
                $.subview,
                $.stack,
                $.switch_statements,
                $.loop,
                $.loop_operator,
                $.php_statement,
                $.text,
                // $.html_element
            ),

        comment: ($) => seq('{{--', optional($.text), '--}}'),
        extends: ($) => seq('@extends', $.directive_parameter),
        yield: ($) => seq('@yield', $.directive_parameter),

        // !section
        section: ($) =>
            seq(
                '@section',
                $.directive_parameter,
                optional(repeat($._definition)),
                '@endsection'
            ),
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
        php_statement: ($) =>
            choice($._escaped, $._unescaped, $._raw),
        _escaped: ($) => seq('{{', optional($.php_text), '}}'),
        _unescaped: ($) => seq('{!!', optional($.php_text), '!!}'),

        // raw php
        _raw: ($) =>
            choice($._inline_raw, $._multi_line_raw, $._classic_raw),
        _multi_line_raw: ($) =>
            seq('@php', optional($.php_text), '@endphp'),
        _inline_raw: ($) => seq('@php', $.directive_parameter),
        _classic_raw: ($) => seq('<?php', optional($.php_text), '?>'),

        // ! Javascript Blocks
        // TODO:Stuff that need JS injection such as alpineJS?

        // !Conditionals
        conditional: ($) => choice($.if_statement, $.directive),
        directive: ($) =>
            seq(
                /@(auth|guest|env|production|unless|isset|empty|hasSection|sectionMissing|verbatim|error|disk|unlessdisk|once)/,
                optional($.directive_parameter),
                repeat($._definition),
                /@(endauth|endguest|endenv|endproduction|endunless|endisset|endempty|endverbatim|enderror|enddisk|endonce|endif)/
            ),
        if_statement: ($) =>
            seq(
                '@if',
                $.directive_parameter,
                repeat(choice($._definition, $.conditional_keyword)),
                '@endif'
            ),
        conditional_keyword: ($) =>
            seq(
                /@(else|elseif|elsedisk)/,
                optional($.directive_parameter)
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
                $.directive_parameter
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
                repeat($._definition),
                /@(endfor|endforeach|endforelse|endwhile)/
            ),
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

        // !fragment
        fragment: ($) =>
            seq(
                '@fragment',
                $.directive_parameter,
                optional(repeat($._definition)),
                '@endfragment'
            ),

        // !component
        // TODO: make sure the attributes work
        // <x-alert type="error" :message="$message"/>
        // Could possibly mix self and parent into one
        // by making the end tag optional and changing the start tag to <x-[a-zA-Z\-\.:\s]+\/?>
        // but the syntax highlighting will pick the error better in <x-test/>error</x-test>
        component: ($) =>
            choice($.self_closing_component, $.parent_component),

        self_closing_component: ($) =>
            seq(/<x-[a-zA-Z\-\.:]+/, repeat($.text), '/>'),
        parent_component: ($) =>
            seq(
                seq(/<x-[a-zA-Z\-\.:]+/, repeat($.text), '>'),
                optional(repeat($._definition)),
                /<\/x-[a-zA-Z\-\.:]+>/
            ),

        // !keywords
        keyword: ($) => choice($.props, $.csrf, $.method, $.inject),
        props: ($) => seq('@props', $.directive_parameter),
        csrf: ($) => '@csrf',
        method: ($) => seq('@method', $.directive_parameter),
        inject: ($) => seq('@inject', $.directive_parameter),

        //! Misc
        _open_parenthesis: ($) => /\([\'\"]?/,
        _close_parenthesis: ($) => /[\'\"]?\)/,
        // REVIEW: optional or not optional statement?
        directive_parameter: ($) =>
            seq(
                $._open_parenthesis,
                optional($.text),
                $._close_parenthesis
            ),

        // !HTML Element
        // This will be a dirty fix to sort components being parsed as
        // html due to injection
        // html_start_tag: ($) =>
        //     seq(
        //         '<',
        //         $._tag_name,
        //         optional(repeat($.php_statement)),
        //         '>'
        //     ),
        // html_end_tag: ($) =>
        //     seq(
        //         '</',
        //         $._tag_name,
        //         optional(repeat($.php_statement)),
        //         '>'
        //     ),
        // html_element: ($) =>
        //     seq(
        //         $.html_start_tag,
        //         optional(repeat($._definition)),
        //         $.html_end_tag
        //     ),
        // _tag_name: ($) => /[^<>:!{}@]*/,

        text: ($) => /[^\s(){!}@]([^(){!}@]*[^\s{!}()@])?/,
        php_text: $ => /[^\s{!}@]([^{!}@]*[^\s{!}@])?/
    },
})
