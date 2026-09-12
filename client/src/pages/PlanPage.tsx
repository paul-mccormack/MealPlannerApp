import { useEffect, useState } from "react";
import { api } from "../api";
import { GITHUB_REPO_URL, LINKEDIN_PROFILE_URL } from "../constants";
import { DAY_LABELS, type PlanEntry, type Recipe } from "../types";

export function PlanPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [entries, setEntries] = useState<PlanEntry[]>([]);

  function refreshPlan() {
    api.listPlan().then(setEntries);
  }

  useEffect(() => {
    api.listRecipes().then(setRecipes);
    refreshPlan();
  }, []);

  function entryFor(weekday: number) {
    return entries.find((e) => e.weekday === weekday);
  }

  async function handleSelect(weekday: number, recipeId: string) {
    if (!recipeId) {
      const existing = entryFor(weekday);
      if (existing) await api.deletePlanEntry(existing.id);
    } else {
      await api.setPlanEntry(weekday, Number(recipeId));
    }
    refreshPlan();
  }

  async function handleReset() {
    if (!confirm("Clear this week's dinner plan?")) return;
    await api.resetPlan();
    refreshPlan();
  }

  function goToRecipe(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="page">
      <section className="intro">
        <p>
          Meal Planner helps you plan dinners for the week. Add recipes on the Recipes tab, assign one to each day
          below, and check Shopping List for a combined list of everything you need to buy. When you're ready to
          plan a new week, use "Reset plan" to clear the board and start again.
        </p>
      </section>

      <section className="card">
        <div className="plan-header">
          <h2>Dinner plan</h2>
          <button className="danger" onClick={handleReset}>
            Reset plan
          </button>
        </div>
        <table className="plan-table">
          <tbody>
            {DAY_LABELS.map((label, weekday) => {
              const entry = entryFor(weekday);
              return (
                <tr key={weekday}>
                  <th>{label}</th>
                  <td>
                    <select
                      value={entry?.recipeId ?? ""}
                      onChange={(e) => handleSelect(weekday, e.target.value)}
                    >
                      <option value="">—</option>
                      {recipes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {entry?.recipe.sourceUrl && (
                      <button type="button" onClick={() => goToRecipe(entry.recipe.sourceUrl!)}>
                        Go to recipe
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <footer className="app-footer">
        <p>
          Created by Paul McCormack and Claude Code. This project is open source —{" "}
          <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">
            view it on GitHub
          </a>
          {" · "}
          <a href={LINKEDIN_PROFILE_URL} target="_blank" rel="noopener noreferrer">
            connect on LinkedIn
          </a>
          .
        </p>
      </footer>
    </div>
  );
}
