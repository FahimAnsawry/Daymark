# Daymark visual system

## Identity

Daymark is a calm editorial planning product: warm paper surfaces, deep botanical green, sage-lime accents, and muted terracotta details. The voice is kind, intentional, concise, and human.

- Brand mark: a half-risen orange sun with five rays over a horizon line (`frontend/src/components/BrandMark.tsx`, `frontend/public/favicon.svg`). The horizon takes the surrounding text color so the mark works on light, dark and photographic grounds. `size="lg" animated` plays the sunrise (sun climbs, rays appear) and is reserved for moments like the post-checkout thank-you page.

## Typography

- Body: DM Sans, with a system sans fallback.
- Display: Space Grotesk for energetic headings and quotes, with a system sans fallback.
- Logo: Sora 700 in uppercase (`DAYMARK`, tracking 0.08em), used only for the wordmark beside the sunrise mark (`font-logo`).
- Headings use generous scale and confident weight; body copy stays readable and relaxed.

## Color

- Paper: `#f7f6f2`
- Ink: `#27352f`
- Ink: `#1f2937` / `#ea580c`
- Soft orange: `#fed7aa` / `#fdba74`
- Orange: `#ea580c`
- Muted text: `#727b73`
- Dark surface: `#111a17`

## Buttons

One primary color system, defined once as utilities in `frontend/src/index.css`. Pick the utility by the ground the button sits on, never by page:

- `btn-primary` on paper and light surfaces: burnt orange `#c2410c`, white label, hover `#9a3412`. In dark mode it becomes soft orange `#fed7aa` with an ink `#1f2937` label and a `#fdba74` hover. `#ea580c` is not a button fill, because white text on it fails AA (3.6:1).
- `btn-primary-inverse` on botanical green, the dark footer, the mobile menu and photography: soft orange `#fed7aa`, ink label, hover `#fdba74`, in both themes.
- `btn-primary-strong` on soft-orange surfaces that stay `#fed7aa` in both themes (pricing highlight card and band): burnt orange in both themes.
- Secondary actions are outlined or ghost, never a second fill color. Selected chips, the done checkbox and the selected calendar day use the primary pair. Green is a surface color, not a button color.
- The utilities carry color, hover and focus ring only. Size, radius (pills) and motion stay on each button.

## Layout and surfaces

- Landing pages use spacious editorial sections, asymmetric two-column compositions, and centered hero/quote moments.
- Surfaces are mostly flat paper or botanical green with 1px rules; avoid decorative card stacks.
- Controls are compact rounded pills; content blocks use restrained or no radius.
- Images are natural, warm, and tactile. Overlays are used for legibility, not decoration.

## Motion and accessibility

- Motion is subtle and purposeful: lift/opacity transitions and carousel fades.
- Preserve visible focus rings, keyboard operation, readable contrast, responsive behavior, and reduced-motion accommodations.

## Surface brief: landing page

- Mode: Persuade.
- Motion: every landing section rises in once as it scrolls into view (hero on load, then intro, cards, quote and closing CTA). About and pricing use the same `useReveal` entrances. In-page jumps scroll without adding a #hash to the URL.
- Sequence: photographic hero → paper intro ("Your day is more than a list of things to do.") with three principle cards → botanical-green testimonial band → closing CTA → `SiteFooter`. No eyebrow labels above headings.
- Principle cards are the one sanctioned card row: `#ecebe5` (dark `#262626`), 20px radius, centered text, orange step number (the 01–03 order is the catch → choose → live flow). Each ends in a small day-sheet vignette pinned to the card bottom: white rows, soft-orange pills, the orange "one thing" row, and a green "Room to live" block. Hover gives a quiet response (pills rise, the one thing lifts while the others dim). On first scroll into view the intro rises in and the cards stagger in, each vignette telling its step: pills drop in and settle, the one thing lifts above the rest, and the evening fades in. Reduced motion shows the settled state.
- The testimonial is a single static quote on `#183b37` (dark `#111a17`). The closing CTA is a single-line display heading over an orange pill whose arrow slides in on hover.
- Preserve existing landing copy, route contracts, navigation, and authentication links.
- Visual iteration should stay within the established editorial system unless the user explicitly requests a redesign.

## Surface brief: sign in and sign up

- Mode: Operate. `/login` and `/register` share `frontend/src/components/AuthPage.tsx`.
- Layout: form column on paper `#f7f6f2` (about 420px measure) on the left. On `lg` and up, an inset sage panel `#e4eadf` (dark `#111a17`, 28px radius) sits on the right. The form column only on mobile.
- The panel holds `AuthDayPreview`: a square white day sheet (16px radius, a soft shadow and no border) dated with the local date. It lists three things, a botanical-green "Room to live" line and parked-loop pills. A 1px horizon hairline crosses the panel behind it. The sheet is labeled "A sample day in Daymark".
- Motion: one loop. Sign in checks today's items off; sign up writes them into empty lines. Reduced motion shows a settled state.
- Controls: 48px pill buttons with Google first. The primary button is `btn-primary` (burnt orange `#c2410c`, dark: soft orange `#fed7aa`). Inputs are 48px, 10px radius, with a green focus ring. Secondary text is `#5d6a62` and placeholders are `#6b746c` for contrast.
- Browser surfaces: text selection is soft orange, the caret is orange, and scrollbars are `#c7cfc2` / `#424242`.
