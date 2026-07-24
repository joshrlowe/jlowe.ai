# Web Design Guidelines Audit — jlowe.ai

Date: 2026-05-15
Branch: `cleanup/2026-05-15`
Auditor: web-design-guidelines skill (Vercel guidelines, fetched from `vercel-labs/web-interface-guidelines/main/command.md`) + WCAG 2.1 AA review
Scope: `pages/**/*.{ts,tsx}` (excluding `pages/api/*`), `components/**/*.{ts,tsx}`, `styles/globals.css`
Skipped: `e2e/`, `__tests__/`, `__mocks__/`, `__fixtures__/`, `coverage/`, `node_modules/`, `.next/`, `scripts/`

Every finding below was verified by reading the source file. Severity scale: `critical | high | medium | low`. Findings are grouped by category, prioritized within each category from most to least severe.

---

## Confirmed prior-audit baseline checks

| Prior claim                                  | Result                                                                                        |
| -------------------------------------------- | --------------------------------------------------------------------------------------------- |
| "21 `<img>` / `<Image>` usages"              | Confirmed. `grep` finds **10** native `<img>` JSX usages + **3** `<Image>` JSX usages (the prior audit may also have counted imports). All carry an `alt` attribute (often meaningful, never missing). |
| "0 `<footer>` elements"                      | **Disproven.** `components/Footer.tsx:138` renders a `<footer>` element. The prior audit was wrong, or stale. |
| "570:1 `<div>:<main>` ratio"                 | The `<main>` count is **2** (`pages/_app.tsx:174` + `components/admin/AdminLayout.tsx:13`). I did not count every `<div>`, but the global ratio claim is plausible — JSX is `<div>`-heavy throughout. |
| "Missing h4 / heading jumps"                 | **Confirmed in one place.** `components/Project/ProjectDetail.tsx:129` emits an `<h3>` ("Associated Papers") inside the page `<header>` *before* the page's `<h2>` sections at lines 190, 203, 221, 254, 286 — i.e. h1 → h3 → h2. No file uses `<h5>` or `<h6>` at all, so the audit's "h3-then-h5" pattern was not found. |

---

## A. Accessibility

### Critical

- [critical] `components/Articles/NewsletterSubscription.tsx:53` — `<input type="email">` has no `<label>`, no `name`, no `id`, no `aria-label`, and no `autoComplete="email"`; only a `placeholder`. Screen readers will announce "edit text" with no field name; password managers / autofill cannot identify it. (Add `<label htmlFor>` and `name="email" autoComplete="email"`.)
- [critical] `components/Articles/PostComments.tsx:172,180,332,340,349` — every comment / reply form input uses `placeholder` as its only label, and none have `name` / `autoComplete` attributes. The "Your email (optional)" field at line 340 specifically needs `autoComplete="email"`. (Wrap each in a `<label>` or attach `aria-label`.)
- [critical] `pages/admin/login.tsx:74-100` — both `<label>` elements lack `htmlFor`, and the `<input>` elements lack `id`, `name`, and `autoComplete`. The email input needs `autoComplete="email"` (or `"username"`) and the password input needs `autoComplete="current-password"` so password managers work. (Add `htmlFor`/`id` pairs and the autocomplete attributes.)
- [critical] `pages/articles/index.tsx:70-130` — the search `<input>` and three `<select>` filters have **no labels of any kind** (no wrapping `<label>`, no `htmlFor`, no `aria-label`). Same pattern is repeated. The selects above (e.g. `pages/projects.tsx:280,296`) are labelled with a visible `<label>` text but the label has no `htmlFor` and the select has no `id`, so the association is purely visual. (Add `id`/`htmlFor` or `aria-label` to every control.)

### High

- [high] `components/Project/ProjectCard.tsx:99-108`, `components/FeaturedProjects.tsx:215-232`, `components/RecentResources.tsx:182-204` — each renders an `<article role="article" tabIndex={0} onClick={...} onKeyDown={...}>` that uses `router.push()` for navigation. The Vercel guidelines list "inline `onClick` for navigation" and "`<div>`/`<span>` with click handlers" as anti-patterns. `<article>` is not a button or link; this breaks middle-click / cmd-click "open in new tab", does not show the URL on hover, and forces manual keyboard wiring. (Wrap the card body in a `<Link>` and remove `role="article"` — the `<article>` already conveys the role.)
- [high] `components/Chat/ChatPanel.tsx:140-217` — the chat dialog has `role="dialog"` but no `aria-modal="true"`, no Escape key handler, no focus trap, and no `aria-live` region on the streaming message area. Keyboard users cannot dismiss it with Esc, and screen-reader users get no announcement when the assistant streams tokens in. The streaming bubble in `ChatMessage.tsx:67-74` shows `…` while empty but never announces. (Add `aria-modal="true"`, an `onKeyDown` Escape handler on the dialog root, focus trap, and `aria-live="polite"` on the message list.)
- [high] `components/admin/shared/Modal.tsx:22-56` — `role="dialog" aria-modal="true"` is set, but there's no Escape handler and no focus trap. The dismiss backdrop is a `<div onClick={onClose}>` with no keyboard handler.
- [high] `components/admin/KeyboardShortcutsHelp.tsx:18-44` — modal that *documents* Escape closing, but the modal itself has **no role/aria-modal, no Escape handler, no focus trap, no aria-label**. The dismiss `<div onClick={onHide}>` at line 20 also has no aria-hidden / keyboard handler.
- [high] `components/admin/ProjectPreview.tsx:28` — backdrop `<div onClick={onHide}>` with no keyboard equivalent and no surrounding modal aria.
- [high] `pages/_app.tsx:174` — `<main role="main">` is redundant ARIA on a `<main>` element; same in `components/RecentResources.tsx:201`, `components/FeaturedProjects.tsx:229`, `components/Project/ProjectCard.tsx:105` (`role="article"` on `<article>`). Redundant roles get flagged by axe. (Remove the `role` attribute.)
- [high] `components/HeroSection.tsx:326-350` — "Scroll to services" button uses `document.getElementById("services").scrollIntoView()`. There is **no element with `id="services"` anywhere in the codebase** (verified with grep). Clicking the button is a no-op. (Either add a target section or rewire to the existing `#recent-activity` / `#github-activity` ids.)

### Medium

- [medium] `components/admin/shared/FormField.tsx:84-93` — the shared `<label>` lacks `htmlFor`; the wrapped input has no `id`. This component is used throughout the admin and propagates the same bug everywhere it's mounted. (Generate a stable `useId()` and bind both ends.)
- [medium] `pages/contact.tsx:277,286,301` — `<label>` elements are used as visual section headers ("Name", "Email", "Phone") for static `<p>`/`<a>` content. These should be `<dt>`/`<dd>` or `<span>` since there is no form control to associate with. As-is, screen readers will treat them as orphan form labels.
- [medium] `pages/admin/comments.tsx:180` — moderation "Optional reason" `<input>` has only a `placeholder`; no label, no `aria-label`, no `name`.
- [medium] `components/admin/DateRangePicker.tsx:18,26`, `components/admin/BulkActionsToolbar.tsx:49`, `components/admin/TeamMemberManager.tsx:37,44`, `components/admin/projects/ProjectListItem.tsx:35`, `components/admin/shared/TagInput.tsx:43` — admin form controls with placeholder-only labelling (not strictly user-facing but accessibility hygiene applies).
- [medium] `pages/articles/[topic]/[slug].tsx:257-267` — markdown `img` override always passes `alt={alt || ""}` to `<Image>`. Empty alt is correct for decorative images, but body content images in articles are almost always informational. (Surface alt as required input upstream or warn in author UI.)
- [medium] `pages/articles/[topic]/[slug].tsx:211-225` — `ReactMarkdown` `components` config renders `<h1>` for `#` headings inside the article body. The page already has an `<h1>` at line 123 (the post title), so markdown-level `#` produces a **second h1 inside the same article**. (Map markdown `h1` → `h2`, `h2` → `h3`, etc., when the page already owns its top-level h1.)
- [medium] `components/Project/ProjectDetail.tsx:129` — `<h3>` "Associated Papers" appears inside the page `<header>` before the page's main `<h2>` sections at lines 190, 203, 221, 254, 286. Heading order: h1 → h3 → h2. (Promote to `<h2>` or restructure.)
- [medium] `components/admin/AdminLayout.tsx:13-20` — `<main>` contains the page's `<h1>`, but the admin layout has **no `<header>`, `<nav>`, or `<footer>` landmarks** beyond the sidebar's `<nav>`. No skip-link is rendered on admin pages (`pages/_app.tsx:158-163` only renders it on the public layout).
- [medium] SVG icons throughout (`Footer.tsx:30,40,45,50`, `Header.tsx:128-145`, `contact.tsx:118-126,360-372`, `ChatPanel.tsx:158-167,200-213`, `ChatMessage.tsx:120-156`, etc.) — decorative SVGs lack `aria-hidden="true"`. Grep shows only **9 `aria-hidden` usages** across the entire codebase; many of these SVGs are inside aria-labelled parents so they're functionally fine, but standalone decorative ones (e.g. the chevrons after link text) should be hidden from AT.
- [medium] `pages/contact.tsx:339-374` — disabled social links use `opacity-50 cursor-not-allowed` and `onClick` `preventDefault` but remain in tab order. They have no `aria-disabled`. (Set `aria-disabled="true"` and `tabIndex={-1}`, or omit the anchor entirely when no URL is present.)

### Low

- [low] `pages/articles/[topic]/[slug].tsx:166-172` — `<iframe>` for video embed has no `title` attribute (WCAG 2.4.1).
- [low] `components/Footer.tsx:201-212` and `components/Header.tsx:89-98` — link / nav items use `onMouseEnter`/`onMouseLeave` to mutate inline `style.color`. There is no corresponding `onFocus`/`onBlur` so keyboard users get no equivalent hover-state feedback. (Refactor to `:hover` / `:focus-visible` CSS so both pointers and keyboard get the same affordance.)

---

## B. Performance

### High

- [high] `styles/globals.css` is **930 lines** and ships on every route (`pages/_app.tsx:35`). Every visitor downloads the Liquid Heat + Supernova tokens, all utility classes (`.glass`, `.glass-card`, `.glow-*`, `.gradient-text-*`, `.btn-*`, `.card`, `.badge-*`), and the heading animations even on routes that never use them. (Split into route-scoped CSS modules or extract Liquid Heat tokens — they're only used in `_design/*` per the line-678 comment.)
- [high] `components/admin/AboutSettingsSection.tsx` is **1,084 lines** in a single file. The admin bundle ships this whenever any admin page loads. (Code-split per settings tab; the file is already a candidate for the `useSettingsForm` refactor tracked in CONTEXT.md.)
- [high] `components/GitHubContributionGraph.tsx` is **630 lines** and dynamically imported on the home page — that's correct — but the component itself eagerly imports `react-activity-calendar` and recharts-like helpers internally. Verify that this doesn't pull a large sync dependency into the dynamic chunk. (I cannot confirm without `next build --profile` output; flagging for investigation.)
- [high] `pages/_app.tsx:98-103` — `document.addEventListener("mouseenter", handler, true)` runs on every page. The handler calls `router.prefetch(href)` for every link in the DOM as the cursor passes over. On large pages (articles, projects) this can fire dozens of prefetches; Next.js already provides per-`<Link>` prefetching on intersection. (Either remove this redundant listener or debounce per-href.)

### Medium

- [medium] `pages/articles/index.tsx:151-160` — `<Image fill>` inside each article card list has no `loading="lazy"` (defaults to lazy in next/image, but the implicit behaviour is easy to break). Cover images on the article-list page are below the fold past row 2; explicit `loading="lazy"` would document intent.
- [medium] `pages/articles/[topic]/[slug].tsx:152-159` — cover image has `priority`, good. But the same component also renders the article markdown that may contain `<Image width={800} height={400}>` inline (line 259-265) with no `loading="lazy"` / `sizes`, and no real width/height when the source markdown uses larger images.
- [medium] `components/HeroSection.tsx:74-77` — `setTimeout(setAnimationReady, 3300)` blocks the typing animation for 3.3 s on first visit. CLS / time-to-interactive impact for the LCP on the home page. (Document the 3.3 s as load-bearing for the supernova flash, or trim.)
- [medium] `pages/_app.tsx:35-36` — global `react-toastify/dist/ReactToastify.css` plus `styles/toast.css` are loaded eagerly even on routes that never trigger a toast (toasts are admin-and-chat-only). Defer via dynamic import.

### Low

- [low] `components/_design/HeroV2.tsx`, `components/_design/FluidHeatShader.tsx`, `components/_design/ProjectDetailV2.tsx` — `_design/*` is route-noindex'd per `pages/_app.tsx:108-125`, but the files still live in the same `components/` tree and any incorrect import would pull them into the production bundle. Consider moving to a separate package boundary or naming convention enforced by lint.
- [low] No `<link rel="preconnect">` for Bedrock/Cal.com/external image hosts. The chat endpoint is internal, so this is moot for first-paint perf.

---

## C. UX

### High

- [high] `components/HeroSection.tsx:326-350` — "Explore" scroll button targets a nonexistent `#services` anchor (verified above). Users tabbing through the hero land on a control that does nothing. (Critical regression; either remove or rewire.)
- [high] `components/Chat/ChatPanel.tsx:140-217` — no aria-live region on the message list, no Escape-to-close. Streaming messages render but screen-reader users won't know. Keyboard users have no way to dismiss without clicking the X. The textarea has `disabled={loading}` (line 191) which the Vercel guidelines explicitly discourage: "keep submit buttons enabled until requests start". (Allow typing the next question while assistant is still streaming.)
- [high] `components/Articles/NewsletterSubscription.tsx:62-69` and `components/Articles/PostComments.tsx:358-364` — submit buttons go to `disabled` immediately on `setStatus("loading")`. OK for once-only forms, but neither shows an inline error position (errors are appended to the form at lines 71-75 / 366-370), so the user has to scroll to find the issue. No autofocus on first invalid field per the Vercel guideline "focus first error on submit".

### Medium

- [medium] `pages/contact.tsx:224-238` — loading state shows "Loading contact info..." which uses `...` instead of `…` (the guideline says: "end loading states with …"). Same in `pages/admin/login.tsx:108` ("Logging in..."), `components/Articles/NewsletterSubscription.tsx:67` ("Subscribing..."), `components/Articles/PostComments.tsx:194,363` ("Posting...", "Submitting..."). 10+ occurrences. (Replace with `…` ellipsis character.)
- [medium] Placeholder text uses `...` not `…` across many forms (e.g. `pages/articles/index.tsx:72` "Search articles...", `components/Articles/PostComments.tsx:181` "Write a reply...", `components/admin/ImageUploader.tsx:192` "Enter image URL...", etc.). 8+ occurrences.
- [medium] `components/Footer.tsx:201-212` and `components/Header.tsx:89-98` — link affordances are *only* visual hover (inline style mutation); no focus equivalent. Keyboard users get no feedback on Tab.
- [medium] `pages/contact.tsx:339-374` — disabled social links: only visual affordance is `opacity-50`. Per "color-only meaning" guideline, also need a textual cue or `aria-disabled`.
- [medium] `components/Project/ProjectCard.tsx:140-145` and `components/FeaturedProjects.tsx:282-289` — "Featured" badge is meaningful information conveyed via a star icon + the word "Featured". OK for sighted users; the icon should be `aria-hidden="true"` so the label isn't read twice.
- [medium] `pages/projects.tsx:38` — initial state hydrates 100% of the projects list to client state; "infinite scroll" then loads more from that already-loaded array. Real infinite scroll would not block initial paint. Empty state, error state, and skeleton are all present, though, so the UX flow is otherwise solid.
- [medium] `components/admin/ToastProvider.tsx` (referenced from `_app.tsx:131`) — toasts at `position="bottom-left"` (admin) and on the public layout (`_app.tsx:180`). For ChatWidget at `bottom-6 right-6` (`ChatWidget.tsx:15`), toasts won't collide, but the ToastContainer is rendered for non-admin layouts too with no opt-out — the chat feedback toast at `ChatMessage.tsx:51-53` is the only consumer outside admin.

### Low

- [low] `components/RecentActivity.tsx:197-208` — each activity item title is a `<Link>` (good) but the surrounding `<div>` has no `tabIndex`; only the link is focusable. That's fine, but there's no heading element at all for each item — just `<p>`. Adds noise to a screen-reader scan.
- [low] `pages/contact.tsx:118-127` — `mailto:` link is the only fallback for the contact card; no formal contact form (which `CONTEXT.md` describes as intentional — the funnel is via chat or Cal.com booking).

---

## D. Semantic HTML

### Medium

- [medium] `pages/admin/*` pages contain `<main>` (`components/admin/AdminLayout.tsx:13`) but the admin layout has no `<header>` element wrapping the page title (`<h1>` is bare inside `<main>`). The page would benefit from a proper `<header>` landmark to match `pages/_app.tsx` default layout.
- [medium] `components/admin/AdminSidebar.tsx:46-94` — sidebar contains `<nav>` (good, line 64) but the overall sidebar `<div>` (line 53) is itself a navigation landmark and could be `<aside>`. The mobile-overlay `<div onClick={() => setIsOpen(false)}>` at line 47 has no keyboard equivalent.
- [medium] `components/Header.tsx:54-184` — `<header>` and `<nav>` are correctly used. Mobile menu at line 151-181 is positioned with `pointer-events: none` when closed but `<Link>` children remain in tab order regardless (the `pointer-events-none` only affects pointer events, not Tab). (Add `aria-hidden={!isMenuOpen}` and `tabIndex={-1}` on hidden links, or unmount the panel.)
- [medium] `components/RecentActivity.tsx:156-235` — activity items render as a `<div>` with a `<Link>` for the title. Each activity is content-bearing; `<article>` or `<li>` inside a `<ol>` would model it correctly. (Compare to `components/Project/ProjectCard.tsx` which does use `<article>`.)

### Low

- [low] `pages/about.tsx:144-226` — every section uses `<section id="section-…">` (good) but no section has an `aria-labelledby` pointing at its heading. The child components do render the heading; adding `aria-labelledby` would tighten landmark navigation.
- [low] `pages/articles/[topic]/[slug].tsx:101-285` — `<article>` is used. `<header>` for the metadata block is also used (good). However `<PostComments>` rendered at line 284 produces an `<h2>` that's a sibling of the article's content — appropriate as a section heading, but currently lives *inside* the `<article>`, which makes it appear to be part of the post. (Move comments outside `<article>` or wrap in their own `<section>`.)

---

## E. Cross-cutting / config hygiene

### Medium

- [medium] `pages/_document.tsx:5-15` — `<Html lang="en">` is set (good) but no `color-scheme: dark` meta or CSS root style. The site is dark-themed unconditionally; setting `color-scheme: dark` on `<html>` (or `style={{ colorScheme: 'dark' }}`) ensures native form controls (selects, scrollbars) render dark, matching the design. Currently `<select>` elements (e.g. `pages/projects.tsx:280`, `pages/articles/index.tsx:82`) will look light-themed on macOS / Windows.
- [medium] `pages/_app.tsx:154` — `<meta name="theme-color" content="#bb1313">`. The site's actual primary is `#e85d04`. The theme-color hex doesn't match any token in `styles/globals.css`. (Sync.)
- [medium] No viewport meta is set in `pages/_document.tsx`; it's only injected by `components/SEO.tsx:26` *if* a page renders `<SEO>`. Admin and design pages don't, so they render without `width=device-width`. (Move viewport to `_document.tsx` Head.)
- [medium] **34 occurrences of `transition: all`** found across components (e.g. `pages/contact.tsx:339`, `pages/admin/login.tsx:84,99`, `components/Header.tsx:56,70,84,130,136,141,152,170`, `components/Footer.tsx:195`, `components/HeroSection.tsx:306`, `components/ui/Button.tsx:86`, `components/ui/Card.tsx:98`, `components/Articles/PostLikeButton.tsx:86`, `components/About/AboutHero/AboutHero.tsx:42`, etc.). Guideline says "never use `transition: all` — animate only `transform` and `opacity`". This is a hot-path perf concern because it triggers transitions on every animatable property (color, background, border, shadow, etc.).
- [medium] **59 occurrences of `outline-none` / `focus:outline-none`** in components & pages but only **2 occurrences of `focus-visible:*`** in source (one in `components/ui/Button.tsx:88`, one in `styles/globals.css:231` covering all elements). The single global `:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px }` in `globals.css:231` partially mitigates this — but every `focus:outline-none` actively removes that style on `:focus`, and many inputs only replace it with a `focus:border-[var(--color-primary)]` (a 1px border-color change, well below WCAG 2.4.7's "minimum 3:1 against adjacent colors, minimum 2px thick" guidance). Visible focus is a critical a11y requirement.

### Low

- [low] `pages/articles/[topic]/[slug].tsx:170` — uses `frameBorder="0"` which is deprecated HTML; should be omitted or replaced with `style={{ border: 0 }}`.
- [low] No `prefers-color-scheme` media query — site is dark-only, intentional per the design vocabulary (Supernova / Liquid Heat).
- [low] CSS reduced-motion handling at `styles/globals.css:608` is broad (sets `animation-duration: 0.01ms !important` on `*`). This is the standard pattern and works, but it doesn't disable JS-driven animations (GSAP). Each component checks `getPrefersReducedMotion()` independently — verified for `HeroSection.tsx:84`, `RecentActivity.tsx:262`, `ProjectCard.tsx:26`, `projects.tsx:52`, `contact.tsx:97`. Pattern is consistent.

---

## Top-10 fix priority (for `/to-issues`)

These are ordered by impact × ease. Each bullet is one independently-grabbable issue.

1. **Add `name` + `autoComplete` + associated `<label>` to every public form input** — login (`pages/admin/login.tsx:74-100`), newsletter (`components/Articles/NewsletterSubscription.tsx:53`), comments (`components/Articles/PostComments.tsx:172-349`), articles search/filters (`pages/articles/index.tsx:70-130`), projects sort (`pages/projects.tsx:280,296`). [critical accessibility + autofill regression]
2. **Make `<article>` project / resource cards proper `<Link>` navigation** — fix `components/Project/ProjectCard.tsx:99-108`, `components/FeaturedProjects.tsx:215-232`, `components/RecentResources.tsx:182-204`. Removes anti-pattern `<article onClick>`, restores middle-click / cmd-click, eliminates manual `onKeyDown` wiring, and removes redundant `role="article"`. [high accessibility + UX]
3. **Fix the broken "Explore" scroll button** in `components/HeroSection.tsx:326-350` — target `#services` does not exist. Either remove the affordance or point it at `#recent-activity`. [high UX regression — feature is non-functional]
4. **Harden the chat dialog** (`components/Chat/ChatPanel.tsx:140-217`): add `aria-modal="true"`, Escape-to-close, focus trap on open, `aria-live="polite"` on the message list, and stop disabling the textarea while the assistant streams. [high accessibility + UX]
5. **Replace 34 `transition: all` usages with `transition-[transform,opacity,color,...]`** — start with `components/ui/Button.tsx:86`, `components/ui/Card.tsx:98`, `components/Header.tsx`, `components/Footer.tsx`. [high performance — paid by every animated UI element]
6. **Restore visible focus on form controls** — audit the 59 `focus:outline-none` usages and add explicit `focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]` (or equivalent) on each. The global `globals.css:231` `:focus-visible` style is overridden by every input that has `focus:outline-none`. [high accessibility — WCAG 2.4.7]
7. **Split `styles/globals.css` (930 LOC) by route / concern** — extract Liquid Heat tokens (only used in `_design/*`), per-page utilities, and reduce-motion handlers. Currently every visitor downloads tokens for routes they never load. [high performance]
8. **Fix the heading hierarchy** in `components/Project/ProjectDetail.tsx:129` (h1 → h3 → h2) and the ReactMarkdown `h1` override at `pages/articles/[topic]/[slug].tsx:211` (renders an h1 inside an article that already owns h1). [medium accessibility + SEO]
9. **Set `color-scheme: dark` on `<html>` and move viewport meta to `_document.tsx`** — native `<select>` controls currently render light-themed against the dark site; admin / design pages without `<SEO>` ship without the viewport meta. [medium UX hygiene]
10. **Modal Escape / focus-trap pattern** — extract a shared `useDialog()` hook and apply to `components/admin/shared/Modal.tsx`, `components/admin/KeyboardShortcutsHelp.tsx`, `components/admin/ProjectPreview.tsx`. All three modals can currently only be dismissed by pointer. [medium accessibility]

---

## Severity totals

| Severity | Count |
| --- | --- |
| critical | 4 |
| high | 16 |
| medium | 26 |
| low | 8 |
| **Total** | **54** |

## What I could not verify without running the dev server

- Real CSS bundle size of `styles/globals.css` after Tailwind v4 purges (line 930 source ≠ shipped bytes).
- Whether `react-activity-calendar` is split into the dynamic chunk for `GitHubContributionGraph` or pulled into the home page.
- Actual color contrast of the orange-on-black `--color-primary: #e85d04` on `--color-bg-dark: #000` — the CSS comment on `--color-text-muted` claims 5.5:1 but only for `#8a8a8a`. (Use a Lighthouse pass.)
- Whether the GSAP-driven IntersectionObserver in `pages/about.tsx:75-91` works correctly with `prefers-reduced-motion: reduce` (the surrounding code returns early but the observer is still set up).
- LCP candidate identification on the home page — likely the hero `<h1>` after the 3.3 s supernova delay (`components/HeroSection.tsx:74-77`).
