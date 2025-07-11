# Checklist

- [ ] `deno check main/` to make sure the source code is fine
- [ ] `deno lint main/` to utilise the linter. You could also do
      `deno lint --fix main/` to automatically fix
- [ ] `deno run generate` ensure you include everything in the `src/*` - [ ] All
      tests pass in CI
- [ ] There are enough tests for the new fix/feature
- [ ] Grammar rules have not been renamed unless absolutely necessary (x rules
      renamed)
- [ ] The conflicts section hasn't grown too much (x new conflicts)
- [ ] The parser size hasn't grown too much (master: STATE_COUNT, PR:
      STATE_COUNT) >Check the value of STATE_COUNT in src/parser.c it should be
      roughly ~5k
