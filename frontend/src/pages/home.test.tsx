import { fireEvent, render, waitFor, within } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import type { CatalogGame, ListGame, ScheduleResponse } from "../types";
import { HomePage } from "./home";

function createJsonResponse(body: unknown): Response {
  return {
    ok: true,
    json: async () => body,
  } as Response;
}

function createSearchResult(overrides: Partial<ListGame> = {}): ListGame {
  return {
    igdb_id: 10,
    name: "Hollow Knight",
    cover_url: "https://images.igdb.com/igdb/image/upload/t_thumb/test.jpg",
    summary: "Bug souls.",
    genres: ["Action"],
    platforms: ["PC"],
    release_year: 2017,
    rating: 95,
    hltb_status: "resolved",
    hltb_match_name: "Hollow Knight",
    main_story_hours: 27.5,
    main_extra_hours: 40,
    completionist_hours: 60,
    ...overrides,
  };
}

function createCatalogResult(
  overrides: Partial<CatalogGame> = {},
): CatalogGame {
  const {
    hltb_status,
    hltb_match_name,
    main_story_hours,
    main_extra_hours,
    completionist_hours,
    ...catalog
  } = createSearchResult(overrides);
  return catalog;
}

describe("HomePage", () => {
  test("opens on game selection with three tabs and no theme controls", () => {
    window.localStorage.setItem("gaming-clock-theme", "dark");
    const view = render(<HomePage />);
    expect(view.getByRole("link", { name: "Asobi" })).toBeTruthy();
    expect(view.getByRole("region", { name: "Your games" })).toBeTruthy();
    expect(view.queryByRole("complementary", { name: "Schedule" })).toBeNull();
    expect(view.getAllByRole("tab")).toHaveLength(3);
    expect(
      view
        .getByRole("tab", { name: "Pick games" })
        .getAttribute("aria-selected"),
    ).toBe("true");
    expect(view.queryByRole("button", { name: /switch.*theme/i })).toBeNull();
  });

  test("restores planner work after the page reloads", async () => {
    const user = userEvent.setup();
    const originalFetch = globalThis.fetch;
    const searchResult = createSearchResult();

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith("/api/games/search?")) {
        return createJsonResponse([createCatalogResult()]);
      }
      if (url === "/api/games/resolve") {
        return createJsonResponse(searchResult);
      }
      throw new Error(`Unexpected fetch call: ${url}`);
    }) as typeof fetch;

    try {
      const firstView = render(<HomePage />);
      const gamesPanel = firstView.getByRole("region", { name: "Your games" });
      const searchInput = within(gamesPanel).getByRole("textbox", {
        name: /search by title/i,
      });

      await user.type(searchInput, "ho");
      await waitFor(() =>
        expect(
          firstView.getByRole("button", {
            name: /add hollow knight to backlog/i,
          }),
        ).toBeTruthy(),
      );
      await user.click(
        firstView.getByRole("button", {
          name: /add hollow knight to backlog/i,
        }),
      );
      await waitFor(() =>
        expect(
          firstView.getByRole("button", {
            name: /use main time: 27h 30m/i,
          }),
        ).toBeTruthy(),
      );

      await user.click(
        firstView.getByRole("button", { name: /rename my backlog/i }),
      );
      await user.clear(firstView.getByLabelText(/backlog name/i));
      await user.type(
        firstView.getByLabelText(/backlog name/i),
        "Weekend games",
      );
      await user.click(firstView.getByRole("tab", { name: "Schedule" }));
      if (firstView.queryByRole("button", { name: /edit hours/i }))
        await user.click(
          firstView.getByRole("button", { name: /edit hours/i }),
        );
      await user.click(
        firstView.getByRole("button", { name: "Monday at 20:00" }),
      );
      await user.click(firstView.getByRole("tab", { name: "Schedule" }));
      await user.selectOptions(
        firstView.getByLabelText(/schedule method/i),
        "alternating",
      );
      await waitFor(() =>
        expect(
          (firstView.getByLabelText(/schedule method/i) as HTMLSelectElement)
            .value,
        ).toBe("alternating"),
      );

      firstView.unmount();
      const reloadedView = render(<HomePage />);

      expect(
        reloadedView.getByRole("tabpanel", { name: "Schedule" }),
      ).toBeTruthy();
      expect(
        reloadedView.getByRole("heading", {
          name: "Weekend games",
          hidden: true,
        }),
      ).toBeTruthy();
      await user.click(reloadedView.getByRole("tab", { name: "Pick games" }));
      expect(
        reloadedView.getByRole("button", {
          name: /use main time: 27h 30m/i,
        }),
      ).toBeTruthy();
      await user.click(reloadedView.getByRole("tab", { name: "Schedule" }));
      if (reloadedView.queryByRole("button", { name: /edit hours/i }))
        await user.click(
          reloadedView.getByRole("button", { name: /edit hours/i }),
        );
      expect(
        reloadedView.getByRole("button", {
          name: "Monday, 1h from 20:00",
        }),
      ).toBeTruthy();
      await user.click(reloadedView.getByRole("tab", { name: "Schedule" }));
      expect(
        (reloadedView.getByLabelText(/schedule method/i) as HTMLSelectElement)
          .value,
      ).toBe("alternating");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("adds the selected IGDB game immediately while its playtime resolves", async () => {
    const user = userEvent.setup();
    const originalFetch = globalThis.fetch;
    const catalogResult = createCatalogResult();
    const resolvedResult = createSearchResult();
    const requests: string[] = [];
    let resolvePlaytime: ((response: Response) => void) | undefined;
    const playtimeResponse = new Promise<Response>((resolve) => {
      resolvePlaytime = resolve;
    });

    globalThis.fetch = (async (
      input: RequestInfo | URL,
      _init?: RequestInit,
    ) => {
      const url = String(input);
      requests.push(url);
      if (url.startsWith("/api/games/search?")) {
        return createJsonResponse([catalogResult]);
      }
      if (url === "/api/games/resolve") {
        return playtimeResponse;
      }
      throw new Error(`Unexpected fetch call: ${url}`);
    }) as typeof fetch;

    try {
      const view = render(<HomePage />);
      const searchInput = within(view.getByRole("main")).getByRole("textbox", {
        name: /search by title/i,
      });
      await user.type(searchInput, "ho");
      await waitFor(() =>
        expect(
          view.getByRole("button", { name: /add hollow knight to backlog/i }),
        ).toBeTruthy(),
      );
      expect(requests).toContain("/api/games/search?query=ho");

      await user.click(
        view.getByRole("button", { name: /add hollow knight to backlog/i }),
      );

      await waitFor(() => expect(requests).toContain("/api/games/resolve"));
      expect(
        within(view.getByRole("main")).getByText(/retrieving playtime/i),
      ).toBeTruthy();
      expect(
        within(view.getByRole("region", { name: "Your games" })).getByText("—"),
      ).toBeTruthy();

      await user.click(view.getByRole("tab", { name: "Schedule" }));
      if (view.queryByRole("button", { name: /edit hours/i }))
        await user.click(view.getByRole("button", { name: /edit hours/i }));
      await user.click(view.getByRole("button", { name: "Monday at 20:00" }));
      await user.click(view.getByRole("tab", { name: "Result" }));
      expect(
        within(view.getByRole("main")).getByText(/getting playtime estimates/i),
      ).toBeTruthy();

      resolvePlaytime?.(createJsonResponse(resolvedResult));

      await user.click(view.getByRole("tab", { name: "Pick games" }));
      await waitFor(() =>
        expect(
          within(view.getByRole("region", { name: "Your games" })).getByText(
            /^27\.5h$/i,
          ),
        ).toBeTruthy(),
      );
      expect(
        within(view.getByRole("region", { name: "Your games" })).getByText(
          /^27\.5h$/i,
        ),
      ).toBeTruthy();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("keeps search results open to add multiple matching games", async () => {
    const user = userEvent.setup();
    const originalFetch = globalThis.fetch;
    const firstGame = createCatalogResult();
    const secondGame = createCatalogResult({
      igdb_id: 11,
      name: "Hollow Knight: Silksong",
    });

    globalThis.fetch = (async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      const url = String(input);
      if (url.startsWith("/api/games/search?")) {
        return createJsonResponse([firstGame, secondGame]);
      }
      if (url === "/api/games/resolve") {
        const game = JSON.parse(String(init?.body ?? "{}")) as CatalogGame;
        return createJsonResponse(
          createSearchResult({
            igdb_id: game.igdb_id,
            name: game.name,
          }),
        );
      }
      throw new Error(`Unexpected fetch call: ${url}`);
    }) as typeof fetch;

    try {
      const view = render(<HomePage />);
      const activePanel = view.getByRole("main");
      const searchInput = within(activePanel).getByRole("textbox", {
        name: /search by title/i,
      });

      await user.type(searchInput, "ho");
      await waitFor(() =>
        expect(
          view.getByRole("button", {
            name: /add hollow knight: silksong to backlog/i,
          }),
        ).toBeTruthy(),
      );

      await user.click(
        view.getByRole("button", { name: /add hollow knight to backlog/i }),
      );

      expect((searchInput as HTMLInputElement).value).toBe("ho");
      expect(
        view.getByRole("button", {
          name: /add hollow knight: silksong to backlog/i,
        }),
      ).toBeTruthy();

      await user.click(
        view.getByRole("button", {
          name: /add hollow knight: silksong to backlog/i,
        }),
      );

      await waitFor(() =>
        expect(
          activePanel.querySelectorAll(
            ".planner-backlog-row .planner-backlog-row__title",
          ),
        ).toHaveLength(2),
      );
      expect(
        within(activePanel).queryByText(
          /choose a playtime for each game\. select main, main \+ extras, or completionist/i,
        ),
      ).toBeNull();

      await user.click(
        within(activePanel).getAllByRole("button", { name: /^remove$/i })[0],
      );

      expect(
        activePanel.querySelectorAll(
          ".planner-backlog-row .planner-backlog-row__title",
        ),
      ).toHaveLength(1);
      expect(
        activePanel.querySelector(".planner-backlog-row__title")?.textContent,
      ).toBe("Hollow Knight: Silksong");
      expect(
        within(activePanel).getByRole("button", { name: /^remove$/i }),
      ).toBeTruthy();
      expect(within(activePanel).queryByText(/^removed$/i)).toBeNull();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("lets each backlog game activate an HLTB time and removes extra card metadata", async () => {
    const user = userEvent.setup();
    const originalFetch = globalThis.fetch;
    const catalogResult = createCatalogResult();
    const resolvedResult = createSearchResult();
    const captured: { request: Record<string, unknown> | null } = {
      request: null,
    };

    globalThis.fetch = (async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      const url = String(input);
      if (url.startsWith("/api/games/search?")) {
        return createJsonResponse([catalogResult]);
      }
      if (url === "/api/games/resolve") {
        return createJsonResponse(resolvedResult);
      }
      if (url === "/api/schedule/generate") {
        captured.request = JSON.parse(String(init?.body ?? "{}")) as Record<
          string,
          unknown
        >;
        return createJsonResponse({
          sessions: [],
          total_hours: 60,
          estimated_end_date: null,
        });
      }
      throw new Error(`Unexpected fetch call: ${url}`);
    }) as typeof fetch;

    try {
      const view = render(<HomePage />);
      const gamesPanel = view.getByRole("region", { name: "Your games" });
      const searchInput = within(gamesPanel).getByRole("textbox", {
        name: /search by title/i,
      });

      await user.type(searchInput, "ho");
      await waitFor(() =>
        expect(
          view.getByRole("button", { name: /add hollow knight to backlog/i }),
        ).toBeTruthy(),
      );
      await user.click(
        view.getByRole("button", { name: /add hollow knight to backlog/i }),
      );

      await waitFor(() =>
        expect(
          view.getByRole("button", { name: /use main time: 27h 30m/i }),
        ).toBeTruthy(),
      );
      expect(
        view.queryByText(
          /choose a playtime for each game\. select main, main \+ extras, or completionist/i,
        ),
      ).toBeNull();
      expect(
        view
          .getByRole("button", { name: /use main time: 27h 30m/i })
          .getAttribute("aria-pressed"),
      ).toBe("true");
      expect(view.queryByText(/playstation/i)).toBeNull();
      expect(view.queryByText(/resolved from/i)).toBeNull();
      expect(within(gamesPanel).getByText(/^27\.5h$/i)).toBeTruthy();

      await user.click(
        view.getByRole("button", {
          name: /use completionist time: 60h/i,
        }),
      );
      expect(
        view
          .getByRole("button", {
            name: /use completionist time: 60h/i,
          })
          .getAttribute("aria-pressed"),
      ).toBe("true");
      expect(within(gamesPanel).getByText(/^60h$/i)).toBeTruthy();

      await user.click(view.getByRole("tab", { name: "Schedule" }));
      if (view.queryByRole("button", { name: /edit hours/i }))
        await user.click(view.getByRole("button", { name: /edit hours/i }));
      await user.click(view.getByRole("button", { name: "Monday at 20:00" }));
      await user.click(view.getByRole("tab", { name: "Result" }));

      await waitFor(() => expect(captured.request).not.toBeNull());
      const requestGames = captured.request?.games as Array<{
        selected_hltb_category?: string;
      }>;
      expect(requestGames[0]?.selected_hltb_category).toBe("completionist");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
  test("renders the dashboard without obsolete landing sections", () => {
    const view = render(<HomePage />);
    const activePanel = view.getByRole("main");

    expect(view.getByRole("link", { name: /skip to planner/i })).toBeTruthy();
    expect(view.getByRole("main")).toBeTruthy();
    expect(
      view.getByRole("heading", {
        level: 1,
        name: /your games/i,
      }),
    ).toBeTruthy();
    expect(view.container.querySelector(".backlog-manager")).toBeTruthy();
    expect(view.getByRole("tab", { name: "Pick games" })).toBeTruthy();
    expect(view.queryByRole("region", { name: "Availability" })).toBeNull();
    expect(view.getByRole("tab", { name: "Result" })).toBeTruthy();
    expect(view.queryByText(/gaming backlog planner/i)).toBeNull();
    expect(view.queryByText(/^overview$/i)).toBeNull();
    expect(within(activePanel).getByText(/find your games/i)).toBeTruthy();
    expect(within(activePanel).queryByText(/^search$/i)).toBeNull();
    expect(
      within(activePanel).queryByText(/enter at least 2 characters/i),
    ).toBeNull();
    expect(
      within(activePanel).getByRole("heading", { name: /my backlog/i }),
    ).toBeTruthy();
    expect(within(activePanel).queryByText(/^backlog$/i)).toBeNull();
    expect(within(activePanel).queryByText(/weekly cadence/i)).toBeNull();
    expect(
      view.queryByRole("complementary", { name: /planner status/i }),
    ).toBeNull();
  });

  test("navigates with tabs without duplicate bottom navigation", async () => {
    const user = userEvent.setup();
    const view = render(<HomePage />);
    expect(view.getByRole("tabpanel", { name: "Pick games" })).toBeTruthy();
    expect(
      view.queryByRole("button", { name: "Set your schedule" }),
    ).toBeNull();
    await user.click(view.getByRole("tab", { name: "Schedule" }));
    expect(view.getByRole("tabpanel", { name: "Schedule" })).toBeTruthy();
    expect(view.queryByRole("region", { name: "Your games" })).toBeNull();
    await user.click(view.getByRole("tab", { name: "Result" }));
    expect(view.getByRole("tabpanel", { name: "Result" })).toBeTruthy();
    expect(view.getByRole("complementary", { name: "Schedule" })).toBeTruthy();
    await user.click(view.getByRole("tab", { name: "Schedule" }));
    expect(view.getByRole("tabpanel", { name: "Schedule" })).toBeTruthy();
  });

  test("supports arrow, Home and End navigation and restores the selected tab", async () => {
    const user = userEvent.setup();
    const view = render(<HomePage />);
    const games = view.getByRole("tab", { name: "Pick games" });
    games.focus();
    await user.keyboard("{ArrowRight}");
    expect(view.getByRole("tab", { name: "Schedule" })).toBe(
      document.activeElement,
    );
    expect(view.getByRole("tabpanel", { name: "Schedule" })).toBeTruthy();
    await user.keyboard("{End}");
    expect(view.getByRole("tab", { name: "Result" })).toBe(
      document.activeElement,
    );
    await user.keyboard("{Home}");
    expect(games).toBe(document.activeElement);
    await user.keyboard("{ArrowLeft}");
    expect(view.getByRole("tab", { name: "Result" })).toBe(
      document.activeElement,
    );
    expect(games.tabIndex).toBe(-1);
    view.unmount();
    const restored = render(<HomePage />);
    expect(restored.getByRole("tabpanel", { name: "Result" })).toBeTruthy();
    expect(restored.queryByRole("region", { name: "Your games" })).toBeNull();
  });

  test("creates a second backlog from the compact backlog manager", async () => {
    const user = userEvent.setup();
    const view = render(<HomePage />);

    await user.click(view.getByRole("button", { name: /manage backlogs/i }));
    await user.type(view.getByLabelText(/new backlog name/i), "Weekend games");
    await user.click(view.getByRole("button", { name: /create backlog/i }));

    expect(view.getByText("My Backlog")).toBeTruthy();
    expect(
      view.getByRole("button", { name: /weekend games, 0 games/i }),
    ).toBeTruthy();
  });

  test("preserves draft state while navigating dashboard sections", async () => {
    const user = userEvent.setup();

    const view = render(<HomePage />);
    let activePanel = view.getByRole("main");

    const searchInput = within(activePanel).getByRole("textbox", {
      name: /search by title/i,
    });
    await user.type(searchInput, "z");
    expect((searchInput as HTMLInputElement).value).toBe("z");

    await user.click(view.getByRole("tab", { name: "Schedule" }));
    if (view.queryByRole("button", { name: /edit hours/i }))
      await user.click(view.getByRole("button", { name: /edit hours/i }));
    await user.click(view.getByRole("tab", { name: "Pick games" }));

    activePanel = view.getByRole("main");
    const restoredSearchInput = within(activePanel).getByRole("textbox", {
      name: /search by title/i,
    });
    expect((restoredSearchInput as HTMLInputElement).value).toBe("z");
  });

  test("initializes start date from the local calendar day instead of UTC ISO date", async () => {
    const user = userEvent.setup();
    const RealDate = globalThis.Date;

    class MockDate extends RealDate {
      constructor(value?: string | number | Date) {
        super(value ?? "2026-03-29T01:30:00.000Z");
      }

      getFullYear() {
        return 2026;
      }

      getMonth() {
        return 2;
      }

      getDate() {
        return 28;
      }

      toISOString() {
        return "2026-03-29T01:30:00.000Z";
      }

      static now() {
        return new RealDate("2026-03-29T01:30:00.000Z").valueOf();
      }
    }

    globalThis.Date = MockDate as unknown as DateConstructor;

    try {
      const view = render(<HomePage />);

      await user.click(view.getByRole("tab", { name: "Result" }));

      expect(
        (
          within(view.getByRole("main")).getByLabelText(
            /start date/i,
          ) as HTMLInputElement
        ).value,
      ).toBe("2026-03-28");
    } finally {
      globalThis.Date = RealDate;
    }
  });

  test("shows loading copy while searching games", async () => {
    const user = userEvent.setup();
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.startsWith("/api/games/search?")) {
        await new Promise((resolve) => window.setTimeout(resolve, 500));
        return createJsonResponse([]);
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    }) as typeof fetch;

    try {
      const view = render(<HomePage />);
      const activePanel = view.getByRole("main");
      const searchInput = within(activePanel).getByRole("textbox", {
        name: /search by title/i,
      });

      await user.type(searchInput, "ha");

      await waitFor(() =>
        expect(view.getByText(/finding games/i)).toBeTruthy(),
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("sends the selected weekly start time when the live schedule updates", async () => {
    const user = userEvent.setup();
    const originalFetch = globalThis.fetch;
    const captured: { request: Record<string, unknown> | null } = {
      request: null,
    };

    const searchResult = createSearchResult();

    const schedule: ScheduleResponse = {
      sessions: [
        {
          game_name: "Hollow Knight",
          date: "2026-03-30",
          start_time: "18:30:00",
          duration_hours: 2.5,
        },
      ],
      total_hours: 2.5,
      estimated_end_date: "2026-03-30",
    };

    globalThis.fetch = (async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      const url = String(input);

      if (url.startsWith("/api/games/search?")) {
        return createJsonResponse([createCatalogResult()]);
      }

      if (url === "/api/games/resolve") {
        return createJsonResponse(searchResult);
      }

      if (url === "/api/schedule/generate") {
        captured.request = JSON.parse(String(init?.body ?? "{}")) as Record<
          string,
          unknown
        >;
        return createJsonResponse(schedule);
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    }) as typeof fetch;

    try {
      const view = render(<HomePage />);
      const gamesPanel = view.getByRole("region", { name: "Your games" });
      const searchInput = within(gamesPanel).getByRole("textbox", {
        name: /search by title/i,
      });

      await user.type(searchInput, "ho");

      await waitFor(() =>
        expect(
          view.getByRole("button", { name: /add hollow knight to backlog/i }),
        ).toBeTruthy(),
      );

      await user.click(
        view.getByRole("button", { name: /add hollow knight to backlog/i }),
      );

      await waitFor(() =>
        expect(
          view.getByRole("button", { name: /use main time: 27h 30m/i }),
        ).toBeTruthy(),
      );

      await user.click(view.getByRole("tab", { name: "Schedule" }));
      if (view.queryByRole("button", { name: /edit hours/i }))
        await user.click(view.getByRole("button", { name: /edit hours/i }));

      const availabilityPanel = view.getByRole("main");
      await user.click(
        within(availabilityPanel).getByRole("button", {
          name: "Monday at 18:30",
        }),
      );
      await user.click(
        within(availabilityPanel).getByRole("button", {
          name: "Monday, 1h from 18:30",
        }),
      );
      await user.keyboard("{Shift>}{ArrowDown}{ArrowDown}{/Shift}");

      await user.click(view.getByRole("tab", { name: "Result" }));

      await waitFor(() => expect(captured.request).not.toBeNull());

      const requestAvailability = captured.request?.availability as {
        days: Array<{
          day_of_week: number;
          hours: number;
          start_hour: number;
          start_minute: number;
        }>;
      };

      expect(requestAvailability.days).toEqual([
        {
          day_of_week: 0,
          hours: 2,
          start_hour: 18,
          start_minute: 30,
        },
      ]);
      expect(
        within(view.getByRole("region", { name: "Session agenda" })).getByText(
          /^18:30$/,
        ),
      ).toBeTruthy();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("shows only the current-list hours and missing schedule prerequisites", async () => {
    const user = userEvent.setup();
    const view = render(<HomePage />);

    expect(
      view.queryByRole("complementary", { name: /planner status/i }),
    ).toBeNull();
    expect(within(view.getByRole("main")).getByText(/^0\.0h$/i)).toBeTruthy();
    expect(view.queryByText(/availability status/i)).toBeNull();

    await user.click(view.getByRole("tab", { name: "Result" }));

    const activePanel = view.getByRole("main");
    expect(
      within(activePanel).getByText(/add games and set your hours/i),
    ).toBeTruthy();
    expect(within(activePanel).getByText(/0 hours per week/i)).toBeTruthy();
  });

  test("schedules available games while naming games without HLTB playtime", async () => {
    const user = userEvent.setup();
    const originalFetch = globalThis.fetch;
    let scheduleGenerated = false;

    const unresolvedGame = createSearchResult({
      hltb_status: "unresolved",
      hltb_match_name: null,
      main_story_hours: null,
      main_extra_hours: null,
      completionist_hours: null,
    });

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.startsWith("/api/games/search?")) {
        return createJsonResponse([createCatalogResult()]);
      }

      if (url === "/api/games/resolve") {
        return createJsonResponse(unresolvedGame);
      }

      if (url === "/api/schedule/generate") {
        scheduleGenerated = true;
        return createJsonResponse({
          sessions: [],
          total_hours: 0,
          estimated_end_date: null,
        });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    }) as typeof fetch;

    try {
      const view = render(<HomePage />);
      const activePanel = view.getByRole("main");
      const searchInput = within(activePanel).getByRole("textbox", {
        name: /search by title/i,
      });

      await user.type(searchInput, "ho");

      await waitFor(() =>
        expect(
          view.getByRole("button", { name: /add hollow knight to backlog/i }),
        ).toBeTruthy(),
      );

      await user.click(
        view.getByRole("button", { name: /add hollow knight to backlog/i }),
      );

      await waitFor(() =>
        expect(
          within(activePanel).getByText(/playtime unavailable/i),
        ).toBeTruthy(),
      );
      expect(
        activePanel.querySelector(".planner-backlog-row__title")?.textContent,
      ).toBe("Hollow Knight");

      await user.click(view.getByRole("tab", { name: "Schedule" }));
      if (view.queryByRole("button", { name: /edit hours/i }))
        await user.click(view.getByRole("button", { name: /edit hours/i }));
      await user.click(view.getByRole("button", { name: "Monday at 20:00" }));
      await user.click(view.getByRole("tab", { name: "Result" }));

      await waitFor(() => expect(scheduleGenerated).toBe(true));
      expect(
        within(view.getByRole("main")).getByText(
          /hollow knight does not have hltb playtime data/i,
        ),
      ).toBeTruthy();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("retries only HLTB fields without replacing saved card artwork", async () => {
    const user = userEvent.setup();
    const originalFetch = globalThis.fetch;
    let resolveAttempt = 0;
    const unresolvedGame = createSearchResult({
      hltb_status: "unresolved",
      hltb_match_name: null,
      main_story_hours: null,
      main_extra_hours: null,
      completionist_hours: null,
    });
    const retryResult = createSearchResult({
      cover_url: "https://example.com/retried-cover.jpg",
      logo_url: "https://example.com/retried-logo.png",
      hero_url: "https://example.com/retried-hero.jpg",
      main_story_hours: 42,
      main_extra_hours: 60,
      completionist_hours: 80,
    });

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith("/api/games/search?")) {
        return createJsonResponse([createCatalogResult()]);
      }
      if (url === "/api/games/resolve") {
        resolveAttempt += 1;
        return createJsonResponse(
          resolveAttempt === 1 ? unresolvedGame : retryResult,
        );
      }
      throw new Error(`Unexpected fetch call: ${url}`);
    }) as typeof fetch;

    try {
      const view = render(<HomePage />);
      const gamesPanel = view.getByRole("region", { name: "Your games" });
      const searchInput = within(gamesPanel).getByRole("textbox", {
        name: /search by title/i,
      });

      await user.type(searchInput, "ho");
      await waitFor(() =>
        expect(
          view.getByRole("button", { name: /add hollow knight to backlog/i }),
        ).toBeTruthy(),
      );
      await user.click(
        view.getByRole("button", { name: /add hollow knight to backlog/i }),
      );
      await waitFor(() =>
        expect(
          within(gamesPanel).getByRole("button", {
            name: /retry hollow knight playtime/i,
          }),
        ).toBeTruthy(),
      );

      const originalCoverUrl = view.container
        .querySelector(".planner-backlog-row .game-cartridge__hero")
        ?.getAttribute("src");

      expect(originalCoverUrl).toBeTruthy();
      await user.click(
        within(gamesPanel).getByRole("button", {
          name: /retry hollow knight playtime/i,
        }),
      );

      await waitFor(() =>
        expect(within(gamesPanel).getByText(/42h main/i)).toBeTruthy(),
      );
      expect(
        view.container
          .querySelector(".planner-backlog-row .game-cartridge__hero")
          ?.getAttribute("src"),
      ).toBe(originalCoverUrl);
      expect(resolveAttempt).toBe(2);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("keeps duplicate add feedback stable without key warnings", async () => {
    const user = userEvent.setup();
    const originalFetch = globalThis.fetch;
    const originalConsoleError = console.error;
    const consoleErrors: unknown[][] = [];

    const searchResult = createSearchResult();

    console.error = (...args: unknown[]) => {
      consoleErrors.push(args);
    };

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.startsWith("/api/games/search?")) {
        return createJsonResponse([createCatalogResult()]);
      }

      if (url === "/api/games/resolve") {
        return createJsonResponse(searchResult);
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    }) as typeof fetch;

    try {
      const view = render(<HomePage />);
      const gamesPanel = view.getByRole("region", { name: "Your games" });
      const searchInput = within(gamesPanel).getByRole("textbox", {
        name: /search by title/i,
      });

      await user.type(searchInput, "ho");

      await waitFor(() =>
        expect(
          view.getByRole("button", { name: /add hollow knight to backlog/i }),
        ).toBeTruthy(),
      );

      await user.click(
        view.getByRole("button", { name: /add hollow knight to backlog/i }),
      );

      await waitFor(() =>
        expect(view.getByRole("heading", { name: /my backlog/i })).toBeTruthy(),
      );

      await user.type(searchInput, "ho");

      await waitFor(() =>
        expect(
          view.getByRole("button", { name: /add hollow knight to backlog/i }),
        ).toBeTruthy(),
      );

      await user.click(
        view.getByRole("button", { name: /add hollow knight to backlog/i }),
      );

      expect(view.getAllByText(/hollow knight/i).length).toBeGreaterThan(0);
      expect(view.getByRole("heading", { name: /my backlog/i })).toBeTruthy();
      expect(
        consoleErrors.some((args) =>
          args.some((arg) => String(arg).toLowerCase().includes("key")),
        ),
      ).toBe(false);
    } finally {
      console.error = originalConsoleError;
      globalThis.fetch = originalFetch;
    }
  });

  test("renders schedule metrics on the home page after generating a schedule", async () => {
    const user = userEvent.setup();
    const originalFetch = globalThis.fetch;

    const searchResult = createSearchResult();

    const schedule: ScheduleResponse = {
      sessions: [
        {
          game_name: "Hollow Knight",
          date: "2026-03-30",
          start_time: "20:00",
          duration_hours: 2.5,
        },
        {
          game_name: "Hollow Knight",
          date: "2026-04-01",
          start_time: "20:00",
          duration_hours: 2,
        },
      ],
      total_hours: 4.5,
      estimated_end_date: "2026-04-03",
    };

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.startsWith("/api/games/search?")) {
        return createJsonResponse([createCatalogResult()]);
      }

      if (url === "/api/games/resolve") {
        return createJsonResponse(searchResult);
      }

      if (url === "/api/schedule/generate") {
        return createJsonResponse(schedule);
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    }) as typeof fetch;

    try {
      const view = render(<HomePage />);
      const gamesPanel = view.getByRole("region", { name: "Your games" });
      const searchInput = within(gamesPanel).getByRole("textbox", {
        name: /search by title/i,
      });

      await user.type(searchInput, "ho");

      await waitFor(() =>
        expect(
          view.getByRole("button", { name: /add hollow knight to backlog/i }),
        ).toBeTruthy(),
      );

      await user.click(
        view.getByRole("button", { name: /add hollow knight to backlog/i }),
      );

      await waitFor(() =>
        expect(
          view.getByRole("button", { name: /use main time: 27h 30m/i }),
        ).toBeTruthy(),
      );

      await waitFor(() =>
        expect(view.getByRole("heading", { name: /my backlog/i })).toBeTruthy(),
      );

      await user.click(view.getByRole("tab", { name: "Schedule" }));
      if (view.queryByRole("button", { name: /edit hours/i }))
        await user.click(view.getByRole("button", { name: /edit hours/i }));
      await user.click(view.getByRole("button", { name: "Monday at 20:00" }));

      await user.click(view.getByRole("tab", { name: "Result" }));

      await waitFor(() =>
        expect(view.container.querySelector("#schedule-heading")).toBeTruthy(),
      );

      const schedulePanel = view.getByRole("region", {
        name: "Session agenda",
      });
      expect(
        within(schedulePanel).getByText(/total planned hours/i),
      ).toBeTruthy();
      expect(within(schedulePanel).getByText(/estimated finish/i)).toBeTruthy();
      const sessionsMetric = within(schedulePanel)
        .getByText(/^sessions$/i)
        .closest<HTMLElement>(".planner-metric");
      expect(sessionsMetric).toBeTruthy();
      if (!sessionsMetric) {
        throw new Error("Sessions metric is missing its metric container");
      }
      expect(within(schedulePanel).getByText(/days to finish/i)).toBeTruthy();
      expect(within(sessionsMetric).getByText(/^2$/)).toBeTruthy();
      expect(within(schedulePanel).getByText(/3 days/i)).toBeTruthy();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("keeps the schedule current when start date or algorithm changes", async () => {
    const user = userEvent.setup();
    const originalFetch = globalThis.fetch;

    const searchResult = createSearchResult();

    const schedule: ScheduleResponse = {
      sessions: [
        {
          game_name: "Hollow Knight",
          date: "2026-03-30",
          start_time: "20:00",
          duration_hours: 2.5,
        },
        {
          game_name: "Hollow Knight",
          date: "2026-04-01",
          start_time: "20:00",
          duration_hours: 2,
        },
      ],
      total_hours: 4.5,
      estimated_end_date: "2026-04-03",
    };

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.startsWith("/api/games/search?")) {
        return createJsonResponse([createCatalogResult()]);
      }

      if (url === "/api/games/resolve") {
        return createJsonResponse(searchResult);
      }

      if (url === "/api/schedule/generate") {
        return createJsonResponse(schedule);
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    }) as typeof fetch;

    try {
      const view = render(<HomePage />);
      const gamesPanel = view.getByRole("region", { name: "Your games" });
      const searchInput = within(gamesPanel).getByRole("textbox", {
        name: /search by title/i,
      });

      await user.type(searchInput, "ho");

      await waitFor(() =>
        expect(
          view.getByRole("button", { name: /add hollow knight to backlog/i }),
        ).toBeTruthy(),
      );

      await user.click(
        view.getByRole("button", { name: /add hollow knight to backlog/i }),
      );

      await waitFor(() =>
        expect(
          view.getByRole("button", { name: /use main time: 27h 30m/i }),
        ).toBeTruthy(),
      );

      await waitFor(() =>
        expect(view.getByRole("heading", { name: /my backlog/i })).toBeTruthy(),
      );

      await user.click(view.getByRole("tab", { name: "Schedule" }));
      if (view.queryByRole("button", { name: /edit hours/i }))
        await user.click(view.getByRole("button", { name: /edit hours/i }));
      await user.click(view.getByRole("button", { name: "Monday at 20:00" }));

      await user.click(view.getByRole("tab", { name: "Result" }));

      const schedulePanel = () => view.getByRole("main");
      await waitFor(() =>
        expect(view.container.querySelector("#schedule-heading")).toBeTruthy(),
      );

      await user.clear(
        within(schedulePanel()).getByLabelText(
          /start date/i,
        ) as HTMLInputElement,
      );
      await user.type(
        within(schedulePanel()).getByLabelText(/start date/i),
        "2026-04-05",
      );

      await waitFor(() =>
        expect(view.container.querySelector("#schedule-heading")).toBeTruthy(),
      );

      await user.selectOptions(
        within(schedulePanel()).getByLabelText(/schedule method/i),
        "alternating",
      );

      await waitFor(() =>
        expect(view.container.querySelector("#schedule-heading")).toBeTruthy(),
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
