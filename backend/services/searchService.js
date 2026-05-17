const axios = require('axios');

const searchWeb = async (query) => {
  const apiKey = process.env.SEARCH_API_KEY;
  const provider = process.env.SEARCH_API_PROVIDER || '';

  if (!apiKey) {
    return {
      success: false,
      results: [],
      message: 'Web search is not configured. Please set SEARCH_API_KEY in your environment variables.'
    };
  }

  try {
    if (provider.toLowerCase() === 'serpapi' || provider.toLowerCase() === 'serp') {
      const response = await axios.get('https://serpapi.com/search', {
        params: {
          q: query,
          api_key: apiKey,
          engine: 'google',
          num: 5
        },
        timeout: 10000
      });

      const results = (response.data.organic_results || []).slice(0, 5).map(r => ({
        title: r.title,
        link: r.link,
        snippet: r.snippet
      }));

      return { success: true, results, source: 'SerpAPI' };
    }

    if (provider.toLowerCase() === 'googlesearch' || provider.toLowerCase() === 'google') {
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          q: query,
          key: apiKey,
          cx: process.env.SEARCH_ENGINE_ID || '',
          num: 5
        },
        timeout: 10000
      });

      const results = (response.data.items || []).slice(0, 5).map(r => ({
        title: r.title,
        link: r.link,
        snippet: r.snippet
      }));

      return { success: true, results, source: 'Google Custom Search' };
    }

    return {
      success: false,
      results: [],
      message: `Unknown search provider: ${provider}. Supported: serpapi, google.`
    };
  } catch (error) {
    console.error('Search API error:', error.message);
    return {
      success: false,
      results: [],
      message: 'Web search is currently unavailable. Please try again later.'
    };
  }
};

module.exports = { searchWeb };
