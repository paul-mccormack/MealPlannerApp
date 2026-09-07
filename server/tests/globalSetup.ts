import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const TEST_DATABASE_URL = "file:../data/test.db";

export default function setup() {
  const dataDir = path.join(__dirname, "..", "data");
  fs.mkdirSync(dataDir, { recursive: true });

  execSync("npx prisma migrate deploy", {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
}
