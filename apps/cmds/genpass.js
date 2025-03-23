class PasswordGenerator {
  constructor() {
    this.charsets = {
      lowercase: 'abcdefghijklmnopqrstuvwxyz',
      uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      numbers: '0123456789',
      symbols: '!@#$%^&*()_'
    };
  }

  generatePassword(baseWord = '', length = 12) {
    if (length < 7 || length > 32) {
      throw new Error('Password length must be between 7 and 32 characters');
    }

    let charset = this.charsets.lowercase + this.charsets.uppercase + this.charsets.numbers + this.charsets.symbols;
    const processedBaseWord = this.processBaseWord(baseWord, length);
    const additionalLength = length - processedBaseWord.length;
    const additionalChars = this.generateRandomChars(charset, additionalLength);
    const passwordChars = [
      ...processedBaseWord,
      ...additionalChars
    ];

    return this.shuffleArray(passwordChars).join('');
  }

  processBaseWord(baseWord, totalLength) {
    if (!baseWord) return [];
    const transformedWord = baseWord
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, Math.floor(totalLength / 2));
    return transformedWord.split('').map(this.randomlyModifyChar);
  }

  randomlyModifyChar(char) {
    const modifications = {
      'a': '@',
      'e': '3',
      'i': '!',
      'o': '0',
      's': '$'
    };
    return Math.random() < 0.3 && modifications[char] 
      ? modifications[char] 
      : char;
  }

  generateRandomChars(charset, length) {
    let randomChars = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      randomChars += charset[randomIndex];
    }
    return randomChars;
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const randomIndex = Math.floor(Math.random() * (i + 1));
      [array[i], array[randomIndex]] = [array[randomIndex], array[i]];
    }
    return array;
  }
}

exports.meta = {
  name: 'genpass',
  version: '1.0.0',
  description: 'Generate strong passwords with optional base word',
  author: 'JohnDev19',
  guide: [
    '[base_word]',
  ],
  cooldown: 0,
  category: 'utility',
  type: 'anyone'
};

exports.onStart = async function({ msg, bot, chatId, args }) {
  const passwordGenerator = new PasswordGenerator();
  const baseWord = args[0] || '';
  const firstName = msg.from.first_name;

  if (!baseWord) {
    const usageMessage = `
💡 *Usage:* /generatepass [base_word]
- Generates 6 strong passwords based on the base word (if provided).
- Passwords are between 7 and 32 characters long.
    `;
    await bot.sendMessage(chatId, usageMessage, { parse_mode: 'Markdown' });
    return;
  }

  const passwordLength = 12;

  try {
    const passwords = [];
    for (let i = 0; i < 6; i++) {
      const password = passwordGenerator.generatePassword(baseWord, passwordLength);
      passwords.push(`${i + 1}: \`${password}\``);
    }

    const responseMessage = `
Hey ${firstName}, here's your generated passwords for "${baseWord}":
🔐 *Generated Passwords:*\n\n
${passwords.join('\n')}
    `;

    await bot.sendMessage(chatId, responseMessage, { parse_mode: 'Markdown' });

  } catch (error) {
    console.error('Password Generation Error:', error);
    await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
  }
};
