import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("recipes routes", () => {
  it("creates, lists, and fetches a recipe", async () => {
    const createRes = await request(app)
      .post("/api/recipes")
      .send({
        name: "Spaghetti Bolognese",
        servings: 4,
        ingredients: [
          { name: "Spaghetti", quantity: 500, unit: "g" },
          { name: "Minced Beef", quantity: 400, unit: "g" },
        ],
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.name).toBe("Spaghetti Bolognese");
    expect(createRes.body.ingredients).toHaveLength(2);

    const listRes = await request(app).get("/api/recipes");
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(1);

    const getRes = await request(app).get(`/api/recipes/${createRes.body.id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.id).toBe(createRes.body.id);
  });

  it("returns 404 for a missing recipe id", async () => {
    const res = await request(app).get("/api/recipes/999999");
    expect(res.status).toBe(404);
  });

  it("rejects an ingredient missing a unit with 400", async () => {
    const res = await request(app)
      .post("/api/recipes")
      .send({ name: "Bad Recipe", ingredients: [{ name: "Flour", quantity: 200, unit: "" }] });
    expect(res.status).toBe(400);
  });

  it("rejects an invalid sourceUrl with 400", async () => {
    const res = await request(app)
      .post("/api/recipes")
      .send({ name: "Bad Link Recipe", sourceUrl: "not-a-url", ingredients: [] });
    expect(res.status).toBe(400);
  });

  it("fully replaces ingredients on PUT and can clear sourceUrl", async () => {
    const createRes = await request(app)
      .post("/api/recipes")
      .send({
        name: "Cheese Omelette",
        sourceUrl: "https://example.com/omelette",
        ingredients: [{ name: "Eggs", quantity: 2, unit: "pcs" }],
      });
    expect(createRes.status).toBe(201);

    const updateRes = await request(app)
      .put(`/api/recipes/${createRes.body.id}`)
      .send({
        name: "Cheese Omelette",
        sourceUrl: "",
        ingredients: [
          { name: "Eggs", quantity: 3, unit: "pcs" },
          { name: "Cheese", quantity: 50, unit: "g" },
        ],
      });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.sourceUrl).toBeNull();
    expect(updateRes.body.ingredients).toHaveLength(2);
    expect(updateRes.body.ingredients.map((i: { ingredient: { name: string } }) => i.ingredient.name).sort()).toEqual(
      ["Cheese", "Eggs"]
    );
  });

  it("returns 404 when deleting an already-deleted recipe", async () => {
    const createRes = await request(app).post("/api/recipes").send({ name: "To Delete", ingredients: [] });
    const id = createRes.body.id;

    const firstDelete = await request(app).delete(`/api/recipes/${id}`);
    expect(firstDelete.status).toBe(204);

    const secondDelete = await request(app).delete(`/api/recipes/${id}`);
    expect(secondDelete.status).toBe(404);
  });
});
