import { BundleOptions } from "jsr:@trx/deno-bundle";
import { bundle } from "jsr:@trx/deno-bundle";

const options: BundleOptions = {
  entryPoint: "./lib/grammar.ts",
  outfile: "./grammar.js",
  type: "module",
  minify: true,
  sourceMap: false,
  check: false,
};

try {
  await bundle(options);
} catch {
  console.log("could not bundle, please raise an issue");
}
