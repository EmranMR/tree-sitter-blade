/// <reference types="node" />
const assert = require("node:assert");
const { describe, it } = require("node:test");

const Parser = require("tree-sitter");
const blade = require("../..");

describe("grammar", () => {
  const parser = new Parser();
  parser.setLanguage(blade);

  it("should be named blade", () => {
    assert.strictEqual(parser.getLanguage().name, "blade");
  });

  it("should parse source code", () => {
    const sourceCode = "@php echo 'Hello, World!'; @endphp";
    const tree = parser.parse(sourceCode);
    assert(!tree.rootNode.hasError);
  });
});
