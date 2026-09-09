import { Router } from "express";
import { prisma } from "../db";
import { validateIngredients, validateSourceUrl, type IngredientInput } from "./recipes";

export const backupRouter = Router();

interface BackupIngredient {
  name: string;
  defaultUnit?: string | null;
}

interface BackupRecipe {
  name: string;
  instructions?: string | null;
  servings?: number | null;
  sourceUrl?: string | null;
  ingredients: IngredientInput[];
}

interface BackupPayload {
  version: number;
  exportedAt: string;
  ingredients: BackupIngredient[];
  recipes: BackupRecipe[];
}

function validateBackupPayload(body: unknown): string | null {
  if (!body || typeof body !== "object") return "Backup file is not valid JSON";
  const { ingredients, recipes } = body as Partial<BackupPayload>;

  if (!Array.isArray(recipes)) return "Backup file is missing a recipes array";
  if (ingredients !== undefined && !Array.isArray(ingredients)) {
    return "Backup file's ingredients must be an array";
  }
  for (const ing of ingredients ?? []) {
    if (!ing || typeof ing.name !== "string" || !ing.name.trim()) {
      return "Backup file has an ingredient without a name";
    }
  }

  for (const [i, recipe] of recipes.entries()) {
    if (!recipe || typeof recipe.name !== "string" || !recipe.name.trim()) {
      return `Recipe ${i + 1} in the backup file is missing a name`;
    }
    const sourceUrlError = validateSourceUrl(recipe.sourceUrl ?? undefined);
    if (sourceUrlError) return `Recipe "${recipe.name}": ${sourceUrlError}`;
    if (!Array.isArray(recipe.ingredients)) {
      return `Recipe "${recipe.name}" is missing an ingredients array`;
    }
    const ingredientsError = validateIngredients(recipe.ingredients);
    if (ingredientsError) return `Recipe "${recipe.name}": ${ingredientsError}`;
  }

  return null;
}

backupRouter.get("/", async (_req, res) => {
  const [ingredients, recipes] = await Promise.all([
    prisma.ingredient.findMany({ orderBy: { name: "asc" } }),
    prisma.recipe.findMany({
      include: { ingredients: { include: { ingredient: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const payload: BackupPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    ingredients: ingredients.map((i) => ({ name: i.name, defaultUnit: i.defaultUnit })),
    recipes: recipes.map((r) => ({
      name: r.name,
      instructions: r.instructions,
      servings: r.servings,
      sourceUrl: r.sourceUrl,
      ingredients: r.ingredients.map((ri) => ({
        name: ri.ingredient.name,
        quantity: ri.quantity,
        unit: ri.unit,
      })),
    })),
  };

  const filename = `meal-planner-backup-${payload.exportedAt.slice(0, 10)}.json`;
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.json(payload);
});

// Restoring replaces the entire recipes/ingredients database with the
// contents of the backup file — this is the intended behavior for restoring
// onto a fresh instance, and for restoring over an existing one it's the
// only sensible meaning of "restore" (as opposed to a merge).
backupRouter.post("/restore", async (req, res) => {
  const validationError = validateBackupPayload(req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  const { ingredients = [], recipes } = req.body as BackupPayload;

  await prisma.$transaction(async (tx) => {
    await tx.recipe.deleteMany({});
    await tx.ingredient.deleteMany({});

    for (const ing of ingredients) {
      await tx.ingredient.upsert({
        where: { name: ing.name },
        update: { defaultUnit: ing.defaultUnit ?? null },
        create: { name: ing.name, defaultUnit: ing.defaultUnit ?? null },
      });
    }

    for (const recipe of recipes) {
      const links = await Promise.all(
        recipe.ingredients.map(async ({ name, quantity, unit }) => {
          const ingredient = await tx.ingredient.upsert({
            where: { name },
            update: {},
            create: { name },
          });
          return { ingredientId: ingredient.id, quantity, unit };
        })
      );
      await tx.recipe.create({
        data: {
          name: recipe.name,
          instructions: recipe.instructions ?? undefined,
          servings: recipe.servings ?? undefined,
          sourceUrl: recipe.sourceUrl?.trim() || undefined,
          ingredients: { create: links },
        },
      });
    }
  });

  res.status(204).end();
});
