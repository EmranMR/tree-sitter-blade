import { assertEquals } from "@std/assert";

// Directives only matched through patterns in the grammar, e.g. /@(continue|break)/
const PATTERN_DIRECTIVES = [
  "break",
  "continue",
  "discord",
  "microsoftTeams",
  "show",
  "slack",
  "telegram",
];

// Names the scanner excludes by prefix, so they don't need to be listed
const isExcludedByPrefix = (name: string) =>
  name.startsWith("end") || name.startsWith("else");

const collectDirectives = (rule: unknown, directives: Set<string>) => {
  if (Array.isArray(rule)) {
    rule.forEach((r) => collectDirectives(r, directives));
  } else if (rule && typeof rule === "object") {
    const { type, value } = rule as { type?: string; value?: unknown };
    if (
      type === "STRING" && typeof value === "string" && /^@[a-zA-Z\d]+$/.test(value)
    ) {
      directives.add(value.slice(1));
    }
    Object.values(rule).forEach((r) => collectDirectives(r, directives));
  }
};

Deno.test("Scanner BUILTIN_DIRECTIVES contains every directive of the grammar", async () => {
  const grammar = JSON.parse(
    await Deno.readTextFile(new URL("../../src/grammar.json", import.meta.url)),
  );
  const scanner = await Deno.readTextFile(
    new URL("../../src/scanner.c", import.meta.url),
  );

  const directives = new Set(PATTERN_DIRECTIVES);
  collectDirectives(grammar.rules, directives);
  const expected = [...directives].filter((d) => !isExcludedByPrefix(d)).sort();

  const list = scanner.match(/BUILTIN_DIRECTIVES\[\] = \{([^}]*)\}/);
  const actual = [...(list?.[1] ?? "").matchAll(/"([^"]+)"/g)]
    .map((m) => m[1])
    .sort();

  assertEquals(actual, expected);
});
