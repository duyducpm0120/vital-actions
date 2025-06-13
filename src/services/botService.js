const TelegramBot = require('node-telegram-bot-api');
const moment = require('moment');
const { config } = require('../config/config');

class BotService {
    constructor() {
        this.initializeBot();
        this.channelId = config.telegram.channelId;
    }

    initializeBot() {
        try {
            // Khởi tạo bot với long polling
            this.bot = new TelegramBot(config.telegram.token, {
                polling: {
                    interval: 1000,
                    autoStart: false,
                    params: {
                        timeout: 30
                    }
                }
            });

            // Xử lý các sự kiện lỗi
            this.bot.on('polling_error', (error) => {
                console.error('Polling error:', error.message);
                // Thử khởi động lại polling sau 5 giây
                setTimeout(() => {
                    console.log('🔄 Restarting polling...');
                    this.bot.stopPolling();
                    this.startPolling();
                }, 5000);
            });

            this.bot.on('error', (error) => {
                console.error('Bot error:', error.message);
            });

            // Kiểm tra kết nối và bắt đầu polling
            this.bot.getMe()
                .then(botInfo => {
                    console.log('🤖 Bot connected successfully:', botInfo.username);
                    return this.startPolling();
                })
                .catch(error => {
                    console.error('Failed to connect bot:', error.message);
                    // Thử kết nối lại sau 5 giây
                    setTimeout(() => this.initializeBot(), 5000);
                });

        } catch (error) {
            console.error('Error initializing bot:', error.message);
            // Thử khởi động lại sau 5 giây
            setTimeout(() => this.initializeBot(), 5000);
        }
    }

    startPolling() {
        return new Promise((resolve, reject) => {
            try {
                this.bot.startPolling({
                    polling: {
                        interval: 1000,
                        autoStart: true,
                        params: {
                            timeout: 30
                        }
                    }
                });
                console.log('✅ Polling started successfully');
                resolve();
            } catch (error) {
                console.error('Failed to start polling:', error.message);
                reject(error);
            }
        });
    }

    async sendMessage(chatId, message) {
        try {
            await this.bot.sendMessage(chatId, message, {
                parse_mode: 'HTML',
                disable_web_page_preview: true
            });
            return true;
        } catch (error) {
            console.error('Error sending message:', error.message);
            return false;
        }
    }

    async sendToChannel(message) {
        try {
            await this.bot.sendMessage(this.channelId, message, {
                parse_mode: 'HTML',
                disable_web_page_preview: true
            });
            return true;
        } catch (error) {
            console.error('Error sending message to channel:', error.message);
            return false;
        }
    }

    getBot() {
        return this.bot;
    }
}

module.exports = new BotService(); 