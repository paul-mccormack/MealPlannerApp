import { Router } from "express";
import { prisma } from "../db";

export const shoppingListRouter = Router();

shoppingListRouter.get("/", async (_req, res) => {
  const entries = await prisma.planEntry.findMany({
    include: {
      recipe: {
        include: { ingredients: { include: { ingredient: true } } },
      },
    },
  });

  const totals = new Map<string, { ingredient: string; unit: string; quantity: number }>();

  for (const entry of entries) {
    for (const link of entry.recipe.ingredients) {
      const key = `${link.ingredient.name}::${link.unit}`;
      const existing = totals.get(key);
      if (existing) {
        existing.quantity += link.quantity;
      } else {
        totals.set(key, { ingredient: link.ingredient.name, unit: link.unit, quantity: link.quantity });
      }
    }
  }

  const items = [...totals.values()].sort((a, b) => a.ingredient.localeCompare(b.ingredient));
  res.json({ items });
});
