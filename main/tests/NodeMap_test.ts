import NodeMap from "../NodeMap.ts";
import { assert, assertEquals, assertFalse } from "jsr:@std/assert";

const rule1: SymbolRule<string> = {
  type: "SYMBOL",
  name: "A",
};
const rule2: SymbolRule<string> = {
  type: "SYMBOL",
  name: "B",
};
const rule3: SymbolRule<string> = {
  type: "SYMBOL",
  name: "C",
};

Deno.test("NodeMap can successfully add grammar nodes", () => {
  const nodes = new NodeMap();
  nodes.add(rule1, rule2);
  assert(nodes.has(rule1));
  assert(nodes.has(rule2));
});

Deno.test("NodeMap can not have duplicates nodes in cache, and can gracefully handled", () => {
  const nodes = new NodeMap();
  nodes.add(rule1, rule1);
  assert(nodes.size() === 1);
});
Deno.test("New grammmar nodes can be added later on to the cache, and gracefully handled", () => {
  const nodes = new NodeMap();
  nodes.add(rule1);
  nodes.add(rule3);
  assert(nodes.has(rule3));
  assertFalse(nodes.has(rule2));
});

Deno.test("Can successfully return all cached grammar nodes", () => {
  const nodes = new NodeMap();
  nodes.add(rule1);
  nodes.add(rule2);
  nodes.add(rule3);

  assertEquals(
    [rule1, rule2, rule3],
    [...nodes.all()],
  );
});

Deno.test("Can return the nodes from the cache without a specific node", () => {
  const nodes = new NodeMap();
  nodes.add(rule1);
  nodes.add(rule2);
  nodes.add(rule3);

  const collection = new Set(nodes.without(rule2));
  assertFalse(collection.has(rule2));
});

Deno.test("After removal cache must stay immutable", () => {
  const nodes = new NodeMap();
  nodes.add(rule1);
  nodes.add(rule2);
  nodes.add(rule3);

  nodes.without(rule2);

  assertEquals(
    [rule1, rule2, rule3],
    [...nodes.all()],
  );
});

Deno.test("Can correctly merge a temp Node for a specific grammar", () => {
  const nodes = new NodeMap();
  nodes.add(rule1);
  nodes.add(rule2);

  const grammar = new Set(nodes.with(rule3).all());
  assert(grammar.has(rule1));
  assert(grammar.has(rule2));
  assert(grammar.has(rule3));
});

Deno.test("Can use with and without successfully", () => {
  const nodes = new NodeMap();
  nodes.add(rule1);
  nodes.add(rule2);

  const grammar = new Set(nodes.with(rule3).without(rule1));
  assertFalse(grammar.has(rule1));
  assert(grammar.has(rule2));
  assert(grammar.has(rule3));
});
