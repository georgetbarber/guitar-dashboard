# Phase 2A-5 fonts — 18 September 2026

Finding B16: the interface specified DM Sans and Instrument Serif, but the app shipped neither. On a device without those fonts, body text and headings silently fell back to system fonts, so the intended layout and typography varied by device.

The app now bundles the regular Latin variable weight of DM Sans and the regular Latin face of Instrument Serif as WOFF2 assets. They are loaded from this app's origin with `font-display: swap`; system sans and serif fallbacks remain for loading and glyphs outside these Latin files. Both packages are pinned at 5.3.0 and licensed under SIL Open Font License 1.1. Copies of their complete notices ship at `apps/current/public/fonts/DM-Sans-OFL.txt` and `apps/current/public/fonts/Instrument-Serif-OFL.txt`.

The production build emits exactly two WOFF2 files, 36,932 and 21,032 bytes. The service worker precaches both fonts and both notices. Its precache grew from 14 entries / 1,024.41 KiB to 18 entries / 1,090.17 KiB, a 65.76 KiB increase. This is the known cost of making typography deterministic offline; broader guest-loading and cache-size work remains a separate Phase 2 package.

Verification: the production build passed; 247 unit/interface tests passed; 60 desktop and phone browser checks passed. The new browser check confirms that both faces load, are applied to body and heading text, come from the app's origin, and do not cause horizontal overflow at 320px. The existing phone-layout journey now waits for fonts before measuring Continue, Course map, Strengthen, Play, Create and Explore at 320px, 390px and a short 640px viewport. The generated `dist/sw.js` was inspected and contains both font URLs and both licence URLs.

This is verified locally in Chromium emulation, not on a real phone or through a fresh installed PWA. No push or deployment was performed in this package. The separate restyling work and its uncommitted implementation-log edit were left untouched.
