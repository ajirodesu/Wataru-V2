const meta = {
  name: "rps",
  version: "1.0.0",
  description: "Play Rock Paper Scissors",
  author: "JohnDev19",
  type: "anyone",
  cooldown: 5,
  category: "fun",
  guide: [""],
};

async function onStart({ bot, msg }) {
  const chatId = msg.chat.id;
  const choices = ["rock", "paper", "scissors"];
  const emojis = { rock: "🪨", paper: "📄", scissors: "✂️" };

  // Build the inline keyboard with placeholder gameMessageId.
  const inlineKeyboard = [
    choices.map(choice => ({
      text: `${choice.charAt(0).toUpperCase() + choice.slice(1)} ${emojis[choice]}`,
      callback_data: JSON.stringify({
        command: "rps",
        gameMessageId: null,
        args: [choice]
      }),
    })),
  ];

  let gameMessage;
  try {
    // Send the game message with the inline keyboard.
    gameMessage = await bot.sendMessage(chatId, "Choose Rock, Paper, or Scissors:", {
      reply_markup: { inline_keyboard: inlineKeyboard },
    });
  } catch (err) {
    console.error(`Failed to send game message: ${err.message}`);
    return;
  }

  // Update the inline keyboard so that each button includes the actual gameMessageId.
  const updatedKeyboard = [
    choices.map(choice => ({
      text: `${choice.charAt(0).toUpperCase() + choice.slice(1)} ${emojis[choice]}`,
      callback_data: JSON.stringify({
        command: "rps",
        gameMessageId: gameMessage.message_id,
        args: [choice]
      }),
    })),
  ];
  try {
    await bot.editMessageReplyMarkup(
      { inline_keyboard: updatedKeyboard },
      { chat_id: chatId, message_id: gameMessage.message_id }
    );
  } catch (err) {
    console.error(`Failed to update inline keyboard: ${err.message}`);
  }
};

async function onCallback({ bot, callbackQuery, payload }) {
  // Make sure the callback is for RPS and the game message matches.
  if (payload.command !== "rps" || !payload.gameMessageId || callbackQuery.message.message_id !== payload.gameMessageId) return;

  const choices = ["rock", "paper", "scissors"];
  const emojis = { rock: "🪨", paper: "📄", scissors: "✂️" };
  const playerChoice = payload.args[0];

  if (!choices.includes(playerChoice)) {
    return bot.answerCallbackQuery(callbackQuery.id, { text: "Invalid choice." });
  }

  // Bot randomly picks a choice.
  const botChoice = choices[Math.floor(Math.random() * choices.length)];

  // Determine the outcome.
  let result;
  if (playerChoice === botChoice) {
    result = "It's a tie!";
  } else if (
    (playerChoice === "rock" && botChoice === "scissors") ||
    (playerChoice === "paper" && botChoice === "rock") ||
    (playerChoice === "scissors" && botChoice === "paper")
  ) {
    result = "You win!";
  } else {
    result = "You lose!";
  }

  try {
    // Update the game message to show the outcome and remove the inline keyboard.
    await bot.editMessageText(
      `You chose ${emojis[playerChoice]}\nI chose ${emojis[botChoice]}\n\n${result}`,
      {
        chat_id: callbackQuery.message.chat.id,
        message_id: payload.gameMessageId,
        reply_markup: { inline_keyboard: [] },
      }
    );
    await bot.answerCallbackQuery(callbackQuery.id);
  } catch (err) {
    console.error(`Error in RPS callback: ${err.message}`);
    await bot.answerCallbackQuery(callbackQuery.id, { text: "An error occurred. Please try again." })
      .catch(console.error);
  }
};

module.exports = { meta, onStart, onCallback };
