import { app } from "./app";

const port = process.env.PORT ?? 3000;

app.listen(port, () => {
  console.log(`meal-planner server listening on port ${port}`);
});
