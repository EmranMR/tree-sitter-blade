var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// tree-sitter-html/grammar.js
var require_grammar = __commonJS({
  "tree-sitter-html/grammar.js"(exports, module) {
    module.exports = grammar({
      name: "html",
      extras: ($) => [
        $.comment,
        /\s+/
      ],
      externals: ($) => [
        $._start_tag_name,
        $._script_start_tag_name,
        $._style_start_tag_name,
        $._end_tag_name,
        $.erroneous_end_tag_name,
        "/>",
        $._implicit_end_tag,
        $.raw_text,
        $.comment
      ],
      rules: {
        document: ($) => repeat($._node),
        doctype: ($) => seq(
          "<!",
          alias($._doctype, "doctype"),
          /[^>]+/,
          ">"
        ),
        _doctype: (_) => /[Dd][Oo][Cc][Tt][Yy][Pp][Ee]/,
        _node: ($) => choice(
          $.doctype,
          $.entity,
          $.text,
          $.element,
          $.script_element,
          $.style_element,
          $.erroneous_end_tag
        ),
        element: ($) => choice(
          seq(
            $.start_tag,
            repeat($._node),
            choice($.end_tag, $._implicit_end_tag)
          ),
          $.self_closing_tag
        ),
        script_element: ($) => seq(
          alias($.script_start_tag, $.start_tag),
          optional($.raw_text),
          $.end_tag
        ),
        style_element: ($) => seq(
          alias($.style_start_tag, $.start_tag),
          optional($.raw_text),
          $.end_tag
        ),
        start_tag: ($) => seq(
          "<",
          alias($._start_tag_name, $.tag_name),
          repeat($.attribute),
          ">"
        ),
        script_start_tag: ($) => seq(
          "<",
          alias($._script_start_tag_name, $.tag_name),
          repeat($.attribute),
          ">"
        ),
        style_start_tag: ($) => seq(
          "<",
          alias($._style_start_tag_name, $.tag_name),
          repeat($.attribute),
          ">"
        ),
        self_closing_tag: ($) => seq(
          "<",
          alias($._start_tag_name, $.tag_name),
          repeat($.attribute),
          "/>"
        ),
        end_tag: ($) => seq(
          "</",
          alias($._end_tag_name, $.tag_name),
          ">"
        ),
        erroneous_end_tag: ($) => seq(
          "</",
          $.erroneous_end_tag_name,
          ">"
        ),
        attribute: ($) => seq(
          $.attribute_name,
          optional(seq(
            "=",
            choice(
              $.attribute_value,
              $.quoted_attribute_value
            )
          ))
        ),
        attribute_name: (_) => /[^<>"'/=\s]+/,
        attribute_value: (_) => /[^<>"'=\s]+/,
        // An entity can be named, numeric (decimal), or numeric (hexacecimal). The
        // longest entity name is 29 characters long, and the HTML spec says that
        // no more will ever be added.
        entity: (_) => /&(#([xX][0-9a-fA-F]{1,6}|[0-9]{1,5})|[A-Za-z]{1,30});?/,
        quoted_attribute_value: ($) => choice(
          seq("'", optional(alias(/[^']+/, $.attribute_value)), "'"),
          seq('"', optional(alias(/[^"]+/, $.attribute_value)), '"')
        ),
        text: (_) => /[^<>&\s]([^<>&]*[^<>&\s])?/
      }
    });
  }
});

// main/NodeMap.ts
var NodeMap = class {
  cachedNodes;
  extraNodes;
  constructor() {
    this.cachedNodes = /* @__PURE__ */ new Map();
    this.extraNodes = /* @__PURE__ */ new Set();
  }
  /**
   * The method used to collect, cache and return the entire grammar
   * new nodes needing cached can be added at a later point
   */
  add(...nodes2) {
    if (this.size() != 0) {
      nodes2.forEach((node) => {
        if (!this.has(node)) {
          this.set(node);
        }
      });
      return this.cachedNodes.values();
    }
    nodes2.forEach((node) => this.set(node));
    return this.cachedNodes.values();
  }
  /**
   * Map the node to the cache
   */
  set(node) {
    this.cachedNodes.set(node.name, node);
  }
  /**
   * returns all the cached nodes, including the extra nodes specified
   */
  all() {
    return this.extraNodes.size == 0 ? this.cachedNodes.values() : this.mergedWith(...this.cachedNodes.values());
  }
  /**
   * rule specific nodes to be used temporarily.
   */
  with(...nodes2) {
    nodes2.forEach((node) => this.extraNodes.add(node));
    return this;
  }
  /**
   * Checks if a node already exists
   */
  has(node) {
    return this.cachedNodes.has(node.name);
  }
  /**
   * Return cached nodes without the specified nodes.
   *
   * If extra nodes are provided, it will be merged and returned as well
   */
  without(...nodes2) {
    const temp = new Map(this.cachedNodes);
    nodes2.forEach((node) => temp.delete(node.name));
    return this.extraNodes.size == 0 ? temp.values() : this.mergedWith(...temp.values());
  }
  /**
   * returns the size of the Data Structure
   */
  size() {
    return this.cachedNodes.size;
  }
  /**
   * Return the merged node set and clears the extraNodes.
   */
  mergedWith(...nodes2) {
    const temp = new Set(this.extraNodes);
    this.extraNodes.clear();
    return temp.union(new Set(nodes2));
  }
};

// main/grammar.ts
var import_grammar = __toESM(require_grammar());
var nodes = new NodeMap();
var grammar_default = grammar(import_grammar.default, {
  name: "blade",
  rules: {
    // The entire grammar
    _node: ($) => choice(
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
        $.conditional
      )
    ),
    // ------------------
    // https://stackoverflow.com/questions/13014947/regex-to-match-a-c-style-multiline-comment/36328890#36328890
    comment: (_) => token(seq("{{--", /[^-]*-+([^}-][^-]*-+)*/, "}}")),
    // !keywords
    keyword: ($) => alias(
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
        "@wireUiScripts"
      ),
      $.directive
    ),
    // ! PHP Statements
    php_statement: ($) => choice($._escaped, $._unescaped, $._setup, $._raw, $._php),
    // From tree-sitter-php
    _php: ($) => seq(
      $.php_tag,
      optional(alias($.text, $.php_only)),
      $.php_end_tag
    ),
    php_tag: (_) => /<\?([pP][hH][pP]|=)?/,
    php_end_tag: (_) => "?>",
    // --------------------
    _escaped: ($) => seq(
      "{{",
      optional(alias($.text, $.php_only)),
      "}}"
    ),
    _unescaped: ($) => seq(
      "{!!",
      optional(alias($.text, $.php_only)),
      "!!}"
    ),
    // ! raw php
    _raw: ($) => choice($._inline_raw, $._multi_line_raw),
    _inline_raw: ($) => seq(alias("@php", $.directive), $._directive_parameter),
    _multi_line_raw: ($) => seq(
      alias("@php", $.directive_start),
      optional(alias($.text, $.php_only)),
      alias("@endphp", $.directive_end)
    ),
    // tree-sitter-html override
    attribute: ($) => choice(
      $._blade_attribute,
      $._html_attribute,
      $.php_statement
    ),
    attribute_name: (_) => token(prec(-1, /[^<>"'/=\s]+/)),
    attribute_value: (_) => token(prec(-1, /[^<>"'/=\s]+/)),
    quoted_attribute_value: ($) => choice(
      seq(
        "'",
        optional(
          repeat(
            choice(
              $.php_statement,
              $.conditional,
              $._inline_directive,
              $.comment,
              alias($._singly_quoted_attribute_text, $.attribute_value)
            )
          )
        ),
        "'"
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
              alias($._doubly_quoted_attribute_text, $.attribute_value)
            )
          )
        ),
        '"'
      )
    ),
    // utilised from tree-sitter-html
    _html_attribute: ($) => seq(
      $.attribute_name,
      optional(
        seq(
          "=",
          choice($.attribute_value, $.quoted_attribute_value)
        )
      )
    ),
    // ! Conditional Blade Attribute Directives
    _blade_attribute: ($) => seq(
      alias(
        choice(
          "@class",
          "@style",
          "@checked",
          "@selected",
          "@disabled",
          "@readonly",
          "@required"
        ),
        $.directive
      ),
      $._directive_parameter
    ),
    // !inline directives
    _inline_directive: ($) => seq(
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
          "@wireUiScripts"
        ),
        $.directive
      ),
      $._directive_parameter
    ),
    // !nested directives
    fragment: ($) => seq(
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
              $.once
            )
          )
        )
      ),
      alias("@endfragment", $.directive_end)
    ),
    // ! section
    section: ($) => choice(
      seq(
        alias("@section", $.directive),
        "(",
        alias(/[^,()]+/, $.parameter),
        ",",
        alias(/[^,()]+/, $.parameter),
        ")"
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
                $.fragment
              )
            )
          )
        ),
        alias(/@(endsection|show)/, $.directive_end)
      )
    ),
    once: ($) => seq(
      alias("@once", $.directive_start),
      optional(
        repeat1(
          choice(...nodes.without($.doctype, $.envoy, $.section))
        )
      ),
      alias("@endonce", $.directive_end)
    ),
    verbatim: ($) => seq(
      alias("@verbatim", $.directive_start),
      optional(
        repeat1(
          choice(...nodes.without($.doctype, $.livewire, $.envoy))
        )
      ),
      alias("@endverbatim", $.directive_end)
    ),
    stack: ($) => choice(
      $._push,
      $._pushOnce,
      $._pushIf,
      $._prepend,
      $._prependOnce
    ),
    _push: ($) => seq(
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
              $.verbatim
            )
          )
        )
      ),
      alias("@endpush", $.directive_end)
    ),
    _pushOnce: ($) => seq(
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
              $.verbatim
            )
          )
        )
      ),
      alias("@endPushOnce", $.directive_end)
    ),
    _pushIf: ($) => seq(
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
              $.verbatim
            )
          )
        )
      ),
      alias("@endPushIf", $.directive_end)
    ),
    _prepend: ($) => seq(
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
              $.verbatim
            )
          )
        )
      ),
      alias("@endprepend", $.directive_end)
    ),
    _prependOnce: ($) => seq(
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
              $.verbatim
            )
          )
        )
      ),
      alias("@endPrependOnce", $.directive_end)
    ),
    // !Conditionals
    conditional: ($) => choice(
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
      $._authorization,
      $._feature,
      $._custom
    ),
    // used in the conditional body rules
    conditional_keyword: ($) => choice(
      alias("@else", $.directive),
      seq(
        alias(/@(elseif|else[a-zA-Z]+)/, $.directive),
        $._directive_parameter
      )
    ),
    _if: ($) => seq(
      alias("@if", $.directive_start),
      $._conditional_directive_body,
      alias("@endif", $.directive_end)
    ),
    _unless: ($) => seq(
      alias("@unless", $.directive_start),
      $._conditional_directive_body,
      alias("@endunless", $.directive_end)
    ),
    _isset: ($) => seq(
      alias("@isset", $.directive_start),
      $._conditional_directive_body,
      alias("@endisset", $.directive_end)
    ),
    _empty: ($) => seq(
      alias("@empty", $.directive_start),
      $._conditional_directive_body,
      alias("@endempty", $.directive_end)
    ),
    _auth: ($) => seq(
      alias("@auth", $.directive_start),
      $._conditional_body_with_optional_parameter,
      alias("@endauth", $.directive_end)
    ),
    _guest: ($) => seq(
      alias("@guest", $.directive_start),
      $._conditional_body_with_optional_parameter,
      alias("@endguest", $.directive_end)
    ),
    _production: ($) => seq(
      alias("@production", $.directive_start),
      optional($._conditonal_body),
      alias("@endproduction", $.directive_end)
    ),
    _env: ($) => seq(
      alias("@env", $.directive_start),
      $._conditional_directive_body,
      alias("@endenv", $.directive_end)
    ),
    _hasSection: ($) => seq(
      alias("@hasSection", $.directive_start),
      $._conditional_directive_body,
      alias("@endif", $.directive_end)
    ),
    _sectionMissing: ($) => seq(
      alias("@sectionMissing", $.directive_start),
      $._conditional_directive_body,
      alias("@endif", $.directive_end)
    ),
    _error: ($) => seq(
      alias("@error", $.directive_start),
      $._conditional_directive_body,
      alias("@enderror", $.directive_end)
    ),
    // !Authorisation Directives
    _authorization: ($) => choice($._can, $._canany, $._cannot),
    _can: ($) => seq(
      alias("@can", $.directive_start),
      $._conditional_directive_body,
      alias("@endcan", $.directive_end)
    ),
    _cannot: ($) => seq(
      alias("@cannot", $.directive_start),
      $._conditional_directive_body,
      alias("@endcannot", $.directive_end)
    ),
    _canany: ($) => seq(
      alias("@canany", $.directive_start),
      $._conditional_directive_body,
      alias("@endcanany", $.directive_end)
    ),
    // !Laravel Pennant
    _feature: ($) => seq(
      alias("@feature", $.directive_start),
      $._conditional_directive_body,
      alias("@endfeature", $.directive_end)
    ),
    // !Custom if Statements
    _custom: ($) => seq(
      choice(
        alias(/@unless[a-zA-Z\d]+/, $.directive_start),
        alias(token(prec(-1, /@[a-zA-Z\d]+/)), $.directive_start)
      ),
      $._conditional_directive_body,
      alias(token(prec(1, /@end[a-zA-Z\d]+/)), $.directive_end)
    ),
    // !switch
    switch: ($) => seq(
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
                $.switch
              )
            )
          )
        )
      ),
      alias("@endswitch", $.directive_end)
    ),
    _case: ($) => seq(
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
              $.switch
            )
          )
        )
      ),
      optional(alias("@break", $.directive))
    ),
    // !Loops
    loop: ($) => choice($._for, $._foreach, $._forelse, $._while),
    _loop_operator: ($) => choice(
      seq(
        alias(/@(continue|break)/, $.directive),
        optional($._directive_parameter)
      ),
      alias("@empty", $.directive)
    ),
    _for: ($) => seq(
      alias("@for", $.directive_start),
      $._loop_directive_body,
      alias("@endfor", $.directive_end)
    ),
    _foreach: ($) => seq(
      alias("@foreach", $.directive_start),
      $._loop_directive_body,
      alias("@endforeach", $.directive_end)
    ),
    _forelse: ($) => seq(
      alias("@forelse", $.directive_start),
      $._loop_directive_body,
      alias("@endforelse", $.directive_end)
    ),
    _while: ($) => seq(
      alias("@while", $.directive_start),
      $._loop_directive_body,
      alias("@endwhile", $.directive_end)
    ),
    // !envoy
    envoy: ($) => choice($._task, $._story, $._hooks),
    _setup: ($) => seq(
      alias("@setup", $.directive_start),
      optional(alias($.text, $.php_only)),
      alias("@endsetup", $.directive_end)
    ),
    _task: ($) => seq(
      alias("@task", $.directive_start),
      $._envoy_directive_body,
      alias("@endtask", $.directive_end)
    ),
    _story: ($) => seq(
      alias("@story", $.directive_start),
      $._envoy_directive_body,
      alias("@endstory", $.directive_end)
    ),
    _hooks: ($) => choice(
      $._before,
      $._after,
      $._envoy_error,
      $._success,
      $._finished
    ),
    _before: ($) => seq(
      alias("@before", $.directive_start),
      optional(repeat($._notification)),
      alias("@endbefore", $.directive_end)
    ),
    _after: ($) => seq(
      alias("@after", $.directive_start),
      optional(repeat($._notification)),
      alias("@endafter", $.directive_end)
    ),
    _envoy_error: ($) => seq(
      alias("@error", $.directive_start),
      optional(repeat($._notification)),
      alias("@enderror", $.directive_end)
    ),
    _success: ($) => seq(
      alias("@success", $.directive_start),
      optional(repeat($._notification)),
      alias("@endsuccess", $.directive_end)
    ),
    _finished: ($) => seq(
      alias("@finished", $.directive_start),
      optional(repeat($._notification)),
      alias("@endfinished", $.directive_end)
    ),
    // !envoy:notification
    _notification: ($) => seq(
      alias(
        /@(slack|discord|telegram|microsoftTeams)/,
        $.directive
      ),
      $._directive_parameter
    ),
    // !livewire 🪼
    livewire: ($) => choice($._persist, $._teleport, $._volt, $._script, $._assets),
    _persist: ($) => seq(
      alias("@persist", $.directive_start),
      $._directive_parameter,
      repeat1(
        choice(
          $.entity,
          $.text,
          $.element,
          $.php_statement,
          $.conditional
        )
      ),
      alias("@endpersist", $.directive_end)
    ),
    _teleport: ($) => seq(
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
            $.stack
          )
        )
      ),
      alias("@endteleport", $.directive_end)
    ),
    _volt: ($) => seq(
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
            $.stack
          )
        )
      ),
      alias("@endvolt", $.directive_end)
    ),
    _script: ($) => seq(
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
            $.stack
          )
        )
      )),
      alias("@endscript", $.directive_end)
    ),
    _assets: ($) => seq(
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
            $.stack
          )
        )
      )),
      alias("@endassets", $.directive_end)
    ),
    /*-----------------------------------*
    /  Do NOT change below this line
    /  without running tests
    /  This is the engine
    /*----------------------------------*/
    // !conditional helpers
    _conditonal_body: ($) => repeat1(choice(...nodes.with($.conditional_keyword).all())),
    _conditional_directive_body: ($) => seq($._directive_parameter, optional($._conditonal_body)),
    _conditional_body_with_optional_parameter: ($) => seq(optional($._directive_parameter), $._conditonal_body),
    // ! envoy helpers
    _envoy_if: ($) => seq(
      alias("@if", $.directive_start),
      $._directive_parameter,
      choice($.conditional_keyword, $._envoy_body),
      alias("@endif", $.directive_end)
    ),
    _envoy_body: ($) => repeat1(choice($.text, $._envoy_if, $._escaped)),
    _envoy_directive_body: ($) => seq($._directive_parameter, optional($._envoy_body)),
    // !loop helpers
    _loop_body: ($) => repeat1(
      choice(
        ...nodes.with($._loop_operator).without(
          $.doctype,
          $.envoy,
          $.livewire,
          $.section,
          $.fragment,
          $.once,
          $.verbatim,
          $.stack
        )
      )
    ),
    _loop_directive_body: ($) => seq($._directive_parameter, optional($._loop_body)),
    // !directive parameter
    _directive_parameter: ($) => seq(
      "(",
      optional(repeat($.parameter)),
      ")"
    ),
    // !parenthesis balancing - for functions/casts
    parameter: ($) => choice(/[^()]+/, $._nested_parenthases),
    _nested_parenthases: ($) => seq("(", repeat($.parameter), ")"),
    text: ($) => prec.right(repeat1($._text)),
    // hidden to reduce AST noise in php_only #39
    // It is selectively unhidden for other areas
    // Create alternative text rep for php_only
    _text: (_) => (
      // custom directive conflict resolution
      choice(
        token(prec(-1, /@[a-zA-Z\d]*[^\(-]/)),
        // orphan tags
        token(prec(-2, /[{}!@()?,-]/)),
        token(
          prec(
            -1,
            /[^\s(){!}@-]([^<>(){!}@,?]*[^<>{!}()@?,-])?/
            // general text
          )
        )
      )
    ),
    _singly_quoted_attribute_text: (_) => prec.right(
      repeat1(
        choice(
          token(prec(-2, /[{}]/)),
          token(prec(-1, /[^'{}]/))
        )
      )
    ),
    _doubly_quoted_attribute_text: (_) => prec.right(
      repeat1(
        choice(
          token(prec(-2, /[{}]/)),
          token(prec(-1, /[^"{}]/))
        )
      )
    )
  }
});
export {
  grammar_default as default
};
/**
 * @file HTML grammar for tree-sitter
 * @author Max Brunsfeld <maxbrunsfeld@gmail.com>
 * @author Amaan Qureshi <amaanq12@gmail.com>
 * @license MIT
 */
/**
 * @file Blade grammar for tree-sitter
 * @author Emran Mashhadi Ramezan <2t5ukanu@duck.com>
 * @license MIT
 */
