# Changelog

## 1.4.2 - 2026-11-11

## Improved

### A clearer Reset button for screen reader users

Screen readers and other assistive technologies now announce the Reset button as **"Reset count to zero"** instead of just "Reset", so you know what the button does before you press it. The button still shows the word "Reset" on screen. The spoken name starts with that same word, so voice-control users can still press it by saying "Reset".

The button works the same way as before: pressing it still sets the count back to zero.

## 1.4.1 - 2026-11-11

## Improved

### The date under the title is now machine-readable

The date shown under the tally page's title is now marked up as a proper date, carrying the exact calendar date alongside the text you see. Screen readers and other assistive tools can now read it as a real date without having to work it out from the display text. Scripts and automated checks can read the date the same way, with no guessing about format.

The machine-readable date always matches the date on screen, because both come from your device's local date, not a server or UTC clock. If you open the page near midnight, both show the same day, so neither one jumps ahead or lags behind.

The page looks and works the same as before. Nothing changes in how you count, and you don't need to do anything.

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
