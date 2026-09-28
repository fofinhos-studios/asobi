import { render } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import { HomePage } from "../pages/home";
import { LanguageProvider, detectLanguage } from "./i18n";

describe("i18n", () => {
  test("uses the browser's supported language and falls back to English", () => {
    expect(detectLanguage(["pt-BR", "en-US"])).toBe("pt-BR");
    expect(detectLanguage(["fr-FR"])).toBe("en");
  });

  test("lets a person choose a language and remembers the choice", async () => {
    window.localStorage.clear();
    const user = userEvent.setup();
    const view = render(
      <LanguageProvider browserLanguages={["pt-BR"]}>
        <HomePage />
      </LanguageProvider>,
    );

    const chooser = view.getByRole("combobox", { name: "Idioma" });
    expect((chooser as HTMLSelectElement).value).toBe("pt-BR");
    expect(view.getByRole("heading", { name: "Seus jogos" })).toBeTruthy();
    expect(view.getByRole("heading", { name: "Minha lista" })).toBeTruthy();
    expect(view.getByRole("tab", { name: "Resultado" })).toBeTruthy();

    await user.selectOptions(chooser, "en");

    expect(view.getByRole("combobox", { name: "Language" })).toBeTruthy();
    expect(view.getByRole("heading", { name: "Your games" })).toBeTruthy();
    expect(view.getByRole("heading", { name: "My Backlog" })).toBeTruthy();
    expect(window.localStorage.getItem("gaming-clock.language")).toBe("en");

    await user.click(view.getByRole("button", { name: "Rename My Backlog" }));
    const backlogName = view.getByLabelText("Backlog name");
    await user.clear(backlogName);
    await user.type(backlogName, "Weekend games");
    await user.selectOptions(
      view.getByRole("combobox", { name: "Language" }),
      "pt-BR",
    );

    expect(view.getByRole("heading", { name: "Weekend games" })).toBeTruthy();
  });
});
