# Changelog

## 2.0.0 - 2026-11-12

### Changed: Tally now opens in dark mode

The counter now uses dark mode by default. Before, it showed light unless your system asked for dark. If your device has no colour-scheme preference, Tally now opens dark. If your system is set to light mode, you still get a light version.

The colours are new in both modes. The old indigo is replaced by teal on a deep slate background, with an amber accent. Light mode uses the same colours on a pale teal background. The count, button labels and reset text meet a 4.5:1 contrast ratio in both modes, and the focus ring meets 3:1. The tap button is still the largest control and reset still looks secondary, so the layout works as before. Reduced-motion and wide-screen behaviour are unchanged.

### Breaking: theming properties have new names

If you restyle Tally by overriding its CSS custom properties, your overrides will stop applying. Every property now follows one naming pattern, `--tally-<group>-<name>`. The old unprefixed names are not kept as aliases. No property was removed, so each old name has exactly one replacement:

| Old name | New name |
| --- | --- |
| `--background`, `--primary`, `--ring`, … (all colour roles) | `--tally-color-background`, `--tally-color-primary`, `--tally-color-ring`, … |
| `--elevation-<step>` | `--tally-shadow-<step>` |
| `--font-<name>` | `--tally-font-<name>` |
| `--text-<step>` | `--tally-font-size-<step>` |
| `--leading-<step>` | `--tally-line-height-<step>` |
| `--spacing` / `--spacing-<n>` | `--tally-space-unit` / `--tally-space-<n>` |
| `--radius` / `--radius-<step>` | `--tally-radius-base` / `--tally-radius-<step>` |
| `--duration-<speed>` | `--tally-duration-<speed>` |
| `--ease-<kind>` | `--tally-ease-<kind>` |
| `--count-fluid` | `--tally-count-size-fluid` |
| `--control-min-touch` | `--tally-touch-target-min` |

The comment block at the top of `styles.css` has the full list, one line per property. The new **Theming** section in the README points to it. To update your overrides, rename each property using the table. Because the default is now dark, set your dark values at the top level and put light values inside a `prefers-color-scheme: light` query.

## 1.6.0 - 2026-11-12

## New

### Haptic feedback on every tap

Tally now gives a short vibration each time you tap **+** or **−**, so you can feel the count change without looking at the screen. This helps when you're counting people at a door, laps, reps, or anything else that keeps your eyes busy.

The pulse only plays on devices and browsers that support vibration, which is most Android phones. Where vibration isn't available, as with iOS Safari and desktop browsers, the counter works the same as before, with no errors or missing controls. There's nothing to set up: if your device can vibrate, you'll feel it.

## 1.5.0 - 2026-11-11

## New

### Recent counts under the counter

A **Recent counts** list now sits below the number and shows the last five counts you reached, newest first. If you mis-tap or lose your place, you can check what the count was a moment ago.

The list is empty when you open the page, so it looks the same as before until you start tapping.

## Good to know

The list lives only in the tab you're using. It isn't saved, so reloading the page clears it, even though your current count is still kept. When you confirm a reset, the list clears too; if you cancel the reset, nothing changes. If you have Tally open in more than one tab, each tab's list shows only the taps made in that tab, even when the current count syncs across tabs. A reset made in another tab doesn't clear this tab's list.

## 1.4.0 - 2026-11-11

## 1.3.1 - 2026-11-11

## 1.3.0 - 2026-11-10

## 1.2.0 - 2026-11-10

## 1.1.0 - 2026-11-10

## New

**Tally is live on GitHub Pages.** This first release is a single, styled web page: you tap the button and the count goes up by one. There's nothing to install and no account to create. Open the page in any modern browser and start counting.

**Your count is still there when you come back.** Tally saves the number in your browser, so reloading the page or closing and reopening it keeps your count. If you have Tally open in more than one tab, every tab shows the same number. Tap in one and the others update to match.

**Resetting asks before it clears.** You can set the count back to zero, but Tally asks you to confirm first. A stray tap won't wipe out a tally you've been building.

## Built for everyone

**Screen readers announce every change.** Each tap and each reset is read aloud, so you can track the count without looking at the screen.

**Counting works even when storage is blocked.** In private browsing, or anywhere else the browser won't let the page save data, Tally still counts normally. The only difference is that the number won't be kept after you leave the page.

## Changed

The count label now reads **"Taps:"**, and screen readers announce the same word. What you see on screen and what you hear from assistive technology now match.

## Improved

### Clearer search results and link previews

When Tally appears in search results or someone shares a link to it, the preview now shows a short, accurate description: _"Tally: a calm, minimal tap counter. Tap +1 to count; your count is saved on this device."_ That tells people what Tally does before they open it: tap to count, and the count stays on their device. The page carries exactly one description, so search engines and link-preview tools all pick up the same text.

Nothing changes once you open Tally. The counter, the buttons and the look are all the same, and any count you've already saved on your device is kept.
