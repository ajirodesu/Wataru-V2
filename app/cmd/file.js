const fs = require("fs");
const path = require("path");

exports.meta = {
  name: "file",
  aliases: [],
  version: "1.0.0",
  author: "Deku",
  description: "File management: view command files from a list.",
  guide: [""],
  cooldown: 8,
  type: "admin",
  category: "system"
};

/**
 * Helper function: Sends file content.
 * If the content is longer than 2000 characters, writes it to a temporary file and sends it as an attachment.
 */
async function sendFileContent({ bot, chatId, filePath, fileDisplayName }) {
  const content = fs.readFileSync(filePath, "utf8");
  if (content.length > 2000) {
    const tempDir = path.join(process.cwd(), "app", "tmp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    const tempFile = path.join(tempDir, `${fileDisplayName}_${Date.now()}.txt`);
    fs.writeFileSync(tempFile, content, "utf8");
    await bot.sendMessage(chatId, "File content is too long, sending as attachment.", { attachment: tempFile });
    fs.unlinkSync(tempFile);
  } else {
    await bot.sendMessage(chatId, content, { parse_mode: "Markdown" });
  }
}

/**
 * onStart: Executes when the user issues the "file" command.
 * It sends a paginated list (default page 1) of command files found in the "app/cmd" folder.
 * The sent message is formatted with Markdown (so text between * is bold).
 * The message’s ID and page number are stored so that later replies (by number) are processed.
 */
exports.onStart = async function({ bot, chatId, msg, args }) {
  try {
    // Folder with command files.
    const dir = path.join(process.cwd(), "app", "cmd");
    if (!fs.existsSync(dir)) {
      return await bot.sendMessage(chatId, "The command files directory does not exist.", { parse_mode: "Markdown" });
    }
    // Get only .js files.
    let files = fs.readdirSync(dir).filter(file => file.endsWith(".js"));
    if (files.length === 0) {
      return await bot.sendMessage(chatId, "No command files found.", { parse_mode: "Markdown" });
    }

    // Determine the requested page number (default: 1).
    let page = 1;
    if (args[0]) {
      const parsed = parseInt(args[0]);
      if (!isNaN(parsed)) page = parsed;
      else return await bot.sendMessage(chatId, "Invalid page number provided.", { parse_mode: "Markdown" });
    }

    const itemsPerPage = 10;
    const totalPages = Math.ceil(files.length / itemsPerPage);
    if (page < 1 || page > totalPages) {
      return await bot.sendMessage(chatId, `Invalid page number. There are only *${totalPages}* page(s).`, { parse_mode: "Markdown" });
    }

    // Build the paginated list message.
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, files.length);
    let messageText = "*📁 List of Available Command Files:*\n\n";
    for (let i = startIndex; i < endIndex; i++) {
      // Remove the .js extension for display.
      const displayName = files[i].replace(".js", "");
      messageText += `📄 ${i + 1}. ${displayName}\n`;
    }
    messageText += `\n*📖 Page ${page}/${totalPages}*\nReply with the number of the file to view its content.`;

    // Send the list message with Markdown parse mode.
    const sentMsg = await bot.sendMessage(chatId, messageText, { parse_mode: "Markdown" });
    // Retrieve the sent message's ID (try both possible property names).
    const messageId = sentMsg.message_id || sentMsg.id;
    // Save context so that replies to this message will know which page to reference.
    global.client.replies.set(messageId, {
      meta: exports.meta,
      page: page
    });
  } catch (error) {
    await bot.sendMessage(chatId, `An error occurred: ${error.message}`, { parse_mode: "Markdown" });
  }
};

/**
 * onReply: Executes when the user replies to the file list message.
 * The reply should be a number corresponding to one of the files shown.
 * The file's content is then sent (or attached if too long).
 */
exports.onReply = async function({ bot, msg, chatId, userId, args, data, commandName, replyMsg, message }) {
  try {
    const page = data.page;
    const dir = path.join(process.cwd(), "app", "cmd");
    let files = fs.readdirSync(dir).filter(file => file.endsWith(".js"));
    if (files.length === 0) {
      return await bot.sendMessage(chatId, "No command files found.", { parse_mode: "Markdown" });
    }

    const itemsPerPage = 10;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, files.length);
    const displayedCount = endIndex - startIndex;

    const selection = parseInt(msg.text);
    if (isNaN(selection) || selection < 1 || selection > displayedCount) {
      return await bot.sendMessage(chatId, "Invalid selection. Please reply with a valid number from the list.", { parse_mode: "Markdown" });
    }

    // Calculate the index of the selected file.
    const fileIndex = startIndex + selection - 1;
    const fileName = files[fileIndex].replace(".js", "");
    const filePath = path.join(dir, files[fileIndex]);
    if (!fs.existsSync(filePath)) {
      return await bot.sendMessage(chatId, "File not found.", { parse_mode: "Markdown" });
    }

    // Send the file content (or attachment if it’s too long).
    await sendFileContent({ bot, chatId, filePath, fileDisplayName: fileName });
  } catch (error) {
    await bot.sendMessage(chatId, `Error processing your reply: ${error.message}`, { parse_mode: "Markdown" });
  }
};