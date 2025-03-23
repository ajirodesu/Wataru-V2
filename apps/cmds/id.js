exports.meta = {
  name: 'id',
  version: '1.0.0',
  description: 'Get user ID information',
  author: 'JohnDev19',
  type: 'anyone',
  cooldown: 0,
  category: 'utility',
  guide: [
    '[username]',
  ]
};

exports.onStart = async function({ bot, msg, args, chatId }) {
  try {
    let targetUser;
    let userPhotos;

    if (args[0] && args[0].startsWith('@')) {
      try {
        const chatMembers = await bot.getChatAdministrators(chatId);

        const foundMember = chatMembers.find(member => 
          member.user.username && 
          '@' + member.user.username.toLowerCase() === args[0].toLowerCase()
        );

        if (!foundMember) {
          return bot.sendMessage(chatId, `❌ User ${args[0]} not found in this group.`);
        }

        targetUser = foundMember.user;
      } catch (memberError) {
        console.error('Member search error:', memberError);
        return bot.sendMessage(chatId, '❌ Unable to find user in the group.');
      }
    } 
    else {
      targetUser = msg.from;
    }

    try {
      userPhotos = await bot.getUserProfilePhotos(targetUser.id);
    } catch (photoError) {
      console.error('Profile photo error:', photoError);
      userPhotos = null;
    }

    const userDetails = `
📋 *User Information*

👤 Name: ${targetUser.first_name || ''} ${targetUser.last_name || ''}
🆔 User ID: \`${targetUser.id}\`
👥 Username: ${targetUser.username ? '@' + targetUser.username : 'No username'}

🌐 *Chat Details:*
💬 Chat ID: \`${msg.chat.id}\`
📊 Chat Type: ${msg.chat.type}
    `;

    if (userPhotos && userPhotos.photos.length > 0) {
      await bot.sendPhoto(chatId, userPhotos.photos[0][0].file_id, {
        caption: userDetails,
        parse_mode: 'Markdown'
      });
    } else {
      await bot.sendMessage(chatId, userDetails, {
        parse_mode: 'Markdown'
      });
    }

  } catch (error) {
    console.error('ID Command Error:', error);
    bot.sendMessage(chatId, '❌ An error occurred while retrieving ID information.');
  }
};
