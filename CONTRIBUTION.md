# HELLO! 👋

Welcome to the contribution guide, and I hope you enjoyed the grammar.
Here you will find out how the grammar is organised and how you can contribute, so that it adheres to the grammar styles.

### Prerequisite:
- You need to know how to use the [tree-sitter cli](https://tree-sitter.github.io/tree-sitter/creating-parsers#tool-overview) for generating and testing
- Make sure you are familiar with this chapter from [tree-sitter](https://tree-sitter.github.io/tree-sitter/creating-parsers#writing-the-grammar) especially the functions.
- in depth knowledge is not necessary unless you are contributing to the core.

### General Overview:
The grammar is pretty over engineered, i.e there are lots of aliases and hidden rules. However I personally believe it is easy to read and follow. This was intentional so that it is future proof, extensible and maintainable. Thanks to this, there is a 98% chance that the future new directive rules can be added with **no more than 6 lines of code** for future directives! I will explain that below 😊

Everything is organised in the order they appear in `_definition`, and then subcategorised based on their similarities. such as being either `nested` or `inline`. The actual building blocks are all defined at the bottom of the document below the `directive body`. The `rules` are then made like a lego using the building blocks. As a result any changes below that line will likely be a breaking change so hopefully do not need to touch those definitions.

### How to add new directives
TBA