const newsService = require('../services/newsService');
const botService = require('../services/botService');
const moment = require('moment');

class NewsController {
    async processDailyNews(options = {}) {
        try {
            console.log('🔄 Starting daily news processing...');

            // Crawl news
            const news = await newsService.crawlNews();
            console.log(`📰 Crawled ${news.length} news articles`);

            if (news.length === 0) {
                console.log('⚠️ No news found for yesterday');
                return;
            }

            // Analyze news using AI
            const analysis = await newsService.analyzeNews(news, options);
            console.log('✅ News analysis completed');

            // Format message
            const message = `
<b>📊 Báo cáo tin tức ngày ${moment().format('DD/MM/YYYY')}</b>

${analysis}

<b>#VitalActions #DailyReport</b>
            `;

            // Send to channel
            await botService.sendToChannel(message);
            console.log('✅ Daily report sent to channel');

        } catch (error) {
            console.error('❌ Error processing daily news:', error);
            throw error;
        }
    }
}

module.exports = new NewsController(); 