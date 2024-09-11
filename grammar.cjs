module.exports = grammar({
  name: 'blade',

  rules: {
    blade: ($) => repeat($._definition),
    // !definitions
    _definition: ($) =>
      choice(
        $.keyword,
        $.php_statement,
        $.attribute,
        $._inline_directive,
        $._nested_directive,
        $.loop_operator,
        $.comment,
        $.text,
      ),

    // https://stackoverflow.com/questions/13014947/regex-to-match-a-c-style-multiline-comment/36328890#36328890
    comment: ($) =>
      token(seq('{{--', /[^-]*-+([^}-][^-]*-+)*/, '}}')),

    // !keywords
    keyword: ($) =>
      alias(
        /@(csrf|viteReactRefresh|livewireStyles|livewireScripts|livewireScriptConfig|parent)/,
        $.directive,
      ),
    // ! PHP Statements
    php_statement: ($) =>
      choice(
        $._escaped,
        $._unescaped,
        $._raw,
        $._setup,
        $._hooks,
      ),
    _escaped: ($) =>
      seq(
        alias('{{', $.bracket_start),
        optional($.php_only),
        alias('}}', $.bracket_end),
      ),
    _unescaped: ($) =>
      seq(
        alias('{!!', $.bracket_start),
        optional($.php_only),
        alias('!!}', $.bracket_end),
      ),

    // ! raw php
    _raw: ($) => choice($._inline_raw, $._multi_line_raw),

    _inline_raw: ($) =>
      seq(alias('@php', $.directive), $._directive_parameter),

    _multi_line_raw: ($) =>
      seq(
        alias('@php', $.directive_start),
        optional($.php_only),
        alias('@endphp', $.directive_end),
      ),
    _js: ($) =>
      seq(alias('@js', $.directive), $._directive_parameter),
    // ! Conditional Attributes
    attribute: ($) =>
      seq(
        alias(
          /@(class|style|checked|selected|disabled|readonly|required)/,
          $.directive,
        ),
        $._directive_parameter,
      ),
    // !inline directives
    _inline_directive: ($) =>
      choice(
        seq(
          alias(
            choice(
              /@(extends|yield|include(If|When|Unless|First)?|props)/,
              /@(method|inject|each|vite|livewire|aware|section|servers|import)/,
            ),
            $.directive,
          ),
          $._directive_parameter,
        ),
        $.inlineSection,
        $._use,
        $._js,
      ),
    // !TODO add test for this
    _use: ($) =>
      seq(
        alias('@use', $.directive),
        alias('(', $.bracket_start),
        optional(alias($._section_parameter, $.parameter)),
        optional(seq(',', alias($._section_parameter, $.parameter))),
        alias(')', $.bracket_end),
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
        $.loop,
        $.envoy,
        $.livewire,
      ),

    // !fragment
    fragment: ($) =>
      seq(
        alias('@fragment', $.directive_start),
        $._directive_body_with_parameter,
        alias('@endfragment', $.directive_end),
      ),

    // ! section
    section: ($) =>
      seq(
        alias('@section', $.directive_start),
        alias('(', $.bracket_start),
        optional(alias($._section_parameter, $.parameter)),
        alias(')', $.bracket_end),
        optional($._directive_body),
        alias(/@(endsection|show)/, $.directive_end),
      ),
    inlineSection: ($) =>
      seq(
        alias('@section', $.directive),
        alias('(', $.bracket_start),
        optional(alias($._section_parameter, $.parameter)),
        ',',
        optional(alias($._section_parameter, $.parameter)),
        alias(')', $.bracket_end),
      ),
    // once
    once: ($) =>
      seq(
        alias('@once', $.directive_start),
        optional($._directive_body),
        alias('@endonce', $.directive_end),
      ),

    // !verbatim
    verbatim: ($) =>
      seq(
        alias('@verbatim', $.directive_start),
        optional($._directive_body),
        alias('@endverbatim', $.directive_end),
      ),

    // ! stacks
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
        alias('@push', $.directive_start),
        $._directive_body_with_parameter,
        alias('@endpush', $.directive_end),
      ),

    _pushOnce: ($) =>
      seq(
        alias('@pushOnce', $.directive_start),
        $._directive_body_with_parameter,
        alias('@endPushOnce', $.directive_end),
      ),

    _pushIf: ($) =>
      seq(
        alias('@pushIf', $.directive_start),
        $._directive_body_with_parameter,
        alias('@endPushIf', $.directive_end),
      ),

    _prepend: ($) =>
      seq(
        alias('@prepend', $.directive_start),
        $._directive_body_with_parameter,
        alias('@endprepend', $.directive_end),
      ),

    _prependOnce: ($) =>
      seq(
        alias('@prependOnce', $.directive_start),
        $._directive_body_with_parameter,
        alias('@endPrependOnce', $.directive_end),
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
        $._error,
        $.authorization,
        alias($._feature, $.pennant),
        $._custom,
      ),
    // used in the conditional body rules
    conditional_keyword: ($) =>
      choice(
        alias('@else', $.directive),
        seq(
          alias(/@(elseif|else[a-zA-Z]+)/, $.directive),
          optional($._directive_parameter),
        ),
      ),

    _if: ($) =>
      seq(
        alias('@if', $.directive_start),
        $._if_statement_directive_body,
        alias('@endif', $.directive_end),
      ),

    _unless: ($) =>
      seq(
        alias('@unless', $.directive_start),
        $._if_statement_directive_body,
        alias('@endunless', $.directive_end),
      ),

    _isset: ($) =>
      seq(
        alias('@isset', $.directive_start),
        $._if_statement_directive_body,
        alias('@endisset', $.directive_end),
      ),

    _empty: ($) =>
      seq(
        alias('@empty', $.directive_start),
        $._if_statement_directive_body,
        alias('@endempty', $.directive_end),
      ),

    _auth: ($) =>
      seq(
        alias('@auth', $.directive_start),
        $._if_statement_directive_body_with_optional_parameter,
        alias('@endauth', $.directive_end),
      ),

    _guest: ($) =>
      seq(
        alias('@guest', $.directive_start),
        $._if_statement_directive_body_with_optional_parameter,
        alias('@endguest', $.directive_end),
      ),

    _production: ($) =>
      seq(
        alias('@production', $.directive_start),
        $._if_statement_directive_body_with_no_parameter,
        alias('@endproduction', $.directive_end),
      ),

    _env: ($) =>
      seq(
        alias('@env', $.directive_start),
        $._if_statement_directive_body,
        alias('@endenv', $.directive_end),
      ),

    _hasSection: ($) =>
      seq(
        alias('@hasSection', $.directive_start),
        $._if_statement_directive_body,
        alias('@endif', $.directive_end),
      ),

    _sectionMissing: ($) =>
      seq(
        alias('@sectionMissing', $.directive_start),
        $._if_statement_directive_body,
        alias('@endif', $.directive_end),
      ),

    _error: ($) =>
      seq(
        alias('@error', $.directive_start),
        $._if_statement_directive_body,
        alias('@enderror', $.directive_end),
      ),

    // !Authorisation Directives
    authorization: ($) => choice($._can, $._canany, $._cannot),
    _can: ($) =>
      seq(
        alias('@can', $.directive_start),
        $._if_statement_directive_body,
        alias('@endcan', $.directive_end),
      ),

    _cannot: ($) =>
      seq(
        alias('@cannot', $.directive_start),
        $._if_statement_directive_body,
        alias('@endcannot', $.directive_end),
      ),
    _canany: ($) =>
      seq(
        alias('@canany', $.directive_start),
        $._if_statement_directive_body,
        alias('@endcanany', $.directive_end),
      ),
    // !Laravel Pennant
    _feature: ($) =>
      seq(
        alias('@feature', $.directive_start),
        $._if_statement_directive_body,
        alias('@endfeature', $.directive_end),
      ),

    // !Custom if Statements
    _custom: ($) =>
      seq(
        choice(
          alias(/@unless[a-zA-Z\d]+/, $.directive_start),
          alias(token(prec(-1, /@[a-zA-Z\d]+/)), $.directive_start),
        ),
        $._if_statement_directive_body,
        alias(token(prec(1, /@end[a-zA-Z\d]+/)), $.directive_end),
      ),

    // !switch
    switch: ($) =>
      seq(
        alias('@switch', $.directive_start),
        $._directive_parameter,
        repeat($._case),
        optional(
          seq(alias('@default', $.directive), repeat($._definition)),
        ),
        alias('@endswitch', $.directive_end),
      ),
    _case: ($) =>
      seq(
        alias('@case', $.directive),
        $._directive_body_with_parameter,
        alias('@break', $.directive),
      ),

    // !Loops
    loop: ($) => choice($._for, $._foreach, $._forelse, $._while),
    loop_operator: ($) =>
      choice(
        seq(
          alias(/@(continue|break)/, $.directive),
          optional($._directive_parameter),
        ),
        seq(alias('@empty', $.directive)),
      ),

    _for: ($) =>
      seq(
        alias('@for', $.directive_start),
        $._directive_body_with_parameter,
        alias('@endfor', $.directive_end),
      ),

    _foreach: ($) =>
      seq(
        alias('@foreach', $.directive_start),
        $._directive_body_with_parameter,
        alias('@endforeach', $.directive_end),
      ),

    _forelse: ($) =>
      seq(
        alias('@forelse', $.directive_start),
        $._directive_body_with_parameter,
        alias('@endforelse', $.directive_end),
      ),

    _while: ($) =>
      seq(
        alias('@while', $.directive_start),
        $._directive_body_with_parameter,
        alias('@endwhile', $.directive_end),
      ),

    // !envoy
    envoy: ($) => choice($._task, $._story),

    _setup: ($) =>
      seq(
        alias('@setup', $.directive_start),
        optional($.php_only),
        alias('@endsetup', $.directive_end),
      ),

    _task: ($) =>
      seq(
        alias('@task', $.directive_start),
        $._directive_body_with_parameter,
        alias('@endtask', $.directive_end),
      ),

    _story: ($) =>
      seq(
        alias('@story', $.directive_start),
        $._directive_body_with_parameter,
        alias('@endstory', $.directive_end),
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
        alias('@before', $.directive_start),
        optional(repeat(choice($._notification, $.php_only))),
        alias('@endbefore', $.directive_end),
      ),
    _after: ($) =>
      seq(
        alias('@after', $.directive_start),
        optional(repeat(choice($._notification, $.php_only))),
        alias('@endafter', $.directive_end),
      ),
    _envoy_error: ($) =>
      seq(
        alias('@error', $.directive_start),
        optional(repeat(choice($._notification, $.php_only))),
        alias('@enderror', $.directive_end),
      ),
    _success: ($) =>
      seq(
        alias('@success', $.directive_start),
        optional(repeat(choice($._notification, $.php_only))),
        alias('@endsuccess', $.directive_end),
      ),
    _finished: ($) =>
      seq(
        alias('@finished', $.directive_start),
        optional(repeat(choice($._notification, $.php_only))),
        alias('@endfinished', $.directive_end),
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
    livewire: ($) => choice($._persist, $._teleport, $._volt),
    _persist: ($) =>
      seq(
        alias('@persist', $.directive_start),
        $._directive_body_with_parameter,
        alias('@endpersist', $.directive_end),
      ),
    _teleport: ($) =>
      seq(
        alias('@teleport', $.directive_start),
        $._directive_body_with_parameter,
        alias('@endteleport', $.directive_end),
      ),
    _volt: ($) =>
      seq(
        alias('@volt', $.directive_start),
        $._directive_body_with_parameter,
        alias('@endvolt', $.directive_end),
      ),

    /* ------------------------------------
        /  Do NOT change below this line   /
        /  without running tests           /
        /  This is the engine              /
        /-----------------------------------*/

    // !normal directive body
    _directive_body: ($) => repeat1($._definition),
    _directive_body_with_parameter: ($) =>
      seq($._directive_parameter, optional($._directive_body)),
    _directive_body_with_optional_parameter: ($) =>
      seq(
        optional($._directive_parameter),
        optional($._directive_body),
      ),
    // !if statements body
    _if_statement_directive_body: ($) =>
      seq(
        $._directive_parameter,
        optional(
          repeat(choice($._definition, $.conditional_keyword)),
        ),
      ),
    _if_statement_directive_body_with_optional_parameter: ($) =>
      seq(
        optional($._directive_parameter),
        repeat1(choice($._definition, $.conditional_keyword)),
      ),
    _if_statement_directive_body_with_no_parameter: ($) =>
      repeat1(choice($._definition, $.conditional_keyword)),

    // !parenthesis balancing
    parameter: ($) => choice(/[^()]+/, $._text_with_parenthesis),
    _text_with_parenthesis: ($) =>
      seq(/[^()]+/, '(', repeat($.parameter), ')'),
    // !directive parameter
    _directive_parameter: ($) =>
      seq(
        alias(token(prec(1, '(')), $.bracket_start),
        optional(repeat($.parameter)),
        alias(token(prec(1, ')')), $.bracket_end),
      ),
    // !section parameters
    _section_parameter: ($) =>
      seq(optional(/[\"\']/), $.text, optional(/[\"\']/)),

    // !text definitions
    php_only: ($) => prec.right(repeat1($._text)),
    text: ($) => prec.right(repeat1($._text)),
    // hidden to reduce AST noise in php_only #39
    // It is selectively unhidden for other areas
    _text: ($) =>
      choice(
        token(prec(-1, /@[a-zA-Z\d]*[^\(-]/)), // custom directive conflict resolution
        token(prec(-2, /[{}!@()?,-]/)), // orphan tags
        token(
          prec(
            -1,
            /[^\s(){!}@-]([^(){!}@,?]*[^{!}()@?,-])?/, // general text
          ),
        ),
      ),
  },
});
