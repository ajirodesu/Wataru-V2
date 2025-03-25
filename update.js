"use strict";

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// Load package.json and set script name/version
const packageJson = require(path.join(__dirname, "package.json"));
const SCRIPT_NAME = packageJson.name || "bot-updater";
const SCRIPT_VERSION = packageJson.version || "unknown";

// Project directory
const PROJECT_DIR = path.resolve(__dirname);

// Log prefixes
const LOG_PREFIX = {
  INFO: "[INFO]",
  WARN: "[WARN]",
  ERROR: "[ERROR]",
  EXEC: "[EXEC]",
};

// Function to log messages with prefixes
function log(level, message) {
  console.log(`${LOG_PREFIX[level]} ${message}`);
}

// Read and parse update.json
const updateConfigPath = path.join(__dirname, "json", "update.json");
let updateConfig;
try {
  const configData = fs.readFileSync(updateConfigPath, "utf8");
  updateConfig = JSON.parse(configData);
} catch (error) {
  log("ERROR", `Failed to read or parse update.json: ${error.message}`);
  process.exit(1);
}

// Validate update.json
if (!updateConfig.repository || typeof updateConfig.repository !== "string") {
  log("ERROR", "Missing or invalid 'repository' in update.json");
  process.exit(1);
}
if (!updateConfig.branch || typeof updateConfig.branch !== "string") {
  log("ERROR", "Missing or invalid 'branch' in update.json");
  process.exit(1);
}
if (!updateConfig.preserve || !Array.isArray(updateConfig.preserve)) {
  log("ERROR", "Missing or invalid 'preserve' in update.json");
  process.exit(1);
}
if (!updateConfig.backup || typeof updateConfig.backup !== "string") {
  log("ERROR", "Missing or invalid 'backup' in update.json");
  process.exit(1);
}

// Set CONFIG based on update.json
const CONFIG = {
  repoUrl: updateConfig.repository,
  branch: updateConfig.branch,
  preserveDirs: updateConfig.preserve,
  backupDir: path.join(PROJECT_DIR, updateConfig.backup),
};

/**
 * Executes a shell command with error handling and logging.
 * @param {string} command - The shell command to execute.
 * @param {string} [errorMessage] - Custom error message for failure.
 * @returns {string} Command output, or empty string if none.
 * @throws {Error} If the command fails.
 */
function runCommand(command, errorMessage = `Failed to execute '${command}'`) {
  try {
    const output = execSync(command, { cwd: PROJECT_DIR, stdio: "inherit" });
    log("EXEC", command);
    return output ? output.toString().trim() : "";
  } catch (error) {
    const message = `${errorMessage}: ${error.message}`;
    log("ERROR", message);
    throw new Error(message);
  }
}

/**
 * Checks if Git is available on the system.
 * @returns {boolean} True if Git is installed, false otherwise.
 */
function isGitInstalled() {
  try {
    runCommand("git --version", "Git is not installed on this system");
    return true;
  } catch (error) {
    log("ERROR", error.message);
    return false;
  }
}

/**
 * Updates the bot to the latest version from the GitHub repository.
 * @returns {Promise<void>} Resolves when the update completes successfully.
 * @throws {Error} If the update process fails.
 */
async function updateBot() {
  log("INFO", `Starting ${SCRIPT_NAME} update (Version: ${SCRIPT_VERSION})...`);

  try {
    // Validate Git installation
    if (!isGitInstalled()) {
      throw new Error("Git is not installed. Please install Git and try again.");
    }

    // Ensure backup directory exists
    if (!fs.existsSync(CONFIG.backupDir)) {
      fs.mkdirSync(CONFIG.backupDir, { recursive: true });
      log("INFO", `Created backups directory: ${CONFIG.backupDir}`);
    }

    // Backup preserved directories
    const backups = {};
    for (const dir of CONFIG.preserveDirs) {
      const fullDir = path.join(PROJECT_DIR, dir);
      if (fs.existsSync(fullDir)) {
        const backupPath = path.join(CONFIG.backupDir, `${dir}_backup_${Date.now()}`);
        fs.cpSync(fullDir, backupPath, { recursive: true });
        backups[dir] = backupPath;
        log("INFO", `Backed up ${dir} to ${backupPath}`);
      } else {
        log("INFO", `No ${dir} folder found to back up.`);
      }
    }

    // Check for uncommitted changes
    try {
      runCommand("git diff --quiet && git diff --staged --quiet", "Failed to check Git status");
    } catch (error) {
      log("WARN", "Uncommitted changes detected. These will be overwritten.");
    }

    // Update the repository
    runCommand(
      "git rev-parse --is-inside-work-tree || git init",
      "Failed to initialize or verify Git repository"
    );
    runCommand(
      `git remote set-url origin ${CONFIG.repoUrl} || git remote add origin ${CONFIG.repoUrl}`,
      "Failed to set Git remote origin"
    );
    runCommand("git fetch origin", "Failed to fetch from remote repository");
    runCommand(
      `git reset --hard origin/${CONFIG.branch}`,
      `Failed to reset to latest ${CONFIG.branch} branch`
    );

    // Restore preserved directories
    for (const [dir, backupPath] of Object.entries(backups)) {
      const fullDir = path.join(PROJECT_DIR, dir);
      fs.rmSync(fullDir, { recursive: true, force: true });
      fs.cpSync(backupPath, fullDir, { recursive: true });
      fs.rmSync(backupPath, { recursive: true, force: true });
      log("INFO", `Restored original ${dir} from ${backupPath}`);
    }

    // Install dependencies
    try {
      runCommand("npm install", "Failed to install NPM dependencies");
    } catch (error) {
      throw new Error(`Dependency installation failed: ${error.message}. Update aborted.`);
    }

    log("INFO", `${SCRIPT_NAME} updated successfully.`);
  } catch (error) {
    log("ERROR", `Update process failed: ${error.message}`);
    throw error;
  }
}

// Export for use in other modules
module.exports = { updateBot };

// Execute if run directly
if (require.main === module) {
  updateBot().catch((error) => {
    log("ERROR", `Unhandled error: ${error.message}`);
    process.exit(1);
  });
}