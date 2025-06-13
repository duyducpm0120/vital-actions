require('dotenv').config();

const config = {
    telegram: {
        token: process.env.TELEGRAM_BOT_TOKEN,
        channelId: process.env.CHANNEL_ID
    },
    grok: {
        apiKey: process.env.GROK_API_KEY,
        model: 'grok-3-latest'
    }
};

// Validate required environment variables
const validateConfig = () => {
    const { token, channelId } = config.telegram;
    const { apiKey } = config.grok;

    if (!token || !channelId) {
        console.error('❌ Missing required environment variables:');
        console.error('- TELEGRAM_BOT_TOKEN:', token ? '✅ Set' : '❌ Missing');
        console.error('- CHANNEL_ID:', channelId ? '✅ Set' : '❌ Missing');
        process.exit(1);
    }

    if (!apiKey) {
        console.error('❌ Missing Grok API key:');
        console.error('- GROK_API_KEY:', apiKey ? '✅ Set' : '❌ Missing');
        process.exit(1);
    }
};

module.exports = {
    config,
    validateConfig
}; 