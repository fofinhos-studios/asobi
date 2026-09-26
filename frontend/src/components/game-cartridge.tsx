import {
  CalendarBlankIcon,
  ClockIcon,
  GameControllerIcon,
  TagIcon,
} from "@phosphor-icons/react";
import { useState } from "preact/hooks";
import { type ListGame, getSelectedGameHours } from "../types";
import { PlatformIcons } from "./platform-icons";

interface Props {
  game: ListGame;
  plannedHours?: number;
  startTime?: string;
  variant?: "backlog" | "calendar";
}

function previewCoverUrl(coverUrl: string): string {
  return coverUrl.replace("/t_thumb/", "/t_cover_small/");
}

export function GameCartridge({
  game,
  plannedHours,
  startTime,
  variant = "backlog",
}: Props) {
  const primaryHours = plannedHours ?? getSelectedGameHours(game);
  const primaryLabel =
    plannedHours === undefined ? "PLAY TIME" : "TIME TO PLAY";
  const coverUrl = game.cover_url ? previewCoverUrl(game.cover_url) : "";
  const heroFallbackUrl =
    game.cover_url?.replace("/t_thumb/", "/t_1080p/") ?? "";
  const [failedArtwork, setFailedArtwork] = useState<string[]>([]);
  const heroUrl = [game.hero_url, heroFallbackUrl]
    .filter((url): url is string => Boolean(url))
    .find((url) => !failedArtwork.includes(url));
  const logoUrl =
    game.logo_url && !failedArtwork.includes(game.logo_url)
      ? game.logo_url
      : "";
  const artworkUrls = [
    ...new Set(
      [heroUrl, coverUrl, logoUrl].filter((url): url is string => Boolean(url)),
    ),
  ];
  const [settledArtwork, setSettledArtwork] = useState<string[]>([]);
  const isReady =
    game.hltb_status !== "loading" &&
    artworkUrls.every((url) => settledArtwork.includes(url));

  const markArtworkSettled = (url: string) => {
    setSettledArtwork((current) =>
      current.includes(url) ? current : [...current, url],
    );
  };
  const markArtworkFailed = (url: string) => {
    markArtworkSettled(url);
    setFailedArtwork((current) =>
      current.includes(url) ? current : [...current, url],
    );
  };

  return (
    <div
      class={`game-cartridge game-cartridge--${variant}${
        isReady ? "" : " game-cartridge--loading"
      }`}
      aria-busy={!isReady}
    >
      {!isReady && (
        <output
          class="game-cartridge__loading"
          aria-label={`Loading ${game.name} artwork`}
        >
          <div class="game-cartridge__loading-cover" />
          <div class="game-cartridge__loading-content">
            <span class="game-cartridge__loading-logo" />
            <span class="game-cartridge__loading-line" />
            <span class="game-cartridge__loading-label" />
          </div>
        </output>
      )}

      {heroUrl && (
        <img
          aria-hidden="true"
          class="game-cartridge__hero"
          src={heroUrl}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={() => markArtworkSettled(heroUrl)}
          onError={() => markArtworkFailed(heroUrl)}
        />
      )}
      <div class="game-cartridge__wash" aria-hidden="true" />

      <div class="game-cartridge__cover-frame" aria-hidden={!isReady}>
        {coverUrl && !failedArtwork.includes(coverUrl) ? (
          <img
            class="game-cartridge__cover"
            src={coverUrl}
            alt={`${game.name} cover`}
            loading="lazy"
            decoding="async"
            onLoad={() => markArtworkSettled(coverUrl)}
            onError={() => markArtworkFailed(coverUrl)}
          />
        ) : (
          <div class="game-cartridge__cover game-cartridge__cover--empty">
            NO ART
          </div>
        )}
      </div>

      <div class="game-cartridge__content" aria-hidden={!isReady}>
        <div class="game-cartridge__identity">
          {logoUrl ? (
            <img
              class="game-cartridge__logo"
              src={logoUrl}
              alt={`${game.name} logo`}
              loading="lazy"
              decoding="async"
              onLoad={() => markArtworkSettled(logoUrl)}
              onError={() => markArtworkFailed(logoUrl)}
            />
          ) : null}
          <h3 class="game-cartridge__title planner-backlog-row__title">
            {game.name}
          </h3>
          <PlatformIcons
            class="game-cartridge__platforms"
            platforms={game.platforms}
            maxIcons={2}
            showFallback={false}
          />
        </div>

        <dl class="game-cartridge__label" aria-label={`${game.name} details`}>
          <div>
            <dt>
              <ClockIcon aria-hidden="true" />
              {variant !== "calendar" && <span>{primaryLabel}</span>}
            </dt>
            <dd>{primaryHours.toFixed(1)}H</dd>
          </div>
          {startTime && (
            <div>
              <dt>
                <ClockIcon aria-hidden="true" />
                <span>START</span>
              </dt>
              <dd>{startTime.slice(0, 5)}</dd>
            </div>
          )}
          <div>
            <dt>
              <CalendarBlankIcon aria-hidden="true" />
              <span>YEAR</span>
            </dt>
            <dd>{game.release_year ?? "—"}</dd>
          </div>
          <div>
            <dt>
              <GameControllerIcon aria-hidden="true" />
              <span>MODE</span>
            </dt>
            <dd>{game.selected_hltb_category ?? "main"}</dd>
          </div>
          <div>
            <dt>
              <TagIcon aria-hidden="true" />
              <span>GENRE</span>
            </dt>
            <dd>{game.genres[0] ?? "—"}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
