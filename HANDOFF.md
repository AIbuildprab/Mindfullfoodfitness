# Handoff

Repo: `Mindfullfoodfitness`, branch `Dev`. Last commit: `1b2f2bb`. Changes since then are uncommitted.

## Done since the designer critique (Impeccable critique scored 21/32)
- 6-month card: removed the leaked draft note; the "Mid-point progress review and plan reset" bullet stays (Paul confirmed it is real).
- Pricing (`#pricing`): price and button now sit directly under each tier name; no fixed card height or inner scrolling; no fade-in; "What's included" is a collapsible (`src/components/PlanDetails.tsx`), open on desktop and collapsed on phones. All wording and prices unchanged. Phone height 3,464px -> 2,369px.
- Contrast: new `--gold-deep` (#86712f, 4.7:1 with white text) used for filled gold buttons, badges, the contact panel and the sticky bar. The brighter gold stays for text on dark backgrounds.
- Hero: second button is now an outline so the gold button leads.
- Motion: reveals 1.1s -> 0.7s and trigger earlier; hero entrance 1.4-1.7s -> 0.8-0.9s; no more scale-from-20% headline.
- Tap targets: review arrows 44px, contact checkbox 20px inside a 44px row, header social icons 32px.
- `Hero.mp4` 11.8 MB -> 3.1 MB (540x960, audio kept).
- tsc, eslint (0 errors), `npm run build` and `impeccable detect` all clean.

## Still open
- Needs Paul's decision: the "17+ Years' experience" badge (reads as 17 years of coaching; 17 years were in kitchens, coaching since 2018); scarcity lines ("Only a few spaces open each quarter"); hand-typed relative review dates; no payment-plan price for the 12-month option.
- Remaining phone tap target: "privacy policy" link (36px).
- Page is still about 18,400px tall on phones: merge Roadmap into Programme, cut gallery and duplicate quotes, tuck away the in-person and gym blocks, add a "from £750" hint near the hero, add a short FAQ.
- Chef touches (menu-style pricing, phases as courses, food imagery) need photos from Paul.
- Small gold text on white (section labels, ticks) is about 3.2:1; large headings pass.
- Two font preloads (Manrope / Open Sans) warn as unused; left as is to avoid a font flash.
- Re-run `/impeccable critique` to record a new score.
- Login/dashboard: `src/lib/auth.ts` is a stub; `/dashboard` has no auth guard.
- Untracked and not committed: `.impeccable/`, `assets/`, `public/fonts`, `public/plates`, `public/mff/people`, `src/styles`.

## Latest (uncommitted)
- Booking CTA: every "Book a Free Strategy Call" button removed (header, mobile menu, hero, pricing cards, About, in-person, sticky mobile bar). One booking section remains, under the pricing cards ("Not sure which option is right for you?", `id="book"`). `MobileCtaBar.tsx` deleted. The contact intro still says "or book a free call" as plain text.
- Mobile nav: compact accordion (Programme / Results), Sign in full width, dimmed backdrop.
- Animation: mobile menu slides in with staggered items; gold scroll-progress line under the header; header tightens on scroll; pricing cards lift on hover; pill buttons press-scale; slow sheen on the one booking button. All respect reduced motion.
- Hero now plays a silent loop (`public/mff/hero-loop.mp4`); sound stays in the About video.
- `/login` restyled as a dark full-screen page.
