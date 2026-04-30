/**
 * @file Blade grammar for tree-sitter
 * @author Emran Mashhadi Ramezan <2t5ukanu@duck.com>
 * @license MIT
 */

import NodeMap from "./NodeMap.ts";
import html from "../tree-sitter-html/grammar.js";

const nodes = new NodeMap();

/// <reference types="tree-sitter-cli/dsl" />

// Single source of truth for paired conditional directives.
// `param` controls whether `$._directive_parameter` is required, optional, or
// disallowed (e.g. `@auth` accepts an optional argument; `@production` accepts
// none). Each entry produces strictly paired start/end directives so that a
// missing `@end…` is reported as an error rather than swallowed.
const CONDITIONAL_SPECS = [
  { start: "@if", end: "@endif", param: "required" },
  { start: "@unless", end: "@endunless", param: "required" },
  { start: "@isset", end: "@endisset", param: "required" },
  { start: "@empty", end: "@endempty", param: "required" },
  { start: "@auth", end: "@endauth", param: "optional" },
  { start: "@guest", end: "@endguest", param: "optional" },
  { start: "@production", end: "@endproduction", param: "none" },
  { start: "@env", end: "@endenv", param: "required" },
  { start: "@error", end: "@enderror", param: "required" },
  { start: "@can", end: "@endcan", param: "required" },
  { start: "@cannot", end: "@endcannot", param: "required" },
  { start: "@canany", end: "@endcanany", param: "required" },
  { start: "@feature", end: "@endfeature", param: "required" },
];

// Build a paired conditional `seq` for a given body rule. The body is what
// changes between contexts (block-level vs. inside an HTML start tag).
const buildConditional = ($, spec, body) => {
  const start = alias(spec.start, $.directive_start);
  const end = alias(spec.end, $.directive_end);
  if (spec.param === "none") {
    return seq(start, optional(body), end);
  }
  if (spec.param === "optional") {
    return seq(start, optional($._directive_parameter), optional(body), end);
  }
  return seq(start, $._directive_parameter, optional(body), end);
};

export default grammar(html, {
  name: "blade",

  rules: {
    // The entire grammar
    _node: ($) =>
      choice(
        ...nodes.add(
          // tree-sitter-html
          $.doctype,
          $.entity,
          $.text,
          $.element,
          $.script_element,
          $.style_element,
          $.erroneous_end_tag,
          // tree-sitter-blade
          $.keyword,
          $.php_statement,
          $._inline_directive,
          $.comment,
          $.switch,
          $.loop,
          $.envoy,
          $.livewire,
          // nested
          $.fragment,
          $.section,
          $.once,
          $.verbatim,
          $.stack,
          // conditional
          $.conditional,
        ),
      ),
    // ------------------

    // https://stackoverflow.com/questions/13014947/regex-to-match-a-c-style-multiline-comment/36328890#36328890
    comment: (_) => token(seq("{{--", /[^-]*-+([^}-][^-]*-+)*/, "}}")),

    // !keywords
    keyword: ($) =>
      alias(
        choice(
          "@csrf",
          "@viteReactRefresh",
          "@livewireStyles",
          "@livewireScripts",
          "@livewireScriptConfig",
          "@parent",
          "@inertia",
          "@inertiaHead",
          // log1x/sage-directives #77
          "@routes",
          "@permalink",
          "@title",
          "@content",
          "@excerpt",
          // WireUI
          "@wireUiScripts",
        ),
        $.directive,
      ),
    // ! PHP Statements
    php_statement: ($) =>
      choice($._escaped, $._unescaped, $._setup, $._raw, $._php),

    // From tree-sitter-php
    _php: ($) =>
      seq(
        $.php_tag,
        optional(alias($.text, $.php_only)),
        $.php_end_tag,
      ),

    php_tag: (_) => /<\?([pP][hH][pP]|=)?/,
    php_end_tag: (_) => "?>",
    // --------------------

    _escaped: ($) =>
      seq(
        "{{",
        optional(alias($.text, $.php_only)),
        "}}",
      ),
    _unescaped: ($) =>
      seq(
        "{!!",
        optional(alias($.text, $.php_only)),
        "!!}",
      ),

    // ! raw php
    _raw: ($) => choice($._inline_raw, $._multi_line_raw),

    _inline_raw: ($) => seq(alias("@php", $.directive), $._directive_parameter),

    _multi_line_raw: ($) =>
      seq(
        alias("@php", $.directive_start),
        optional(alias($.text, $.php_only)),
        alias("@endphp", $.directive_end),
      ),

    // tree-sitter-html override
    attribute: ($) =>
      choice(
        $._blade_attribute,
        $._html_attribute,
        $.php_statement,
        $._conditional_attribute,
      ),
    attribute_name: (_) => token(prec(-1, /[^<>"'/=\s]+/)),

    attribute_value: (_) => token(prec(-1, /[^<>"'/=\s]+/)),
    quoted_attribute_value: ($) =>
      choice(
        seq(
          "'",
          optional(
            repeat(
              choice(
                $.php_statement,
                $.conditional,
                $._inline_directive,
                $.comment,
                alias($._singly_quoted_attribute_text, $.attribute_value),
              ),
            ),
          ),
          "'",
        ),
        seq(
          '"',
          optional(
            repeat(
              choice(
                $.php_statement,
                $.conditional,
                $._inline_directive,
                $.comment,
                alias($._doubly_quoted_attribute_text, $.attribute_value),
              ),
            ),
          ),
          '"',
        ),
      ),

    // utilised from tree-sitter-html
    _html_attribute: ($) =>
      seq(
        $.attribute_name,
        optional(
          seq(
            "=",
            choice($.attribute_value, $.quoted_attribute_value),
          ),
        ),
      ),

    // ! Conditional Blade Attribute Directives
    _blade_attribute: ($) =>
      seq(
        alias(
          choice(
            "@class",
            "@style",
            "@checked",
            "@selected",
            "@disabled",
            "@readonly",
            "@required",
          ),
          $.directive,
        ),
        $._directive_parameter,
      ),

    // ! Conditional directives inside HTML tag attributes
    // Handles: <div @if($cond) x-data="..." @endif>
    // Built from CONDITIONAL_SPECS so the directive list lives in one place
    // and start/end pairs stay strict (e.g. @if must close with @endif).
    // Nesting works because $.attribute itself includes $._conditional_attribute.
    _conditional_attribute: ($) =>
      choice(
        ...CONDITIONAL_SPECS.map((spec) =>
          buildConditional($, spec, $._conditional_attribute_body),
        ),
      ),

    _conditional_attribute_body: ($) =>
      repeat1(choice($.attribute, $.conditional_keyword)),

    // !inline directives
    _inline_directive: ($) =>
      seq(
        alias(
          choice(
            "@include",
            "@includeIf",
            "@includeWhen",
            "@includeUnless",
            "@includeFirst",
            "@extends",
            "@yield",
            "@method",
            "@inject",
            "@each",
            "@vite",
            "@livewire",
            "@aware",
            "@servers",
            "@import",
            "@js",
            "@svg",
            "@props",
            "@use",
            "@stack",
            // log1x/sage-directives #77
            "@asset",
            "@json",
            "@script",
            "@thumbnail",
            "@extract",
            "@set",
            // ACF (Advanced Custom Fields)
            "@field",
            "@options",
            // WireUI
            "@wireUiScripts",
          ),
          $.directive,
        ),
        $._directive_parameter,
      ),

    // !nested directives

    fragment: ($) =>
      seq(
        alias("@fragment", $.directive_start),
        $._directive_parameter,
        optional(
          repeat1(
            choice(
              ...nodes.without(
                $.doctype,
                $.envoy,
                $.livewire,
                $.fragment,
                $.section,
                $.stack,
                $.once,
              ),
            ),
          ),
        ),
        alias("@endfragment", $.directive_end),
      ),

    // ! section
    section: ($) =>
      choice(
        seq(
          alias("@section", $.directive),
          "(",
          alias(/[^,()]+/, $.parameter),
          ",",
          alias(/[^,()]+/, $.parameter),
          ")",
        ),
        seq(
          alias("@section", $.directive_start),
          "(",
          alias(/[^,()]+/, $.parameter),
          ")",
          optional(
            repeat1(
              choice(
                ...nodes.without(
                  $.doctype,
                  $.section,
                  $.once,
                  $.envoy,
                  $.fragment,
                ),
              ),
            ),
          ),
          alias(/@(endsection|show)/, $.directive_end),
        ),
      ),

    once: ($) =>
      seq(
        alias("@once", $.directive_start),
        optional(
          repeat1(
            choice(...nodes.without($.doctype, $.envoy, $.section)),
          ),
        ),
        alias("@endonce", $.directive_end),
      ),

    verbatim: ($) =>
      seq(
        alias("@verbatim", $.directive_start),
        optional(
          repeat1(
            choice(...nodes.without($.doctype, $.livewire, $.envoy)),
          ),
        ),
        alias("@endverbatim", $.directive_end),
      ),

    stack: ($) =>
      choice(
        $._push,
        $._pushOnce,
        $._pushIf,
        $._prepend,
        $._prependOnce,
      ),

    _push: ($) =>
      seq(
        alias("@push", $.directive_start),
        $._directive_parameter,
        optional(
          repeat1(
            choice(
              ...nodes.without(
                $.doctype,
                $.envoy,
                $.livewire,
                $.loop,
                $._loop_operator,
                $.conditional,
                $.stack,
                $.once,
                $.fragment,
                $.section,
                $.verbatim,
              ),
            ),
          ),
        ),
        alias("@endpush", $.directive_end),
      ),

    _pushOnce: ($) =>
      seq(
        alias("@pushOnce", $.directive_start),
        $._directive_parameter,
        optional(
          repeat1(
            choice(
              ...nodes.without(
                $.doctype,
                $.envoy,
                $.livewire,
                $.loop,
                $._loop_operator,
                $.conditional,
                $.stack,
                $.once,
                $.fragment,
                $.section,
                $.verbatim,
              ),
            ),
          ),
        ),
        alias("@endPushOnce", $.directive_end),
      ),

    _pushIf: ($) =>
      seq(
        alias("@pushIf", $.directive_start),
        $._directive_parameter,
        optional(
          repeat1(
            choice(
              ...nodes.without(
                $.doctype,
                $.envoy,
                $.livewire,
                $.loop,
                $._loop_operator,
                $.conditional,
                $.stack,
                $.once,
                $.fragment,
                $.section,
                $.verbatim,
              ),
            ),
          ),
        ),
        alias("@endPushIf", $.directive_end),
      ),

    _prepend: ($) =>
      seq(
        alias("@prepend", $.directive_start),
        $._directive_parameter,
        optional(
          repeat1(
            choice(
              ...nodes.without(
                $.doctype,
                $.envoy,
                $.livewire,
                $.loop,
                $._loop_operator,
                $.conditional,
                $.stack,
                $.once,
                $.fragment,
                $.section,
                $.verbatim,
              ),
            ),
          ),
        ),
        alias("@endprepend", $.directive_end),
      ),

    _prependOnce: ($) =>
      seq(
        alias("@prependOnce", $.directive_start),
        $._directive_parameter,
        optional(
          repeat1(
            choice(
              ...nodes.without(
                $.doctype,
                $.envoy,
                $.livewire,
                $.loop,
                $._loop_operator,
                $.conditional,
                $.stack,
                $.once,
                $.fragment,
                $.section,
                $.verbatim,
              ),
            ),
          ),
        ),
        alias("@endPrependOnce", $.directive_end),
      ),

    // !Conditionals
    // All paired conditionals are built from CONDITIONAL_SPECS so that the
    // directive list lives in one place and is shared with $._conditional_attribute.
    // $._hasSection / $._sectionMissing both close with @endif (not @end<name>),
    // and $._custom is the catch-all for user-registered directives, so they
    // remain explicit.
    conditional: ($) =>
      choice(
        ...CONDITIONAL_SPECS.map((spec) =>
          buildConditional($, spec, $._conditonal_body),
        ),
        $._hasSection,
        $._sectionMissing,
        $._custom,
      ),

    // used in the conditional body rules
    conditional_keyword: ($) =>
      choice(
        alias("@else", $.directive),
        seq(
          alias(/@(elseif|else[a-zA-Z]+)/, $.directive),
          $._directive_parameter,
        ),
      ),

    _hasSection: ($) =>
      seq(
        alias("@hasSection", $.directive_start),
        $._conditional_directive_body,
        alias("@endif", $.directive_end),
      ),

    _sectionMissing: ($) =>
      seq(
        alias("@sectionMissing", $.directive_start),
        $._conditional_directive_body,
        alias("@endif", $.directive_end),
      ),

    // !Custom if Statements
    _custom: ($) =>
      seq(
        choice(
          alias(/@unless[a-zA-Z\d]+/, $.directive_start),
          alias(token(prec(-1, /@[a-zA-Z\d]+/)), $.directive_start),
        ),
        $._conditional_directive_body,
        alias(token(prec(1, /@end[a-zA-Z\d]+/)), $.directive_end),
      ),

    // !switch
    switch: ($) =>
      seq(
        alias("@switch", $.directive_start),
        $._directive_parameter,
        repeat($._case),
        optional(
          seq(
            alias("@default", $.directive),
            repeat1(
              choice(
                ...nodes.without(
                  $.doctype,
                  $.section,
                  $.once,
                  $.stack,
                  $.verbatim,
                  $.envoy,
                  $.fragment,
                  $.switch,
                ),
              ),
            ),
          ),
        ),
        alias("@endswitch", $.directive_end),
      ),
    _case: ($) =>
      seq(
        alias("@case", $.directive),
        $._directive_parameter,
        optional(
          repeat1(
            choice(
              ...nodes.without(
                $.doctype,
                $.section,
                $.once,
                $.stack,
                $.verbatim,
                $.envoy,
                $.fragment,
                $.switch,
              ),
            ),
          ),
        ),
        optional(alias("@break", $.directive)),
      ),

    // !Loops
    loop: ($) => choice($._for, $._foreach, $._forelse, $._while),

    _loop_operator: ($) =>
      choice(
        seq(
          alias(/@(continue|break)/, $.directive),
          optional($._directive_parameter),
        ),
        alias("@empty", $.directive),
      ),

    _for: ($) =>
      seq(
        alias("@for", $.directive_start),
        $._loop_directive_body,
        alias("@endfor", $.directive_end),
      ),

    _foreach: ($) =>
      seq(
        alias("@foreach", $.directive_start),
        $._loop_directive_body,
        alias("@endforeach", $.directive_end),
      ),

    _forelse: ($) =>
      seq(
        alias("@forelse", $.directive_start),
        $._loop_directive_body,
        alias("@endforelse", $.directive_end),
      ),

    _while: ($) =>
      seq(
        alias("@while", $.directive_start),
        $._loop_directive_body,
        alias("@endwhile", $.directive_end),
      ),

    // !envoy
    envoy: ($) => choice($._task, $._story, $._hooks),

    _setup: ($) =>
      seq(
        alias("@setup", $.directive_start),
        optional(alias($.text, $.php_only)),
        alias("@endsetup", $.directive_end),
      ),

    _task: ($) =>
      seq(
        alias("@task", $.directive_start),
        $._envoy_directive_body,
        alias("@endtask", $.directive_end),
      ),

    _story: ($) =>
      seq(
        alias("@story", $.directive_start),
        $._envoy_directive_body,
        alias("@endstory", $.directive_end),
      ),

    _hooks: ($) =>
      choice(
        $._before,
        $._after,
        $._envoy_error,
        $._success,
        $._finished,
      ),

    _before: ($) =>
      seq(
        alias("@before", $.directive_start),
        optional(repeat($._notification)),
        alias("@endbefore", $.directive_end),
      ),
    _after: ($) =>
      seq(
        alias("@after", $.directive_start),
        optional(repeat($._notification)),
        alias("@endafter", $.directive_end),
      ),
    _envoy_error: ($) =>
      seq(
        alias("@error", $.directive_start),
        optional(repeat($._notification)),
        alias("@enderror", $.directive_end),
      ),
    _success: ($) =>
      seq(
        alias("@success", $.directive_start),
        optional(repeat($._notification)),
        alias("@endsuccess", $.directive_end),
      ),
    _finished: ($) =>
      seq(
        alias("@finished", $.directive_start),
        optional(repeat($._notification)),
        alias("@endfinished", $.directive_end),
      ),

    // !envoy:notification
    _notification: ($) =>
      seq(
        alias(
          /@(slack|discord|telegram|microsoftTeams)/,
          $.directive,
        ),
        $._directive_parameter,
      ),
    // !livewire 🪼
    livewire: ($) =>
      choice($._persist, $._teleport, $._volt, $._script, $._assets),
    _persist: ($) =>
      seq(
        alias("@persist", $.directive_start),
        $._directive_parameter,
        repeat1(
          choice(
            $.entity,
            $.text,
            $.element,
            $.php_statement,
            $.conditional,
          ),
        ),
        alias("@endpersist", $.directive_end),
      ),
    _teleport: ($) =>
      seq(
        alias("@teleport", $.directive_start),
        $._directive_parameter,
        repeat1(
          choice(
            ...nodes.without(
              $.doctype,
              $.envoy,
              $.fragment,
              $.section,
              $.once,
              $.verbatim,
              $.stack,
            ),
          ),
        ),
        alias("@endteleport", $.directive_end),
      ),
    _volt: ($) =>
      seq(
        alias("@volt", $.directive_start),
        $._directive_parameter,
        repeat1(
          choice(
            ...nodes.without(
              $.doctype,
              $.envoy,
              $.fragment,
              $.section,
              $.once,
              $.verbatim,
              $.stack,
            ),
          ),
        ),
        alias("@endvolt", $.directive_end),
      ),
    _script: ($) =>
      seq(
        alias("@script", $.directive_start),
        optional(repeat1(
          choice(
            ...nodes.without(
              $.doctype,
              $.envoy,
              $.fragment,
              $.section,
              $.once,
              $.verbatim,
              $.stack,
            ),
          ),
        )),
        alias("@endscript", $.directive_end),
      ),
    _assets: ($) =>
      seq(
        alias("@assets", $.directive_start),
        optional(repeat1(
          choice(
            ...nodes.without(
              $.doctype,
              $.envoy,
              $.fragment,
              $.section,
              $.once,
              $.verbatim,
              $.stack,
            ),
          ),
        )),
        alias("@endassets", $.directive_end),
      ),

    /*-----------------------------------*
    /  Do NOT change below this line
    /  without running tests
    /  This is the engine
    /*----------------------------------*/

    // !conditional helpers

    _conditonal_body: ($) =>
      repeat1(choice(...nodes.with($.conditional_keyword).all())),

    _conditional_directive_body: ($) =>
      seq($._directive_parameter, optional($._conditonal_body)),

    // ! envoy helpers
    _envoy_if: ($) =>
      seq(
        alias("@if", $.directive_start),
        $._directive_parameter,
        choice($.conditional_keyword, $._envoy_body),
        alias("@endif", $.directive_end),
      ),

    _envoy_body: ($) => repeat1(choice($.text, $._envoy_if, $._escaped)),
    _envoy_directive_body: ($) =>
      seq($._directive_parameter, optional($._envoy_body)),

    // !loop helpers
    _loop_body: ($) =>
      repeat1(
        choice(
          ...nodes
            .with($._loop_operator)
            .without(
              $.doctype,
              $.envoy,
              $.livewire,
              $.section,
              $.fragment,
              $.once,
              $.verbatim,
              $.stack,
            ),
        ),
      ),

    _loop_directive_body: ($) =>
      seq($._directive_parameter, optional($._loop_body)),

    // !directive parameter
    _directive_parameter: ($) =>
      seq(
        "(",
        optional(repeat($.parameter)),
        ")",
      ),

    // !parenthesis balancing - for functions/casts
    parameter: ($) => choice(/[^()]+/, $._nested_parenthases),
    _nested_parenthases: ($) => seq("(", repeat($.parameter), ")"),

    text: ($) => prec.right(repeat1($._text)),
    // hidden to reduce AST noise in php_only #39
    // It is selectively unhidden for other areas

    // escaped blade directives e.g. @@if, @@csrf
    _escaped_directive: (_) => token(prec(1, /@@[a-zA-Z\d]*/)),

    // Create alternative text rep for php_only
    _text: ($) =>
      // custom directive conflict resolution
      choice(
        $._escaped_directive,
        token(prec(-1, /@[a-zA-Z\d]*[^\(-]/)),
        // orphan tags
        token(prec(-2, /[{}!@()?,-]/)),
        token(
          prec(
            -1,
            /[^\s(){!}@-]([^<>(){!}@,?]*[^<>{!}()@?,-])?/, // general text
          ),
        ),
      ),

    _singly_quoted_attribute_text: ($) =>
      prec.right(
        repeat1(
          choice(
            $._escaped_directive,
            token(prec(-2, /[{}]/)),
            token(prec(-1, /[^'{}]/)),
          ),
        ),
      ),
    _doubly_quoted_attribute_text: ($) =>
      prec.right(
        repeat1(
          choice(
            $._escaped_directive,
            token(prec(-2, /[{}]/)),
            token(prec(-1, /[^"{}]/)),
          ),
        ),
      ),
  },
});
