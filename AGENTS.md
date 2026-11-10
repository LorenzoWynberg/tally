<!-- TRINITY-MANAGED-START -->

## Documentation

`tally` is a repo of the tally project, and its root is a package (Tally). Trinity generates this section from the project packages and rewrites it whenever they change, so write your own notes outside it.

Its documentation starts at [`.trinity/docs/index.md`](.trinity/docs/index.md), which links every page in the `.trinity/docs/` families:

- `rules/<topic>.md`: the rules every change in the package follows
- `gotchas/<tech>.md`: one page per technology in the package stack
- `tech-guide/<section>/<chapter>.md`: how the code works
- `user-guide/<section>/<chapter>.md`: what a person sees and does

<!-- TRINITY-MANAGED-END -->

## Package notes

- Design: [`DESIGN.md`](DESIGN.md) is the source of the design system's tokens; `styles.css` holds the theme layer written from it, and components read its roles and scales only.
- Stack: `package.json` and `package-lock.json` are the record of the stack (dev-only tooling; the shipped page has no runtime dependencies and no build step).
