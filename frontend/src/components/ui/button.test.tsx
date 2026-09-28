import { render } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { Button } from "./button";
test("keeps semantic button behavior across visual variants", async () => {
  const click = vi.fn();
  const user = userEvent.setup();
  const view = render(
    <>
      <Button variant="primary" onClick={click}>
        Add game
      </Button>
      <Button disabled onClick={click}>
        Unavailable
      </Button>
    </>,
  );
  await user.click(view.getByRole("button", { name: "Add game" }));
  await user.click(view.getByRole("button", { name: "Unavailable" }));
  expect(click).toHaveBeenCalledTimes(1);
  expect(
    view.getByRole("button", { name: "Add game" }).getAttribute("type"),
  ).toBe("button");
});
