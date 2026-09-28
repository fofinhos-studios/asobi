import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "vitest";
const read = (file: string) => readFile(resolve(process.cwd(), file), "utf8");
test("centralizes palette and fonts in the Asobi design system", async () => {
  const entry = await read("src/index.css");
  const system = await read("src/styles/design-system.css");
  expect(entry).toContain("./styles/design-system.css");
  expect(entry).not.toMatch(/#[0-9a-f]{3,8}|@font-face/i);
  expect(system.slice(system.indexOf("/* Foundations */"))).not.toMatch(
    /#[0-9a-f]{3,8}|rgba?\(/i,
  );
  expect(system).toContain("color-scheme: light");
  expect(system).not.toContain('data-theme="dark"');
});
test("serves typefaces and the Japanese mark locally", async () => {
  const system = await read("src/styles/design-system.css");
  expect(system).not.toContain("fonts.googleapis.com");
  expect(system).toContain("GeneralSans-Variable.woff2");
  expect(system).toContain("MartianMono-NrRg.woff2");
  const mark = await read("public/asobi-mark.svg");
  expect(mark).toContain("<path");
  expect(mark).not.toContain("<text");
});
