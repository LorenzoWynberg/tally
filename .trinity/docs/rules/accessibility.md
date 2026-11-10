# Accessibility

Shape: [Counter state](../tech-guide/app/counter-state.md)

The page targets WCAG 2.1 Level AA, enforced by `tests/shell.spec.js` with `@axe-core/playwright` against both the light and dark colour-scheme facets (`prefers-color-scheme`), since the design ships colour roles for each and both must pass on their own.

Alongside the axe sweep, the same test file measures contrast ratios directly against the rendered page: the count text and the tap button's label meet 4.5:1, and the count's own boundary and the tap and reset buttons' borders meet the 3:1 WCAG 1.4.11 non-text contrast minimum against the page background, in both facets.

The `#live-region` element (`aria-live="polite"`, `aria-atomic="true"`) announces a tap (`"Count: <n>"`) and a confirmed reset (`"Count reset to 0"`). It does not announce a count that changes only because another open tab synced it — see [cross-tab sync](../tech-guide/app/counter-state.md#cross-tab-sync) — since that would be chatter the person on this tab did not cause.
