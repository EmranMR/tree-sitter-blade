/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

export default class NodeSet {
  private nodes: Set<SymbolRule<string>>;
  private extraNodes: Set<SymbolRule<string>>;

  constructor() {
    this.nodes = new Set();
    this.extraNodes = new Set();
  }

  /**
   * The method used to collect and package entire grammar
   */
  add(...nodes: SymbolRule<string>[]) {
    if (this.nodes.size != 0) {
      console.error("This should be only ever be called collect node sets");
      return choice(...this.nodes);
    }

    nodes.forEach((node) => this.nodes.add(node));
    return choice(...this.nodes);
  }

  /**
   * returns all the cached nodes
   */
  all() {
    return this.extraNodes.size == 0
      ? repeat1(choice(...this.nodes))
      : repeat1(choice(...this.merged()));
  }

  /**
   * rule specific nodes to be used temporarily.
   */
  with(...nodes: SymbolRule<string>[]) {
    nodes.forEach((node) => this.extraNodes.add(node));
    return this;
  }

  /**
   * Only use the following nodes (no caching)
   */
  only(...nodes: SymbolRule<string>[]) {
    const temp = new Set<SymbolRule<string>>();
    nodes.forEach((node) => temp.add(node));

    return repeat1(
      choice(
        ...temp,
      ),
    );
  }

  /**
   * Return a new set without the specified nodes.
   */
  without(...nodes: SymbolRule<string>[]): Repeat1Rule {
    const temp = this.extraNodes.size == 0
      ? new Set(this.nodes)
      : this.merged();

    nodes.forEach((node) => temp.delete(node));
    return repeat1(choice(...temp));
  }

  /**
   * Return the merged set and clears the extraNodes.
   */
  private merged() {
    const temp = this.nodes.union(this.extraNodes);
    this.extraNodes.clear();
    return temp;
  }
}
