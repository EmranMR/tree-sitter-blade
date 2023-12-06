# Tree-Sitter-Blade 🌳

#### ⚠️ Please keep an eye on the _release-notes_ until v1.0.0 is out.⚠️

-   There might be minor breaking changes, once the
    [split-parser](https://github.com/EmranMR/tree-sitter-blade/issues/5)
    is released and tested.
-   This could possibly be due to change of **rule names**, which
    might in return affect your `injection.scm` or `highlights.scm`

> The grammar is up to date as of **_Laravel 10.x_**

## ⚠️ v0.9.0 Upgrade Guide ✨

-   There has been some structural refactor to make the grammar future
    proof, semantic and flexible as it grows with Laravel
-   Please read the `v0.9.0`
    [Release Note for the Upgrade Guide](https://github.com/EmranMR/tree-sitter-blade/releases/tag/v0.9.0),
    if you have any questions feel free to start a discussion or raise
    an issue
-   As soon as you change your `injections.scm` you are good to go ✅
    to enjoy all the new features ✨
-   I have also updated the instructions underneath 👇 for new and
    upcoming users

## Introduction (feel free to skip)

This project aims to write the tree-sitter grammar for
[Laravel Blade](https://laravel.com/docs/10.x/blade#main-content). It
is currently in beta, until I get some feedback from the community. So
far It has passed my own stress tests.

This is very useful for editors and services that are based on
tree-sitter. Such as, but not limited to:

-   **_Neovim_**
-   **_zed_**
-   **_Nova_** by panic
-   **_Github_**
-   **_Emacs_**

<img src="https://raw.githubusercontent.com/EmranMR/Laravel-Nova-Extension/main/Images/screenshot.png" width="60%" style="border-radius: 2%" alt="php injection" title="php injection" />

## Sponsorship ❤️

If you found this project helpful, I would really appreciate if you
can [sponsor](https://github.com/sponsors/EmranMR) me so that I could
keep maintaining and improving the grammar to include the entire
**Laravel Ecosystem** inlcluding **Livewire**, **AlpineJS**,
**Inertia** and so forth. Furthermore keeping the project up to date
with **future releases of Laravel**.

## Nova Users <img src="https://github.com/EmranMR/Laravel-Nova-Extension/blob/main/Laravel.novaextension/extension.png?raw=true" width="40px" style="position: relative; top: 10px;left: 10px" alt="alt text" title="image Title" />

Simply install the
[Laravel Suite Extension](https://extensions.panic.com/extensions/emran-mr/emran-mr.laravel/)
from the Extension Library. That includes:

1. injections including the `php injection` out of the box!
2. Autocompletion
3. Folding
4. Syntax Highlighting

## NeoVim Users

If you are NeoVim user and would like to give this parser a shot, I
would highly recommend checking out the
[step by step guide and tips](https://github.com/EmranMR/tree-sitter-blade/discussions/19#discussion-5400675)
by @yaegassy.

Once stable this repo will be hopefully get added to `nvim-treesitter`
allowing you to install via `:TSInstall` instead.

> I do not know how to do this myself, I would appreciate some help in
> that matter.

## How to inject languages:

When you parse your code there are three main important injection
points. There is an example in the `queries/injection.scm`. For ease
of use I have narrowed everything down to the following rules/queries:

### 1. html/php

-   This will inject `html/php` into your document

```scm
((text) @injection.content
   (#not-has-ancestor? @injection.content "envoy")
   (#set! injection.combined)
   (#set! injection.language php))
```

### 2. (php_only) 🚧

> This will be availble once the
> [split parser](https://github.com/tree-sitter/tree-sitter-php/pull/180)
> is merged into `tre-sitter-php`.The name might also change.

-   You inject `php_only` into `(php_only)` nodes. This is for all the
    php directives including `{{ x }}`, `{!! x !!}} ` and so forth

```scm
((php_only) @injection.content
   (#set! injection.language php_only))
```

### 3. optional: (parameter) 🚧

> This will be availble once the
> [split parser](https://github.com/tree-sitter/tree-sitter-php/pull/180)
> is merged into `tree-sitter-php`.The name might also change.

-   It will add a nice syntax highlighting for your parameters
-   This is also a php injection point. I initially had this aliased
    as `(php_only)`, however I decided to keep it separate.
-   This is for all the inline directives such as `@extends(x)`,
    `@yield(x)` and so forth
-   you inject `php_only` in `(parameter)` to get a nice syntax
    highlighting

```scm
((parameter) @injection.content
   (#set! injection.language php_only))
```

### 4. Envoy/Bash

-   This is used specifically for Laravel Envoy
-   Mainly to parse stuff inside `@task`
-   You will get a nice `shell` syntax highlighting and possibly
    completion when writing your envoys
-   For your hooks, `@before, @after ... ` you will get `php_only`
    injections provided by the code above, automatically.
    > You can use whatever you want, zsh etc Here is an an example
    > with `bash`

```scm
((text) @injection.content
   (#has-ancestor? @injection.content "envoy")
   (#set! injection.combined)
   (#set! injection.language bash))
```

<img src="https://github.com/EmranMR/Laravel-Nova-Extension/blob/main/Images/Envoy%20Injection.png?raw=true" width="60%" style="border-radius: 2%" alt="php injection" title="php injection" />

### 5. (javascript)

-   TBA
-   I would really appreciate if anyone experienced with **_inertia_**
    or any other `javascript` front-end raise an
    [issue](https://github.com/EmranMR/tree-sitter-blade/issues) and
    discuss the regions that are points of interest for injection.
-   I am more of a TALL (**_tailwind, alpinejs, laravel and
    livewire_**) person and I will add a first party AlpineJS support
    so that `javascript` is injected into your `AlpineJS` directives,
    such as `x-data` 😏

## How to Highlight:

This is what you need to use inside your `highlights.scm`. For ease of
use, I managed to boil everything down to the following tree-sitter
queries:

#### 1. (directives) `@theme_selector`

-   This is your keywords like `@csrf` or inline directives such as
    `@extends()`
-   By highlighting `(directive)` you are painting `@extends` in
    `@extends(x)` and the keywords

#### 2. (directive_start) `@theme_selector`

-   This is for multiline directives such as `@php x @endphp`
-   this will specifically target the `@php`

#### 3. (directive_end) `@theme_selector`

-   This is also for multiline directives such as `@php x @endphp`
-   However it will target the closing directive such as `@endphp`

#### 4. optional: (attribute (directive) `@theme_selector`)

-   You can use this to fine tune your highlight and grab the blade
    `attribute` directives to get highlighted as an `attribute`
-   This is optional, I understand some rather have blade highlighted
    as a framework tag

#### 5. (comment) `@theme_selector`

-   This is your comments `{{-- x --}}`
-   so you can add a capture for comment highlight to this query using
    `(comment)`

#### 6. optional: (bracket_start) `@theme_selector`

-   If you want to highlight your brackets such as `{{}}` use this to
    capture

#### 7. optional: (bracket_end) `@theme_selector`

-   If you want to highlight your brackets such as `{{}}` use this to
    capture

## Folding

The grammar is written in a way to support code folding. You write
them in `queries/folds.scm`.

As long as your editor supports `folds.scm` , you can easily write
predicates to implement foldings. This will allow you to clear up
clutter and focus on the feature you are working in hand.

You can have a look into `queries/folds.scm`, which has the excerpts
used to implement this feature in Nova.

The following is a list of `nodes` that you need to capture to
implement the folding

1. `(directive_start)` and `(directive_end)`
2. `(bracket_start)` and `(bracket_end)`

> ❗ Please note each **editor** uses it's own sets of
> predicates/variables so you need to look into their documentation.

```scm
; Example Query used in Nova to implement folding

(   (directive_start) @start
    (directive_end) @end.after
    (#set! role block))


(   (bracket_start) @start
    (bracket_end) @end
    (#set! role block))
```

<img src="https://raw.githubusercontent.com/EmranMR/Laravel-Nova-Extension/main/Images/folding.gif" width="60%" style="border-radius: 2%" alt="php injection" title="php injection" />

## Quick Note about `queries/` folder

This is for `tree-sitter cli`. Your editor or service might use
different **_capture group_** name or **_predicates_**.

Consequently you will need to find out how you could approach queries
or where they are stored and used by your editor by reading their
documentation. For example **_Nova_** does not use anything in this
folder and uses it's own `Queries` folder instead.

At the moment consider all the `.scm` files in that folder as stubs
based on the upcoming Nova extension I am developing. 🔴

## Issues

If something does not look right please raise an
[issue](https://github.com/EmranMR/tree-sitter-blade/issues) with
detailed examples of what you are trying to achieve.

-   code excerpts or screenshots would be appreciated

If you need help with anything else or would like to share tips and
tricks for fellow devs, feel free to use the
[discussion tab](https://github.com/EmranMR/tree-sitter-blade/discussions)

## Contribution

See the [contribution](/CONTRIBUTING.md) guidelines for more details,
as well as in depth info about the `grammar` itself.

## Next in Line

-   [x] Write the grammar
-   [x] Write the tests
-   [x] Support folding
-   [x] Support Livewire 🪼
-   [x] Laravel envoy
-   [ ] support AlpineJS
