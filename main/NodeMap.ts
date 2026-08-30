/// <reference types="tree-sitter-cli/dsl" />

/**
 * Defines whether a conditional directive accepts a parameter.
 *
 * - `required` — The directive must have a parameter.
 * - `optional` — The directive may have a parameter.
 * - `none` — The directive does not accept a parameter.
 */
type ConditionalParam = "required" | "optional" | "none";

/**
 * Single source of truth for paired conditional directives.
 *
 * `param` controls whether `$._directive_parameter` is required, optional, or
 * disallowed (e.g. `@auth` accepts an optional argument; `@production` accepts
 * none). Each entry produces strictly paired start/end directives so that a
 * missing `@end…` is reported as an error rather than swallowed.
 *
 * @property start The opening Blade directive, e.g. `@auth`.
 * @property end The closing Blade directive, e.g. `@endauth`.
 * @property param Whether the directive parameter is required, optional, or disallowed.
 */
export type ConditionalSpec = {
  start: string;
  end: string;
  param: ConditionalParam;
};

export default class NodeMap {
  private cachedNodes: Map<string, SymbolRule<string>>;
  private extraNodes: Set<SymbolRule<string>>;
  private conditionalSpec: ConditionalSpec[];

  /**
   * Creates a NodeMap with the supplied conditional directive definitions.
   *
   * @param conditionalSpec The hard-coded Blade conditional directive
   * definitions used to generate paired conditional grammar rules.
   */
  constructor(conditionalSpec: ConditionalSpec[]) {
    this.cachedNodes = new Map();
    this.extraNodes = new Set();
    this.conditionalSpec = conditionalSpec;
  }

  /**
   * Adds grammar nodes to the cache and returns all cached nodes.
   *
   * Nodes are stored by their name. If the cache already contains nodes,
   * only nodes that are not already cached are added.
   *
   * @param nodes Grammar nodes to add to the cache.
   * @returns An iterator over all cached grammar nodes.
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
   * Adds a grammar node to the cache using its name as the cache key.
   *
   * @param node The grammar node to cache.
   */
  private set(node: SymbolRule<string>) {
    this.cachedNodes.set(node.name, node);
  }

  /**
   * Returns all cached grammar nodes.
   *
   * If temporary nodes have been added with {@link with}, they are merged with
   * the cached nodes and the temporary nodes are cleared after the merge.
   *
   * @returns An iterable containing the cached nodes and any temporary nodes.
   */
  all() {
    return this.extraNodes.size == 0
      ? this.cachedNodes.values()
      : this.mergedWith(...this.cachedNodes.values());
  }

  /**
   * Adds grammar nodes as temporary nodes for the next merged node set.
   *
   * Temporary nodes are not added to the cache. They are included when
   * {@link all} or {@link without} performs a merge, after which the temporary
   * nodes are cleared.
   *
   * @param nodes Grammar nodes to use temporarily.
   * @returns This NodeMap instance.
   */
  with(...nodes: SymbolRule<string>[]) {
    nodes.forEach((node) => this.extraNodes.add(node));
    return this;
  }

  /**
   * Checks whether a grammar node with the same name is already cached.
   *
   * @param node The grammar node whose name should be checked.
   * @returns `true` if a node with the same name is cached; otherwise `false`.
   */
  has(node: SymbolRule<string>) {
    return this.cachedNodes.has(node.name);
  }

  /**
   * Returns the cached grammar nodes without the specified nodes.
   *
   * Nodes are removed by name rather than by object identity. If temporary
   * nodes have been added with {@link with}, they are merged into the result
   * and then cleared.
   *
   * @param nodes Grammar nodes to exclude from the cached node set.
   * @returns An iterable containing the remaining cached nodes and any
   * temporary nodes.
   */
  without(...nodes: SymbolRule<string>[]) {
    const temp = new Map(this.cachedNodes);

    nodes.forEach((node) => temp.delete(node.name));

    return this.extraNodes.size == 0
      ? temp.values()
      : this.mergedWith(...temp.values());
  }

  /**
   * Returns the number of cached grammar nodes.
   *
   * Temporary nodes added with {@link with} are not included in the count.
   *
   * @returns The number of cached nodes.
   */
  size() {
    return this.cachedNodes.size;
  }

  /**
   * Generates the conditional grammar rules for a specific body rule.
   *
   * Each configured conditional in {@link conditionalSpec} is converted into
   * a paired start/end rule using the supplied body.
   *
   * @param $ Grammar symbols used to construct the conditional rules.
   * @param body The grammar rule allowed as the body of each conditional.
   * @returns An array of conditional grammar rules.
   */
  getConditionalsUsing(
    $: GrammarSymbols<string>,
    body: SymbolRule<string>,
  ): Rule[] {
    return this.conditionalSpec.map(
      (spec) => this.buildConditional($, spec, body),
    );
  }

  /**
   * Builds a paired conditional grammar rule from a conditional specification.
   *
   * The generated rule aliases the configured opening and closing directives
   * as `directive_start` and `directive_end`. The directive parameter is then
   * included according to the specification:
   *
   * - `required` — requires `$._directive_parameter`.
   * - `optional` — optionally accepts `$._directive_parameter`.
   * - `none` — does not accept a directive parameter.
   *
   * The conditional body is optional in all cases.
   *
   * @param $ Grammar symbols used to construct the conditional rule.
   * @param spec The conditional directive specification.
   * @param body The grammar rule allowed inside the conditional.
   * @returns A grammar rule representing the paired conditional.
   */
  private buildConditional(
    $: GrammarSymbols<string>,
    spec: ConditionalSpec,
    body: SymbolRule<string>,
  ): Rule {
    const start = alias(spec.start, $.directive_start);
    const end = alias(spec.end, $.directive_end);
    if (spec.param === "none") {
      return seq(start, optional(body), end);
    }
    if (spec.param === "optional") {
      return seq(start, optional($._directive_parameter), optional(body), end);
    }
    return seq(start, $._directive_parameter, optional(body), end);
  }

  /**
   * Merges the temporary nodes with the supplied node set.
   *
   * The temporary nodes are included in the returned set and are cleared from
   * the NodeMap after the merge.
   *
   * @param nodes The cached nodes to merge with the temporary nodes.
   * @returns A set containing the supplied nodes and temporary nodes.
   */
  private mergedWith(...nodes: SymbolRule<string>[]) {
    const temp = new Set(this.extraNodes);
    this.extraNodes.clear();
    return temp.union(new Set(nodes));
  }
}
