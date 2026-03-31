# Web Host Pro Workspace Guidelines

## Project Scope
- This repository is a static landing site (no build tooling, no package manager).
- Main entry point is [index.html](../index.html).
- Keep changes simple and browser-compatible (plain HTML, CSS, and vanilla JS).

## Architecture
- Single-page structure with in-page section anchors in [index.html](../index.html) (for example `#hero`, `#services`, `#contact`).
- Styling is split by concern:
  - Base and component styling: [assets/css/style.css](../assets/css/style.css)
  - Breakpoints and layout adaptation: [assets/css/responsive.css](../assets/css/responsive.css)
  - Motion and effects: [assets/css/animations.css](../assets/css/animations.css)
- Client behavior and i18n are centralized in [assets/js/main.js](../assets/js/main.js).
- [sections/](../sections/) contains standalone section drafts/templates and is not auto-included by [index.html](../index.html).

## Build And Test
- No install step and no formal test suite.
- Local preview options:
  - Open [index.html](../index.html) directly in a browser.
  - Or serve the root with: `python3 -m http.server`.
- After edits, validate manually:
  - Anchor navigation still scrolls to the expected section.
  - Language toggle (EN/EL) still updates visible text correctly.
  - Contact modal open/close behavior still works (buttons, backdrop click, Escape key).

## Conventions
- Keep all asset paths root-relative to this project layout (for example `assets/css/...`, `assets/js/...`, `assets/images/...`).
- For translatable UI text, update the dictionaries in [assets/js/main.js](../assets/js/main.js):
  - `englishToGreek` is the primary source.
  - Greek-to-English mapping is generated from that source.
  - Prefer updating existing strings instead of adding duplicate near-identical keys.
- Preserve existing language persistence key: `whp_lang` in `localStorage`.
- Contact CTA buttons that open the modal should continue using `open-contact-modal` plus `data-modal-title-el` and `data-modal-title-en`.

## Common Pitfalls
- Changing visible text in HTML without updating [assets/js/main.js](../assets/js/main.js) can break translation coverage.
- Moving [index.html](../index.html) or changing folder depth can break relative `assets/...` references.
- Contact form currently has placeholder submit target (`action="#"`); avoid implying backend behavior unless explicitly implemented.

## Documentation Links
- Site structure and planned future pages: [notes/sitemap.md](../notes/sitemap.md)
- Project overview (currently minimal): [README.md](../README.md)
