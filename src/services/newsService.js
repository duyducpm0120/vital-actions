const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment');

class NewsService {
    constructor() {
        this.sources = [
            {
                name: 'BBC',
                url: 'https://www.bbc.com/news/world',
                selector: '.gs-c-promo-heading',
                getContent: async (url) => {
                    const response = await axios.get(url);
                    const $ = cheerio.load(response.data);
                    return {
                        title: $('h1').first().text().trim(),
                        content: $('.article__body-content').text().trim(),
                        date: $('time').first().attr('datetime') || moment().format('YYYY-MM-DD')
                    };
                }
            },
            {
                name: 'Reuters',
                url: 'https://www.reuters.com/world',
                selector: '.article-card__title',
                getContent: async (url) => {
                    const response = await axios.get(url);
                    const $ = cheerio.load(response.data);
                    return {
                        title: $('h1').first().text().trim(),
                        content: $('.article-body__content__17Yit').text().trim(),
                        date: $('time').first().attr('datetime') || moment().format('YYYY-MM-DD')
                    };
                }
            },
            {
                name: 'The Guardian',
                url: 'https://www.theguardian.com/world',
                selector: '.fc-item__title',
                getContent: async (url) => {
                    const response = await axios.get(url);
                    const $ = cheerio.load(response.data);
                    return {
                        title: $('h1').first().text().trim(),
                        content: $('.article-body-commercial-selector').text().trim(),
                        date: $('time').first().attr('datetime') || moment().format('YYYY-MM-DD')
                    };
                }
            }
        ];
    }

    async crawlNews() {
        const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
        const news = [];

        for (const source of this.sources) {
            try {
                console.log(`🔄 Crawling ${source.name}...`);
                const response = await axios.get(source.url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });
                const $ = cheerio.load(response.data);

                const articles = $(source.selector).slice(0, 5); // Get top 5 articles

                for (const article of articles) {
                    const link = $(article).attr('href');
                    if (link) {
                        const fullUrl = link.startsWith('http') ? link : new URL(link, source.url).href;
                        try {
                            const content = await source.getContent(fullUrl);
                            if (content.date.includes(yesterday)) {
                                news.push({
                                    source: source.name,
                                    url: fullUrl,
                                    ...content
                                });
                            }
                        } catch (error) {
                            console.error(`Error fetching article from ${source.name}:`, error.message);
                        }
                    }
                }
                console.log(`✅ Finished crawling ${source.name}`);
            } catch (error) {
                console.error(`Error crawling ${source.name}:`, error.message);
            }
        }

        return news;
    }

    async analyzeNews(news) {
        const grokService = require('./grokService');

        const prompt = `
Hãy phân tích các tin tức quốc tế sau và tổng hợp thành một báo cáo theo format sau:

1. Phân tích về chính trị nói chung
2. Phân tích về kinh tế nói chung
3. Liên hệ và Đưa ra gợi ý về lối tư duy - định hướng cho người dùng sống ở Việt Nam

Tin tức cần phân tích:
${JSON.stringify(news, null, 2)}

Lưu ý: 
- Hãy trả lời bằng tiếng Việt
- Đảm bảo thông tin chính xác, khách quan
- Phân tích tác động của các sự kiện quốc tế đến Việt Nam
- Đưa ra các gợi ý thực tế và có thể áp dụng được
`;

        try {
            const response = await grokService.getSimpleResponse(prompt);
            return response;
        } catch (error) {
            console.error('Error analyzing news:', error);
            throw error;
        }
    }
}

module.exports = new NewsService(); 