---
name: pmg-helpdesk-design
description: Use this skill to generate well-branded interfaces and assets for the PMG Helpdesk — an internal IT ticketing system replacing ServiceNow — either for production or throwaway prototypes/mocks. Contains design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out of `assets/` and reference `colors_and_type.css` for foundations. Static HTML files are the preferred deliverable.

If working on production code, copy assets and read `README.md` to internalize the rules; treat the JSX in `ui_kits/helpdesk/` as a reference for component shape, not as a production library.

If the user invokes this skill without further guidance, ask what they want to build (a screen? a slide? a flow?), ask a few clarifying questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

**Key things to remember**
- Internal IT helpdesk — voice is calm and lowercase-friendly. Never "submit a request"; we say "report something."
- One accent color: PMG green `#16A37E`. Reserve for primary CTAs, links, focus, brand mark.
- 1px borders carry the UI. Avoid drop shadows except for popovers and modals.
- No gradients, no emoji in nav, no rounded-cards-with-colored-left-border.
- Type: Hanken Grotesk (sans), JetBrains Mono (IDs / code).
- Icons: Lucide, 1.5px stroke, no fills.
