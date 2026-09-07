import { Router } from "express";
import { prisma } from "../db";

export const recipesRouter = Router();

export type IngredientInput = {
  name: string;
  quantity: number;
  unit: string;
};

export function validateSourceUrl(sourceUrl: string | undefined): string | null {
  if (!sourceUrl?.trim()) return null;
  try {
    const url = new URL(sourceUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("bad protocol");
  } catch {
    return "Recipe link must be a valid http(s) URL";
  }
  return null;
}

export function validateIngredients(ingredients: IngredientInput[]): string | null {
  for (const ing of ingredients) {
    if (!ing.name?.trim() || !ing.unit?.trim()) {
      return "Each ingredient needs both a name and a unit";
    }
    if (typeof ing.quantity !== "number" || !Number.isFinite(ing.quantity) || ing.quantity <= 0) {
      return "Each ingredient needs a positive quantity";
    }
  }
  return null;
}

async function resolveIngredientLinks(ingredients: IngredientInput[]) {
  return Promise.all(
    ingredients.map(async ({ name, quantity, unit }) => {
      const ingredient = await prisma.ingredient.upsert({
        where: { name },
        update: {},
        create: { name },
      });
      return { ingredientId: ingredient.id, quantity, unit };
    })
  );
}

recipesRouter.get("/", async (_req, res) => {
  const recipes = await prisma.recipe.findMany({
    include: { ingredients: { include: { ingredient: true } } },
    orderBy: { name: "asc" },
  });
  res.json(recipes);
});

recipesRouter.get("/:id", async (req, res) => {
  const recipe = await prisma.recipe.findUnique({
    where: { id: Number(req.params.id) },
    include: { ingredients: { include: { ingredient: true } } },
  });
  if (!recipe) return res.status(404).json({ error: "recipe not found" });
  res.json(recipe);
});

recipesRouter.post("/", async (req, res) => {
  const { name, instructions, servings, sourceUrl, ingredients = [] } = req.body as {
    name: string;
    instructions?: string;
    servings?: number;
    sourceUrl?: string;
    ingredients?: IngredientInput[];
  };
  if (!name) return res.status(400).json({ error: "name is required" });
  const sourceUrlError = validateSourceUrl(sourceUrl);
  if (sourceUrlError) return res.status(400).json({ error: sourceUrlError });
  const ingredientsError = validateIngredients(ingredients);
  if (ingredientsError) return res.status(400).json({ error: ingredientsError });

  const links = await resolveIngredientLinks(ingredients);
  const recipe = await prisma.recipe.create({
    data: {
      name,
      instructions,
      servings,
      sourceUrl: sourceUrl?.trim() || undefined,
      ingredients: { create: links },
    },
    include: { ingredients: { include: { ingredient: true } } },
  });
  res.status(201).json(recipe);
});

recipesRouter.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, instructions, servings, sourceUrl, ingredients = [] } = req.body as {
    name: string;
    instructions?: string;
    servings?: number;
    sourceUrl?: string;
    ingredients?: IngredientInput[];
  };
  if (!name) return res.status(400).json({ error: "name is required" });
  const sourceUrlError = validateSourceUrl(sourceUrl);
  if (sourceUrlError) return res.status(400).json({ error: sourceUrlError });

  const ingredientsError = validateIngredients(ingredients);
  if (ingredientsError) return res.status(400).json({ error: ingredientsError });

  const links = await resolveIngredientLinks(ingredients);
  await prisma.recipeIngredient.deleteMany({ where: { recipeId: id } });
  const recipe = await prisma.recipe.update({
    where: { id },
    data: {
      name,
      instructions,
      servings,
      sourceUrl: sourceUrl?.trim() || null,
      ingredients: { create: links },
    },
    include: { ingredients: { include: { ingredient: true } } },
  });
  res.json(recipe);
});

recipesRouter.delete("/:id", async (req, res) => {
  await prisma.recipe.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
});
