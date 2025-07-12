/**
 * Sage Setup Script
 * ------------------
 * Clones the Sage starter theme into ./themes/sage-theme
 * and installs Composer and npm dependencies.
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const THEMES_TARGET = path.resolve("themes");
const SAGE_DIR = path.join(THEMES_TARGET, "sage-theme");

/**
 * Clones the Sage starter theme and installs dependencies.
 */
async function cloneSage() {
  if (fs.existsSync(SAGE_DIR)) {
    console.log("⚠️  Sage theme already exists. Skipping clone.");
    return;
  }

  console.log("🌱 Cloning Sage theme...");
  execSync(`git clone --depth=1 https://github.com/roots/sage.git "${SAGE_DIR}"`, { stdio: "inherit" });

  console.log("📦 Installing Composer dependencies...");
  execSync(`composer install`, { cwd: SAGE_DIR, stdio: "inherit" });

  console.log("📦 Installing npm dependencies...");
  execSync(`npm install`, { cwd: SAGE_DIR, stdio: "inherit" });

  console.log("✅ Sage setup complete!");
}

// CLI Entry
const [,, command] = process.argv;
if (command === "sagesetup") {
  cloneSage();
} else {
  console.log("❌ Unknown command. Try:");
  console.log("   node scripts/sage.js sagesetup");
}
