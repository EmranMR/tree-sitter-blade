# Tree-Sitter-Blade 🌳
#### ⚠️ Please keep an eye on the *release-notes* until v1.0.0 is out.⚠️

- There might be minor breaking changes, once the [split-parser](https://github.com/EmranMR/tree-sitter-blade/issues/5) is released and tested.
- This could possibly be due to change of **rule names**, which might in return affect your `injection.scm` or `highlights.scm`

> The grammar is up to date as of **_Laravel 10.x_**
## Introduction (feel free to skip)

This project aims to write the tree-sitter grammar for [Laravel Blade](https://laravel.com/docs/10.x/blade#main-content). It is currently in beta,
until I get some feedback from the community. So far It has passed my own stress tests.

This is very useful for editors and services that are based on tree-sitter. Such as, but not limited to:
- ***Neovim***
- ***zed***
- ***Nova*** by panic
- ***Github***

## Sponsorship ❤️
If you found this project helpful, I would really appreciate if you can [sponsor](https://github.com/sponsors/EmranMR) me so that I could keep maintaining and improving the grammar to include the entire **Laravel Ecosystem** inlcluding **Livewire**, **AlpineJS**,  **Inertia** and so forth. Furthermore keeping the project up to date with **future releases of Laravel**.

## NeoVim Users
If you are NeoVim user and would like to give this parser a shot, I would highly recommend checking out the [step by step guide and tips](https://github.com/EmranMR/tree-sitter-blade/discussions/19#discussion-5400675) by @yaegassy. 
Once stable the repo will be hopefully added to nvim-treesitter allowing to install via `:TSInstall` instead.

## How to inject languages:

When you parse your code there are three main important injection
points. There is an example in the `queries/injection.scm`. For ease
of use I have narrowed everything down to the following rules/queries:

#### 1. (php) 
- This will inject `html/php` into your document  
- You need to inject `php` in the `(php)` nodes
-   make sure it is `(#set! injection.combined)`
```
((php) @injection.content
    (#set! injection.combined)
    (#set! injection.language php))
```

#### 2. (php_only) 🚧
> This will be availble once the [split parser](https://github.com/tree-sitter/tree-sitter-php/pull/180) is merged into `tre-sitter-php`.The name might also change.
-   You inject `php_only` into `(php_only)` nodes. This is for all the php
    directives including `{{ x }}`, `{!! x !!}} ` and so forth
-   Optional: `(#set! injection.combined)` but considering laravel
    will render the different `php_only` points like having multiple
    `<?php code ?>` The codes should have the same scope. In Nova you
    also get extra autocompletion which are built-in.

#### 3. (parameter) 🚧
> This will be availble once the [split parser](https://github.com/tree-sitter/tree-sitter-php/pull/180) is merged into `tre-sitter-php`.The name might also change.
-   optional: It will add a nice syntax highlighting for your parameters
-   This is also a php injection point. I initially had this aliased
    as `(php-only)` however decided to keep it separate.
-   This is for all the inline directives such as `@extends(x)`,
    `@yield(x)` and so forth
-   you inject `php_only` in `(parameter)` to get a nice syntax
    highlighting
-   Do ***NOT*** add `(#set! injection.combined)`
    -   Because they are _parameter_.
    -   This is just for syntax highlighting and getting nice `php` IDE autocompletion if needed.

#### 4. (javascript)

-   TBA
-   I would really appreciate if anyone experienced with **_inertia_**
    or any other `javascript` front-end raise an
    [issue](https://github.com/EmranMR/tree-sitter-blade/issues) and
    discuss the regions that are points of interest for injection.
-   I am more of a TALL (**_tailwind, alpinejs, laravel and
    livewire_**) person and I will add alpineJS support shortly so
    that `javascript` is injected into your `alpineJS` directives,
    such as `x-data` 😏

## How to Highlight:

For ease of use, I managed to boil everything down to the following
tree-sitter queries:

#### 1. (directives)

-   This is your keywords like `@csrf` or inline directives such as
    `@extends()`
-   By highlighting `(directive)` you are painting `@extends` in
    `@extends(x)` and the keywords

#### 2. (directive_start)

-   This is for multiline directives such as `@php x @endphp`
-   this will specifically target the `@php`

#### 3. (directive_end)

-   This is also for multiline directives such as `@php x @endphp`
-   However it will target the closing directive such as `@endphp`

#### 4. (comment)

-   This is your comments `{{-- x --}}`
-   so you can add a capture for comment highlight to this query using
    `(comment)`

## Folding

The grammar is written in a way so that you can easily add folding
functionality. All you have to do is to mark the regions between
`(directive_start)` and `(directive_end)`

You will need to first find out what capture groups your editor uses. I will add an example in `folds.scm` for your information once I write one for Nova.

## Quick Note about `queries/` folder

This is for `tree-sitter cli`. Your editor or service might use different ***capture group*** name or ***predicates***.

Consequently you will need to find out in their documentation how you could approach queries or where they are stored and used by your editor. For example ***Nova*** does not use anything in this folder and uses it's own `Queries` folder instead.

At the moment consider all the `.scm` files in that folder as stubs based on the upcoming Nova extension I am developing. 🔴

## Issues
If something does not look right please raise an
[issue](https://github.com/EmranMR/tree-sitter-blade/issues) with
detailed examples of what you are trying to achieve.

- code excerpts or screenshots would be appreciated 

If you need help with anything else, feel free to use the [discussion tab](https://github.com/EmranMR/tree-sitter-blade/discussions)

## Contribution

See the [contribution](/CONTRIBUTION.md) guidelines for more details,
as well as in depth info about the `grammar` itself. 

## Todos

-   [x] Write the grammar
-   [x] Write the tests
-   [ ] Support Livewire 🪼
-   [ ] support AlpineJS
-   [ ] support for Javascript injection points (examples needed from
        the users please raise an
        [issue](https://github.com/EmranMR/tree-sitter-blade/issues))
-   [ ] Write the queries (examples needed example needed from the
        users, please raise an
        [issue](https://github.com/EmranMR/tree-sitter-blade/issues))

<!-- ## For Nova Contributors & Issues

Head over to this repo:

-   [blade extension for Nova](https://github.com/EmranMR/nova-blade)

You need to compile the parser to `.dylib` and then copy it in the
`Syntax/` folder of the extension.

You can download the build script here:
[**Parser Build Script**](https://docs.nova.app/syntax-reference/build_script.zip)

Please refer to the README file in that repo for more information
about contributing and using the build script. -->
