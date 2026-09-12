import { useState } from "react";
import "./App.css";
import { RecipesPage } from "./pages/RecipesPage";
import { PlanPage } from "./pages/PlanPage";
import { ShoppingListPage } from "./pages/ShoppingListPage";
import { useTheme } from "./theme";

type Tab = "plan" | "shopping" | "recipes";

function App() {
  const [tab, setTab] = useState<Tab>("plan");
  const [theme, setTheme] = useTheme();

  return (
    <div className="app">
      <header className="app-header">
        <h1>Meal Planner</h1>
        <div className="header-actions">
          <nav className="tabs">
            <button className={tab === "plan" ? "active" : ""} onClick={() => setTab("plan")}>
              Dinner Plan
            </button>
            <button className={tab === "shopping" ? "active" : ""} onClick={() => setTab("shopping")}>
              Shopping List
            </button>
            <button className={tab === "recipes" ? "active" : ""} onClick={() => setTab("recipes")}>
              Recipes
            </button>
          </nav>
          <button
            type="button"
            className="theme-toggle"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      {tab === "plan" && <PlanPage />}
      {tab === "shopping" && <ShoppingListPage />}
      {tab === "recipes" && <RecipesPage />}
    </div>
  );
}

export default App;
