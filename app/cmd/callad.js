exports.meta = {
  name: "callad",
  aliases: [],
  version: "1.4.0",
  author: "NTKhang, ManhG Fix Get, Enhanced by AjiroDesu",
  description: "Report bot errors or feedback to admins and maintain a continuous conversation.",
  guide: "[Error encountered or comments]",
  cooldown: 5,
  type: "anyone",
  category: "report"
};

// Handles ongoing conversations between users and admins
exports.onReply = async function({ bot, wataru, msg, chatId, args, data }) {
  const senderName = `${msg.from.first_name || 'Unknown'} ${msg.from.last_name || ''}`.trim();
  const groupName = msg.chat.title || "Private Chat";
  const groupId = msg.chat.id;

  if (data.type === "reply") {
    // User is replying to an admin.
    for (let adminId of global.config.admin) {
      await bot.sendMessage(adminId, 
        `📩 **New Reply from ${senderName}**\n📌 **Group:** ${groupName} (**ID:** \`${groupId}\`)\n💬 **Message:**\n${msg.text}`, 
        {
          parse_mode: "Markdown",
          reply_markup: { force_reply: true },
          reply_to_message_id: data.adminMsgId // Reply directly to the admin's last message
        }
      ).then(sentMsg => {
        global.client.replies.set(sentMsg.message_id, {
          meta: exports.meta,
          type: "calladmin",
          userId: data.userId,
          adminMsgId: sentMsg.message_id, // Store new admin message ID
          userMsgId: msg.message_id, // Store user message ID
          groupName,
          groupId
        });
      });
    }
    // Send confirmation to the user
    await bot.sendMessage(chatId, "✅ **Your reply has been sent to the admin(s).**", { parse_mode: "Markdown", reply_to_message_id: msg.message_id });

  } else if (data.type === "calladmin") {
    // Admin is replying to the user.
    await bot.sendMessage(data.userId, 
      `📌 **Reply from Admin: \n${senderName}**\n💬 **Message:**\n${msg.text}\n\n➡ **Reply to continue the conversation.**`, 
      {
        parse_mode: "Markdown",
        reply_markup: { force_reply: true },
        reply_to_message_id: data.userMsgId // Reply directly to the user's last message
      }
    ).then(sentMsg => {
      global.client.replies.set(sentMsg.message_id, {
        meta: exports.meta,
        type: "reply",
        userId: data.userId,
        adminMsgId: msg.message_id, // Store admin message ID
        userMsgId: sentMsg.message_id, // Store new user message ID
        groupName: data.groupName,
        groupId: data.groupId
      });
    });
    // Send confirmation to the admin
    await bot.sendMessage(chatId, "✅ **Your reply has been sent to the user.**", { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
  }
};

// Handles initial reports
exports.onStart = async function({ bot, wataru, msg, chatId, args, userId }) {
  if (!args[0]) {
    return await bot.sendMessage(chatId, "❌ **Please enter the content to report.**", { parse_mode: "Markdown" });
  }

  const userName = `${msg.from.first_name || 'Unknown'} ${msg.from.last_name || ''}`.trim();
  const groupName = msg.chat.title || "Private Chat";
  const groupId = msg.chat.id;
  const moment = require("moment-timezone");
  const currentTime = moment.tz(`${global.config.timeZone}`).format("HH:mm:ss D/MM/YYYY");

  // Notify the user that their report has been sent
  await bot.sendMessage(chatId, `✅ **Report sent!**\n📅 **Time:** ${currentTime}`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });

  // Send the report to all admins
  for (let adminId of global.config.admin) {
    await bot.sendMessage(adminId, 
      `📩 **New Report**\n👤 **From:** ${userName}\n🔰 **Group:** ${groupName} (**ID:** \`${groupId}\`)\n🆔 **User ID:** \`${userId}\`\n` +
      `-----------------\n⚠ **Report:** ${args.join(" ")}\n-----------------\n🕒 **Time:** ${currentTime}`,
      {
        parse_mode: "Markdown",
        reply_markup: { force_reply: true }
      }
    ).then(sentMsg => {
      global.client.replies.set(sentMsg.message_id, {
        meta: exports.meta,
        type: "calladmin",
        userId: chatId,
        adminMsgId: sentMsg.message_id, // Store admin's first message ID
        userMsgId: msg.message_id, // Store user's first message ID
        groupName,
        groupId
      });
    });
  }
};