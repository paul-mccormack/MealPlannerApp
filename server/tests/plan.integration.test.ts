import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app";

async function createRecipe(name: string) {
  const res = await request(app)
    .post("/api/recipes")
    .send({ name, ingredients: [{ name: "Eggs", quantity: 2, unit: "pcs" }] });
  return res.body.id as number;
}

describe("plan routes", () => {
  it("upserts a plan entry by weekday", async () => {
    const recipeId = await createRecipe("Cheese Omelette");

    const putRes = await request(app).put("/api/plan").send({ weekday: 0, recipeId });
    expect(putRes.status).toBe(200);
    expect(putRes.body.weekday).toBe(0);
    expect(putRes.body.recipeId).toBe(recipeId);

    const otherRecipeId = await createRecipe("Pancakes");
    const overwriteRes = await request(app).put("/api/plan").send({ weekday: 0, recipeId: otherRecipeId });
    expect(overwriteRes.status).toBe(200);
    expect(overwriteRes.body.recipeId).toBe(otherRecipeId);

    const listRes = await request(app).get("/api/plan");
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(1);
  });

  it("rejects a weekday outside 0-6", async () => {
    const recipeId = await createRecipe("Cheese Omelette");
    const res = await request(app).put("/api/plan").send({ weekday: 7, recipeId });
    expect(res.status).toBe(400);
  });

  it("rejects a missing recipeId", async () => {
    const res = await request(app).put("/api/plan").send({ weekday: 0 });
    expect(res.status).toBe(400);
  });

  it("clears all entries on reset", async () => {
    const recipeId = await createRecipe("Cheese Omelette");
    await request(app).put("/api/plan").send({ weekday: 0, recipeId });
    await request(app).put("/api/plan").send({ weekday: 1, recipeId });

    const resetRes = await request(app).delete("/api/plan/reset");
    expect(resetRes.status).toBe(204);

    const listRes = await request(app).get("/api/plan");
    expect(listRes.body).toHaveLength(0);
  });

  it("returns 404 when deleting an already-deleted plan entry", async () => {
    const recipeId = await createRecipe("Cheese Omelette");
    const putRes = await request(app).put("/api/plan").send({ weekday: 0, recipeId });
    const id = putRes.body.id;

    const firstDelete = await request(app).delete(`/api/plan/${id}`);
    expect(firstDelete.status).toBe(204);

    const secondDelete = await request(app).delete(`/api/plan/${id}`);
    expect(secondDelete.status).toBe(404);
  });
});
