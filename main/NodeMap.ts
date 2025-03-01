/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

export default class NodeMap {
  private nodes: Map<string, SymbolRule<string>>;
  private extraNodes: Set<SymbolRule<string>>;

  constructor() {
    this.nodes = new Map();
    this.extraNodes = new Set();
  }

  /**
   * The method used to collect, cache and return the entire grammar
   */
  add(...nodes: SymbolRule<string>[]) {
    if (this.nodes.size != 0) {
      console.error("This should be only ever be called collect node sets");
      return repeat(choice(...this.nodes.values()));
    }

    nodes.forEach((node) => this.nodes.set(node.name, node));
    return repeat(choice(...this.nodes.values()));
  }

  /**
   * returns all the cached nodes
   */
  all() {
    return this.extraNodes.size == 0
      ? repeat1(choice(...this.nodes.values()))
      : repeat1(choice(...this.mergedWith(...this.nodes.values())));
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
    return repeat1(
      choice(
        ...nodes,
      ),
    );
  }

  /**
   * Return cached nodes without the specified nodes.
   */
  without(...nodes: SymbolRule<string>[]): Repeat1Rule {
    const temp = new Map(this.nodes);

    nodes.forEach((node) => temp.delete(node.name));
    return repeat1(choice(...temp.values()));
  }

  /**
   * Return the merged node set and clears the extraNodes.
   */
  private mergedWith(...nodes: SymbolRule<string>[]) {
    const temp = new Set(this.extraNodes);
    this.extraNodes.clear();
    return temp.union(new Set(nodes));
  }
}
