import { afterAll, beforeEach } from "vitest";
import { prisma } from "../src/db";

beforeEach(async () => {
  await prisma.planEntry.deleteMany();
  await prisma.recipeIngredient.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.ingredient.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
