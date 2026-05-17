const commandParser = (message) => {
  const text = message.toLowerCase().trim();

  const patterns = [
    {
      intent: 'create_note',
      patterns: [
        /^(?:take|make|create|write|save)\s+(?:a\s+)?note/i,
        /^note\s+(?:this|that|down)/i,
        /^remember\s+this/i,
        /^save\s+this/i
      ],
      extract: (msg) => {
        const cleaned = msg.replace(/^(?:take|make|create|write|save)\s+(?:a\s+)?note\s*/i, '');
        return { title: 'Quick Note', content: cleaned || msg };
      }
    },
    {
      intent: 'create_task',
      patterns: [
        /^remind\s+me/i,
        /^(?:add|create|make)\s+(?:a\s+)?task/i,
        /^(?:add|create|make)\s+(?:a\s+)?reminder/i,
        /^set\s+(?:a\s+)?reminder/i,
        /^schedule/i,
        /^don'?t\s+let\s+me\s+forget/i
      ],
      extract: (msg) => {
        const patterns = [
          /(?:to|about|for)\s+(.+?)(?:\s+(?:tomorrow|today|next\s+\w+|on\s+\w+\s+\d+))/i,
          /(?:to|about|for)\s+(.+)/i,
          /remind\s+me\s+(?:to\s+)?(.+)/i
        ];
        let title = msg;
        for (const p of patterns) {
          const match = msg.match(p);
          if (match) {
            title = match[1].trim();
            break;
          }
        }
        title = title.replace(/^(?:add|create|make|set|schedule)\s+(?:a\s+)?(?:task|reminder)\s*/i, '').trim();
        if (!title) title = msg;

        const dueDate = extractDueDate(msg);
        return { title, priority: 'medium', due_date: dueDate };
      }
    },
    {
      intent: 'search_web',
      patterns: [
        /^(?:search|google|look up|find|lookup|browse)\s+(?:for\s+)?/i,
        /^search\s+the\s+web/i,
        /^what\s+(?:is|are|does|do|can|would)/i,
        /^who\s+(?:is|was|are|were)/i,
        /^where\s+(?:is|are|can)/i,
        /^when\s+(?:is|was|did)/i,
        /^how\s+(?:to|do|does|is|can)/i,
        /^why\s+(?:is|does|do|can)/i
      ],
      extract: (msg) => {
        const cleaned = msg.replace(/^(?:search|google|look up|find|lookup|browse)\s+(?:for\s+)?/i, '').trim();
        return { query: cleaned || msg };
      }
    },
    {
      intent: 'open_website',
      patterns: [
        /^open\s+(.+)/i,
        /^go\s+to\s+(.+)/i,
        /^launch\s+(.+)/i,
        /^navigate\s+to\s+(.+)/i
      ],
      extract: (msg) => {
        const siteMap = {
          'youtube': 'https://youtube.com',
          'github': 'https://github.com',
          'gmail': 'https://mail.google.com',
          'google': 'https://google.com',
          'linkedin': 'https://linkedin.com',
          'twitter': 'https://twitter.com',
          'x': 'https://x.com',
          'facebook': 'https://facebook.com',
          'instagram': 'https://instagram.com',
          'reddit': 'https://reddit.com',
          'stackoverflow': 'https://stackoverflow.com',
          'netflix': 'https://netflix.com',
          'amazon': 'https://amazon.com',
          'chatgpt': 'https://chat.openai.com',
          'claude': 'https://claude.ai',
          'perplexity': 'https://perplexity.ai',
          'notion': 'https://notion.so',
          'drive': 'https://drive.google.com',
          'docs': 'https://docs.google.com',
          'calendar': 'https://calendar.google.com',
          'maps': 'https://maps.google.com',
          'whatsapp': 'https://web.whatsapp.com',
          'telegram': 'https://web.telegram.org',
          'discord': 'https://discord.com',
          'spotify': 'https://spotify.com'
        };
        const site = msg.replace(/^(?:open|go to|launch|navigate to)\s+/i, '').trim().toLowerCase();

        for (const [key, url] of Object.entries(siteMap)) {
          if (site === key || site.includes(key)) {
            return { site: key, url, search: false };
          }
        }

        if (/^search\s+(.+)\s+(?:on|for)\s+(.+)/i.test(msg) || /^search\s+(.+)/i.test(msg)) {
          const searchMatch = msg.match(/^search\s+(.+?)\s+(?:on|for|in)\s+(.+)/i);
          if (searchMatch) {
            const platform = searchMatch[2].trim().toLowerCase();
            const query = searchMatch[1].trim();
            for (const [key, baseUrl] of Object.entries(siteMap)) {
              if (platform.includes(key)) {
                return { site: key, url: `${baseUrl}/search?q=${encodeURIComponent(query)}`, search: true, query };
              }
            }
          }
        }

        if (/^(?:https?:\/\/)/i.test(site)) {
          return { site: 'custom', url: site, search: false };
        }

        return { site: 'google', url: `https://google.com/search?q=${encodeURIComponent(site)}`, search: true, query: site };
      }
    },
    {
      intent: 'summarize_file',
      patterns: [
        /^summarize\s+(?:the\s+)?file/i,
        /^summarise\s+(?:the\s+)?file/i,
        /^what('s| is) in (?:the )?file/i,
        /^tell me about (?:the )?file/i,
        /^summarize/i
      ],
      extract: (msg) => ({})
    },
    {
      intent: 'analyze_csv',
      patterns: [
        /^analyze\s+(?:the\s+)?csv/i,
        /^analyse\s+(?:the\s+)?csv/i,
        /^show\s+(?:me\s+)?(?:the\s+)?(?:csv\s+)?(?:summary|stats|statistics)/i,
        /^what\s+(?:are\s+)?(?:the\s+)?trends/i,
        /^analyze/i
      ],
      extract: (msg) => ({ query: msg })
    },
    {
      intent: 'general_chat',
      patterns: [/.*/],
      extract: (msg) => ({})
    }
  ];

  for (const pattern of patterns) {
    for (const regex of pattern.patterns) {
      if (regex.test(text)) {
        const data = pattern.extract(message);
        return { intent: pattern.intent, data };
      }
    }
  }

  return { intent: 'general_chat', data: {} };
};

const extractDueDate = (message) => {
  const text = message.toLowerCase();
  const dateMap = {
    'today': new Date(),
    'tomorrow': new Date(Date.now() + 86400000),
    'day after tomorrow': new Date(Date.now() + 172800000),
    'next week': new Date(Date.now() + 604800000),
    'next month': new Date(Date.now() + 2592000000)
  };

  for (const [key, date] of Object.entries(dateMap)) {
    if (text.includes(key)) {
      return date.toISOString().split('T')[0];
    }
  }

  const dayMatch = text.match(/(?:this\s+|next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
  if (dayMatch) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDay = days.indexOf(dayMatch[1].toLowerCase());
    const today = new Date();
    const currentDay = today.getDay();
    let diff = targetDay - currentDay;
    if (diff <= 0) diff += 7;
    const result = new Date(today);
    result.setDate(today.getDate() + diff);
    return result.toISOString().split('T')[0];
  }

  const dateMatch = text.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)/i);
  if (dateMatch) {
    const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const monthIndex = months.findIndex(m => dateMatch[2].toLowerCase().startsWith(m));
    if (monthIndex >= 0) {
      const year = new Date().getFullYear();
      return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(parseInt(dateMatch[1])).padStart(2, '0')}`;
    }
  }

  return null;
};

module.exports = { commandParser };
