const moment = require("moment-timezone");

exports.event = async function({ bot, msg, chatId, wataru }) {
  const timeStart = Date.now();
  const formattedTime = moment.tz(global.config.timeZone).format("HH:mm:ss L");
  const { events } = global.client;
  const { devMode } = global.config;

  // Ensure chatId is defined (fallback to msg.chat.id if not provided)
  chatId = chatId || String(msg.chat.id);

  // Process only system events (join/leave)
  if (msg.new_chat_members || msg.left_chat_member) {
    const eventType = msg.new_chat_members ? "welcome" : "leave";

    for (const [eventName, eventHandler] of events.entries()) {
      // Check if this event handler should process the current system event.
      if (eventHandler.meta.type.includes(eventType)) {
        try {
          const context = { bot, wataru, msg, chatId };
          await eventHandler.onStart(context); // Execute the event handler

          if (devMode) {
            const executionTime = Date.now() - timeStart;
            const consoleWidth = process.stdout.columns || 60;
            const separator = "─".repeat(consoleWidth);
            const logMessage = `
${separator}
[ DEV MODE ]
Event           : ${eventHandler.meta.name}
Time            : ${formattedTime}
Execution Time  : ${executionTime}ms
${separator}
            `.trim();
            console.log(logMessage);
          }
        } catch (error) {
          console.error(`[ Event Error ] ${eventHandler.meta.name}:`, error);
        }
      }
    }
    // Exit after processing system events
    return;
  }
};
