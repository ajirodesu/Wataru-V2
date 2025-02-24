exports.meta = {
  name: "rps",
  version: "1.0.0",
  description: "Play Rock Paper Scissors",
  author: "JohnDev19",
  type: "anyone",
  cooldown: 5,
  category: "fun",
  guide: [""],
};

exports.onStart = async function ({ bot, msg }) {
  const chatId = msg.chat.id;
  const choices = ["rock", "paper", "scissors"];
  const emojis = { rock: "🪨", paper: "📄", scissors: "✂️" };

  // Build the inline keyboard with placeholder gameMessageId.
  const inlineKeyboard = [
    [
      {
        text: "Rock 🪨",
        callback_data: JSON.stringify({
          command: "rps",
          gameMessageId: null,
          args: ["rock"]
        }),
      },
      {
        text: "Paper 📄",
        callback_data: JSON.stringify({
          command: "rps",
          gameMessageId: null,
          args: ["paper"]
        }),
      },
      {
        text: "Scissors ✂️",
        callback_data: JSON.stringify({
          command: "rps",
          gameMessageId: null,
          args: ["scissors"]
        }),
      },
    ],
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

  // Update the inline keyboard so that each button's callback_data includes the actual gameMessageId.
  const updatedKeyboard = [
    [
      {
        text: "Rock 🪨",
        callback_data: JSON.stringify({
          command: "rps",
          gameMessageId: gameMessage.message_id,
          args: ["rock"]
        }),
      },
      {
        text: "Paper 📄",
        callback_data: JSON.stringify({
          command: "rps",
          gameMessageId: gameMessage.message_id,
          args: ["paper"]
        }),
      },
      {
        text: "Scissors ✂️",
        callback_data: JSON.stringify({
          command: "rps",
          gameMessageId: gameMessage.message_id,
          args: ["scissors"]
        }),
      },
    ],
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

exports.onCallback = async function ({ bot, callbackQuery, payload }) {
  // payload is already parsed by the global callback handler
  const choices = ["rock", "paper", "scissors"];
  const emojis = { rock: "🪨", paper: "📄", scissors: "✂️" };

  try {
    // Validate that this callback is for the RPS command and for the correct game message.
    if (payload.command !== "rps") return;
    if (!payload.gameMessageId || callbackQuery.message.message_id !== payload.gameMessageId) return;

    // Retrieve the player's choice from the payload.
    const playerChoice = payload.args[0];
    if (!choices.includes(playerChoice)) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: "Invalid choice." });
      return;
    }

    // Bot randomly picks a choice.
    const botChoice = choices[Math.floor(Math.random() * choices.length)];

    // Determine the game outcome.
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
    try {
      await bot.answerCallbackQuery(callbackQuery.id, { text: "An error occurred. Please try again." });
    } catch (innerErr) {
      console.error(`Failed to answer callback query: ${innerErr.message}`);
    }
  }
};
