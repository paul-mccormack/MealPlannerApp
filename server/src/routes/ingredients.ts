import { Router } from "express";
import { prisma } from "../db";

export const ingredientsRouter = Router();

ingredientsRouter.get("/", async (_req, res) => {
  const ingredients = await prisma.ingredient.findMany({ orderBy: { name: "asc" } });
  res.json(ingredients);
});

ingredientsRouter.post("/", async (req, res) => {
  const { name, defaultUnit } = req.body;
  if (!name) {
    return res.status(400).json({ error: "name is required" });
  }
  const ingredient = await prisma.ingredient.upsert({
    where: { name },
    update: { defaultUnit },
    create: { name, defaultUnit },
  });
  res.status(201).json(ingredient);
});

ingredientsRouter.delete("/:id", async (req, res) => {
  await prisma.ingredient.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
});
