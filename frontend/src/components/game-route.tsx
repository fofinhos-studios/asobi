import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowsOutSimpleIcon,
  DotsSixVerticalIcon,
  PathIcon,
} from "@phosphor-icons/react";
import { useState } from "preact/hooks";
import { useLanguage } from "../i18n/i18n";
import type { ListGame, ScheduleAlgorithm, ScheduleResponse } from "../types";
import { GameCartridge } from "./game-cartridge";
import { gameSessions, gameVisualStyle } from "./game-visuals";
import { Button } from "./ui";

interface Props {
  games: ListGame[];
  schedule: ScheduleResponse | null;
  algorithm: ScheduleAlgorithm;
  isGenerating: boolean;
  error: string;
  onReorder: (source: number, target: number) => void;
}

export function GameRoute({
  games,
  schedule,
  algorithm,
  isGenerating,
  error,
  onReorder,
}: Props) {
  const { language, t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [dragged, setDragged] = useState<number | null>(null);
  const date = (value: string) =>
    new Intl.DateTimeFormat(language, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(`${value}T12:00:00`));
  return (
    <aside
      class="asobi-route"
      id="schedule"
      tabIndex={-1}
      aria-labelledby="route-heading"
    >
      <div class="asobi-section-heading">
        <h2 id="route-heading">
          <PathIcon aria-hidden="true" />
          {t.asobi.schedule}
        </h2>
        {games.length > 0 && (
          <Button
            size="sm"
            aria-expanded={expanded}
            aria-controls="game-route"
            onClick={() => setExpanded(!expanded)}
          >
            <ArrowsOutSimpleIcon aria-hidden="true" />
            {expanded ? t.asobi.collapse : t.asobi.expand}
          </Button>
        )}
      </div>
      <div class="asobi-route__summary" aria-live="polite">
        {isGenerating ? (
          <p>{t.schedule.generating}…</p>
        ) : schedule ? (
          <>
            <span class="ui-label">{t.schedule.estimatedFinish}</span>
            <strong>
              {schedule.estimated_end_date
                ? date(schedule.estimated_end_date)
                : "—"}
            </strong>
            <p>
              {t.schedule.hours(schedule.total_hours)} ·{" "}
              {t.asobi.sessions(schedule.sessions.length)}
            </p>
          </>
        ) : (
          <p>
            {games.some((game) => game.hltb_status === "loading")
              ? t.app.prerequisites.loading
              : t.asobi.noPlan}
          </p>
        )}
      </div>
      {error && (
        <p class="planner-error" role="alert">
          {error}
        </p>
      )}
      {algorithm === "alternating" && games.length > 0 && (
        <p class="asobi-route__note">{t.asobi.overlap}</p>
      )}
      <ol
        id="game-route"
        class={`asobi-route__list${expanded ? " asobi-route__list--expanded" : ""}`}
      >
        {games.map((game, index) => {
          const sessions = gameSessions(game, games, schedule?.sessions ?? []);
          const plannedHours = sessions.length
            ? sessions.reduce((sum, session) => sum + session.duration_hours, 0)
            : undefined;
          const dates = sessions.map((session) => session.date).sort();
          const ambiguous =
            games.filter(
              (item) => item.name.toLowerCase() === game.name.toLowerCase(),
            ).length > 1;
          return (
            <li
              key={game.igdb_id}
              style={gameVisualStyle(game.igdb_id)}
              class={`asobi-route__stop${dragged === index ? " asobi-route__stop--dragging" : ""}`}
              draggable
              onDragStart={() => setDragged(index)}
              onDragEnd={() => setDragged(null)}
              onDragOver={(e) => {
                if (dragged !== null) e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragged !== null) onReorder(dragged, index);
                setDragged(null);
              }}
            >
              <span class="asobi-route__number">
                <span class="sr-only">{t.asobi.position} </span>
                {String(index + 1).padStart(2, "0")}
              </span>
              <div class="asobi-route__card">
                <GameCartridge
                  game={game}
                  plannedHours={plannedHours}
                  variant={expanded ? "backlog" : "spine"}
                />
                <div class="asobi-route__dates">
                  {dates.length ? (
                    <>
                      <time dateTime={dates[0]}>{date(dates[0])}</time>
                      <span aria-hidden="true"> → </span>
                      <time dateTime={dates[dates.length - 1]}>
                        {date(dates[dates.length - 1])}
                      </time>
                    </>
                  ) : ambiguous ? (
                    t.asobi.ambiguous
                  ) : (
                    "—"
                  )}
                </div>
                <div class="asobi-route__actions">
                  <DotsSixVerticalIcon aria-hidden="true" />
                  <Button
                    size="sm"
                    aria-label={t.list.moveEarlier(game.name)}
                    disabled={index === 0}
                    onClick={() => onReorder(index, index - 1)}
                  >
                    <ArrowUpIcon aria-hidden="true" />
                  </Button>
                  <Button
                    size="sm"
                    aria-label={t.list.moveLater(game.name)}
                    disabled={index === games.length - 1}
                    onClick={() => onReorder(index, index + 1)}
                  >
                    <ArrowDownIcon aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
