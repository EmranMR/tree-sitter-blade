# Tree-Sitter-Blade

This project aims to write the tree-sitter grammar for Laravel Blade
since there is none available at the moment. I am hoping to get some
help from the kind people of the open source community to accomplish
this and fine tuning the nitty gritties as this is my very first time
writing any language grammar let alone a tree-sitter one! 🙏

I am using Nova editor by Panic 🤘, but I believe the grammars should
be universal for all editors including **NeoVim** or **Zed** (RIP
_Atom_ 🪦). However I am not sure how it can be ported to those
editors, but I assume it should be a fairly easy task once the grammar
is done.

## Quick note

I have left some folders intentionally empty for time being. For
example as I understand some editors may use `queries/` folder as it
is but some like Nova have their own `Query/` folder with specific
`.scm` structuring. But feel free to pull request and write `.scm` for
that folder.

## For Nova Contributors

Headover to this repo:

-   [blade extension for Nova](https://github.com/EmranMR/nova-blade)

You need to compile the parser to `.dylib` and then copy it in the
`Syntax/` folder of the extension.

You can download the build script here:
[**Parser Build Script**](https://docs.nova.app/syntax-reference/build_script.zip)

Please refer to the README file in that repo for more information
about contributing and using the build script.

## Todos

-   [ ] Write the grammar
-   [ ] Write the tests
-   [ ] Support Livewire 🪼
-   [ ] Write queries?
