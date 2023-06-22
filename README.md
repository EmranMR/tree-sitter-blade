# Tree-Sitter-Blade

## Introduction (feel free to skip)
This project aims to write the tree-sitter grammar for Laravel Blade
since there is none available at the moment. It is currently in beta, until I get some feedback from the community, so far It has passed my own stress tests. The grammar is up to date as of ***Laravel 10.x***

I am using Nova editor by Panic 🤘 and also working on an all in one Laravel extension for Nova in parallel hence the need for the tree-sitter-blade grammar.
That project is not yet public due to Nova's php injection shortcomings. I will post updates as soon as the problem is fixed by Panic.

However I decided to release this project in advance considering that a lot of amazing new editors are now tree-sitter based, and there is a demand for the blade support

As a result this should be universal suitable for all editors including **NeoVim**, and hopefully in the future **Zed** (RIP
_Atom_ 🪦).

I would be more than happy to collaborate with people experienced with any of those editors so that they can port this grammar to their editor of choice. So please raise an [issue](https://github.com/EmranMR/tree-sitter-blade/issues) with detailed examples of what you are trying to achieve.

If you found this project helpful, I would really appreciate if you could sponsor me so that I could keep maintaining and improving the grammar to include the entire Laravel eco-system 🤗

## How to inject languages:
When you parse your code there are three main important injection points. There is an example in the `queries/injection.scm`. For ease of use I have narrowed everything down to the following rules/queries:
#### 1. (html)
- You need to inject html in the `(html)` nodes
- make sure it is `(#set! injection.combined)`
#### 2. (php)
- You inject php into `(php)` nodes. This is for all the php directives including `{{ x }}`, `{!! x !!}} ` and so forth
- Optional: `(#set! injection.combined)` but considering laravel will render the different `php` points like havin multiple `<?php code ?>` The codes should have the same scope. In Nova you also get extra autocompletion which are built-in.

### 3. (parameter)
- This is also a php injection point. I initially had this aliased as `(php)` however decided to keep it separate.
- This is for all the inline directives such as `@extends(x)`, `@yield(x)` and so forth
- you inject `php` in `(parameter)` to get a nice syntax highlighting
- Do *NOT* add `(#set! injection.combined)`
- Because they are *parameter*. this is just for syntax highlighting and getting nice `php` autocompletion if needed.

### 4. (javascript)
- TBA
- I would really appreciate if anyone experienced with ***inertia*** and `javascript` front end raise an issue how and whereabouts their code they need `javascript` inserted
- I am more of a TALL (***tailwind, alpinejs, laravel and livewire***) person and I will add alpineJS support so that `javascript` is injected into your `alpineJS` directives, such as `x-data` 😏

## How to Highlight:
For ease of use, I managed to boil everything down to the following tree-sitter queries:
#### 1. (directives)
- This is your keywords like `@csrf` or inline directives such as `@extends()`
- By highlighting `(directive)` you are painting `@extends` in `@extends(x)` and the keywords
#### 2. (directive_start)
- This is for multiline directives such as `@php x @endphp`
- this will specifically target the `@php`

#### 3. (directive_end)
- This is also for multiline directives such as `@php x @endphp`
- However it will target the closing directive such as `@endphp`
#### 4. (comment)
- This is your comments `{{-- x --}}`
- so you can add a capture for comment highlight to this query using `(comment)`

## Quick Note about queries folder

I have left some folders intentionally empty for time being. For
example as I understand some editors may use `queries/` folder as it
is but some like Nova have their own `Query/` folder with specific
`.scm` structuring. But feel free to pull request and write `.scm` for
that folder. I hoping to fill `queries/` for this project with the help of anyone experienced with NeoVim.

## Contribution
See the contribution guidelines for more details, as well as in depth info about the `grammar` itself




## Todos

-   [x] Write the grammar
-   [ ] Support Livewire 🪼
-   [ ] Write the tests
-   [ ] support for Javascript injection points (examples needed)
-   [ ] Write the queries (examples needed)


<!-- ## For Nova Contributors & Issues

Head over to this repo:

-   [blade extension for Nova](https://github.com/EmranMR/nova-blade)

You need to compile the parser to `.dylib` and then copy it in the
`Syntax/` folder of the extension.

You can download the build script here:
[**Parser Build Script**](https://docs.nova.app/syntax-reference/build_script.zip)

Please refer to the README file in that repo for more information
about contributing and using the build script. -->

