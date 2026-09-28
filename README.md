<h1 align="center">
  <img src="frontend/public/asobi-mark.svg" width="32" height="32" alt="" align="absmiddle" />
  <a href="https://asobi.fofinhos.studio/">Asobi</a>
</h1>

<p align="center">Turn your game backlog into a plan you can actually play <img src="https://raw.githubusercontent.com/phosphor-icons/core/main/assets/regular/clock.svg" width="16" height="16" alt="" align="absmiddle" /></p>

Asobi helps you see how much time your list will take and fit it around your real week.

## What you can do

- <img src="https://raw.githubusercontent.com/phosphor-icons/core/main/assets/regular/magnifying-glass.svg" width="16" height="16" alt="" align="absmiddle" /> Search for games and build a personal backlog.
- <img src="https://raw.githubusercontent.com/phosphor-icons/core/main/assets/regular/timer.svg" width="16" height="16" alt="" align="absmiddle" /> See estimated playtime for every game and your whole list.
- <img src="https://raw.githubusercontent.com/phosphor-icons/core/main/assets/regular/calendar-check.svg" width="16" height="16" alt="" align="absmiddle" /> Tell Asobi which days you play and how much time you have.
- <img src="https://raw.githubusercontent.com/phosphor-icons/core/main/assets/regular/shuffle.svg" width="16" height="16" alt="" align="absmiddle" /> Create a schedule that plays games one at a time or rotates between them.
- <img src="https://raw.githubusercontent.com/phosphor-icons/core/main/assets/regular/download-simple.svg" width="16" height="16" alt="" align="absmiddle" /> Download your plan as an iCalendar file to add it to your calendar.

## Data credits

Game information is provided by <img src="https://upload.wikimedia.org/wikipedia/commons/1/19/IGDB_logo.svg" width="32" height="16" alt="" align="absmiddle" /> [IGDB](https://www.igdb.com/). Playtime estimates are sourced from <img src="https://howlongtobeat.com/img/icons/apple-touch-icon-57x57.png" width="16" height="16" alt="" align="absmiddle" /> [HowLongToBeat](https://howlongtobeat.com/). Game logos and hero banners are provided by <img src="https://www.steamgriddb.com/static/img/logo-512.png" width="16" height="16" alt="" align="absmiddle" /> [SteamGridDB](https://www.steamgriddb.com/).

<p align="center">Made with <img src="https://raw.githubusercontent.com/phosphor-icons/core/main/assets/regular/heart.svg" width="16" height="16" alt="love" align="absmiddle" /> by <a href="https://www.fofinhos.studio/">fofinhos.studios</a></p>

## Design system

Asobi adapts Hon's flat dashboard and cards, with an orange and cool-gray identity. General Sans is used for text and Martian Mono for numbers and dates. Fonts are self-hosted; licenses are in `frontend/public/fonts`. The vector 遊 mark is derived from Noto Sans JP.

All visual tokens and component rules live in `frontend/src/styles/design-system.css`. Edit that file to change the palette, type scale, spacing, borders, controls and responsive layout. Game colors are stable references based on IGDB ID, shared across the library, route and agenda. The planner uses three tabs: pick games, schedule your time, and view the result. Breakpoints: 480, 768 and 1200px.

Run the frontend and open `/?design-system` for the development-only component gallery. It uses sample data and never writes to your saved planner. Existing planner and language storage keys remain compatible.

Implementation notes and verification: [Asobi redesign](frontend/DESIGN_SYSTEM.md).
