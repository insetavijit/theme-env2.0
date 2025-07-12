/**
 * WordPress Theme Automation Tasks
 * --------------------------------
 * Automates common development tasks like:
 * 1. Cloning the WordPress repo
 * 2. Copying default themes
 * 3. Cleaning up temporary files
 * 4. Fixing theme permissions (Unix only)
 *
 * Usage:
 *   node scripts/tasks.js [command]
 *
 * Available commands:
 *   clone      - Clone the WordPress repo into a temp folder
 *   copy       - Copy default themes to ./themes
 *   clean      - Remove the temporary cloned folder
 *   fixperms   - Fix file permissions on the ./themes folder
 *   all        - Run all tasks in sequence
 */

const fs = require("fs");
const fsPromises = fs.promises;
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

const WP_REPO = "https://github.com/WordPress/WordPress.git";
const TEMP_DIR = path.resolve("temp-wp");
const THEMES_TARGET = path.resolve("themes");

/**
 * Recursively copies a directory from src to dest.
 * @param {string} src - Source path.
 * @param {string} dest - Destination path.
 */
async function copyDir(src, dest) {
  await fsPromises.mkdir(dest, { recursive: true });
  const entries = await fsPromises.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fsPromises.copyFile(srcPath, destPath);
    }
  }
}

/**
 * Clones the official WordPress GitHub repository into a temporary folder.
 * Throws an error if git fails or folder already exists.
 */
async function cloneRepo() {
  console.log("🚀 Cloning WordPress repo...");
  if (fs.existsSync(TEMP_DIR)) {
    console.log("⚠️  Temp folder already exists. Removing it first...");
    await cleanTemp();
  }

  try {
    execSync(`git clone --depth=1 ${WP_REPO} "${TEMP_DIR}"`, { stdio: "inherit" });
    console.log("✅ WordPress cloned.");
  } catch (err) {
    throw new Error(`Failed to clone repo: ${err.message}`);
  }
}

/**
 * Copies the default WordPress themes from the cloned repo to ./themes.
 * Skips any themes that already exist in the target.
 */
async function copyThemes() {
  const sourceThemes = path.join(TEMP_DIR, "wp-content", "themes");
  console.log("📂 Copying default themes...");

  if (!fs.existsSync(sourceThemes)) {
    throw new Error(`Themes not found in cloned repo: ${sourceThemes}`);
  }

  await fsPromises.mkdir(THEMES_TARGET, { recursive: true });
  const themes = await fsPromises.readdir(sourceThemes);

  for (const theme of themes) {
    const src = path.join(sourceThemes, theme);
    const dest = path.join(THEMES_TARGET, theme);

    if (fs.existsSync(dest)) {
      console.log(`⚠️  Skipping existing theme: ${theme}`);
    } else {
      const stat = await fsPromises.stat(src);
      if (stat.isDirectory()) {
        await copyDir(src, dest);
      } else {
        await fsPromises.copyFile(src, dest);
      }
      console.log(`✅ Copied: ${theme}`);
    }
  }
}

/**
 * Deletes the temporary cloned WordPress folder if it exists.
 */
async function cleanTemp() {
  if (fs.existsSync(TEMP_DIR)) {
    console.log("🧹 Cleaning up temp folder...");
    await fsPromises.rm(TEMP_DIR, { recursive: true, force: true });
    console.log("✅ Temp folder removed.");
  } else {
    console.log("ℹ️ No temp folder found.");
  }
}

/**
 * Fixes ownership and permissions on the ./themes folder.
 * This works only on Unix/macOS systems and uses sudo via Zsh.
 */
function fixPermissions() {
  if (os.platform() === "win32") {
    console.log("⚠️ Skipping permission fix on Windows.");
    return;
  }

  console.log("🔧 Fixing permissions on ./themes ...");
  try {
    execSync(`sudo chown -R $USER:$USER themes && chmod -R 775 themes`, {
      shell: "/bin/zsh",
      stdio: "inherit",
    });
    console.log("✅ Permissions updated.");
  } catch (err) {
    console.warn("❌ Could not fix permissions:", err.message);
  }
}

/**
 * Runs the full pipeline: clone, copy, clean, fixperms.
 * This replicates your original Python main() logic.
 */
async function runAll() {
  console.time("⏱️ Total time");
  await cloneRepo();
  await copyThemes();
  await cleanTemp();
  fixPermissions();
  console.timeEnd("⏱️ Total time");
}

// CLI Dispatcher
const [,, command] = process.argv;
const commands = {
  clone: cloneRepo,
  copy: copyThemes,
  clean: cleanTemp,
  fixperms: fixPermissions,
  all: runAll,
};

/**
 * Entry point. Parses command-line arguments and executes the selected task.
 */
async function main() {
  if (!commands[command]) {
    console.log("❌ Unknown command:", command || "none");
    console.log("\n📌 Usage:");
    console.log("   node scripts/tasks.js <command>");
    console.log("\n🛠 Available commands:");
    Object.keys(commands).forEach(cmd => console.log(`   - ${cmd}`));
    process.exit(1);
  }

  try {
    await commands[command]();
  } catch (err) {
    console.error("💥 Task failed:", err.message);
    process.exit(1);
  }
}

main();
