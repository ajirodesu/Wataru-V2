exports.meta = {
  name: 'owner',
  version: '1.0.0',
  description: 'Displays comprehensive information about the bot owner',
  author: 'AjiroDesu',
  type: 'anyone',
  cooldown: 5,
  category: 'info',
  guide: []
};

exports.onStart = async function({ bot, msg }) {
  const chatId = msg.chat.id;
  const ownerName = global.config.owner;
  const adminContact = global.config.admin[0]; // Primary contact from the admin array

  const ownerInfo = `
*Owner Information*

*Name:* ${ownerName}  
*Title:* Creator of Wataru Bot & Lead Developer  

*Biography:*  
${ownerName} is not only a seasoned software engineer but also the creative force behind Wataru Bot. With years of hands-on experience and a passion for innovation, ${ownerName} has developed Wataru Bot to deliver a reliable, efficient, and engaging experience for its users. Under their guidance, every feature is meticulously designed and regularly updated to incorporate the latest advancements and user feedback.

*Contact:* [Tap to Chat](tg://user?id=${adminContact})  
*Timezone:* ${global.config.timeZone}

For any inquiries, collaborations, or support, please feel free to reach out using the contact link above.
  `;

  try {
    // Attempt to fetch the owner's profile photos with a limit of 1
    const profilePhotos = await bot.getUserProfilePhotos(adminContact, { limit: 1 });
    if (profilePhotos.total_count > 0 && profilePhotos.photos.length > 0) {
      // The API returns an array of arrays. Each inner array holds different sizes.
      // We'll choose the largest available version from the first photo.
      const photoSizes = profilePhotos.photos[0];
      const bestPhoto = photoSizes.reduce((prev, current) => {
        return (current.file_size > prev.file_size ? current : prev);
      });
      
      // Send the photo with the detailed owner info as caption
      await bot.sendPhoto(chatId, bestPhoto.file_id, {
        caption: ownerInfo,
        parse_mode: 'Markdown'
      });
    } else {
      // Fallback: No profile photo found, send just the text message
      await bot.sendMessage(chatId, ownerInfo, { parse_mode: 'Markdown' });
    }
  } catch (error) {
    console.error('Error fetching profile photo:', error);
    // In case of any errors, fallback to sending the text message
    await bot.sendMessage(chatId, ownerInfo, { parse_mode: 'Markdown' });
  }
};
