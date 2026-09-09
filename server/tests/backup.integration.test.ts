import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("backup routes", () => {
  it("exports all recipes and ingredients as a downloadable JSON file", async () => {
    await request(app)
      .post("/api/recipes")
      .send({
        name: "Spaghetti Bolognese",
        servings: 4,
        sourceUrl: "https://example.com/spag-bol",
        ingredients: [
          { name: "Spaghetti", quantity: 500, unit: "g" },
          { name: "Minced Beef", quantity: 400, unit: "g" },
        ],
      });
    await request(app).post("/api/ingredients").send({ name: "Salt", defaultUnit: "pinch" });

    const res = await request(app).get("/api/backup");
    expect(res.status).toBe(200);
    expect(res.headers["content-disposition"]).toMatch(/^attachment; filename="meal-planner-backup-.*\.json"$/);
    expect(res.body.version).toBe(1);
    expect(res.body.recipes).toHaveLength(1);
    expect(res.body.recipes[0]).toMatchObject({
      name: "Spaghetti Bolognese",
      servings: 4,
      sourceUrl: "https://example.com/spag-bol",
    });
    expect(res.body.recipes[0].ingredients.sort((a: { name: string }, b: { name: string }) =>
      a.name.localeCompare(b.name)
    )).toEqual([
      { name: "Minced Beef", quantity: 400, unit: "g" },
      { name: "Spaghetti", quantity: 500, unit: "g" },
    ]);
    expect(res.body.ingredients.map((i: { name: string }) => i.name).sort()).toEqual([
      "Minced Beef",
      "Salt",
      "Spaghetti",
    ]);
  });

  it("restores from a backup file, replacing everything currently stored", async () => {
    await request(app).post("/api/recipes").send({ name: "Old Recipe", ingredients: [] });

    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      ingredients: [{ name: "Flour", defaultUnit: "g" }],
      recipes: [
        {
          name: "Pancakes",
          servings: 2,
          ingredients: [{ name: "Flour", quantity: 200, unit: "g" }, { name: "Eggs", quantity: 2, unit: "pcs" }],
        },
      ],
    };

    const restoreRes = await request(app).post("/api/backup/restore").send(backup);
    expect(restoreRes.status).toBe(204);

    const listRes = await request(app).get("/api/recipes");
    expect(listRes.body).toHaveLength(1);
    expect(listRes.body[0].name).toBe("Pancakes");
    expect(listRes.body[0].ingredients).toHaveLength(2);

    const ingredientsRes = await request(app).get("/api/ingredients");
    expect(ingredientsRes.body.map((i: { name: string }) => i.name).sort()).toEqual(["Eggs", "Flour"]);
  });

  it("rejects a restore payload missing the recipes array", async () => {
    const res = await request(app).post("/api/backup/restore").send({ ingredients: [] });
    expect(res.status).toBe(400);
  });

  it("rejects a restore payload with an invalid ingredient and does not modify existing data", async () => {
    await request(app).post("/api/recipes").send({ name: "Untouched Recipe", ingredients: [] });

    const res = await request(app)
      .post("/api/backup/restore")
      .send({
        version: 1,
        exportedAt: new Date().toISOString(),
        ingredients: [],
        recipes: [{ name: "Bad Recipe", ingredients: [{ name: "Flour", quantity: 200, unit: "" }] }],
      });
    expect(res.status).toBe(400);

    const listRes = await request(app).get("/api/recipes");
    expect(listRes.body).toHaveLength(1);
    expect(listRes.body[0].name).toBe("Untouched Recipe");
  });
});
