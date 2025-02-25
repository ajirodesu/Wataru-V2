/**
 * This module schedules multiple broadcast tasks that send greeting messages
 * to Telegram groups. It uses node-cron for scheduling, moment-timezone for time
 * handling, and node-fetch to retrieve public holidays from the Nager.Date API.
 *
 * Requirements:
 * - A valid Telegram bot instance (`bot`) with a sendMessage method.
 * - A database module (`db`) with a getAllGroups method that returns groups having a group_id.
 * - A global configuration object `global.config` with a `timeZone` property.
 */

const moment = require('moment-timezone');
const cron = require('node-cron');
const fetch = require('node-fetch');

const HOLIDAY_API = 'https://date.nager.at/api/v3/publicholidays';

// Cache for holidays by year to reduce API calls.
const holidayCache = new Map();

/**
 * Fetches public holidays for the given date's year and formats them.
 *
 * @param {moment.Moment} date - A moment date object.
 * @returns {Promise<Array<{ date: string, name: string }>>} - Array of holidays.
 */
const fetchHolidays = async (date) => {
  const year = date.year();
  const countryCode = 'PH'; // Customize based on your needs

  // Return cached holidays if available.
  if (holidayCache.has(year)) {
    return holidayCache.get(year);
  }

  try {
    const response = await fetch(`${HOLIDAY_API}/${year}/${countryCode}`);
    if (!response.ok) {
      throw new Error(`Holiday API request failed with status: ${response.status}`);
    }
    const holidays = await response.json();
    const formattedHolidays = holidays.map(h => ({
      date: moment(h.date)
        .tz(global.config?.timeZone || 'UTC')
        .format('MM-DD'),
      name: h.localName
    }));
    // Cache the holidays for the year.
    holidayCache.set(year, formattedHolidays);
    return formattedHolidays;
  } catch (error) {
    console.error(`Failed to fetch holidays: ${error.message}`);
    return []; // Fallback to an empty array on error.
  }
};

/**
 * Retrieves all special holiday names for the given date.
 *
 * @param {moment.Moment} date - A moment date object.
 * @returns {Promise<string[]>} - Array of holiday names (if any).
 */
const getSpecialDays = async (date) => {
  const holidays = await fetchHolidays(date);
  const today = date.format('MM-DD');
  return holidays.filter(h => h.date === today).map(h => h.name);
};

/**
 * Broadcasts a message to all groups.
 *
 * @param {object} bot - Telegram bot instance with a sendMessage method.
 * @param {object} db - Database instance with a getAllGroups method.
 * @param {string} message - The message to broadcast.
 * @param {object} options - Optional Telegram sendMessage options.
 * @returns {Promise<{successCount: number, failCount: number, total: number}>}
 */
const broadcastMessage = async (bot, db, message, options = {}) => {
  try {
    const groups = await db.getAllGroups();

    if (!groups || groups.length === 0) {
      console.log('No groups found for broadcasting.');
      return { successCount: 0, failCount: 0, noGroups: true };
    }

    // Default options for Telegram messages.
    const messageOptions = {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...options
    };

    const results = await Promise.allSettled(
      groups.map(async group => {
        try {
          await bot.sendMessage(group.group_id, message, messageOptions);
          return { success: true, groupId: group.group_id };
        } catch (err) {
          console.error(`Failed to send message to group ${group.group_id}: ${err.message}`);
          return { success: false, groupId: group.group_id, error: err };
        }
      })
    );

    const successCount = results.filter(
      r => r.status === 'fulfilled' && r.value && r.value.success
    ).length;
    const failCount = results.length - successCount;

    console.log(`Broadcast complete: ${successCount} succeeded, ${failCount} failed out of ${groups.length} groups.`);

    // Detailed error logging.
    results.forEach(r => {
      if (r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)) {
        const groupId = r.status === 'fulfilled' ? r.value.groupId : r.reason?.groupId;
        const errorMsg = r.status === 'fulfilled' ? r.value.error?.message : r.reason?.message;
        console.error(`Broadcast failed for group ${groupId}: ${errorMsg}`);
      }
    });

    return { successCount, failCount, total: groups.length };
  } catch (error) {
    console.error(`Broadcast error: ${error.message}`);
    return { successCount: 0, failCount: 0, error: error.message };
  }
};

/**
 * Schedules broadcast tasks for various times of the day.
 *
 * @param {object} param0 - An object containing the bot, wataru, and db instances.
 */
exports.cron = async function({ bot, wataru, db }) {
  // Validate the bot instance.
  if (!bot || typeof bot.sendMessage !== 'function') {
    throw new Error('Invalid Telegram bot instance. Ensure it is properly initialized.');
  }

  // Use a default timezone if not provided.
  const timeZone = global.config?.timeZone || 'UTC';

  // Morning greeting at 7:00 AM.
  cron.schedule('0 7 * * *', async () => {
    const now = moment.tz(timeZone);
    const specialDays = await getSpecialDays(now);
    let message = `<b>Good morning everyone!</b> ☀️\n${now.format('dddd, MMMM Do YYYY')}`;
    if (specialDays.length > 0) {
      message += `\n\nHappy ${specialDays.length === 1 ? `<b>${specialDays[0]}</b>` : `<b>${specialDays.join(', ')}</b>`}! Enjoy this special day! 🎉`;
    } else {
      message += '\n\nHave an amazing day ahead! 🌟';
    }
    await broadcastMessage(bot, db, message);
  }, { timezone: timeZone });

  // Afternoon greeting at 1:00 PM.
  cron.schedule('0 13 * * *', async () => {
    const now = moment.tz(timeZone);
    const greetings = [
      'Good afternoon folks! Hope your day is going great! 😊',
      'Hello everyone! Enjoy your afternoon! 🌞',
      'Happy afternoon all! Keep the good vibes going! ✨'
    ];
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    const message = `<b>${randomGreeting}</b>\nTime: ${now.format('HH:mm')}`;
    await broadcastMessage(bot, db, message);
  }, { timezone: timeZone });

  // Evening greeting at 7:00 PM.
  cron.schedule('0 19 * * *', async () => {
    const now = moment.tz(timeZone);
    const specialDays = await getSpecialDays(now);
    let message = `<b>Good evening everyone!</b> 🌙\nTime: ${now.format('HH:mm')}`;
    if (specialDays.length > 0) {
      message += `\n\nHope you're enjoying ${specialDays.length === 1 ? `<b>${specialDays[0]}</b>` : `<b>${specialDays.join(', ')}</b>`}! 🎇`;
    } else {
      message += '\n\nSweet dreams and see you tomorrow! 🌃';
    }
    await broadcastMessage(bot, db, message);
  }, { timezone: timeZone });

  // Weekend greeting on Saturday at 10:00 AM.
  cron.schedule('0 10 * * 6', async () => {
    const now = moment.tz(timeZone);
    const specialDays = await getSpecialDays(now);
    let message = `<b>Happy Weekend everyone!</b> 🥳\n${now.format('dddd, MMMM Do')}`;
    if (specialDays.length > 0) {
      message += `\n\nCelebrating ${specialDays.length === 1 ? `<b>${specialDays[0]}</b>` : `<b>${specialDays.join(', ')}</b>`} this weekend! 🎉`;
    } else {
      message += '\n\nTime to unwind and have fun! 🌈';
    }
    await broadcastMessage(bot, db, message);
  }, { timezone: timeZone });
};
