import { fireEvent, render, within } from "@testing-library/preact";
import { useState } from "preact/hooks";
import { describe, expect, test, vi } from "vitest";
import type { ListGame, ScheduleResponse } from "../types";
import { AvailabilityForm } from "./availability-form";
import { GameRoute } from "./game-route";
import { gameSessions, gameVisualStyle, sessionGame } from "./game-visuals";
import { PlannerControls } from "./planner-controls";
import { ScheduleView } from "./schedule-view";

const game: ListGame = {
  igdb_id: 1,
  name: "Celeste",
  cover_url: "",
  summary: "",
  genres: [],
  platforms: [],
  release_year: 2018,
  rating: null,
  hltb_status: "resolved",
  hltb_match_name: "Celeste",
  main_story_hours: 8,
  main_extra_hours: 12,
  completionist_hours: 30,
};
const plan: ScheduleResponse = {
  sessions: [
    {
      game_name: "Celeste",
      date: "2026-10-01",
      start_time: "20:00",
      duration_hours: 2,
    },
  ],
  total_hours: 2,
  estimated_end_date: "2026-10-01",
};

describe("Asobi planning surfaces", () => {
  test("only attributes sessions to unique game names and keeps identity after sorting", () => {
    const duplicate = { ...game, igdb_id: 2, name: "CELESTE" };
    expect(sessionGame(plan.sessions[0], [game])).toBe(game);
    expect(sessionGame(plan.sessions[0], [game, duplicate])).toBeUndefined();
    expect(gameSessions(game, [game, duplicate], plan.sessions)).toEqual([]);
    expect([duplicate, game].map((g) => gameVisualStyle(g.igdb_id))[1]).toEqual(
      gameVisualStyle(game.igdb_id),
    );
  });
  test("updates route dates and exported data after editing a session without dragging", () => {
    const download = vi.fn();
    function Harness() {
      const [schedule, setSchedule] = useState(plan);
      return (
        <>
          <GameRoute
            games={[game]}
            schedule={schedule}
            algorithm="sequential"
            isGenerating={false}
            error=""
            onReorder={() => {}}
          />
          <ScheduleView
            games={[game]}
            schedule={schedule}
            onScheduleChange={setSchedule}
            onDownloadIcal={async () => {
              download(schedule);
              return true;
            }}
            onCopyCalendarUrl={async () => true}
          />
        </>
      );
    }
    const view = render(<Harness />);
    fireEvent.change(view.getByLabelText("Move to date: Celeste 1"), {
      target: { value: "2026-10-09" },
    });
    const route = view.getByRole("complementary", { name: "Schedule" });
    expect(route.querySelector('time[datetime="2026-10-09"]')).toBeTruthy();
    expect(route.querySelector('time[datetime="2026-10-01"]')).toBeNull();
    fireEvent.click(view.getByRole("button", { name: /download .ics/i }));
    expect(download).toHaveBeenCalledWith(
      expect.objectContaining({
        estimated_end_date: "2026-10-09",
        sessions: [expect.objectContaining({ date: "2026-10-09" })],
      }),
    );
    fireEvent.click(view.getByRole("button", { name: "Expand" }));
    expect(within(route).getByText("2h")).toBeTruthy();
  });
  test("reorders route cards with keyboard controls and explains alternating dates", () => {
    const second = { ...game, igdb_id: 2, name: "Hades" };
    function Harness() {
      const [games, setGames] = useState([game, second]);
      return (
        <GameRoute
          games={games}
          schedule={null}
          algorithm="alternating"
          isGenerating={false}
          error=""
          onReorder={(from, to) => {
            const next = [...games];
            next.splice(to, 0, ...next.splice(from, 1));
            setGames(next);
          }}
        />
      );
    }
    const view = render(<Harness />);
    fireEvent.click(view.getByRole("button", { name: /move hades earlier/i }));
    expect(
      view.getAllByRole("heading", { level: 3 }).map((el) => el.textContent),
    ).toEqual(["Hades", "Celeste"]);
    expect(view.getByText(/numbers show their order/i)).toBeTruthy();
  });
  test("keeps availability open until configured and exposes deadline controls", () => {
    const onFinish = vi.fn();
    const props = {
      availability: null,
      startDate: "2026-10-01",
      planningMode: "finish_by" as const,
      finishByDate: null,
      maxSessionHours: 2,
      algorithm: "sequential" as const,
      onAvailability: vi.fn(),
      onPlanningMode: vi.fn(),
      onStartDate: vi.fn(),
      onFinishByDate: onFinish,
      onMaxSessionHours: vi.fn(),
      onAlgorithm: vi.fn(),
    };
    const view = render(<PlannerControls {...props} />);
    expect(
      view.getByRole("button", { name: "Hide hours" }).hasAttribute("disabled"),
    ).toBe(true);
    const deadline = view.container.querySelector("#schedule-finish-by-date");
    if (!deadline) throw new Error("Missing deadline control");
    fireEvent.input(deadline, { target: { value: "2026-10-31" } });
    expect(onFinish).toHaveBeenCalledWith("2026-10-31");
    expect(
      view.container.querySelector("#schedule-max-session-hours"),
    ).toBeTruthy();
    view.rerender(
      <PlannerControls
        {...props}
        availability={{
          days: [{ day_of_week: 0, hours: 2, start_hour: 20, start_minute: 0 }],
        }}
      />,
    );
    fireEvent.click(view.getByRole("button", { name: "Hide hours" }));
    expect(
      view
        .getByRole("button", { name: "Edit hours" })
        .getAttribute("aria-expanded"),
    ).toBe("false");
  });
  test("edits availability through explicit controls and rejects overlapping periods", () => {
    const change = vi.fn();
    const view = render(
      <AvailabilityForm
        availability={{
          days: [
            { day_of_week: 0, hours: 1, start_hour: 20, start_minute: 0 },
            { day_of_week: 0, hours: 1, start_hour: 22, start_minute: 0 },
          ],
        }}
        onChange={change}
      />,
    );
    fireEvent.click(view.getByText("Edit periods"));
    const inputs = view.getAllByLabelText("Start time");
    fireEvent.change(inputs[1], { target: { value: "20:30" } });
    expect(view.getByRole("alert")).toBeTruthy();
    expect(change).not.toHaveBeenCalled();
    fireEvent.change(inputs[1], { target: { value: "21:30" } });
    expect(change).toHaveBeenCalledWith({
      days: [
        { day_of_week: 0, hours: 1, start_hour: 20, start_minute: 0 },
        { day_of_week: 0, hours: 1, start_hour: 21, start_minute: 30 },
      ],
    });
  });
});
