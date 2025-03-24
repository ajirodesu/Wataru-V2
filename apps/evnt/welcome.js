const meta = {
  name: "welcome",
  description: "Handles new members joining the group and sends welcome messages.",
  type: "welcome",
  author: "Ajirodesu"
};

async function onStart({ bot, msg }) {
  const chatId = msg.chat.id;
  const newMembers = msg.new_chat_members;

  try {
    if (!newMembers) return;

    // Get bot info
    const botInfo = await bot.getMe();
    const chatInfo = await bot.getChat(chatId);
    const title = chatInfo.title || "the group";

    // Check if bot was added
    const isBotAdded = newMembers.some(member => member.id === botInfo.id);

    // If the bot itself is newly added
    if (isBotAdded) {
      const chatMember = await bot.getChatMember(chatId, botInfo.id);

      if (chatMember.status !== 'administrator') {
        await bot.sendMessage(
          chatId,
          `🎉 ${botInfo.first_name} has been successfully connected!\n\n` +
          `Thank you for inviting me to ${title}. To unlock my full range of features, ` +
          `please consider granting me admin privileges.`
        );
      }
      return;
    }

    // Handle regular member joins
    for (const newMember of newMembers) {
      const memberName = `${newMember.first_name}${newMember.last_name ? ' ' + newMember.last_name : ''}`;
      const memberCount = await bot.getChatMemberCount(chatId);

      // Send a simple text-only welcome message
      await bot.sendMessage(
        chatId,
        `Hi ${memberName}, welcome to ${title}!\n` +
        `Please enjoy your time here! 🥳♥\n\n` +
        `You are ${memberCount}th member of this group.`
      );
    }

  } catch (error) {
    console.log('Error in welcome handler:', error);
    if (global.config?.admin) {
      await bot.sendMessage(
        global.config.admin,
        `Error in welcome handler:\n${error.message}`
      );
    }
  }
};

module.exports = { meta, onStart };