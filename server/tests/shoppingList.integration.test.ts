import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("shopping list", () => {
  it("returns an empty list when nothing is planned", async () => {
    const res = await request(app).get("/api/shopping-list");
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  it("sums the same ingredient+unit across multiple planned recipes", async () => {
    const spaghetti = await request(app)
      .post("/api/recipes")
      .send({
        name: "Spaghetti Bolognese",
        ingredients: [
          { name: "Spaghetti", quantity: 500, unit: "g" },
          { name: "Minced Beef", quantity: 400, unit: "g" },
        ],
      });
    const lasagne = await request(app)
      .post("/api/recipes")
      .send({
        name: "Lasagne",
        ingredients: [
          { name: "Minced Beef", quantity: 300, unit: "g" },
          { name: "Milk", quantity: 200, unit: "ml" },
        ],
      });

    await request(app).put("/api/plan").send({ weekday: 0, recipeId: spaghetti.body.id });
    await request(app).put("/api/plan").send({ weekday: 1, recipeId: lasagne.body.id });

    const res = await request(app).get("/api/shopping-list");
    expect(res.status).toBe(200);

    const byIngredient = Object.fromEntries(
      res.body.items.map((item: { ingredient: string; unit: string; quantity: number }) => [
        item.ingredient,
        item,
      ])
    );
    expect(byIngredient["Minced Beef"]).toEqual({ ingredient: "Minced Beef", unit: "g", quantity: 700 });
    expect(byIngredient["Spaghetti"]).toEqual({ ingredient: "Spaghetti", unit: "g", quantity: 500 });
    expect(byIngredient["Milk"]).toEqual({ ingredient: "Milk", unit: "ml", quantity: 200 });
  });

  it("keeps the same ingredient in different units as separate line items", async () => {
    const gramsRecipe = await request(app)
      .post("/api/recipes")
      .send({ name: "Recipe A", ingredients: [{ name: "Butter", quantity: 50, unit: "g" }] });
    const tbspRecipe = await request(app)
      .post("/api/recipes")
      .send({ name: "Recipe B", ingredients: [{ name: "Butter", quantity: 2, unit: "tbsp" }] });

    await request(app).put("/api/plan").send({ weekday: 0, recipeId: gramsRecipe.body.id });
    await request(app).put("/api/plan").send({ weekday: 1, recipeId: tbspRecipe.body.id });

    const res = await request(app).get("/api/shopping-list");
    const butterItems = res.body.items.filter((item: { ingredient: string }) => item.ingredient === "Butter");
    expect(butterItems).toHaveLength(2);
    expect(butterItems.map((i: { unit: string }) => i.unit).sort()).toEqual(["g", "tbsp"]);
  });
});
