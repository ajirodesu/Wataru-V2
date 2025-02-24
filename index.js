"use strict";

const { spawn } = require("child_process");
const path = require("path");
const express = require("express");

const app = express();
const SCRIPT_FILE = "main.js";
const SCRIPT_PATH = path.join(__dirname, SCRIPT_FILE);
const PORT = process.env.PORT || 3000;

let botProcess = null;

app.get("/", (req, res) => res.send("Wataru Bot is now running."));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

function startBot() {
  console.log(`Starting bot process: ${SCRIPT_FILE}`);
  botProcess = spawn("node", [SCRIPT_PATH], {
    cwd: __dirname,
    stdio: "inherit",
    shell: true,
  });

  botProcess.on("error", (err) => console.error("Failed to start bot process:", err));
  botProcess.on("close", (exitCode) => {
    console.log(`Bot process exited with code ${exitCode}`);

    if (exitCode === 1) { // Matches restart.js and update.js success
      console.log("Restarting bot process in 3 seconds...");
      setTimeout(startBot, 3000);
    } else {
      console.log("Bot process exited with a non-restart code. Shutting down.");
      process.exit(exitCode);
    }
  });
}

function shutdown() {
  console.log("Shutting down gracefully...");
  if (botProcess) botProcess.kill();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startBot();