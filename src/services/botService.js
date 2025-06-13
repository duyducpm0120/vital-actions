const TelegramBot = require('node-telegram-bot-api');
const moment = require('moment');
const { config } = require('../config/config');

class BotService {
    constructor() {
        this.bot = new TelegramBot(config.telegram.token, { polling: true });
        this.channelId = config.telegram.channelId;
        this.setupErrorHandling();
    }

    setupErrorHandling() {
        this.bot.on('error', (error) => {
            console.error('❌ Bot error:', error);
        });
    }

    async sendMessage(chatId, message) {
        try {
            await this.bot.sendMessage(chatId, message);
            return true;
        } catch (error) {
            console.error('Error sending message:', error);
            return false;
        }
    }

    async sendToChannel(message) {
        try {
            await this.bot.sendMessage(this.channelId, message);
            return true;
        } catch (error) {
            console.error('Error sending message to channel:', error);
            return false;
        }
    }

    getBot() {
        return this.bot;
    }
}

module.exports = new BotService(); 