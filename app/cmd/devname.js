const axios = require('axios');

const prefixes = [
    'cyber', 'tech', 'code', 'dev', 'hack', 'byte', 'pixel', 'data', 'web', 'net',
    'algo', 'script', 'logic', 'proto', 'meta', 'digital', 'binary', 'quantum', 'neural', 'crypto',
    'machine', 'cloud', 'zero', 'stack', 'core', 'spark', 'prime', 'matrix', 'flux', 'nano',
    'system', 'micro', 'intel', 'async', 'sync', 'root', 'admin', 'kernel', 'lambda', 'debug',
    'circuit', 'network', 'stream', 'buffer', 'cache', 'block', 'thread', 'signal', 'proxy', 'wire',
    'pulse', 'blade', 'bolt', 'drone', 'alpha', 'beta', 'gamma', 'delta', 'echo', 'omega',
    'quantum', 'neural', 'ai', 'ml', 'deep', 'learn', 'brain', 'smart', 'cognitive', 'logic',
    'compute', 'process', 'daemon', 'router', 'switch', 'server', 'client', 'host', 'portal', 'gateway',
    'code', 'dev', 'build', 'compile', 'debug', 'test', 'deploy', 'scale', 'optimize', 'refactor',
    'design', 'architect', 'engineer', 'program', 'develop', 'create', 'innovate', 'solve', 'craft', 'build',
    'algo', 'math', 'logic', 'theorem', 'formula', 'compute', 'calculate', 'solve', 'derive', 'analyze',
    'graph', 'matrix', 'vector', 'tensor', 'prime', 'cipher', 'pattern', 'sequence', 'algorithm', 'compute',
    'spark', 'fire', 'blaze', 'storm', 'thunder', 'lightning', 'wave', 'stream', 'river', 'ocean',
    'moon', 'star', 'galaxy', 'cosmos', 'nebula', 'planet', 'asteroid', 'comet', 'solar', 'lunar',
    'bit', 'byte', 'pixel', 'render', 'stream', 'sync', 'async', 'parallel', 'concurrent', 'distributed',
    'flux', 'phase', 'shift', 'wave', 'pulse', 'signal', 'node', 'link', 'mesh', 'grid',
    'micro', 'macro', 'nano', 'pico', 'tera', 'giga', 'mega', 'kilo', 'deca', 'hecto',
    'circuit', 'chip', 'core', 'processor', 'mainframe', 'terminal', 'console', 'interface', 'protocol', 'kernel',
    'cryptic', 'cipher', 'encode', 'decode', 'encrypt', 'decrypt', 'hash', 'key', 'token', 'secure',
    'flux', 'dynamic', 'static', 'runtime', 'compile', 'interpret', 'execute', 'process', 'thread', 'context',
    'abstract', 'concrete', 'virtual', 'actual', 'real', 'potential', 'dynamic', 'static', 'generic', 'specific',
    'prime', 'root', 'base', 'core', 'central', 'primary', 'main', 'key', 'primary', 'fundamental',
    'nano', 'micro', 'mini', 'macro', 'mega', 'giga', 'tera', 'peta', 'exa', 'zetta',
    'neural', 'cognitive', 'intelligent', 'smart', 'adaptive', 'learning', 'reasoning', 'thinking', 'processing', 'analyzing',
    'quantum', 'superposition', 'entanglement', 'probabilistic', 'coherent', 'interference', 'tunneling', 'spin', 'qbit', 'state',
    'cyber', 'digital', 'virtual', 'online', 'network', 'connected', 'global', 'universal', 'integrated', 'distributed',
    'proto', 'meta', 'hyper', 'ultra', 'super', 'trans', 'inter', 'multi', 'poly', 'cross',
    'dynamic', 'elastic', 'flexible', 'adaptive', 'scalable', 'agile', 'robust', 'resilient', 'responsive', 'intelligent',
    'abstract', 'conceptual', 'theoretical', 'hypothetical', 'speculative', 'innovative', 'experimental', 'exploratory', 'groundbreaking', 'revolutionary',
    'prime', 'core', 'essential', 'fundamental', 'basic', 'elemental', 'primary', 'key', 'critical', 'central',
    'quantum', 'neural', 'cognitive', 'intelligent', 'adaptive', 'learning', 'reasoning', 'thinking', 'processing', 'analyzing',
    'cyber', 'digital', 'virtual', 'online', 'network', 'connected', 'global', 'universal', 'integrated', 'distributed',
    'proto', 'meta', 'hyper', 'ultra', 'super', 'trans', 'inter', 'multi', 'poly', 'cross',
    'dynamic', 'elastic', 'flexible', 'adaptive', 'scalable', 'agile', 'robust', 'resilient', 'responsive', 'intelligent'
];

const suffixes = [
    'warrior', 'champion', 'elite', 'legend', 'titan', 'phoenix', 'dragon', 'wolf', 'hawk', 'fox',
    'knight', 'samurai', 'ranger', 'sentinel', 'guardian', 'shield', 'blade', 'storm', 'thunder', 'lightning',
    'master', 'sage', 'guru', 'sensei', 'prophet', 'oracle', 'seer', 'visionary', 'architect', 'strategist',
    'hunter', 'ranger', 'scout', 'sniper', 'tracker', 'breaker', 'crusher', 'slayer', 'killer', 'destroyer',
    'spark', 'flame', 'blaze', 'inferno', 'nova', 'star', 'comet', 'meteor', 'rocket', 'satellite',
    'zero', 'prime', 'omega', 'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'sigma',
    'force', 'power', 'might', 'strength', 'core', 'pulse', 'wave', 'stream', 'flow', 'surge',
    'spirit', 'soul', 'mind', 'brain', 'intellect', 'genius', 'prodigy', 'mastermind', 'innovator', 'creator',
    'guardian', 'protector', 'defender', 'shield', 'armor', 'wall', 'fortress', 'bastion', 'sentinel', 'warden',
    'hunter', 'seeker', 'explorer', 'pioneer', 'trailblazer', 'adventurer', 'voyager', 'navigator', 'pathfinder', 'scout',
    'blade', 'edge', 'razor', 'knife', 'sword', 'dagger', 'spear', 'lance', 'arrow', 'bolt',
    'storm', 'thunder', 'lightning', 'cyclone', 'hurricane', 'tornado', 'tempest', 'gale', 'squall', 'whirlwind',
    'shadow', 'ghost', 'phantom', 'spectre', 'wraith', 'shade', 'whisper', 'echo', 'silence', 'void',
    'rock', 'stone', 'mountain', 'cliff', 'peak', 'boulder', 'granite', 'marble', 'crystal', 'diamond',
    'wave', 'tide', 'current', 'river', 'ocean', 'sea', 'stream', 'rapids', 'waterfall', 'cascade',
    'fire', 'flame', 'blaze', 'inferno', 'ember', 'spark', 'burn', 'heat', 'solar', 'plasma',
    'wind', 'breeze', 'gust', 'draft', 'zephyr', 'cyclone', 'whirl', 'gale', 'breath', 'air',
    'light', 'ray', 'beam', 'gleam', 'shine', 'spark', 'flash', 'radiance', 'glow', 'brilliance',
    'dark', 'shade', 'shadow', 'night', 'void', 'eclipse', 'midnight', 'dusk', 'twilight', 'gloom',
    'star', 'nova', 'comet', 'meteor', 'galaxy', 'cosmos', 'universe', 'nebula', 'constellation', 'orbit',
    'frost', 'ice', 'snow', 'crystal', 'glacier', 'arctic', 'winter', 'freeze', 'chill', 'cold'
];

const techTerms = [
    'git', 'node', 'react', 'vue', 'rust', 'java', 'py', 'go', 'ruby', 'swift',
    'docker', 'kubernetes', 'ansible', 'terraform', 'nginx', 'kafka', 'redis', 'mongo', 'graphql', 'apollo',
    'webpack', 'babel', 'typescript', 'kotlin', 'scala', 'dart', 'elixir', 'erlang', 'haskell', 'clojure',
    'angular', 'svelte', 'ember', 'express', 'django', 'flask', 'spring', 'rails', 'laravel', 'asp',
    'python', 'node', 'java', 'typescript', 'ruby', 'php', 'go', 'swift', 'kotlin', 'rust',
    'cloud', 'aws', 'azure', 'gcp', 'digitalocean', 'heroku', 'vultr', 'linode', 'bitbucket', 'gitlab',
    'docker', 'serverless', 'webassembly', 'microservices', 'frontend', 'backend', 'api', 'oauth', 'graphql',
    'graphql', 'rest', 'soap', 'json', 'xml', 'protobuf', 'websocket', 'http', 'tcp', 'udp',
    'async', 'await', 'promises', 'observables', 'reactivity', 'rxjs', 'redux', 'vuex', 'contextapi', 'hooks',
    'redux', 'vuex', 'ngrx', 'mobx', 'immutability', 'functional', 'objectoriented', 'imperative', 'declarative',
    'lambda', 'stream', 'filter', 'map', 'reduce', 'sort', 'flat', 'reduce', 'asyncawait', 'mutex',
    'queue', 'sync', 'parallel', 'thread', 'task', 'loop', 'iteration', 'recursion', 'memoization', 'debounce',
    'observer', 'pubsub', 'eventbus', 'singleton', 'factory', 'decorator', 'adapter', 'strategy', 'composite',
    'middleware', 'express', 'koa', 'fastify', 'loopback', 'nestjs', 'graphql', 'apollo', 'http', 'sockets',
    'redux', 'contextapi', 'mobx', 'zustand', 'recoil', 'nestjs', 'serverless', 'graphql', 'jwt', 'restapi',
    'oauth', 'cors', 'http', 'https', 'websocket', 'serviceworker', 'redis', 'cache', 'devops', 'ci'
];

class DevNameGenerator {
    constructor() {
        this.styles = ['classic', 'leet', 'minimalist', 'tech'];
        this.variationsCount = 6;
    }

    generateClassicVariations(name) {
        const variations = [];
        for (let i = 0; i < this.variationsCount; i++) {
            const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
            const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
            variations.push(`${prefix}${name.toLowerCase()}${suffix}`);
        }
        return variations;
    }

    generateLeetVariations(name) {
        const variations = [];
        for (let i = 0; i < this.variationsCount; i++) {
            let leetName = name.toLowerCase();
            Object.entries(leetReplacements).forEach(([letter, number]) => {
                if (Math.random() > 0.5) {
                    leetName = leetName.replace(new RegExp(letter, 'g'), number);
                }
            });
            const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
            const randomNum = Math.floor(Math.random() * 999);
            variations.push(`${prefix}_${leetName}_${randomNum}`);
        }
        return variations;
    }

    generateMinimalistVariations(name) {
        const variations = [];
        const vowels = ['a', 'e', 'i', 'o', 'u'];
        let minName = name.toLowerCase();

        variations.push(`_${minName}_`);
        variations.push(`-${minName}-`);
        variations.push(`.${minName}.`);

        let noVowels = minName;
        vowels.forEach(vowel => {
            noVowels = noVowels.replace(new RegExp(vowel, 'g'), '');
        });
        variations.push(`_${noVowels}_`);
        variations.push(`-${noVowels}-`);
        variations.push(`.${noVowels}.`);

        return variations;
    }

    generateTechVariations(name) {
        const variations = [];
        const availableTechTerms = [...techTerms];

        for (let i = 0; i < this.variationsCount; i++) {
            const randomIndex = Math.floor(Math.random() * availableTechTerms.length);
            const techTerm = availableTechTerms[randomIndex];

            if (i % 2 === 0) {
                variations.push(`${techTerm}.${name.toLowerCase()}.dev`);
            } else {
                variations.push(`${name.toLowerCase()}.${techTerm}.io`);
            }
        }
        return variations;
    }

    generateMultipleNames(name) {
        const names = [];
        this.styles.forEach(style => {
            switch (style) {
                case 'classic':
                    names.push({ style: 'Classic', name: this.generateClassicStyle(name) });
                    break;
                case 'leet':
                    names.push({ style: 'Leet', name: this.generateLeetStyle(name) });
                    break;
                case 'minimalist':
                    names.push({ style: 'Minimalist', name: this.generateMinimalistStyle(name) });
                    break;
                case 'tech':
                    names.push({ style: 'Tech', name: this.generateTechStyle(name) });
                    break;
            }
        });
        return names;
    }

    generateClassicStyle(name) {
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        return `${prefix}${name.toLowerCase()}${suffix}`;
    }

    generateLeetStyle(name) {
        let leetName = name.toLowerCase();
        Object.entries(leetReplacements).forEach(([letter, number]) => {
            leetName = leetName.replace(new RegExp(letter, 'g'), number);
        });
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        return `${prefix}_${leetName}_${Math.floor(Math.random() * 999)}`;
    }

    generateMinimalistStyle(name) {
        const vowels = ['a', 'e', 'i', 'o', 'u'];
        let minName = name.toLowerCase();
        vowels.forEach(vowel => {
            minName = minName.replace(new RegExp(vowel, 'g'), '');
        });
        return `_${minName}_`;
    }

    generateTechStyle(name) {
        const techTerm = techTerms[Math.floor(Math.random() * techTerms.length)];
        return `${techTerm}.${name.toLowerCase()}.dev`;
    }

    validateName(name) {
        return /^[a-zA-Z]{2,20}$/.test(name);
    }
}

const leetReplacements = {
    'a': '4',
    'e': '3',
    'i': '1',
    'o': '0',
    's': '5',
    't': '7',
    'b': '8',
    'g': '9'
};

exports.meta = {
  name: 'devname',
  version: '1.0.0',
  description: 'Generate cool developer usernames based on your name.',
  author: 'JohnDev19',
  guide: [
    '<your_name>',
    '<your_name> <style>'
  ],
  cooldown: 0,
  category: 'fun',
  type: 'anyone'
};

exports.onStart = async function({ msg, bot, chatId, args }) {
  const generator = new DevNameGenerator();

  if (args.length === 0) {
    const helpMessage = `
🔥 *Developer Username Generator*

Generate awesome developer usernames with these commands:

1️⃣ *Basic Generation*
Command: \`/devname <your_name>\`
Example: \`/devname john\`
Generates multiple username variations in different styles

2️⃣ *Style-Specific Generation*
Command: \`/devname <your_name> <style>\`
Available styles:
• classic: \`/devname john classic\` - Cool combinations with prefixes and suffixes
• leet: \`/devname john leet\` - L33t 5p34k variations
• minimalist: \`/devname john minimalist\` - Clean and simple versions
• tech: \`/devname john tech\` - Tech-inspired domain-style names

*Rules:*
• Name should be 2-20 characters long
• Only letters allowed (A-Z, a-z)
• No spaces or special characters

Each style-specific generation creates 6 unique variations! 🎨

*Pro tip:* Try different styles to find your perfect dev username! 🚀
    `;
    return bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
  }

  const name = args[0];
  const style = args[1]?.toLowerCase();

  if (!generator.validateName(name)) {
    return bot.sendMessage(
      chatId,
      "⚠️ Invalid name! Please use only letters (2-20 characters long)."
    );
  }

  try {
    let response;

    if (style && !generator.styles.includes(style)) {
      return bot.sendMessage(
        chatId,
        "⚠️ Invalid style! Available styles: classic, leet, minimalist, tech"
      );
    }

    if (style) {
      let variations;
      switch(style) {
        case 'classic':
          variations = generator.generateClassicVariations(name);
          break;
        case 'leet':
          variations = generator.generateLeetVariations(name);
          break;
        case 'minimalist':
          variations = generator.generateMinimalistVariations(name);
          break;
        case 'tech':
          variations = generator.generateTechVariations(name);
          break;
      }
      response = `🎯 Your *${style}* developer usernames:\n\n` + variations.map(
        (name, index) => `${index + 1}. \`${name}\``
      ).join('\n');
    } else {
      const names = generator.generateMultipleNames(name);
      response = '🎨 *Your Developer Usernames:*\n\n' + names.map(
        ({ style, name }) => `*${style}:* \`${name}\``
      ).join('\n');
    }

    await bot.sendMessage(chatId, response, {
      parse_mode: 'Markdown',
      reply_to_message_id: msg.message_id
    });

  } catch (error) {
    console.error('Developer Name Generation Error:', error);
    await bot.sendMessage(
      chatId,
      "😅 Oops! Something went wrong while generating your developer name. Please try again!"
    );
  }
};
