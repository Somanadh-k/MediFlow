const fetchNewsTrends = async () => {
  const apiKey = process.env.NEWS_API_KEY;
  const city = process.env.CITY || 'Hyderabad';
  const query = `${city} AND (dengue OR malaria OR "viral fever" OR flu OR influenza OR heatwave OR dehydration)`;

  if (!apiKey) {
    console.warn('[NewsService] NEWS_API_KEY is missing. Using mocked fallback data.');
    return {
      trendFound: true,
      keyword: 'Viral Fever'
    };
  }

  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&apiKey=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`NewsAPI returned status: ${response.status}`);
    }
    const data = await response.json();

    if (data.articles && data.articles.length > 0) {
      // Analyze headlines to extract the dominant keyword
      const textBlock = data.articles.map(a => a.title + ' ' + a.description).join(' ').toLowerCase();
      
      let topKeyword = null;
      let maxCount = 0;
      
      const keywords = ['dengue', 'malaria', 'viral fever', 'flu', 'influenza', 'heatwave', 'dehydration'];
      keywords.forEach(kw => {
        const count = (textBlock.match(new RegExp(kw, 'g')) || []).length;
        if (count > maxCount) {
          maxCount = count;
          topKeyword = kw;
        }
      });

      if (topKeyword) {
        return {
          trendFound: true,
          keyword: topKeyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        };
      }
    }

    return { trendFound: false, keyword: null };
  } catch (error) {
    console.error('[NewsService] Failed to fetch news. Using fallback.', error.message);
    return {
      trendFound: true,
      keyword: 'Viral Fever'
    };
  }
};

module.exports = { fetchNewsTrends };
