import { useEffect, useState } from "react";
import { api } from "../api";
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

  return (
    <div className="page">
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
