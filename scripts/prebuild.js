const { execSync } = require("child_process");

console.log("[prebuild] Checking database synchronization...");

if (process.env.DATABASE_URL) {
  console.log("[prebuild] DATABASE_URL detected. Synchronizing Prisma schema with database...");
  try {
    execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });
    console.log("[prebuild] Database schema synchronized successfully!");
  } catch (error) {
    console.error("[prebuild] Warning: Could not push database schema:", error.message);
  }
} else {
  console.log("[prebuild] No DATABASE_URL set in environment, skipping prisma db push.");
}
