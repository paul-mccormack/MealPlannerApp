import path from "path";
import express from "express";
import cors from "cors";
import { recipesRouter } from "./routes/recipes";
import { ingredientsRouter } from "./routes/ingredients";
import { planRouter } from "./routes/plan";
import { shoppingListRouter } from "./routes/shoppingList";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/recipes", recipesRouter);
app.use("/api/ingredients", ingredientsRouter);
app.use("/api/plan", planRouter);
app.use("/api/shopping-list", shoppingListRouter);

const clientDist = path.join(__dirname, "..", "public");
app.use(express.static(clientDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(clientDist, "index.html"));
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "internal server error" });
});

export { app };
