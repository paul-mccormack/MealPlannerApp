import type { Ingredient, PlanEntry, Recipe, ShoppingListItem } from "./types";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request to ${path} failed with ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface RecipeIngredientInput {
  name: string;
  quantity: number;
  unit: string;
}

export interface RecipeInput {
  name: string;
  instructions?: string;
  servings?: number;
  ingredients: RecipeIngredientInput[];
}

export const api = {
  listRecipes: () => request<Recipe[]>("/recipes"),
  createRecipe: (input: RecipeInput) =>
    request<Recipe>("/recipes", { method: "POST", body: JSON.stringify(input) }),
  deleteRecipe: (id: number) => request<void>(`/recipes/${id}`, { method: "DELETE" }),

  listIngredients: () => request<Ingredient[]>("/ingredients"),

  listPlan: () => request<PlanEntry[]>("/plan"),
  setPlanEntry: (weekday: number, recipeId: number) =>
    request<PlanEntry>("/plan", { method: "PUT", body: JSON.stringify({ weekday, recipeId }) }),
  deletePlanEntry: (id: number) => request<void>(`/plan/${id}`, { method: "DELETE" }),
  resetPlan: () => request<void>("/plan/reset", { method: "DELETE" }),

  shoppingList: () => request<{ items: ShoppingListItem[] }>("/shopping-list"),
};
