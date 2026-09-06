import { useState } from "react";
import "./App.css";
import { RecipesPage } from "./pages/RecipesPage";
import { PlanPage } from "./pages/PlanPage";
import { ShoppingListPage } from "./pages/ShoppingListPage";

type Tab = "plan" | "shopping" | "recipes";

function App() {
  const [tab, setTab] = useState<Tab>("plan");

  return (
    <div className="app">
      <header className="app-header">
        <h1>Meal Planner</h1>
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
      </header>

      {tab === "plan" && <PlanPage />}
      {tab === "shopping" && <ShoppingListPage />}
      {tab === "recipes" && <RecipesPage />}
    </div>
  );
}

export default App;
