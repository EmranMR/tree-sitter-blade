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

<img src="https://raw.githubusercontent.com/EmranMR/Laravel-Nova-Extension/main/Images/screenshot.png" width="60%" style="border-radius: 2%" alt="php injection" title="php injection" />

## Common Editors Set Up 💻

### <img src="https://github.com/EmranMR/Laravel-Nova-Extension/blob/main/Laravel.novaextension/extension.png?raw=true" width="35px" style="position: relative; right:5px; bottom:-10px " alt="alt text" title="image Title" /> Nova

Simply install the
[Laravel Suite Extension](https://extensions.panic.com/extensions/emran-mr/emran-mr.laravel/)
from the Extension Library. That includes:

1. Language Injections
2. Autocompletion
3. Folding
4. Syntax Highlighting
5. Auto Indentation

### <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Neovim-mark.svg/500px-Neovim-mark.svg.png" height="35px" style="position: relative; right:5px; bottom:-10px " alt="alt text" title="image Title" /> NeoVim

Simply use the [nvim-treesitter](https://github.com/nvim-treesitter/nvim-treesitter) plugin and install the `blade` grammar.

### <img src="https://upload.wikimedia.org/wikipedia/commons/1/16/Zed_Editor_Logo.png" width="35px" style="position: relative; right:5px; bottom:-10px " alt="alt text" title="image Title" /> Zed

Simply
[download the extension](https://github.com/bajrangCoder/zed-laravel-blade) from
zed Extension marketplace

## Queries

> [!NOTE]
> Your editor or service might use a different **_capture group_** name or
> **_predicates_** than the queries in the `queries/` folder. Consequently, you
> will need to find out how to approach queries or where they are stored and
> used in your editor's documentation. For example **_Nova_** does not use
> anything in this folder and uses its own `Queries` folder instead.

Here's an example of all the various languages that are injected:

<img src="https://github.com/EmranMR/Laravel-Nova-Extension/blob/main/Images/Envoy%20Injection.png?raw=true" width="60%" style="border-radius: 2%" alt="php injection" title="php injection" />

And here's an example of folding in action:

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
- [@calebdw](https://github.com/calebdw)

## Anyone said coffee? ☕

<a href="https://www.buymeacoffee.com/bw8dwqpbd2w" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>
