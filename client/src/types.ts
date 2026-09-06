export const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export interface Ingredient {
  id: number;
  name: string;
  defaultUnit: string | null;
}

export interface RecipeIngredient {
  id: number;
  recipeId: number;
  ingredientId: number;
  quantity: number;
  unit: string;
  ingredient: Ingredient;
}

export interface Recipe {
  id: number;
  name: string;
  instructions: string | null;
  servings: number | null;
  ingredients: RecipeIngredient[];
}

export interface PlanEntry {
  id: number;
  weekday: number;
  recipeId: number;
  recipe: Recipe;
}

export interface ShoppingListItem {
  ingredient: string;
  unit: string;
  quantity: number;
}
