# Asobi frontend

The visual system adapts Hon’s numbered image cards, flat controls, compact/expanded route, and dashboard proportions. Asobi uses a white/orange/cool-gray identity and keeps game imagery secondary to readable titles.

## Editing the system

- `frontend/src/styles/design-system.css` owns fonts, primitive/semantic tokens, component rules, states, motion and responsive layouts. `index.css` imports Tailwind and this file.
- `GameCartridge` renders compact game spines with background artwork and no platform information. Library and route order markers share circular station tokens; `game-visuals.ts` assigns stable ID-based pastel tokens and matches session names only when unique.
- `PlannerTabs` presents Pick games → Schedule → Result, with keyboard navigation and back/continue controls. Panels stay mounted to preserve drafts. `PlannerControls` owns the second panel; `GameRoute` and `ScheduleView` show the final result. `use-planner.ts` owns application operations and persistence.
- `/?design-system` loads only in development. Its examples include real library/route/agenda components, editable/reorderable samples, missing/broken images and long titles.
- General Sans, Martian Mono and their licenses live in `public/fonts`. The 遊 SVG contains paths from Noto Sans JP; it requires no Japanese font on the device.

Breakpoints live together at the end of the stylesheet (480/768/1200px). CSS custom properties cannot be used directly in media conditions, so these are documented literal thresholds. The page has a maximum width of 1440px, with game selection and the result route constrained to 1024px for readability. Controls use 1, 2 or 4 columns. Ordinary interactive targets are at least 44px; the dense timetable has equivalent explicit period controls.

## Compatibility

Planner/language storage keys are unchanged. The existing `activeTab` values map to games, scheduling settings and the result; the selected panel is restored on reload. Old theme preferences do not affect the light-only UI. No domains, backend identifiers or infrastructure were renamed. Calendar downloads use `asobi.ics` and send the edited sessions to the existing API. Session dates are never attributed to same-name editions ambiguously.

## Verification

- Frontend unit/integration suite covers legacy state restoration, backlog switching, HLTB categories, search/editions, grouped imports, planning modes, availability editing, session movement/export, route ordering and ambiguous names.
- TypeScript, Biome, dependency audit and production build pass. The component gallery is excluded from the production bundle.
- Browser review at 360, 768, 1024 and 1440px covered responsive composition, PT-BR/English, compact/expanded route, selected controls, missing images and long titles. No page-level horizontal overflow was observed. Reduced-motion and focus rules are centralized in the stylesheet.
- External catalog/scheduling contracts were exercised with test doubles; live third-party credentials were not used for this validation.
- Backend suite: 130 passed, 1 skipped, 1 pre-existing failure in `test_schedule_request_start_date_uses_a_factory`. It compares bound builtin method identity with `is`, which fails on the installed Python 3.14.6. Existing backend working-tree changes were left intact.
