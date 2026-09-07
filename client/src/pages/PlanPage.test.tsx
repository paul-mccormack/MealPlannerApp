import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlanPage } from "./PlanPage";
import { api } from "../api";
import type { PlanEntry } from "../types";

vi.mock("../api", () => ({
  api: {
    listRecipes: vi.fn(),
    listPlan: vi.fn(),
    setPlanEntry: vi.fn(),
    deletePlanEntry: vi.fn(),
    resetPlan: vi.fn(),
  },
}));

function makeRecipe(overrides: Partial<PlanEntry["recipe"]>): PlanEntry["recipe"] {
  return {
    id: 1,
    name: "Recipe",
    instructions: null,
    servings: null,
    sourceUrl: null,
    ingredients: [],
    ...overrides,
  };
}

describe("PlanPage", () => {
  beforeEach(() => {
    vi.mocked(api.listRecipes).mockResolvedValue([]);
  });

  it("shows the Go to recipe button only for a day whose recipe has a link", async () => {
    const withLink: PlanEntry = {
      id: 1,
      weekday: 0,
      recipeId: 10,
      recipe: makeRecipe({ id: 10, name: "Spaghetti Bolognese", sourceUrl: "https://example.com/spaghetti" }),
    };
    const withoutLink: PlanEntry = {
      id: 2,
      weekday: 1,
      recipeId: 11,
      recipe: makeRecipe({ id: 11, name: "Cheese Omelette", sourceUrl: null }),
    };
    vi.mocked(api.listPlan).mockResolvedValue([withLink, withoutLink]);

    render(<PlanPage />);

    const mondayRow = (await screen.findByText("Monday")).closest("tr")!;
    const tuesdayRow = screen.getByText("Tuesday").closest("tr")!;
    const wednesdayRow = screen.getByText("Wednesday").closest("tr")!;

    expect(within(mondayRow).getByRole("button", { name: "Go to recipe" })).toBeInTheDocument();
    expect(within(tuesdayRow).queryByRole("button", { name: "Go to recipe" })).not.toBeInTheDocument();
    expect(within(wednesdayRow).queryByRole("button", { name: "Go to recipe" })).not.toBeInTheDocument();
  });

  it("opens the recipe link in a new tab when clicked", async () => {
    const withLink: PlanEntry = {
      id: 1,
      weekday: 0,
      recipeId: 10,
      recipe: makeRecipe({ id: 10, sourceUrl: "https://example.com/spaghetti" }),
    };
    vi.mocked(api.listPlan).mockResolvedValue([withLink]);
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    const user = userEvent.setup();

    render(<PlanPage />);

    const mondayRow = (await screen.findByText("Monday")).closest("tr")!;
    await user.click(within(mondayRow).getByRole("button", { name: "Go to recipe" }));

    expect(openSpy).toHaveBeenCalledWith("https://example.com/spaghetti", "_blank", "noopener,noreferrer");
  });

  it("does not reset the plan when the confirm dialog is cancelled", async () => {
    vi.mocked(api.listPlan).mockResolvedValue([]);
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();

    render(<PlanPage />);
    await user.click(await screen.findByRole("button", { name: "Reset plan" }));

    expect(api.resetPlan).not.toHaveBeenCalled();
  });

  it("resets the plan when the confirm dialog is accepted", async () => {
    vi.mocked(api.listPlan).mockResolvedValue([]);
    vi.mocked(api.resetPlan).mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();

    render(<PlanPage />);
    await user.click(await screen.findByRole("button", { name: "Reset plan" }));

    await waitFor(() => expect(api.resetPlan).toHaveBeenCalledTimes(1));
  });
});
