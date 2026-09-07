import { describe, expect, it } from "vitest";
import { validateIngredients, validateSourceUrl, type IngredientInput } from "../src/routes/recipes";

describe("validateSourceUrl", () => {
  it("accepts undefined", () => {
    expect(validateSourceUrl(undefined)).toBeNull();
  });

  it("accepts an empty string", () => {
    expect(validateSourceUrl("")).toBeNull();
  });

  it("accepts a whitespace-only string", () => {
    expect(validateSourceUrl("   ")).toBeNull();
  });

  it("accepts an http URL", () => {
    expect(validateSourceUrl("http://example.com/recipe")).toBeNull();
  });

  it("accepts an https URL", () => {
    expect(validateSourceUrl("https://example.com/recipe")).toBeNull();
  });

  it("rejects a non-http(s) protocol", () => {
    expect(validateSourceUrl("ftp://example.com/recipe")).not.toBeNull();
  });

  it("rejects a garbage string", () => {
    expect(validateSourceUrl("not a url")).not.toBeNull();
  });
});

describe("validateIngredients", () => {
  it("accepts an empty list", () => {
    expect(validateIngredients([])).toBeNull();
  });

  it("accepts a fully valid list", () => {
    const ingredients: IngredientInput[] = [
      { name: "Flour", quantity: 200, unit: "g" },
      { name: "Eggs", quantity: 2, unit: "pcs" },
    ];
    expect(validateIngredients(ingredients)).toBeNull();
  });

  it("rejects an ingredient with a name but no unit", () => {
    const ingredients: IngredientInput[] = [{ name: "Flour", quantity: 200, unit: "" }];
    expect(validateIngredients(ingredients)).not.toBeNull();
  });

  it("rejects an ingredient with a unit but no name", () => {
    const ingredients: IngredientInput[] = [{ name: "", quantity: 200, unit: "g" }];
    expect(validateIngredients(ingredients)).not.toBeNull();
  });

  it("rejects a zero quantity", () => {
    const ingredients: IngredientInput[] = [{ name: "Flour", quantity: 0, unit: "g" }];
    expect(validateIngredients(ingredients)).not.toBeNull();
  });

  it("rejects a negative quantity", () => {
    const ingredients: IngredientInput[] = [{ name: "Flour", quantity: -5, unit: "g" }];
    expect(validateIngredients(ingredients)).not.toBeNull();
  });

  it("rejects a non-finite quantity", () => {
    const ingredients: IngredientInput[] = [{ name: "Flour", quantity: Infinity, unit: "g" }];
    expect(validateIngredients(ingredients)).not.toBeNull();
  });
});
