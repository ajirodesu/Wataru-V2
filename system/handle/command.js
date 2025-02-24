const moment = require("moment-timezone");

exports.command = async function ({ bot, wataru, msg, chatId, args, db }) {
  // Guard against non-text messages.
  if (typeof msg.text !== "string") return;

  const text = msg.text;
  const dateNow = Date.now();
  const time = moment.tz(global.config.timeZone).format("HH:mm:ss DD/MM/YYYY");

  // Get global config values.
  const { admin, symbols, devMode, prefix } = global.config;
  const { commands, cooldowns } = global.client;
  const { from, chat } = msg;
  const senderID = String(from.id);
  const userId = from.id;

  // ─────────────────────────────────────────────────────────────────────────
  // Determine the effective prefix.
  let effectivePrefix = prefix;
  if (chat.type === "group" || chat.type === "supergroup") {
    // Retrieve the group record from the database.
    const groupRecord = await db.getGroup(chatId);
    if (groupRecord && groupRecord.prefix && groupRecord.prefix.trim() !== "") {
      effectivePrefix = groupRecord.prefix;
    }
  }

  // Determine if the message starts with the effective prefix.
  const prefixUsed = text.startsWith(effectivePrefix);

  // Remove the prefix if used; otherwise, use the raw trimmed text.
  const commandText = prefixUsed ? text.slice(effectivePrefix.length).trim() : text.trim();

  // If no command text is provided, respond (if the user typed the prefix) or ignore.
  if (commandText.length === 0) {
    if (prefixUsed) {
      return wataru.reply("Please enter a command after the prefix.");
    } else {
      return;
    }
  }

  // Extract the command name and arguments.
  const commandArgs = commandText.split(/\s+/);
  let commandName = commandArgs.shift().toLowerCase();

  // Handle commands that include a bot username (e.g., "/help@YourBotUsername")
  if (commandName.includes("@")) {
    const parts = commandName.split("@");
    commandName = parts[0];
    try {
      const me = await bot.getMe();
      const botUsername = me.username;
      if (parts[1].toLowerCase() !== botUsername.toLowerCase()) {
        return;
      }
    } catch (error) {
      console.error("Failed to get bot username:", error);
      return;
    }
  }

  // Retrieve the command module using its primary name.
  let command = commands.get(commandName);

  // ── Alias Support ─────────────────────────────────────────────
  if (!command) {
    for (const cmd of commands.values()) {
      if (
        cmd.meta.aliases &&
        Array.isArray(cmd.meta.aliases) &&
        cmd.meta.aliases.map((alias) => alias.toLowerCase()).includes(commandName)
      ) {
        command = cmd;
        break;
      }
    }
  }
  // ─────────────────────────────────────────────────────────────

  if (!command) {
    if (prefixUsed) {
      return wataru.reply(`The command "${commandName}" is not found in my system.`);
    } else {
      return;
    }
  }

  // ── Check the Command’s Prefix Requirement ─────────────────────
  let cmdPrefixSetting = command.meta.prefix;
  if (cmdPrefixSetting === undefined) cmdPrefixSetting = true;

  if (cmdPrefixSetting === true && !prefixUsed) {
    return wataru.reply(
      `The command "${command.meta.name}" requires a prefix. Please use "${effectivePrefix}" before the command name.`
    );
  }
  if (cmdPrefixSetting === false && prefixUsed) {
    return wataru.reply(
      `The command "${command.meta.name}" does not require a prefix. Please invoke it without the prefix.`
    );
  }
  // ─────────────────────────────────────────────────────────────

  // Define a helper function to show command usages.
  const usages = () => {
    if (!command.meta.guide) return;
    let usageText = `${symbols} Usages:\n`;
    const displayPrefix = (command.meta.prefix === false) ? "" : effectivePrefix;
    if (Array.isArray(command.meta.guide)) {
      for (const guide of command.meta.guide) {
        usageText += `${displayPrefix}${command.meta.name} ${guide}\n`;
      }
    } else {
      usageText += `${displayPrefix}${command.meta.name} ${command.meta.guide}`;
    }
    return wataru.reply(usageText, { parse_mode: "Markdown" });
  };

  // ── Check Permissions and Restrictions ─────────────────────────
  const isBotAdmin = admin.includes(senderID);
  const isVIP = global.vip.uid.includes(senderID);

  if (command.meta.type === "administrator" && !isBotAdmin) {
    if (!["group", "supergroup"].includes(chat.type)) {
      return wataru.reply(
        `The "${command.meta.name}" command can only be used in a group or supergroup by an administrator.`
      );
    }
    try {
      const member = await bot.getChatMember(chatId, senderID);
      if (!(member.status === "administrator" || member.status === "creator")) {
        return wataru.reply(
          `You do not have sufficient permission to use the "${command.meta.name}" command. (Requires group administrator)`
        );
      }
    } catch (error) {
      return wataru.reply("Unable to verify your group admin status. Please try again later.");
    }
  }

  if (!isBotAdmin) {
    if (command.meta.type === "admin") {
      return wataru.reply(`You do not have sufficient permission to use the "${command.meta.name}" command.`);
    }
    if (command.meta.type === "vip" && !isVIP) {
      return wataru.reply(`You do not have VIP access to use the "${command.meta.name}" command.`);
    }
    if (command.meta.type === "group" && !["group", "supergroup"].includes(chat.type)) {
      return wataru.reply(`The "${command.meta.name}" command can only be used in a group or supergroup.`);
    }
    if (command.meta.type === "private" && chat.type !== "private") {
      return wataru.reply(`The "${command.meta.name}" command can only be used in private chats.`);
    }
  }

  // ── Cooldown Logic ──────────────────────────────────────────────
  if (!isBotAdmin) {
    if (!cooldowns.has(command.meta.name)) {
      cooldowns.set(command.meta.name, new Map());
    }
    const timestamps = cooldowns.get(command.meta.name);
    const expirationTime = (command.meta.cooldown || 1) * 1000;
    if (timestamps.has(senderID) && dateNow < timestamps.get(senderID) + expirationTime) {
      const timeLeft = Math.ceil((timestamps.get(senderID) + expirationTime - dateNow) / 1000);
      return wataru.reply(`😼 Please wait ${timeLeft} seconds before using "${commandName}" again.`);
    }
    timestamps.set(senderID, dateNow);
  }

  try {
    // Build the context and execute the command.
    const context = {
      bot,
      wataru,
      msg,
      chatId,
      args: commandArgs,
      type: isBotAdmin ? "admin" : "anyone",
      userId,
      usages,
      db,
    };

    await command.onStart(context);

    if (devMode === true) {
      console.log(
        `Executed command "${commandName}" at ${time} from ${senderID} with arguments: ${commandArgs.join(" ")} in ${
          Date.now() - dateNow
        }ms`,
        "[ DEV MODE ]"
      );
    }
  } catch (e) {
    console.error(`Error executing command "${commandName}":`, e);
    return wataru.reply(`Error executing command "${commandName}": ${e.message}`);
  }
};
