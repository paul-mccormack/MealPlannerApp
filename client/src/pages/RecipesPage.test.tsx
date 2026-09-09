import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecipesPage, incompleteRowIndexes } from "./RecipesPage";
import { api } from "../api";
import type { Recipe } from "../types";

vi.mock("../api", () => ({
  api: {
    listRecipes: vi.fn(),
    createRecipe: vi.fn(),
    updateRecipe: vi.fn(),
    deleteRecipe: vi.fn(),
    downloadBackup: vi.fn(),
    restoreBackup: vi.fn(),
  },
}));

describe("incompleteRowIndexes", () => {
  it("does not flag fully blank or fully filled rows", () => {
    expect(
      incompleteRowIndexes([
        { name: "", quantity: 1, unit: "" },
        { name: "Flour", quantity: 200, unit: "g" },
      ])
    ).toEqual([]);
  });

  it("flags a row with a name but no unit", () => {
    expect(incompleteRowIndexes([{ name: "Flour", quantity: 200, unit: "" }])).toEqual([0]);
  });

  it("flags a row with a unit but no name", () => {
    expect(incompleteRowIndexes([{ name: "", quantity: 200, unit: "g" }])).toEqual([0]);
  });

  it("flags multiple incomplete rows by index", () => {
    expect(
      incompleteRowIndexes([
        { name: "Flour", quantity: 200, unit: "" },
        { name: "Eggs", quantity: 2, unit: "pcs" },
        { name: "", quantity: 1, unit: "ml" },
      ])
    ).toEqual([0, 2]);
  });
});

describe("RecipesPage", () => {
  beforeEach(() => {
    vi.mocked(api.listRecipes).mockResolvedValue([] as Recipe[]);
  });

  it("blocks submission and highlights the row when an ingredient is incomplete", async () => {
    const user = userEvent.setup();
    render(<RecipesPage />);

    await user.type(screen.getByLabelText("Name"), "Pancakes");
    await user.type(screen.getByPlaceholderText("Ingredient name"), "Flour");
    await user.click(screen.getByRole("button", { name: "Save recipe" }));

    expect(await screen.findByText(/needs both a name and a unit/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ingredient name").closest(".ingredient-row")).toHaveClass("invalid");
    expect(api.createRecipe).not.toHaveBeenCalled();
  });

  it("submits a complete recipe and resets the form", async () => {
    vi.mocked(api.createRecipe).mockResolvedValue({} as Recipe);
    const user = userEvent.setup();
    render(<RecipesPage />);

    await user.type(screen.getByLabelText("Name"), "Pancakes");
    await user.type(screen.getByPlaceholderText("Ingredient name"), "Flour");
    const qtyInput = screen.getByPlaceholderText("Qty");
    await user.clear(qtyInput);
    await user.type(qtyInput, "200");
    await user.type(screen.getByPlaceholderText("Unit (g, ml, cups...)"), "g");
    await user.click(screen.getByRole("button", { name: "Save recipe" }));

    await waitFor(() => expect(api.createRecipe).toHaveBeenCalledTimes(1));
    expect(api.createRecipe).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Pancakes",
        ingredients: [{ name: "Flour", quantity: 200, unit: "g" }],
      })
    );
    await waitFor(() => expect(screen.getByLabelText("Name")).toHaveValue(""));
  });
});

describe("RecipesPage backup and restore", () => {
  beforeEach(() => {
    vi.mocked(api.listRecipes).mockResolvedValue([] as Recipe[]);
  });

  it("downloads a backup file when the download button is clicked", async () => {
    const blob = new Blob(["{}"], { type: "application/json" });
    vi.mocked(api.downloadBackup).mockResolvedValue(blob);
    const createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
    const revokeObjectURL = vi.fn();
    (URL as unknown as { createObjectURL: typeof createObjectURL }).createObjectURL = createObjectURL;
    (URL as unknown as { revokeObjectURL: typeof revokeObjectURL }).revokeObjectURL = revokeObjectURL;
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    const user = userEvent.setup();
    render(<RecipesPage />);
    await user.click(screen.getByRole("button", { name: "Download backup" }));

    await waitFor(() => expect(api.downloadBackup).toHaveBeenCalledTimes(1));
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");

    clickSpy.mockRestore();
  });

  it("does not restore when the confirmation is dismissed", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(<RecipesPage />);

    const file = new File([JSON.stringify({ version: 1, recipes: [] })], "backup.json", {
      type: "application/json",
    });
    await user.upload(screen.getByTestId("backup-file-input"), file);

    expect(api.restoreBackup).not.toHaveBeenCalled();
  });

  it("restores from a chosen backup file after confirmation", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(api.restoreBackup).mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<RecipesPage />);

    const backup = {
      version: 1,
      exportedAt: "2026-01-01T00:00:00.000Z",
      ingredients: [],
      recipes: [{ name: "Pancakes", ingredients: [] }],
    };
    const file = new File([JSON.stringify(backup)], "backup.json", { type: "application/json" });
    await user.upload(screen.getByTestId("backup-file-input"), file);

    await waitFor(() => expect(api.restoreBackup).toHaveBeenCalledTimes(1));
    expect(api.restoreBackup).toHaveBeenCalledWith(backup);
  });
});
