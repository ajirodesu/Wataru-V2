"use strict";

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// Constants
const REPO_URL = "https://github.com/ajirodesu/wataru.git";
const PROJECT_DIR = path.resolve(__dirname);
const SETUP_DIR = path.join(PROJECT_DIR, "json");
const BACKUP_DIR = path.join(PROJECT_DIR, "backups");
const TEMP_SETUP_BACKUP = path.join(BACKUP_DIR, `setup_backup_${Date.now()}`);

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
    console.log(`[EXEC] ${command}`);
    return output ? output.toString().trim() : "";
  } catch (error) {
    const message = `${errorMessage}: ${error.message}`;
    console.error(`[ERROR] ${message}`);
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
    console.error(`[ERROR] ${error.message}`);
    return false;
  }
}

/**
 * Updates the bot to the latest version from GitHub, preserving the setup folder and its contents.
 * @returns {Promise<void>} Resolves when update completes successfully.
 */
async function updateBot() {
  console.log("[INFO] Starting bot update...");

  try {
    // Validate Git installation
    if (!isGitInstalled()) {
      throw new Error("Git is not installed. Please install Git and try again.");
    }

    // Ensure backup directory exists
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR);
      console.log(`[INFO] Created backups directory: ${BACKUP_DIR}`);
    }

    // Backup the setup folder if it exists
    let setupBackedUp = false;
    if (fs.existsSync(SETUP_DIR)) {
      fs.cpSync(SETUP_DIR, TEMP_SETUP_BACKUP, { recursive: true });
      console.log(`[INFO] Backed up setup folder to ${TEMP_SETUP_BACKUP}`);
      setupBackedUp = true;
    } else {
      console.log("[INFO] No setup folder found to back up.");
    }

    // Ensure git is initialized
    runCommand(
      "git rev-parse --is-inside-work-tree || git init",
      "Failed to initialize or verify Git repository"
    );

    // Set or update the remote origin
    if (!REPO_URL) {
      throw new Error("Repository URL is not defined. Please set REPO_URL.");
    }
    runCommand(
      `git remote set-url origin ${REPO_URL} || git remote add origin ${REPO_URL}`,
      "Failed to set Git remote origin"
    );

    // Fetch and pull the latest changes (setup/ may be overwritten)
    runCommand("git fetch origin", "Failed to fetch from remote repository");
    runCommand(
      "git reset --hard origin/main",
      "Failed to reset to latest main branch"
    );

    // Restore the setup folder from backup if it was backed up
    if (setupBackedUp) {
      fs.rmSync(SETUP_DIR, { recursive: true, force: true }); // Remove updated setup
      fs.cpSync(TEMP_SETUP_BACKUP, SETUP_DIR, { recursive: true }); // Restore original
      fs.rmSync(TEMP_SETUP_BACKUP, { recursive: true, force: true }); // Clean up backup
      console.log(`[INFO] Restored original setup folder from ${TEMP_SETUP_BACKUP}`);
    }

    // Install dependencies with fallback
    try {
      runCommand("npm install", "Failed to install NPM dependencies");
    } catch (error) {
      console.warn(`[WARN] ${error.message}. Proceeding without full dependency update.`);
    }

    console.log("[INFO] Bot updated successfully.");
  } catch (error) {
    console.error(`[ERROR] Update process failed: ${error.message}`);
    // Clean up backup if it exists
    if (fs.existsSync(TEMP_SETUP_BACKUP)) {
      fs.rmSync(TEMP_SETUP_BACKUP, { recursive: true, force: true });
      console.log(`[INFO] Cleaned up temporary backup: ${TEMP_SETUP_BACKUP}`);
    }
    throw error; // Propagate to caller
  }
}

module.exports = { updateBot };