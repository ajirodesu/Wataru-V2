const axios = require('axios');

exports.meta = {
  name: 'joke',
  version: '1.0.0',
  description: 'Sends a hilarious random joke',
  author: 'JohnDev19',
  type: 'anyone',
  cooldown: 5,
  category: 'fun',
  guide: [
    ''
  ]
};

exports.onStart = async function({ bot, msg }) {
  try {
    const jokeResponse = await axios.get('https://official-joke-api.appspot.com/random_joke');
    const joke = jokeResponse.data;

    const jokeMessage = `
😂 <b>Get Ready to Laugh! 🤣</b>

${joke.meta}

<i>${joke.punchline}</i>

<b>Joke of the Moment!</b>
    `;

    await bot.sendMessage(msg.chat.id, jokeMessage, {
      parse_mode: 'HTML'
    });

  } catch (error) {
    console.error('Joke Fetch Error:', error);

    const backupJokes = [
      {
        meta: "Why don't scientists trust atoms?",
        punchline: "Because they make up everything!"
      },
      {
        meta: "I told my wife she was drawing her eyebrows too high",
        punchline: "She looked surprised!"
      },
      {
        meta: "Why did the scarecrow win an award?",
        punchline: "Because he was outstanding in his field!"
      }
    ];

    const randomBackupJoke = backupJokes[Math.floor(Math.random() * backupJokes.length)];

    const errorMessage = `
❌ <b>Oops! Joke Retrieval Failed</b>

Here's a backup joke:
${randomBackupJoke.meta}

<i>${randomBackupJoke.punchline}</i>

<b>Humor is unpredictable! 😄</b>
    `;

    await bot.sendMessage(msg.chat.id, errorMessage, { 
      parse_mode: 'HTML' 
    });
  }
};
