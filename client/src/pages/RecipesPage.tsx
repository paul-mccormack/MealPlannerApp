import { useEffect, useState } from "react";
import { api, type RecipeIngredientInput } from "../api";
import type { Recipe } from "../types";

const emptyIngredientRow: RecipeIngredientInput = { name: "", quantity: 1, unit: "" };

function incompleteRowIndexes(rows: RecipeIngredientInput[]): number[] {
  return rows
    .map((_, i) => i)
    .filter((i) => Boolean(rows[i].name.trim()) !== Boolean(rows[i].unit.trim()));
}

export function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [name, setName] = useState("");
  const [servings, setServings] = useState<number | "">("");
  const [instructions, setInstructions] = useState("");
  const [ingredientRows, setIngredientRows] = useState<RecipeIngredientInput[]>([{ ...emptyIngredientRow }]);
  const [error, setError] = useState<string | null>(null);
  const [invalidRows, setInvalidRows] = useState<number[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  function refresh() {
    api.listRecipes().then(setRecipes).catch((e) => setError(e.message));
  }

  useEffect(refresh, []);

  function resetForm() {
    setEditingId(null);
    setName("");
    setServings("");
    setInstructions("");
    setIngredientRows([{ ...emptyIngredientRow }]);
    setInvalidRows([]);
    setError(null);
  }

  function startEdit(recipe: Recipe) {
    setEditingId(recipe.id);
    setName(recipe.name);
    setServings(recipe.servings ?? "");
    setInstructions(recipe.instructions ?? "");
    setIngredientRows(
      recipe.ingredients.length
        ? recipe.ingredients.map((ri) => ({ name: ri.ingredient.name, quantity: ri.quantity, unit: ri.unit }))
        : [{ ...emptyIngredientRow }]
    );
    setInvalidRows([]);
    setError(null);
  }

  function updateRow(index: number, patch: Partial<RecipeIngredientInput>) {
    setIngredientRows((rows) => {
      const next = rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
      setInvalidRows((current) => (current.length === 0 ? current : incompleteRowIndexes(next)));
      return next;
    });
  }

  function addRow() {
    setIngredientRows((rows) => [...rows, { ...emptyIngredientRow }]);
  }

  function removeRow(index: number) {
    setIngredientRows((rows) => {
      const next = rows.filter((_, i) => i !== index);
      setInvalidRows((current) => (current.length === 0 ? current : incompleteRowIndexes(next)));
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const incomplete = incompleteRowIndexes(ingredientRows);
    if (incomplete.length > 0) {
      setInvalidRows(incomplete);
      setError(
        `Ingredient row ${incomplete.map((i) => i + 1).join(", ")} needs both a name and a unit ` +
          "(or leave both blank to remove it)."
      );
      return;
    }
    setInvalidRows([]);

    const ingredients = ingredientRows.filter((row) => row.name.trim() && row.unit.trim());
    const input = {
      name,
      servings: servings === "" ? undefined : servings,
      instructions: instructions || undefined,
      ingredients,
    };
    try {
      if (editingId !== null) {
        await api.updateRecipe(editingId, input);
      } else {
        await api.createRecipe(input);
      }
      resetForm();
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleDelete(id: number) {
    await api.deleteRecipe(id);
    if (editingId === id) resetForm();
    refresh();
  }

  return (
    <div className="page">
      <section className="card">
        <h2>{editingId !== null ? "Edit recipe" : "Add a recipe"}</h2>
        <form onSubmit={handleSubmit} className="form">
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Servings
            <input
              type="number"
              min={1}
              value={servings}
              onChange={(e) => setServings(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </label>
          <label>
            Instructions
            <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3} />
          </label>

          <h3>Ingredients</h3>
          {ingredientRows.map((row, i) => {
            const invalid = invalidRows.includes(i);
            return (
              <div className={invalid ? "ingredient-row invalid" : "ingredient-row"} key={i}>
                <input
                  placeholder="Ingredient name"
                  value={row.name}
                  onChange={(e) => updateRow(i, { name: e.target.value })}
                />
                <input
                  type="number"
                  min={0}
                  step="any"
                  placeholder="Qty"
                  value={row.quantity}
                  onChange={(e) => updateRow(i, { quantity: Number(e.target.value) })}
                />
                <input
                  placeholder="Unit (g, ml, cups...)"
                  value={row.unit}
                  onChange={(e) => updateRow(i, { unit: e.target.value })}
                />
                <button type="button" onClick={() => removeRow(i)} aria-label="Remove ingredient">
                  &times;
                </button>
              </div>
            );
          })}
          <button type="button" onClick={addRow}>
            + Add ingredient
          </button>

          {error && <p className="error">{error}</p>}
          <div className="form-actions">
            <button type="submit" className="primary">
              {editingId !== null ? "Save changes" : "Save recipe"}
            </button>
            {editingId !== null && (
              <button type="button" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="card">
        <h2>Recipes ({recipes.length})</h2>
        <ul className="recipe-list">
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <div className="recipe-header">
                <strong>{recipe.name}</strong>
                {recipe.servings && <span> · serves {recipe.servings}</span>}
                <button className="link edit" onClick={() => startEdit(recipe)}>
                  edit
                </button>
                <button className="link" onClick={() => handleDelete(recipe.id)}>
                  delete
                </button>
              </div>
              <ul className="ingredient-list">
                {recipe.ingredients.map((ri) => (
                  <li key={ri.id}>
                    {ri.quantity} {ri.unit} {ri.ingredient.name}
                  </li>
                ))}
              </ul>
              {recipe.instructions && <p className="instructions">{recipe.instructions}</p>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
