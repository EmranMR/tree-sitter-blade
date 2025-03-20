export default class NodeMap {
  private cachedNodes: Map<string, SymbolRule<string>>;
  private extraNodes: Set<SymbolRule<string>>;

  constructor() {
    this.cachedNodes = new Map();
    this.extraNodes = new Set();
  }

  /**
   * The method used to collect, cache and return the entire grammar
   * new nodes needing cached can be added at a later point
   */
  add(...nodes: SymbolRule<string>[]) {
    if (this.size() != 0) {
      nodes.forEach((node) => {
        if (!this.has(node)) {
          this.set(node);
        }
      });
      return this.cachedNodes.values();
    }

    nodes.forEach((node) => this.set(node));
    return this.cachedNodes.values();
  }

  /**
   * Map the node to the cache
   */
  private set(node: SymbolRule<string>) {
    this.cachedNodes.set(node.name, node);
  }

  /**
   * returns all the cached nodes, including the extra nodes specified
   */
  all() {
    return this.extraNodes.size == 0
      ? this.cachedNodes.values()
      : this.mergedWith(...this.cachedNodes.values());
  }

  /**
   * rule specific nodes to be used temporarily.
   */
  with(...nodes: SymbolRule<string>[]) {
    nodes.forEach((node) => this.extraNodes.add(node));
    return this;
  }

  /**
   * Checks if a node already exists
   */
  has(node: SymbolRule<string>) {
    return this.cachedNodes.has(node.name);
  }

  /**
   * Return cached nodes without the specified nodes.
   *
   * If extra nodes are provided, it will be merged and returned as well
   */
  without(...nodes: SymbolRule<string>[]) {
    const temp = new Map(this.cachedNodes);

    nodes.forEach((node) => temp.delete(node.name));

    return this.extraNodes.size == 0
      ? temp.values()
      : this.mergedWith(...temp.values());
  }

  /**
   * returns the size of the Data Structure
   */
  size() {
    return this.cachedNodes.size;
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
