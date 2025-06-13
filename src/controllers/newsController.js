const newsService = require('../services/newsService');
const botService = require('../services/botService');
const moment = require('moment');

class NewsController {
    async processDailyNews() {
        try {
            console.log('🔄 Starting daily news processing...');

            // Crawl news
            const news = await newsService.crawlNews();
            console.log(`📰 Crawled ${news.length} news articles`);

            if (news.length === 0) {
                console.log('⚠️ No news found for yesterday');
                return;
            }

            // Analyze news using Grok
            const analysis = await newsService.analyzeNews(news);
            console.log('✅ News analysis completed');

            // Format message
            const message = `
📊 Báo cáo tin tức ngày ${moment().subtract(1, 'days').format('DD/MM/YYYY')}

${analysis}

#VitalActions #DailyReport
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