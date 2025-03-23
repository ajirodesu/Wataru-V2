const axios = require('axios');
const he = require('he');
const crypto = require('crypto');

// Store quiz data with quiz ID as key and question details as value
const quizData = new Map();

exports.meta = {
  name: "quiz",
  aliases: ["trivia"],
  prefix: "both",
  version: "1.0.0",
  author: "AjiroDesu",
  description: "Starts a quiz with a random question.",
  guide: [],
  cooldown: 5,
  type: "anyone",
  category: "fun"
};

/**
 * Handles the /quiz command by sending a quiz question with answer buttons.
 * @param {Object} params - Parameters provided by the Wataru bot framework.
 * @param {Object} params.wataru - The bot instance.
 * @param {number} params.chatId - The chat ID where the command was invoked.
 */
exports.onStart = async function({ wataru, chatId }) {
  try {
    // Fetch a random multiple-choice question from Open Trivia Database
    const response = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple');
    const question = response.data.results[0];

    // Decode HTML entities in the question and answers
    const decodedQuestion = he.decode(question.question);
    const correctAnswer = he.decode(question.correct_answer);
    const incorrectAnswers = question.incorrect_answers.map(he.decode);

    // Combine all answers and shuffle them
    const answers = [...incorrectAnswers, correctAnswer];
    const shuffledAnswers = shuffle(answers);
    const correctIndex = shuffledAnswers.indexOf(correctAnswer);

    // Generate a unique quiz ID
    const quizId = crypto.randomBytes(4).toString('hex');

    // Store quiz data for later verification
    quizData.set(quizId, { decodedQuestion, shuffledAnswers, correctIndex });

    // Create inline keyboard with one button per answer
    const keyboard = shuffledAnswers.map((answer, index) => [
      { text: answer, callback_data: `quiz:${quizId}:${index}` }
    ]);

    // Send the quiz question with buttons using wataru.reply
    await wataru.reply(decodedQuestion, {
      reply_markup: { inline_keyboard: keyboard }
    });
  } catch (error) {
    console.error("Error fetching quiz question:", error);
    await wataru.reply("An error occurred while fetching the quiz question.");
  }
};

/**
 * Handles callback queries from button presses.
 * @param {Object} params - Parameters provided by the callback query handler.
 * @param {Object} params.bot - The Telegram bot instance.
 * @param {Object} params.callbackQuery - The callback query object.
 * @param {number} params.chatId - The chat ID.
 * @param {number} params.messageId - The message ID.
 * @param {Array} params.args - The arguments from the callback data.
 */
exports.onCallback = async function({ bot, callbackQuery, chatId, messageId, args }) {
  // Since callback data is quiz:<quizId>:<answerIndex>,
  // args will be ['quizId', 'answerIndex'] after parsing
  const [quizId, answerIndexStr] = args;
  const answerIndex = parseInt(answerIndexStr, 10);

  if (quizData.has(quizId)) {
    const quiz = quizData.get(quizId);
    const isCorrect = answerIndex === quiz.correctIndex;
    const resultText = isCorrect 
      ? "Correct!" 
      : `Wrong! The correct answer is ${quiz.shuffledAnswers[quiz.correctIndex]}`;

    try {
      // Edit the original message with the result and remove buttons
      await bot.editMessageText(resultText, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: { inline_keyboard: [] }
      });

      // Acknowledge the callback query to remove the loading state
      await bot.answerCallbackQuery(callbackQuery.id);
    } catch (error) {
      console.error("Error editing message:", error);
    }

    // Clean up quiz data after answering
    quizData.delete(quizId);
  }
};

/**
 * Shuffles an array randomly using Fisher-Yates algorithm.
 * @param {Array} array - The array to shuffle.
 * @returns {Array} The shuffled array.
 */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}