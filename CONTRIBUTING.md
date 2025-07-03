# HELLO! 👋

Welcome to the contribution guide, and I hope you are enjoying the grammar. Here
you will find out how the grammar is organised and how you can contribute, so
that it adheres to the grammar styles.

### Prerequisite:

---

#### Dev Tooling

- Deno `^2.0`
- Node `^24.0`
- tree-sitter-cli `^0.24.4`

> You do **NOT** need to know `TypeScript`

#### tree-sitter knowledge

- You need to know how to use the
  [tree-sitter cli](https://tree-sitter.github.io/tree-sitter/creating-parsers#tool-overview)
  for generating and testing
- Make sure you are familiar with this chapter from
  [tree-sitter](https://tree-sitter.github.io/tree-sitter/creating-parsers#writing-the-grammar)
  especially the functions.
- In-depth knowledge is not necessary unless you are contributing to the core.

### General:

---

Unlike most othter `tree-sitter` grammars, where you write the grammar at
`grammar.js`, The grammar for tree-sitter-blade is written in `ts` and exists at
`main/grammar.ts`.

> This was a design decision to make maintenance and contributing easier, with
> full typing support, pointing out any errors before compilation. In addition
> this makes the grammar future proof, extensible moving forward.

The grammar itself is pretty abstracted with the help of `alias()` as well as
utilising hidden rules via `_` for better end user Dev Experience. This also
provides a very clean abstract syntax tree AST. As such it should be easy to
follow without any prior knowledge.

### How to set up

---

1. Clone this repo
2. run `deno install --allow-scripts=npm:tree-sitter-cli`
3. To check if your setup is working, simply run:
   - `deno run test-grammar`: This will run the Unit Test to ensure you have

> Make sure you have set up your `tree-sitter`'s `parser-directories` path
> correctly in your config file see
> [path](https://tree-sitter.github.io/tree-sitter/syntax-highlighting#paths)

#### Available Tasks/Scripts to help you during development

You can run `deno task` to see the tasks available. The main ones are as it
follows:

- `deno run start`
  - This will create a **_Playground_** where you can test the grammar **live**
    in your browser!
- `deno run build`
  - This will _bundle_ and _generate_ the grammar.
- `deno run test-grammar`
  - This will run the unit tests for you

### Overview of the Grammar Structure (`main/grammar.ts`)

---

You write your grammar at `main/grammar.ts`.

The grammar DSL is defined in the `exported` `grammar()` function. This function
inherits `html` DSL from `tree-sitter-html`. As such all the nodes defined in
the `tree-sitter-html` are also available in this function. You could modify or
override. `$.attribute` is a good example of this.

> The _external scanners_ are not automatically loaded. They were copied and

> pasted from tree-sitter-html and modified for this project

#### $.\_node:

inside `$._node` node, all the `html` and `blade` nodes are loaded to the
`NodeMap` data structure. This will override what is defined in the
`tree-sitter-html`. The `$._node` is then used in `$.document` defined by the
`tree-sitter-html`.

#### 1. $.keyword:

These are the stand-alone directives that can appear anywhere in the document,
with **_NO_** _parameters_ for example:

- `@csrf`

#### 2. $.php_statement

These are the directives or rules that need their content parsed as `php_only`

- `{{}}`
- `{!! !!}`
- ...

#### 3. $.attribute

Blade attributes, such as:

- `@class()`
- `@style()`
- ...

#### 4. $.\_inline_directive

These are the directives that **_take on_** parameters.

- `@yield()`
- `@extends()`
- ...
  > Names starting with `_` are hiddent when parsing. see
  > [tree-sitter](https://tree-sitter.github.io/tree-sitter/creating-parsers#writing-the-grammar)

#### 5. $.\_nested_directives

Directive that have _start_ and _end_ directive, with a _body_

- `@if() @endif`
- `@error @enderror`
- ...

#### 6. $.loop_operator

Very unlikely you would need to touch this, but these are loop operators that
can appear in any subtree.

- `@break`
- `@continue`
- ...

#### 7. $.\_text

This should not be used, instead you should opt for `$.text` or `$.php_only` if
needed

#### 9. $.text

This is a general use text node. In this grammar it can be used, alongside
predicates in the `injection.scm` to achieve interesting outcome. Such as
injecting normal `text`, `html` or even `shell`. This is also built on `$._text`

### Adding New Directives:

---

The first thing to do is to determine what category it belongs to. Look at the
`$._definition`, pick a rule group, and dig in, to get an idea.

As an example look below on how the `@if` directive is defined:

```mermaid
graph TD;
    A($.document)-->B($._nested_directive)-->C($.conditional)-->D[/Directives\];
    D---> E($._if);
    D--> G(...);

    E --> H($.directive_start) & I($._if_statement_body) & J($.directive_end)
```

#### A Note on the `NodeMap`

The entire Blade grammar is packaged into the `nodes` object, when defining the
`$._node` tree node. This allows you to pick and choose the nodes that you would
like to allow recursively be for a specific Blade structure. For example

##### Example:

- For example take a look at the `$.fragmant` node.
- Here, only `nodes` that are needed are repeated in the body of `fragment` that
  are _semantically_ correct via the `without()` method

##### Other `NodeMap` methods available:

###### `add()`

- This should be used preferably once, when defining `$._node`

###### `all()`

- Returns all the nodes that are cached via `add()`

###### `with()`

- Sometimes only a specific node based on a specific subNode, that you do not
  wish to cache, as it is not used elsewhere. As such you can define it as
  usual, and bundle it with the stuff you have cached via `with()`
- `$.loop` body is a good example of this

###### `without()`

- Returns all nodes, without the ones defined here from the cached nodes via
  `add()`

###### `has()`

- Used to check if a specific `node` exists in the cache

#### Defining a node:

If you are adding a new keyword and so forth, it is as easy as writing it to the
correct node.

On a _**very rare**_ occasion that you might need to create a brand new node,
please consider the following:

- Only use nodes that are needed from the `nodes` object. This will keep the
  grammar semantically correct.
- Be as specific as you can be. This will allow syntax highlighting, to
  _highlight_ the **users** that the syntax they used is incorrect.

### Test it:

---

Whenever you define a new rule, you need to test it in two ways:

1. Once you are satisfied with your definition, you can use the built in, super
   helpful tree-sitter playground to test your syntax. Just run the following
   command and you are good to go to test it in your browser

   ```bash
   deno run start
   ```

2. To ensure your rule is not breaking any other rules, just do the following to
   run the unit test:

   ```bash
   deno run test-grammar
   ```

If all green you are good to go 👍

Once happy with your result, write the appropriate unit `test` in
`test/corpus/`. You could either use any of the categories or make your own.

### Pull requests:

- Just follow the pull request template and ensure you have completed all
  necessary steps. 😊"
