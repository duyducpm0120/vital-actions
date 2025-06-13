const express = require('express');
const cron = require('node-cron');
const { validateConfig } = require('./config/config');
const newsController = require('./controllers/newsController');
const botController = require('./controllers/botController');
const { providers } = require('./services/aiService');

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Validate configuration
validateConfig();

// Middleware
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Route to manually trigger news processing
app.post('/api/news/process', async (req, res) => {
    try {
        const provider = req.query.provider || 'gemini'; // Lấy provider từ query param, mặc định là gemini
        console.log(`🔄 Manually triggering news processing with provider: ${provider}...`);

        await newsController.processDailyNews({ provider });

        res.json({
            status: 'success',
            message: 'News processing completed successfully',
            provider,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error in manual news processing:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to process news',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Schedule daily news processing at 9:00 AM
cron.schedule('0 9 * * *', async () => {
    console.log('🕘 Running scheduled news processing...');
    try {
        await newsController.processDailyNews();
    } catch (error) {
        console.error('❌ Scheduled task failed:', error);
    }
});

// Start server
app.listen(port, () => {
    console.log(`🚀 Server is running on port ${port}`);
    console.log('🤖 Telegram bot is active');
    console.log('⏰ Daily news processing scheduled for 9:00 AM');
}); 