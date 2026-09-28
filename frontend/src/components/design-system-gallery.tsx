import { GameControllerIcon, PlusIcon } from "@phosphor-icons/react";
import { useState } from "preact/hooks";
import { useLanguage } from "../i18n/i18n";
import type { PlannerTab } from "../services/planner-storage";
import type {
  ListGame,
  PlanningMode,
  ScheduleAlgorithm,
  ScheduleResponse,
  WeeklyAvailability,
} from "../types";
import { AsobiBrand } from "./asobi-brand";
import { GameCartridge } from "./game-cartridge";
import { GameListView } from "./game-list-view";
import { GameRoute } from "./game-route";
import { PlannerControls } from "./planner-controls";
import { PlannerTabs } from "./planner-tabs";
import { ScheduleView } from "./schedule-view";
import { Button, Input } from "./ui";

const samples: ListGame[] = [
  {
    igdb_id: 7346,
    name: "Hollow Knight",
    app: 367520,
    hours: 27.5,
    year: 2017,
    genre: "Adventure",
  },
  {
    igdb_id: 113112,
    name: "Hades",
    app: 1145360,
    hours: 22,
    year: 2020,
    genre: "Roguelike",
  },
  {
    igdb_id: 26226,
    name: "Celeste",
    app: 504230,
    hours: 8.5,
    year: 2018,
    genre: "Platform",
  },
].map(({ app, hours, year, genre, ...game }) => ({
  ...game,
  cover_url: `https://cdn.cloudflare.steamstatic.com/steam/apps/${app}/library_600x900.jpg`,
  logo_url: `https://cdn.cloudflare.steamstatic.com/steam/apps/${app}/logo.png`,
  hero_url: `https://cdn.cloudflare.steamstatic.com/steam/apps/${app}/library_hero.jpg`,
  summary: "",
  genres: [genre],
  platforms: ["PC (Microsoft Windows)"],
  release_year: year,
  hltb_status: "resolved",
  hltb_match_name: game.name,
  main_story_hours: hours,
  main_extra_hours: hours * 1.5,
  completionist_hours: hours * 2,
}));

export function DesignSystemGallery() {
  const { language, setLanguage, t } = useLanguage();
  const [games, setGames] = useState(samples);
  const [activeTab, setActiveTab] = useState<PlannerTab>("games");
  const [availability, setAvailability] = useState<WeeklyAvailability | null>({
    days: [{ day_of_week: 0, hours: 2, start_hour: 20, start_minute: 0 }],
  });
  const [startDate, setStartDate] = useState("2026-10-12");
  const [planningMode, setPlanningMode] = useState<PlanningMode>("weekly");
  const [finishByDate, setFinishByDate] = useState<string | null>(null);
  const [maxSessionHours, setMaxSessionHours] = useState(4);
  const [algorithm, setAlgorithm] = useState<ScheduleAlgorithm>("sequential");
  const [schedule, setSchedule] = useState<ScheduleResponse>({
    total_hours: 6,
    estimated_end_date: "2026-10-14",
    sessions: samples.map((game, index) => ({
      game_name: game.name,
      date: `2026-10-${12 + index}`,
      start_time: "20:00",
      duration_hours: 2,
    })),
  });
  const reorder = (from: number, to: number) =>
    setGames((items) => {
      const next = [...items];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  return (
    <div class="asobi-shell" id="top">
      <header class="asobi-header">
        <AsobiBrand />
        <nav>
          <a href="/">Planner ↗</a>
        </nav>
        <select
          aria-label={t.language.label}
          value={language}
          onChange={(e) =>
            setLanguage(e.currentTarget.value as typeof language)
          }
        >
          <option value="en">English</option>
          <option value="pt-BR">Português (Brasil)</option>
        </select>
      </header>
      <main class="asobi-gallery">
        <p class="ui-label">Asobi / Design system</p>
        <h1>Components & states</h1>
        <p>General Sans + Martian Mono · 0123456789 · ÁÉÍÓÚ ç ã</p>
        <section>
          <h2>Surfaces & signals</h2>
          <div class="asobi-swatches">
            {[
              "surface",
              "muted",
              "accent",
              "game-tone-1",
              "game-tone-2",
              "game-tone-3",
              "game-tone-4",
            ].map((token) => (
              <div
                key={token}
                class="asobi-swatch"
                style={{ background: `var(--${token})` }}
              >
                {token}
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2>Controls & states</h2>
          <div class="asobi-gallery-controls">
            <Button variant="primary">
              <PlusIcon />
              {t.asobi.library}
            </Button>
            <Button>Secondary</Button>
            <Button disabled>Disabled</Button>
            <Button data-feedback="success">Success</Button>
          </div>
          <label htmlFor="gallery-input">
            <span class="ui-label">Input</span>
            <Input id="gallery-input" placeholder="Hollow Knight" />
          </label>
          <p class="planner-error" role="alert">
            {t.app.scheduleFailed}
          </p>
          <p class="planner-inline-notice">{t.schedule.finishByRequired}</p>
        </section>
        <PlannerTabs
          activeTab={activeTab}
          onChange={setActiveTab}
          games=<section class="asobi-library">
            <div class="asobi-section-heading">
              <h2>
                <GameControllerIcon />
                {t.asobi.library}
              </h2>
            </div>
            <GameListView
              name="Weekend collection"
              games={games}
              onRemoveGame={(id) =>
                setGames(games.filter((game) => game.igdb_id !== id))
              }
              onSelectGameTime={(index, category) =>
                setGames(
                  games.map((game, i) =>
                    i === index
                      ? { ...game, selected_hltb_category: category }
                      : game,
                  ),
                )
              }
              onRetryGame={() => undefined}
              onMoveGame={(index, direction) =>
                reorder(index, index + direction)
              }
              onReorderGames={reorder}
              onRenameList={() => undefined}
            />
          </section>
          availability={
            <PlannerControls
              availability={availability}
              startDate={startDate}
              planningMode={planningMode}
              finishByDate={finishByDate}
              maxSessionHours={maxSessionHours}
              algorithm={algorithm}
              onAvailability={setAvailability}
              onStartDate={setStartDate}
              onPlanningMode={setPlanningMode}
              onFinishByDate={setFinishByDate}
              onMaxSessionHours={setMaxSessionHours}
              onAlgorithm={setAlgorithm}
            />
          }
          schedule={
            <div class="asobi-result">
              <GameRoute
                games={games}
                schedule={schedule}
                algorithm={algorithm}
                isGenerating={false}
                error=""
                onReorder={reorder}
              />
              <div class="asobi-agenda">
                <ScheduleView
                  games={games}
                  schedule={schedule}
                  onScheduleChange={setSchedule}
                  onDownloadIcal={async () => true}
                  onCopyCalendarUrl={async () => true}
                />
              </div>
            </div>
          }
        />
        <details class="asobi-gallery__edge-cases">
          <summary>Missing artwork, long titles & unavailable duration</summary>
          <GameCartridge
            game={{
              ...samples[0],
              name: "The Legend of a Very Long Game Title: Definitive Anniversary Collection",
              cover_url: "",
              hero_url: "",
              main_story_hours: null,
              hltb_status: "unresolved",
            }}
          />
          <GameCartridge
            game={{
              ...samples[1],
              cover_url: "/missing-gallery-artwork.jpg",
              hero_url: "",
              hltb_status: "loading",
            }}
          />
        </details>
      </main>
    </div>
  );
}
