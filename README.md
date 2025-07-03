# Tree-Sitter-Blade 🌳

---

### ⚠️v0.12.0 Upgrade Guide ✨

- The grammar has been pretty much rewritten from the ground up.
  _tree-sitter-blade_ now inherits `html` and takes control of the `html` tree
  structure as well
- The grammar is way more semantic, leaner and much faster, like lightening fast
  (10x) thanks to the drastically improved performance
- Please read the `v0.12.0`
  [Release Note for the Upgrade Guide](https://github.com/EmranMR/tree-sitter-blade/releases/tag/v0.12.0),
  if you have any questions, feel free to start a discussion or raise an issue

## Introduction (feel free to skip)

This project aims to write the tree-sitter grammar for
[Laravel Blade](https://laravel.com/docs/10.x/blade#main-content).

This grammar can be used in any editor or service that support
[Tree-Sitter](https://github.com/tree-sitter/tree-sitter). Such as, but not
limited to:

- **_Neovim_**
- **_Zed_**
- **_Nova_**
- **_Emacs_**

<img src="https://raw.githubusercontent.com/EmranMR/Laravel-Nova-Extension/main/Images/screenshot.png" width="60%" style="border-radius: 2%" alt="php injection" title="php injection" />

## Common Editors Set Up 💻

### <img src="https://github.com/EmranMR/Laravel-Nova-Extension/blob/main/Laravel.novaextension/extension.png?raw=true" width="35px" style="position: relative; right:5px; bottom:-10px " alt="alt text" title="image Title" />Nova

Simply install the
[Laravel Suite Extension](https://extensions.panic.com/extensions/emran-mr/emran-mr.laravel/)
from the Extension Library. That includes:

1. Language Injections
2. Autocompletion
3. Folding
4. Syntax Highlighting
5. Auto Indentation

### <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Neovim-mark.svg/500px-Neovim-mark.svg.png" height="35px" style="position: relative; right:5px; bottom:-10px " alt="alt text" title="image Title" />NeoVim

<!-- The link to neovim package -->

### <img src="https://upload.wikimedia.org/wikipedia/commons/1/16/Zed_Editor_Logo.png" width="35px" style="position: relative; right:5px; bottom:-10px " alt="alt text" title="image Title" />NeoVim

Simply
[download the extension](https://github.com/bajrangCoder/zed-laravel-blade) from
zed Extension marketplace

### <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/EmacsIcon.svg/2880px-EmacsIcon.svg.png" width="35px" style="position: relative; right:5px; bottom:-10px " alt="alt text" title="image Title" />NeoVim

> Not ported yet? TBA feel free to pull request

## Queries

> Your editor or service might use a different **_capture group_** name or
> **_predicates_** than the stubs in the `queries/` folder. Consequently, you
> will need to find out how to approach queries or where they are stored and
> used in your editor's documentation. For example **_Nova_** does not use
> anything in this folder and uses its own `Queries` folder instead.

### Injections:

You could have a look at the `queries/injection.scm` for inspiration, but here
are some detailed information about the nodes:

#### 1. `(php_only)`

- You inject `php` into `(php_only)` nodes. This is for all the php directives
  including `{{ x }}`, `{!! x !!}}` and so forth

```scm
((php_only) @injection.content
   (#set! injection.language php_only))
```

#### 2. javascript

- Have a look at the `injections.scm` for inspiration. You can go as wild as you
  want depending on your project to inject `javascript` via the correct query

```scm
;; example

; AlpineJS attributes
(attribute
  (attribute_name) @_attr
    (#lua-match? @_attr "^x%-%l")
  (quoted_attribute_value
    (attribute_value) @injection.content)
  (#set! injection.language "javascript"))

; Blade escaped JS attributes
; <x-foo ::bar="baz" />
(element
  (_
    (tag_name) @_tag
      (#lua-match? @_tag "^x%-%l")
  (attribute
    (attribute_name) @_attr
      (#lua-match? @_attr "^::%l")
    (quoted_attribute_value
      (attribute_value) @injection.content)
    (#set! injection.language "javascript"))))

; Blade PHP attributes
; <x-foo :bar="$baz" />
(element
  (_
    (tag_name) @_tag
      (#lua-match? @_tag "^x%-%l")
    (attribute
      (attribute_name) @_attr
        (#lua-match? @_attr "^:%l")
      (quoted_attribute_value
        (attribute_value) @injection.content)
      (#set! injection.language "php_only"))))
```

#### 3. optional: `(parameter)`

- This will add a nice syntax highlighting for your parameters, depending on
  what you inject.

```scm
((parameter) @injection.content
   (#set! injection.language php_only))
```

#### 4. Envoy/Bash (optional)

- This is used specifically for Laravel Envoy
- Mainly to parse the stuff inside the `@task`
- You will get a nice `shell` syntax highlighting and possibly completion when
  writing your envoys

```scm
((text) @injection.content
   (#has-ancestor? @injection.content "envoy")
   (#set! injection.combined)
   (#set! injection.language bash))
```

<img src="https://github.com/EmranMR/Laravel-Nova-Extension/blob/main/Images/Envoy%20Injection.png?raw=true" width="60%" style="border-radius: 2%" alt="php injection" title="php injection" />

### Highlighting:

> ❗ Please note each **editor** uses it's own sets of predicates/variables so
> you need to look into their documentation.

Feel free to look at the `queries/highlights.scm` to get some ideas.

### Folding

> ❗ Please note each **editor** uses it's own sets of predicates/variables so
> you need to look into their documentation.

The grammar is written in a way to support code folding. You write them in the
`queries/folds.scm`.

As long as your editor supports `folds.scm` , you can easily write predicates to
implement foldings. This will allow you to clear up clutter and focus on the
feature you are working in hand.

You can have a look at `queries/folds.scm`, which has the excerpts used to
implement this feature in Nova.

( (bracket_start) @start (bracket_end) @end (#set! role block)) The following is
a list of `nodes` that you need to capture to implement the folding

1. `(directive_start)` and `(directive_end)`
2. `(bracket_start)` and `(bracket_end)`

```scm
; Example Query used in Nova to implement folding

(   (directive_start) @start
    (directive_end) @end.after
    (#set! role block))


(   (bracket_start) @start // redundant
    (bracket_end) @end
    (#set! role block))
```

<img src="https://raw.githubusercontent.com/EmranMR/Laravel-Nova-Extension/main/Images/folding.gif" width="60%" style="border-radius: 2%" alt="php injection" title="php injection" />

## Issues

If something does not look right please raise an
[issue](https://github.com/EmranMR/tree-sitter-blade/issues) with a detailed
examples of what you are trying to achieve. Add any of the following if
necessary:

- Code Excerpts (allows me to test)
- Photo of the issue
- Parse Tree (if inspectable by your editor)

If you need help with anything else or would like to share tips and tricks for
your fellow devs, feel free to use the
[discussion tab](https://github.com/EmranMR/tree-sitter-blade/discussions) and
create a discussion!

## 👥 Contribution

See the [contribution](/CONTRIBUTING.md) guidelines for more details, as well as
in depth info about the `grammar` itself.

## Contributors

> Don't forget to add yourself when you commit!

- [@EmranMR](https://github.com/EmranMR)
- [@CalebDW](https://github.com/calebdw)

## Anyone said coffee? ☕

<a href="https://www.buymeacoffee.com/bw8dwqpbd2w" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>
