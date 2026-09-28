import type { ListGame, PlaySession } from "../types";

/** Stable across sorting, backlogs and sessions; all actual colors live in CSS. */
export function gameVisualStyle(id: number) {
  return { "--game-tone": `var(--game-tone-${(Math.abs(id) % 4) + 1})` };
}

/** The current API sends names, not IDs. Never guess between same-name editions. */
export function sessionGame(session: PlaySession, games: ListGame[]) {
  const matches = games.filter(
    (game) => game.name.toLowerCase() === session.game_name.toLowerCase(),
  );
  return matches.length === 1 ? matches[0] : undefined;
}

export function gameSessions(
  game: ListGame,
  games: ListGame[],
  sessions: PlaySession[],
) {
  return sessions.filter(
    (session) => sessionGame(session, games)?.igdb_id === game.igdb_id,
  );
}
