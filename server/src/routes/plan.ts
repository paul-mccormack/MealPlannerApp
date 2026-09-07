import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../db";

export const planRouter = Router();

planRouter.get("/", async (_req, res) => {
  const entries = await prisma.planEntry.findMany({
    include: { recipe: true },
    orderBy: { weekday: "asc" },
  });
  res.json(entries);
});

planRouter.put("/", async (req, res) => {
  const { weekday, recipeId } = req.body as { weekday: number; recipeId: number };
  if (weekday === undefined || weekday < 0 || weekday > 6 || !recipeId) {
    return res.status(400).json({ error: "weekday (0-6) and recipeId are required" });
  }

  const entry = await prisma.planEntry.upsert({
    where: { weekday },
    update: { recipeId },
    create: { weekday, recipeId },
    include: { recipe: true },
  });
  res.json(entry);
});

planRouter.delete("/reset", async (_req, res) => {
  await prisma.planEntry.deleteMany({});
  res.status(204).end();
});

planRouter.delete("/:id", async (req, res) => {
  try {
    await prisma.planEntry.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return res.status(404).json({ error: "plan entry not found" });
    }
    throw err;
  }
});
