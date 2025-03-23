"use strict";

const { execSync } = require("child_process");

// Constants
const RESTART_CODE = 0;

/**
 * Automatically installs missing NPM packages and restarts the bot.
 */
exports.install = function() {
  const originalRequire = module.constructor.prototype.require;

  module.constructor.prototype.require = function(moduleName) {
    try {
      return originalRequire.call(this, moduleName);
    } catch (error) {
      if (error.code === "MODULE_NOT_FOUND" && !moduleName.startsWith(".") && !moduleName.startsWith("/")) {
        console.log(`NPM module '${moduleName}' not found. Attempting to install...`);

        try {
          execSync(`npm install ${moduleName}`, {
            stdio: "inherit",
            cwd: process.cwd(),
          });

          console.log(`Successfully installed '${moduleName}'. Restarting bot...`);
          restartBot();

          // This return won't execute due to process.exit, but included for completeness
          return originalRequire.call(this, moduleName);
        } catch (installError) {
          console.error(`Failed to install '${moduleName}': ${installError.message}`);
          throw installError;
        }
      }
      throw error; // Re-throw for local paths or other errors
    }
  };
};

/**
 * Restarts the bot process.
 */
function restartBot() {
  console.log("Bot restarting now...");
  process.exit(RESTART_CODE); // Trigger restart via process manager
}

// Run only once
if (!global.install) {
  exports.install();
  global.install = true;
}