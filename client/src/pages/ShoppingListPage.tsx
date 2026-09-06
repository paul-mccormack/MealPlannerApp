import { useEffect, useState } from "react";
import { api } from "../api";
import type { ShoppingListItem } from "../types";

export function ShoppingListPage() {
  const [items, setItems] = useState<ShoppingListItem[]>([]);

  useEffect(() => {
    api.shoppingList().then((res) => setItems(res.items));
  }, []);

  return (
    <div className="page">
      <section className="card">
        <h2>Shopping list</h2>
        {items.length === 0 ? (
          <p className="muted">No dinners planned yet.</p>
        ) : (
          <ul className="shopping-list">
            {items.map((item) => (
              <li key={`${item.ingredient}-${item.unit}`}>
                <label>
                  <input type="checkbox" />
                  {item.quantity} {item.unit} {item.ingredient}
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
