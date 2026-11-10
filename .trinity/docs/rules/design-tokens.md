# Design tokens

Shape: [App structure](../tech-guide/app/structure.md)

`DESIGN.md` is the source of every colour, length, shadow, and timing value the page uses. `styles.css` defines them as CSS custom properties on `:root` (colour roles, elevation shadows, typography scale, spacing scale, radii, and motion durations/easings), with a `@media (prefers-color-scheme: dark)` block overriding the colour-role and elevation variables for the dark facet.

Every rule in `styles.css` below the `:root` blocks reads a role or a scale step (`var(--primary)`, `var(--spacing-8)`, `var(--radius-2xl)`, …) and never writes a literal colour, length, shadow, or timing value directly. Changing a design value means changing the token in `:root` (or its dark override), not the rule that uses it.
