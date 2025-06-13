require('dotenv').config();

const config = {
    telegram: {
        token: process.env.TELEGRAM_TOKEN,
        channelId: process.env.CHANNEL_ID
    }
};

// Validate required environment variables
const validateConfig = () => {
    const { token, channelId } = config.telegram;

    if (!token || !channelId) {
        console.error('❌ Missing required environment variables:');
        console.error('- TELEGRAM_TOKEN:', token ? '✅ Set' : '❌ Missing');
        console.error('- CHANNEL_ID:', channelId ? '✅ Set' : '❌ Missing');
        process.exit(1);
    }
};

module.exports = {
    config,
    validateConfig
}; 