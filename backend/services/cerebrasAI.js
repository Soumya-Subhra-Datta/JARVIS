const axios = require('axios');

const SYSTEM_PROMPT_BASE = `You are JARVIS, a highly advanced personal AI assistant. You have human-like emotional intelligence and adapt your personality to match the context of the conversation.

Your capabilities:
- Answer questions and have natural conversations
- Help with tasks, notes, reminders, and file analysis
- Understand and express emotions appropriately
- Provide web search results when available
- Analyze data from uploaded files

Emotional behavior guidelines:
- Friendly and warm for casual conversation
- Professional and precise for work-related queries
- Empathetic when users share problems or concerns
- Excited and celebratory when users achieve something
- Concerned when something seems wrong
- Use occasional emojis sparingly and naturally
- Adapt your tone based on the user's mood

Response format:
- Keep responses concise unless detailed explanation is needed
- Use markdown formatting for readability
- When creating tasks or notes, clearly indicate what was created
- Always maintain a helpful, assistant-like demeanor`;

const getAIResponse = async ({ message, systemPrompt, memories, chatHistory, fileContext }) => {
  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey || apiKey === 'your_cerebras_api_key_here') {
    return {
      message: "I'm sorry, but the AI service is not configured yet. Please set up your Cerebras API key in the .env file.",
      emotion: 'neutral'
    };
  }

  const messages = [];

  const system = systemPrompt || SYSTEM_PROMPT_BASE;
  messages.push({ role: 'system', content: system });

  if (memories && memories.length > 0) {
    const memoryText = memories.map(m => `- ${m.category}: ${m.content}`).join('\n');
    messages.push({
      role: 'system',
      content: `Here is what you know about this user from their memory:\n${memoryText}\nUse this information to personalize your responses.`
    });
  }

  if (fileContext) {
    messages.push({
      role: 'system',
      content: `The user has provided the following file context:\n${fileContext}\nUse this when answering questions about the file.`
    });
  }

  if (chatHistory && chatHistory.length > 0) {
    const recentHistory = chatHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  messages.push({ role: 'user', content: message });

  try {
    const response = await axios.post(
      'https://api.cerebras.ai/v1/chat/completions',
      {
        model: process.env.CEREBRAS_MODEL || 'gpt-oss-120b',
        messages,
        temperature: 0.7,
        max_tokens: 1024
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const text = response.data.choices[0].message.content;
    const emotion = detectEmotion(text, message);

    return { message: text, emotion };
  } catch (error) {
    console.error('Cerebras API error:', error.response?.data || error.message);
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return {
        message: "I'm having trouble connecting to my AI engine. Please check your network and API configuration.",
        emotion: 'neutral'
      };
    }
    if (error.response?.status === 401) {
      return {
        message: "My AI engine authentication failed. Please check your Cerebras API key.",
        emotion: 'neutral'
      };
    }
    return {
      message: "I encountered an error processing your request. Please try again.",
      emotion: 'neutral'
    };
  }
};

const detectEmotion = (aiText, userMessage) => {
  const text = aiText.toLowerCase();
  const userText = userMessage.toLowerCase();

  const excitedWords = ['great', 'awesome', 'amazing', 'fantastic', 'wonderful', 'excellent', 'congratulations', 'proud', '🎉', 'celebrate'];
  const sadWords = ['sorry', 'sad', 'unfortunate', 'miss', 'regret', 'unhappy', 'disappointed'];
  const happyWords = ['happy', 'glad', 'joy', 'wonderful', 'love', 'delighted', 'pleased'];
  const seriousWords = ['important', 'critical', 'urgent', 'deadline', 'warning', 'careful', 'attention'];

  if (excitedWords.some(w => text.includes(w))) return 'excited';
  if (sadWords.some(w => text.includes(w)) || sadWords.some(w => userText.includes(w))) return 'empathetic';
  if (happyWords.some(w => text.includes(w))) return 'happy';
  if (seriousWords.some(w => text.includes(w)) || seriousWords.some(w => userText.includes(w))) return 'serious';
  if (userText.includes('thank')) return 'happy';

  return 'neutral';
};

module.exports = { getAIResponse, SYSTEM_PROMPT_BASE };
