# AboutSettingsSection refactor plan

**Target:** `components/admin/AboutSettingsSection.tsx` (1084 lines) → < 300 lines.
**Convention precedent:** `components/admin/home/` (`HeroTab.tsx`, `WelcomeTab.tsx`, `GitHubTab.tsx`, `types.ts`, `index.ts`) — mirror it under `components/admin/about/`.

## 1. Sub-features inventory

Confirmed and corrected from the brief. All ranges in `components/admin/AboutSettingsSection.tsx`:

| Sub-feature | Lines | Notes |
|---|---|---|
| Top-of-file ESLint disables | 1–2 | Will go away once we lift the `Record<string, any>` `DynamicEntry` and silence per-file (see Risks). |
| Domain types (`Skill`, `SkillCategory`, `Experience`, `Education`, `Certification`, `Leadership`, `Hobby`, `AboutEditableShape`) | 23–82 | Lift to `components/admin/about/types.ts`. |
| `FieldDef` + `DynamicEntry` (loose record for generic `EntryForm`) | 84–95 | Move with `EntryForm`. |
| `CollapsibleSection` (UI primitive) | 97–120 | Extract → `components/admin/shared/CollapsibleSection.tsx`. Reused 3x in this file and a candidate for other SettingsSections. |
| `EntryForm` (field-def-driven generic; used by Certifications and Leadership) | 122–214 | Extract → `components/admin/about/EntryForm.tsx`. Sole consumer today is AboutSettingsSection, so keep co-located. |
| `ExperienceEntryForm` (Ongoing toggle) | 216–315 | Extract → `components/admin/about/ExperienceEntryForm.tsx`. |
| `EducationEntryForm` (Ongoing + ExpectedGraduation) | 317–443 | Extract → `components/admin/about/EducationEntryForm.tsx`. |
| `expertiseLevels` constant | 445–451 | Move into `SkillsEditor.tsx` (single consumer). |
| `SkillItem` (within-category skill row + nested projects) | 453–569 | Merge into `SkillsEditor.tsx`. |
| `SkillCategoryEntry` (category container) | 571–676 | Merge into `SkillsEditor.tsx` as the category-level component. |
| `ArraySection<T>` (generic CRUD wrapper around `CollapsibleSection`) | 678–734 | Extract → `components/admin/shared/ArraySection.tsx`. Strongest reuse candidate (see §5). |
| `AboutSettingsSection` default export | 737–1084 | The shell. State (743–754), `fetchAboutData` (756–776), `useEffect` (778–780), `handleSave` (782–802), `updateField` (804–809), `certificationFields` + `leadershipFields` (812–831), loading return (833–839), the form JSX (842–1083). |
| Inline Leadership editor | 951–1007 | The lone `CollapsibleSection` that bypasses `ArraySection` (because it adds a Subtitle field above the list). Refactor to use `ArraySection` with a `header` slot — see step 6. |
| Inline Hobbies editor | 1009–1074 | Bespoke string-or-object hobby row. Extract → `components/admin/about/HobbiesEditor.tsx` (kept separate from `ArraySection` because the row shape is bespoke + tolerates legacy string values, see Risks). |

## 2. State + side effects

Single component holds **one** `useState<AboutEditableShape>` (`aboutData`, lines 743–752) plus `loading` (753) and `saving` (754). Persistence:

- **Load**: `GET /api/about` → `pages/api/about/index.ts:4` (public, no auth, returns latest row).
- **Save**: `PUT /api/admin/about` → `pages/api/admin/about.ts:22`. Body must match the eight fields listed at line 24–33 of that handler. The handler **deletes and recreates** the row each save (line 41–54), then fires `content/about.upserted` to Inngest (re-embedding fan-out).
- `onError` prop is the only outward side effect besides `useToast()`.

**Hidden coupling worth flagging before extraction:**

- The Leadership block (951–1007) shares state slot `leadershipExperience` with the inline subtitle (`leadershipSubtitle`). They submit together but render together too. The current code passes both via `updateField`. The extracted `ArraySection` shape must allow rendering a `header` slot to keep this combined.
- The Hobbies block (1015–1062) does **lossy normalization on read** — it accepts both `string` and `{ name; color }` and silently coerces to object on first edit (1028–1031, 1042–1045). The save endpoint stores whatever is sent. Anything reading `hobbies` elsewhere may still see strings until first edit. Don't change this without auditing public consumers.
- `aboutData.professionalSummary` is the **only** field validated server-side (line 36 of the API handler). Empty summary → 400.
- The `DynamicEntry = Record<string, any>` cast at the Certification/Leadership call sites (lines 940, 942, 971, 975) hides that `EntryForm` is type-erased. Extraction is a chance to keep the cast localized to one boundary.

## 3. Concrete extraction candidates

All new files under `components/admin/about/` unless noted. Mirrors the `home/` precedent — short module names, barrel `index.ts`, shared `types.ts`.

| New file | Replaces lines | Public interface |
|---|---|---|
| `components/admin/shared/CollapsibleSection.tsx` | 97–120 | `function CollapsibleSection({ title, children, defaultOpen })`. No deps beyond CSS tokens. |
| `components/admin/shared/ArraySection.tsx` | 678–734 | `function ArraySection<T>({ title, items, onItemsChange, renderItem, addNew, header?, defaultOpen? })`. New optional `header` slot to host the Leadership subtitle. Depends on `CollapsibleSection`. |
| `components/admin/about/types.ts` | 23–95 | Re-exports the eight `AboutEditableShape` field types + `FieldDef`. `DynamicEntry` stays here behind a comment explaining the trade-off. |
| `components/admin/about/EntryForm.tsx` | 122–214 | `function EntryForm({ entry, onChange, onRemove, fields, index, entityName })`. Internal. |
| `components/admin/about/ExperienceEntryForm.tsx` | 216–315 | `function ExperienceEntryForm({ entry, onChange, onRemove, index })`. Preserves `data-testid="ongoing-checkbox"`, `"end-date-input"`, `"ongoing-indicator"`. |
| `components/admin/about/EducationEntryForm.tsx` | 317–443 | `function EducationEntryForm({ entry, onChange, onRemove, index })`. Preserves `data-testid="education-entry-${index}"`, `"education-ongoing-checkbox-${index}"`, `"education-end-date-${index}"`, `"education-expected-grad-${index}"`. |
| `components/admin/about/SkillsEditor.tsx` | 445–676 | Re-export of `SkillCategoryEntry` (renamed `SkillCategoryCard`) + internal `SkillItem`. Single named export `SkillCategoryCard`. Preserves `data-testid="skill-category-${index}"`, `"skill-item-${skillIndex}"`, `"add-skill-to-category-${index}"`, etc. (see test file lines 701–787 for the full list of asserted IDs). |
| `components/admin/about/HobbiesEditor.tsx` | 1009–1074 | `function HobbiesEditor({ hobbies, onChange })`. Encapsulates the string-or-object normalization. |
| `components/admin/about/LeadershipEditor.tsx` | 951–1007 | `function LeadershipEditor({ entries, subtitle, onEntriesChange, onSubtitleChange })`. Internally uses `ArraySection` with `header={<FormField .../>}`. |
| `lib/hooks/useAboutForm.ts` | 743–809 | `useAboutForm({ onError })` → `{ data, loading, saving, updateField, save }`. Encapsulates fetch from `/api/about`, PUT to `/api/admin/about`, toast on success/failure. Keeps the API endpoint as the only knowledge held by the shell. |
| `components/admin/about/index.ts` | — | Barrel: re-export `EntryForm`, `ExperienceEntryForm`, `EducationEntryForm`, `SkillCategoryCard`, `HobbiesEditor`, `LeadershipEditor`, and types. |

Final shell `components/admin/AboutSettingsSection.tsx`: imports the above, calls `useAboutForm`, renders `<form>` with 7 `ArraySection`/editor children. Estimate: ~150–200 lines.

## 4. Refactor commit sequence

Each step compiles, passes `npm test -- AboutSettingsSection.test.jsx`, and is independently reviewable. Test IDs **must not change** — the test file at `__tests__/components/AboutSettingsSection.test.jsx` (1111 lines) asserts on them heavily (see §6).

1. **Extract `CollapsibleSection`** to `components/admin/shared/CollapsibleSection.tsx`. Update the three internal callers (the import, the line 844 `<CollapsibleSection>`, and the two inside `ArraySection`). No behaviour change.
2. **Extract `ArraySection`** to `components/admin/shared/ArraySection.tsx` (depends on step 1). Add `header?: ReactNode` and `defaultOpen?: boolean` props for step 6. Don't yet use them — pure lift.
3. **Create `components/admin/about/types.ts`** and move the domain types from lines 23–95. Adjust imports in the shell. Pure file move.
4. **Extract `EntryForm`** to `components/admin/about/EntryForm.tsx` (depends on step 3). Verify Certifications + Leadership render unchanged.
5. **Extract `ExperienceEntryForm` and `EducationEntryForm`** in one commit (sibling extractions, same pattern, same risk profile). They both already have stable `data-testid` values from the test suite — confirm they survive.
6. **Convert Leadership block to `ArraySection`** with `header` slot (step 2's groundwork). Drop the inline JSX at 951–1007 in favour of `<LeadershipEditor>`. This is the first commit that **changes** structure (introduces `header` slot), so review carefully — the subtitle field, helper text, and the existing add/remove behaviour must match.
7. **Extract `SkillsEditor` (`SkillCategoryCard` + `SkillItem`)** to `components/admin/about/SkillsEditor.tsx`. Largest single commit by LOC, but mechanical.
8. **Extract Hobbies into `HobbiesEditor.tsx`** preserving string-or-object tolerance. No behaviour change.
9. **Extract `useAboutForm` hook** to `lib/hooks/useAboutForm.ts`. Shell now only owns: `useAboutForm` invocation, the loading spinner branch, and the form JSX. Verify the test suite's `fetch` mocks still bind correctly (the hook uses the same `/api/about` GET and `/api/admin/about` PUT).
10. **Cleanup pass**: remove the file-top ESLint disables (lines 1–2) one rule at a time; fix or scope-down any that surface. Update `components/admin/about/index.ts` barrel. Confirm final shell is < 300 lines.

After step 10, run `npm run lint`, `npm test -- AboutSettingsSection`, and `npm run build`. If the project has Playwright admin coverage (`npm run test:e2e`), smoke the `/admin` About tab.

## 5. Generalization

Flagged for later — **don't touch these in this refactor**:

- **`CollapsibleSection`** (shared/) — already a deletion-test win: complexity reappears at three call sites in this file alone. Future use likely in `ContactSettingsSection`, `GlobalSettingsSection`, `ProjectsSettingsSection`.
- **`ArraySection<T>`** (shared/) — the deepest extraction. Generic-add/remove + collapsible wrap pattern recurs verbatim in `ProjectsSettingsSection.tsx:316` lines and likely in `GlobalSettingsSection`. After this refactor, `ArraySection<T>` becomes the obvious primitive for any admin-side "list of editable cards." Two real adapters here (Certifications, Education, Experience, Skill Categories) plus a generalization adapter (Leadership) → real seam, not hypothetical.
- **`useAboutForm`** — a single-endpoint version of a future `useSettingsForm<T>({ getUrl, putUrl, defaults })` flagged in `CONTEXT.md:41`. The `HomeSettingsSection.tsx:44–101` pattern is the same shape (fetch → setState → PUT → toast) but **multi-endpoint** (welcome + page-content). Don't generalize until at least one more SettingsSection follows the single-endpoint shape — `Contact` is the candidate (`components/admin/ContactSettingsSection.tsx`).
- **`FieldDef`-driven `EntryForm`** — could later be its own primitive (`SchemaForm`?). Not worth generalizing now: only Certifications + Leadership use it inside About, and they're both type-erased through `DynamicEntry`. Wait until a third caller appears.

CONTEXT.md already notes both `useSettingsForm<T>` + `<ArraySection>` as open questions (line 41) — this plan delivers the second, partially delivers the first.

## 6. Risks

- **Test IDs are load-bearing.** `__tests__/components/AboutSettingsSection.test.jsx` (1111 lines, ~60 `it()` blocks) asserts on `data-testid` values for `ongoing-checkbox`, `end-date-input`, `ongoing-indicator`, `education-entry-${index}`, `education-ongoing-checkbox-${index}`, `education-end-date-${index}`, `education-expected-grad-${index}`, `skill-category-${index}`, `skill-item-${skillIndex}`, `remove-category-${index}`, `add-skill-to-category-${index}`, `remove-skill-${skillIndex}`, `project-${skillIndex}-${pIdx}`, `add-project-${skillIndex}`. Every extraction must preserve them verbatim.
- **Save body shape is rigid.** `pages/api/admin/about.ts:24–33` destructures exactly eight fields. `useAboutForm.save` must continue to PUT the full `AboutEditableShape`. Extra keys are tolerated (Prisma ignores them) but missing keys silently null out columns server-side (line 46–53 use `|| []` / `|| null` fallbacks).
- **Empty summary = 400.** `pages/api/admin/about.ts:36` rejects on missing/empty `professionalSummary`. Current UI doesn't pre-validate; if the hook later adds client-side validation, mirror this rule exactly.
- **`content/about.upserted` Inngest emit must keep firing** on every save (`pages/api/admin/about.ts:57`). Doesn't affect refactor (server-side), but means a broken save endpoint breaks RAG re-embedding — don't change handler bodies as part of this work.
- **Hobby legacy string format.** Don't normalize on save without checking what `/about` page reads. The current behaviour silently upgrades on edit, leaves alone otherwise.
- **`DynamicEntry = Record<string, any>` casts at the Certification/Leadership call sites** push the type-erasure into the boundary. Confine the cast to inside `EntryForm`'s render — don't let it leak back into the shell after refactor.
- **`SkillCategoryEntry → SkillCategoryCard` rename** if adopted: search-and-replace in tests too (test file references the old name only via `data-testid`, which is unchanged — should be safe).
- **Single load endpoint** — `/api/about` is public and returns the latest row. If the future generalized `useSettingsForm<T>` ever needs admin-only reads, About would migrate too. Out of scope here.

## 7. Target metric

Final `components/admin/AboutSettingsSection.tsx`: **< 300 lines** (~150–200 expected). Verified after step 10 with `wc -l`. If above 300, suspect the form JSX has more inline glue than expected — push more logic into `useAboutForm` or split the form into a `<AboutEditorForm>` co-located in `components/admin/about/`.
