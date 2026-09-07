import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const TEST_DATABASE_URL = "file:../data/test.db";

export default function setup() {
  const dataDir = path.join(__dirname, "..", "data");
  fs.mkdirSync(dataDir, { recursive: true });

  const cwd = path.join(__dirname, "..");
  const env = { ...process.env, DATABASE_URL: TEST_DATABASE_URL };

  // Don't rely on @prisma/client's postinstall hook having generated the
  // client already (e.g. a fresh `npm ci` checkout in CI) — generate it
  // explicitly before running migrations.
  execSync("npx prisma generate", { cwd, stdio: "inherit", env });
  execSync("npx prisma migrate deploy", { cwd, stdio: "inherit", env });
}
