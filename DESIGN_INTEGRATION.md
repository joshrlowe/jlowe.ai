# Design Integration — Claude Design Export Map

Research-only characterization of `design-reference/` (extracted from `jlowe.ai.zip`, Apr 24 2026). Phase 1A. No code changes proposed here — this is the map that informs Phase 1B.

---

## 0. Headline reframe

The first thing to know: `design-reference/components/*.jsx`, `design-reference/pages/*.jsx`, and `design-reference/styles/globals.css` are **not the redesign output**. They are the **input** the Claude Design canvas was given — byte-identical clones of the current repo except one trivial color tweak.

Verified with `diff -q`:
- `components/{FeaturedProjects,Footer,Header,SocialLinks}.jsx` — byte-identical.
- `components/HeroSection.jsx` — differs by one line (`LLMs` tech-badge color `#F72585` → `#3B82F6`).
- `pages/{about,contact,projects}.jsx` — byte-identical.
- `pages/index.jsx` — differs by one line (same `#F72585` → `#3B82F6` swap).
- `styles/globals.css` — byte-identical.

The **actual redesign** lives in `design-reference/src/`. That's the authoring-canvas workspace where the new tokens, new section compositions, and new data schema live. The integration job is therefore: extract tokens, extract JSX patterns, and rewrite the existing repo components to consume them while keeping the current data layer intact.

---

## 1. File inventory

Grouped by role. Byte counts rounded.

### Canvas layer — authoring-tool only, DO NOT port

| File | Size | Role |
| --- | ---: | --- |
| `design-reference/index.html` | 3 KB | Claude Design preview shell — loads fonts, mounts `#react-root`, pulls in `supernova.js` for the detonation intro. |
| `design-reference/src/app.jsx` | 3 KB | Canvas entry; wires `Tweaks` root, feature flags, live font/accent switching. Depends on `window.useTweaks`. |
| `design-reference/src/chrome.jsx` | 5 KB | Fixed-position header + nav wrapper for the canvas preview. Tightly coupled to scroll-tracking and preview-only layout. |
| `design-reference/src/supernova.js` | 35 KB | Three.js-based WebGL intro detonation. This is the hero animation's canvas shim for the preview environment. |
| `design-reference/src/tweaks-panel.jsx` | 18 KB | Floating, draggable controls panel for tuning colors/fonts/etc. inside Claude Design. Zero prod value. |
| `design-reference/uploads/pasted-1777056701851-0.png` | 8.9 MB | Reference screenshot the designer pasted in. Visual mood-board material. Not a production asset. |

### Design source — the redesign itself, port into repo (rewritten, not copied wholesale)

| File | Size | Role |
| --- | ---: | --- |
| `design-reference/src/tokens.css` | 10 KB | **The new design system.** All color/type/motion tokens + reusable CSS utility classes (`.display`, `.chip`, `.card`, `.btn`, `.eyebrow`, `.live-dot`, `.reveal`, `.sn-gradient`). |
| `design-reference/src/hero-about.jsx` | 13 KB | New Hero section + new About section layout. Pulls data from `window.__APP_DATA`. Heavy inline-style JSX (expected — Claude Design canvas export). |
| `design-reference/src/sections.jsx` | 15 KB | New compositions for Projects (featured-grid + archive + tag-chip filter), Articles (card row), Contact (form), Footer. Same inline-style pattern. |
| `design-reference/src/data.js` | 8 KB | Mock `window.__APP_DATA` mirroring the schema the design assumes — owner / projects / experience / education / articles / social / techBadges. **Use as the schema spec.** |

### Input echoes — identical to current repo, ignore for port purposes

| File | Size | Notes |
| --- | ---: | --- |
| `design-reference/components/FeaturedProjects.jsx` | 14 KB | Byte-identical to current. |
| `design-reference/components/Footer.jsx` | 10 KB | Byte-identical. |
| `design-reference/components/Header.jsx` | 7 KB | Byte-identical. |
| `design-reference/components/HeroSection.jsx` | 11 KB | Differs from current by one line — `LLMs` badge color. |
| `design-reference/components/SocialLinks.jsx` | 3 KB | Byte-identical to the orphan (PR #2 delete target). |
| `design-reference/pages/{about,contact,projects}.jsx` | 11–14 KB | Byte-identical. |
| `design-reference/pages/index.jsx` | 6 KB | Differs by one line — same `LLMs` badge color. |
| `design-reference/styles/globals.css` | 14 KB | Byte-identical to current. |

---

## 2. Design system extracted (+ diff vs current `@theme`)

### Palette — **cool pivot**

The design swings from warm ember to cool electric blue/cyan. Token namespaces are almost entirely disjoint, so there are **no value conflicts on current token names** — the current Supernova tokens simply vanish unless we keep them.

**New design tokens (in OKLch / hex):**

| Category | Tokens |
| --- | --- |
| Void (cool blacks) | `--void-000 #000000`, `--void-010 #05070a`, `--void-020 #0a0e14`, `--void-030 #10151c`, `--void-040 #161d28`, `--void-050 #1e2836` |
| Ink (cool whites) | `--ink-100 #f6f8fc`, `--ink-90 #e4ebf3`, `--ink-80 #c5d0de`, `--ink-70 #a3b0c2`, `--ink-60 #818da0`, `--ink-50 #6b7689`, `--ink-40 #515c6d`, `--ink-30 #2f3744`, `--ink-20 #1a1f2a` |
| Supernova accents | `--sn-ice oklch(.97 .02 220)`, `--sn-cyan oklch(.85 .15 210)`, `--sn-cyan-hi oklch(.92 .10 205)`, `--sn-blue oklch(.65 .20 255)`, `--sn-blue-hi oklch(.75 .16 245)`, `--sn-deep oklch(.42 .18 265)`, `--sn-navy oklch(.30 .14 270)`, `--sn-hot-core oklch(.99 .02 220)` |
| Primary alias | `--accent: var(--sn-cyan)`, `--accent-hi: var(--sn-blue)` |
| Rules & glow | `--rule rgba(255,255,255,0.07)`, `--rule-mid rgba(255,255,255,0.12)`, `--rule-hi rgba(180,220,255,0.22)`, `--glow-violet`, `--glow-magenta`, `--glow-cyan` (all OKLch-defined blurs) |
| Motion | `--ease-out-expo cubic-bezier(0.16,1,0.3,1)`, `--ease-in-out cubic-bezier(0.65,0,0.35,1)` |
| Fonts | `--font-sans "Inter"`, `--font-serif "Instrument Serif","Fraunces"`, `--font-mono "JetBrains Mono"` |

**Legacy aliases kept for compatibility** (all now point at the cool palette):
`--sn-violet → --sn-deep`, `--sn-magenta → --sn-blue`, `--sn-fuchsia → --sn-cyan`, `--sn-pink → --sn-cyan-hi`. Existing uses of `--sn-fuchsia` etc. in migrated code will silently turn cyan-blue.

**Current `@theme` tokens that would disappear if we swap wholesale** (no design equivalent):

- Full `--color-*` palette (primary ember `#e85d04`, secondary crimson `#9d0208`, accent gold `#faa307`, cool `#4cc9f0`, fuchsia `#f72585`, plus glows and hover variants).
- Full `--space-*` ladder (`xs`→`5xl`, plus semantic `section`/`header`/`card`/`element`).
- Full `--radius-*` ladder (`sm`→`full`).
- Full `--shadow-*` ladder (`sm`/`md`/`lg`/`xl` + glow variants + `fire`).
- `--transition-*` (`fast`/`normal`/`slow`/`bounce`/`spring`).
- `--container-*` (`sm`→`2xl`).
- Font vars `--font-family-base/heading/mono` (they'll be redefined against Inter/Instrument Serif/JetBrains Mono).

**Conflicts (same name, different value):** none. Current uses `--color-*`, `--space-*`, `--radius-*`, `--shadow-*`, `--transition-*`. Design uses `--ink-*`, `--sn-*`, `--void-*`, `--rule-*`, `--glow-*`, `--ease-*`, `--font-sans/serif/mono`. A wholesale swap is therefore safe against name collision — at the cost of losing everything in the "disappear" bucket above.

### Typography — **editorial pivot**

- **Display**: Instrument Serif (with Fraunces fallback) at `clamp(64px, 11vw, 176px)`, `font-weight: 400`, `line-height: 0.92`, `letter-spacing: -0.02em`, italic-for-emphasis pattern (`<em>` renders in 300-weight italic — a strong editorial signature).
- **Body**: Inter 400, feature settings `"ss01", "cv11", "cv02"` (stylistic alternates).
- **Mono**: JetBrains Mono 500 with 0.16em–0.22em tracking for eyebrows and labels.
- **No fixed size scale** — the design uses ad-hoc `clamp()` per component; there is no `--text-xs`/`--text-sm` ladder to port.

Current portfolio uses Space Grotesk (headings) + Plus Jakarta Sans (body) + JetBrains Mono via `next/font/google` (`lib/fonts.js`). Design keeps JetBrains Mono, drops the other two, adds Inter + Instrument Serif. All three are Google Fonts.

### Motion

Two easing curves, reveal-on-scroll animation (`.reveal { opacity: 0; transform: translateY(24px); }` → `.in` unsets both), and a 1.8 s `live` keyframe for the pulsing status dot. No complex timeline work in tokens; the detonation is delegated entirely to `supernova.js`.

### Reusable CSS classes the design adds (in `tokens.css`)

`.mono`, `.serif`, `.label-mono`, `.eyebrow` (with `.num`, `.bar` sub-elements), `.display` (+`.italic`), `.sn-gradient`, `.sn-gradient-soft`, `.rule`, `.noise`, `.card` (with rim-light `::before`), `.card-hover`, `.accent-text`, `.btn`, `.btn-primary`, `.btn-ghost`, `.chip` (+ `.chip.on`), `.live-dot`, `.ulink`, `.reveal` (+ `.in`), `.section`, `.container`, `.lock-scroll`, and an intro-gate pattern (`#react-root { opacity: 0; ... } .intro-ready { opacity: 1 }`).

### Token-level diff summary

| Bucket | Count | Resolution for Phase 1B |
| --- | ---: | --- |
| Same name, different value | 0 | — |
| New tokens to add | ~35 | Add to `@theme` block. |
| Current tokens lost | ~40 | Either keep for backwards compat (safer), or remove and migrate callers. |
| Fonts swapped | 2 of 3 | `Space_Grotesk` → `Inter`, `Plus_Jakarta_Sans` → `Instrument_Serif` in `lib/fonts.js`. |
| Utility classes added | ~25 | Port relevant ones into `styles/globals.css`. |

---

## 3. Component map

### Design → current mapping

| Design intent (source) | Current component | Match type | Port strategy |
| --- | --- | --- | --- |
| `src/hero-about.jsx` — Hero | `components/HeroSection.jsx` | Same role, **new JSX structure** (serif display, availability chip, supernova-gradient text, different CTA treatment) | **Rewrite**: keep `data` / `homeContent` props + GSAP + ReactTyped + `trackCtaClick`; replace JSX body with the design's layout. |
| `src/hero-about.jsx` — About | `pages/about.jsx` + `components/About/*` | Partial | The current About page is broken into 10 subcomponents (`AboutHero`, `ProfessionalSummary`, `TechnicalSkills`, `Education`, etc.). The design presents About as an inline grid on the home/about page with chip-filtered experience cards — **different information architecture**. Flag as a structural decision in Phase 1B. |
| `src/sections.jsx` — Projects | `components/FeaturedProjects.jsx` + `components/Project/ProjectCard.jsx` + `components/Project/ProjectFilters.jsx` | Partial | Design uses: featured grid (asymmetric 12-col, 4 cards), archive list with tag-chip filter (`All` + dynamic tags), no separate detail page shown in design but data implies one. The current `FeaturedProjects` component handles the homepage featured grid; `pages/projects.jsx` is the full list page. **Rewrite both** to match the featured-grid + tag-chip pattern. `ProjectDetail` (on `/projects/[slug]`) is not covered by the design — keep current, restyle with new tokens. |
| `src/sections.jsx` — Articles | `pages/articles/index.jsx` | Partial | Design shows a compact "recent articles" card row. Current `/articles` is a full blog index with pagination. **Gap**: the design doesn't fully redesign the blog index — it only shows an on-home teaser shape. Recommend: use the design's card shape for both a home teaser + the full index; keep current pagination logic. |
| `src/sections.jsx` — Contact | `pages/contact.jsx` | Same role, **new JSX structure** | Design is cleaner: display question + form in editorial serif + mono label pattern. Keep the data wiring (`/api/contact`, `Contact` model), replace the presentation. |
| `src/sections.jsx` — Footer | `components/Footer.jsx` | Same role, **new JSX** | Keep existing social/contact API fetches; replace JSX layout. |
| (implicit, from `tokens.css` chrome + `src/chrome.jsx`) | `components/Header.jsx` | Same role, **new visual** | Header keeps its nav + scroll-backdrop behavior; needs token migration + slight layout polish (eyebrow-style section numbers, `.ulink` underline-grow hover). |
| (intro animation) | `components/SpaceBackground/*` (R3F) | **Conflict with V2 plan** | Design keeps a WebGL intro (`supernova.js` in the canvas) — clearly load-bearing in the design language. V2 PR #9 says "remove R3F entirely and ship `TokenStreamBackground`". **This is a design/plan collision — see §6.** |

### Net-new design-only components (no current equivalent)

- **Supernova-gradient text span** (`.sn-gradient`) — one-off pattern: a `<span>` that renders multi-stop linear-gradient-masked type. New CSS class, no component.
- **Rim-light card** (`.card` with `::before`) — CSS pattern. No current equivalent; would be a Tailwind-or-raw-CSS helper.
- **Availability chip with `.live-dot`** — new atom (status pill + pulsing dot). No current equivalent.
- **Section header with eyebrow number + bar** (`<SectionHeader num="02" eyebrow="Projects" title=… sub=…>`) — new atom. No current equivalent.
- **Tag-chip filter** (`chip` + `chip.on`) — close to `components/Project/ProjectFilters.jsx` search/sort controls, but visually a different primitive.
- **Reveal-on-scroll utility** (`.reveal` + intersection observer trigger) — currently handled per-component via GSAP ScrollTrigger. Design adds a lighter CSS-driven option.

### Current components not covered by the design

Safe to keep untouched (no design equivalent, no visual conflict expected after token swap):

- `components/ScrollProgress.jsx`, `components/ErrorBoundary.jsx`, `components/SEO.jsx`.
- `components/GitHubContributionGraph.jsx`, `components/RecentActivity.jsx` (both rendered on home — design doesn't include them; they'll inherit new tokens automatically, will need visual QA).
- `components/About/*` (10 subcomponents) — only conflict is the `pages/about.jsx` information architecture question.
- `components/Articles/*` (`PostComments`, `PostLikeButton`, `SocialShare`, `NewsletterSubscription`) — blog-post-internals, design doesn't cover.
- All `components/admin/*` (26 files) — admin panel, out of scope.
- `components/Project/ProjectDetail.jsx` — detail page; design doesn't cover.

Orphan / dead-code (already flagged in PR #2) — the design's identically-named `SocialLinks.jsx` is byte-identical to the orphan we'll delete. Nothing to port.

---

## 4. Page coverage

| Route | Design coverage | Integration strategy |
| --- | --- | --- |
| `/` (home) | **Full** — Hero + Projects featured grid/archive + Articles teaser + Contact + Footer. | Rewrite sections using new tokens + JSX patterns; keep `getStaticProps`. |
| `/about` | **Partial** — design shows About as an on-page grid (chips + cards). Current `/about` is a 10-section long page. | **Decision needed** — adopt the design's compact treatment (drops detail) or apply new tokens to the existing 10-section structure (keeps detail). Recommend the latter for the resume-style depth the audience expects. |
| `/projects` | **Full** — featured grid + archive list + tag chips. | Rewrite list presentation; keep filter logic and `getStaticProps`. |
| `/projects/[slug]` | **None** | Keep `ProjectDetail.jsx`; apply new tokens; visual QA. |
| `/contact` | **Full** — redesign the form + availability copy. | Rewrite JSX; keep `/api/contact` POST and `Contact` Prisma reads. |
| `/articles` | **Partial** — design only shows a card-row teaser shape, not a paginated index. | Adapt the card shape onto the existing `/articles` index; keep pagination. |
| `/articles/[topic]/[slug]` | **None** | Keep current article detail; apply new tokens; visual QA for markdown/code blocks (Shiki pipeline in V2 PR #10 becomes relevant). |
| `/admin/*` (8 routes) | **None** | Leave untouched. The admin panel stays on current styling. |
| `/api/*` | n/a | Not styled. |

**Gap-handling posture:** for routes the design doesn't cover, apply the new tokens (they'll inherit palette/type automatically through CSS variables), but don't restructure JSX. Every uncovered route gets a visual QA pass before merge.

---

## 5. Data layer compatibility

The design's `src/data.js` defines `window.__APP_DATA` — a flat schema that's the design's assumption of what the page has access to. Mapped against the current Prisma models and `getStaticProps` output:

### `owner` (the Hero / About / Footer author block)

| Design field | Current source | Mismatch severity |
| --- | --- | --- |
| `owner.name` | `Welcome.name` | Exact |
| `owner.handle` | (hardcoded `"jlowe.ai"` — not in Prisma) | Can derive from host; trivial |
| `owner.role` | (design says "AI Engineer & Consultant") | Derivable from `Welcome.callToAction` or new `PageContent.home` field |
| `owner.tagline` | (design says "Building What's Next") | **New field** — not in `Welcome` or `PageContent` |
| `owner.focus` | (design says "privacy-preserving ML") | **New field** — feeds the availability chip |
| `owner.subrole` | (design says "MSCS Student @ UCF · Research Assistant at AI MIND Lab @ UCF") | **New field** |
| `owner.summary` | `Welcome.briefBio` | Likely fits; verify length |
| `owner.shortBio` | `Welcome.briefBio` (shortened) | Derive |

**Work:** extend `PageContent.home` JSON content (already an editable blob in the admin) with `tagline`, `focus`, `subrole`. No schema migration needed — `PageContent.content` is a `Json` column.

### `techBadges`

Design and current both use an array; structure overlaps. Current `techBadges` on home is `[{ name, color }]` in `PageContent.home`. Design's flat array `["Python", "PyTorch", …]` — take the current shape; carry per-badge color to differentiate.

### `projects[]`

| Design field | Current Prisma `Project` | Mismatch |
| --- | --- | --- |
| `id` | `id` (cuid) | Exact |
| `title` | `title` | Exact |
| `status` | `status` (enum) | Exact (format transforms) |
| `tag` (single) | `tags` (array of strings) | **Shape mismatch**: design assumes single `tag`, current has array. Resolution: use `tags[0]` as the primary for filtering; keep `tags` for display. |
| `short` | `shortDescription` | Rename only |
| `tech` (array) | `techStack` (JSON — complex object) | **Shape mismatch**: design assumes a flat string array; current has a structured object (`fullStackFramework`, `backendFramework`, `languages`, `apiIntegrations`, …). Resolution: project a flat array from the structured blob in `projectTransformer.js`. |
| `featured` | `featured` (boolean) | Exact |

### `articles[]` (from `data.js`)

Design assumes `{ id, title, excerpt, readMins, topic, date }`. Current `Post` model has `title`, `description`, `readingTime`, `topic`, `datePublished` — maps cleanly. No migration needed.

### `experience[]`, `education[]`

Design flat arrays (`company`, `role`, `years`, `bullet`). Current `About` model has `professionalExperience` and `education` as nested JSON. Map in `getStaticProps`.

### `social`

Current `Contact.socialMediaLinks` is a JSON object (`{ linkedIn, X, github, other: [] }`). Design expects a flat array of `{ label, href, icon }`. Transform in the query, not the schema.

### `contact`

Design form uses `name`, `email`, `message`, maybe `company`. The `/api/contact` POST handler exists — but note the V2 plan (PR #12) introduces a new `ContactSubmission` model with an `engagementType` enum. **Phase 1B should NOT extend the schema** — keep the current API contract. Schema extensions land in V2 PR #12 after the design is stable.

### `heroWords` / `heroSubtitle`

Design's `Contact` section uses a word-carousel and subtitle. Current `Contact` Prisma has `heroWords` (JSON array) + `heroSubtitle` fields — **already present**. No migration needed. (Note: Agent B flagged `react-text-transition` as a new dep here, but it's already in the current `package.json` — no new dep introduced.)

### Summary

- **Zero schema migrations required** for Phase 1B.
- All mismatches resolve in `getStaticProps` / `projectTransformer.js` / new field plumbing through `PageContent.home` JSON (editable via admin).
- The AI/ML rich fields from V2 PR #12 (model cards, eval results, benchmarks, publications) are **out of scope for Phase 1B** — the design doesn't surface them.

---

## 6. Risk list — conflicts with locked decisions

Each item references `CLAUDE.md` standing orders.

### R1. Inline styles everywhere in `src/hero-about.jsx` and `src/sections.jsx`

**Locked rule:** "No inline `style={{ ... }}` except for computed dynamic values."
**Design reality:** the canvas export puts nearly every visual property inline (padding, grid-template-columns, fontSize, colors, shadows). Several dozen per file.
**Implication:** if we port the design JSX verbatim, we violate the rule broadly. Path: translate inline styles to Tailwind utility classes referencing the new `@theme` tokens, and use the design's reusable CSS classes (`.display`, `.card`, `.chip`, `.btn`, `.eyebrow`, `.reveal`) from `tokens.css` for patterns that would be awkward in Tailwind.

### R2. R3F intro animation vs V2 PR #9 removal

**V2 plan:** PR #9 removes `three` + `@react-three/fiber` + `@react-three/drei` and replaces `SpaceBackground` with a lightweight `TokenStreamBackground` (canvas).
**Design reality:** the design's `supernova.js` (35 KB) is a WebGL detonation intro that's clearly load-bearing to the brand language (intro gate at `#react-root.intro-ready`). The design expects R3F or equivalent.
**Implication:** three options. (a) Keep R3F through Phase 1B, defer V2 PR #9 decision. (b) Implement a canvas-based detonation in vanilla (~300 LOC) and drop R3F now. (c) Drop R3F, replace with a CSS intro-blur-gate (cheapest but loses the detonation signature). Recommend (a) for Phase 1B so the visual lands, revisit (b) in V2 PR #9 post-visual-lock.

### R3. Palette pivot invalidates 20+ components' hand-tuned ember accents

**Affected files (partial list):** `components/FeaturedProjects.jsx` (12 inline-style accent applications keyed to `FEATURED_ACCENT_COLORS`), `components/Header.jsx` (RGBA hard-coded), `components/Footer.jsx` (glow effects keyed to ember), `components/RecentActivity.jsx`, `components/GitHubContributionGraph.jsx` (supernova heatmap gradient `#3d1308 → #ffba08`).
**Implication:** components will render with wrong colors after token swap until their inline styles are remapped. Port order needs to address the hotspots first.

### R4. Fonts swap invalidates `font-[family-name:var(--font-oswald)]` call-sites

**Locked in PR #2:** legacy font aliases (`oswald`, `roboto`, `sourceCodePro`) are scheduled for removal and migration to `var(--font-heading)`. Those 11 call-sites still exist on the current branch.
**Design reality:** design uses `--font-sans` (Inter) and `--font-serif` (Instrument Serif). No `--font-heading` in the design tokens.
**Implication:** the font-alias cleanup (V2 PR #2) should ideally land before Phase 1B, otherwise the design integration creates a third set of font references on top of the legacy ones. Option: fold the PR #2 font-alias migration into Phase 1B.

### R5. Intersection of design expectations with the locked "no new runtime deps without justification" rule

**Design uses:**
- Inline React (via CDN in canvas, irrelevant for production port).
- OKLch color values — only a CSS feature, no dep.
- No shadcn, no framer-motion, no new animation libs.

**Net new deps needed for Phase 1B:** none — the design composes from current deps (GSAP, next/image, next/font). The reveal-on-scroll pattern can reuse existing IntersectionObserver via `lib/hooks/useScrollDepth.js`.

### R6. CSS Modules

**Locked rule:** "No CSS Modules in new code."
**Design reality:** design uses pure inline + tokens.css utilities — no CSS Modules introduced.
**Implication:** no risk.

### R7. Design JSX uses `window.__APP_DATA`

**Locked rule:** "No `localStorage` / `sessionStorage` / `window.*` during render."
**Design reality:** the design source reads `const data = window.__APP_DATA` at render time as a shortcut for prop access inside the canvas environment.
**Implication:** must translate to prop-based access during the port — every design component becomes `function Section({ data, ... })`. Mechanical, not a blocker.

### R8. Admin panel styling drift

**Locked posture:** admin untouched.
**Design reality:** design tokens.css is loaded globally via `styles/globals.css`. Admin components use current tokens (`--color-primary` etc.) through inline Tailwind classes and CSS vars.
**Implication:** if we remove or rename current tokens, admin visually regresses. Mitigation: **keep current `--color-*` + `--space-*` ladders as a backwards-compat block in `styles/globals.css`** alongside the new `--ink-*`/`--sn-*`/`--void-*` additions. The admin keeps working without edits until we intentionally restyle it later.

### R9. V2 PR #12 schema (new AI/ML fields, Publication model, ContactSubmission) not part of the design

**Locked plan:** V2 PR #12 adds the AI/ML substance. Design's `src/data.js` has none of it.
**Implication:** the design doesn't render model cards, eval tables, or publications. Those surfaces need design follow-up after Phase 1B lands — either ask Claude Design to do a second pass, or extrapolate from the existing design's patterns (card + chip + rule).

### R10. TypeScript conversion (V2 PRs #3–5) not yet done

**Locked sequence:** PR #1 → PR #2 → PR #3 (TS scaffold) → PR #4 (components TS) → PR #5 (pages TS) → PR #6 (major upgrade) → PR #7 (App Router) → PR #8+ (design + content).
**This phase:** Phase 1B is Phase "design earlier than V2 plan sequenced it". New JSX authored in `.jsx` will need TS conversion in PR #4 later — extra work if Phase 1B lands before PR #3/#4.
**Implication:** acceptable. The JSX written in Phase 1B becomes the input to the TS conversion; the effort is additive, not wasted.

---

## Integration strategy recommendation

Treat the redesign as a **tokens migration + per-section JSX rewrite**, not a component swap. Phase 1B should: (1) copy the design's token layer (`--ink-*`, `--sn-*`, `--void-*`, `--rule-*`, `--glow-*`, `--ease-*`) and reusable utility classes into `styles/globals.css` **alongside** the current Supernova tokens (keep legacy ember/crimson/gold + `--space-*` + `--radius-*` ladders so admin and uncovered routes don't visually regress); (2) swap the two Google Fonts in `lib/fonts.js` (Inter for body, Instrument Serif for display) while keeping JetBrains Mono; (3) rewrite the JSX bodies of `HeroSection`, `FeaturedProjects`, `Footer`, `Header`, `pages/contact.jsx`, and (to the extent the design covers it) `pages/projects.jsx`, using the design's compositions as spec and consuming the new tokens via Tailwind + the added utility classes — translating the design's inline styles into Tailwind utilities where reasonable, keeping inline only for computed dynamic values; (4) extend `PageContent.home` editable JSON with three new string fields (`tagline`, `focus`, `subrole`) wired from the admin; (5) leave R3F in place for Phase 1B (the detonation signature is core to the design) and schedule the R3F-vs-canvas decision for a focused follow-up PR after the new visuals land; (6) leave every admin page, article page, project-detail page, and any other uncovered route untouched at the JSX level — they inherit the new palette automatically through tokens, with visual QA instead of rewrites. Expected effort for Phase 1B: **1.5–2 days** (token migration + five JSX rewrites + QA). Expected failure modes: visual regressions on uncovered routes (style them in a follow-up pass), snapshot/visual-regression test breakage (expected per your brief — do not update baselines in this PR).
