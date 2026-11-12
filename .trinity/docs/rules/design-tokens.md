# Design tokens

Shape: [App structure](../tech-guide/app/structure.md)

`DESIGN.md` is the source of every colour, length, shadow, and timing value the page uses. `styles.css` defines them as CSS custom properties on `:root` (colour roles, elevation shadows, typography scale, spacing scale, radii, and motion durations/easings), with dark as the default (top-level `:root`) and a `@media (prefers-color-scheme: light)` block overriding the colour-role and elevation variables for the light facet. Every property is named `--tally-<group>-<name>`; `styles.css` lists the old→new mapping.

Every rule in `styles.css` below the `:root` blocks reads a role or a scale step (`var(--tally-color-primary)`, `var(--tally-space-8)`, `var(--tally-radius-2xl)`, …) and never writes a literal colour, length, shadow, or timing value directly. Changing a design value means changing the token in `:root` (or its light override), not the rule that uses it.
