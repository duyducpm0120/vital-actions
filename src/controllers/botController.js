const moment = require('moment');
const botService = require('../services/botService');


class BotController {
    constructor() {
        this.bot = null;
        this.initialize();
    }

    async initialize() {
        try {
            this.bot = await botService.getBot();
            this.setupCommands();
        } catch (error) {
            console.error('Failed to initialize bot controller:', error.message);
            // Thử khởi tạo lại sau 5 giây
            setTimeout(() => this.initialize(), 5000);
        }
    }

    setupCommands() {
        // Start command
        this.bot.onText(/\/start/, this.handleStart.bind(this));

        // Help command
        this.bot.onText(/\/help/, this.handleHelp.bind(this));

        // Status command
        this.bot.onText(/\/status/, this.handleStatus.bind(this));

        // Send command
        this.bot.onText(/\/send (.+)/, this.handleSend.bind(this));

        // Test channel command
        this.bot.onText(/\/testchannel/, this.handleTestChannel.bind(this));

        // Handle any text message
        this.bot.on('message', this.handleMessage.bind(this));
    }

    async handleStart(msg) {
        const chatId = msg.chat.id;
        const welcomeMessage = `
🤖 Welcome to Vital Actions Bot!

This bot provides vital information and insights about:
📊 Political developments
💰 Financial market updates
🎯 Actionable insights

Use /help to see available commands.
    `;

        await botService.sendMessage(chatId, welcomeMessage);
    }

    async handleHelp(msg) {
        const chatId = msg.chat.id;
        const helpMessage = `
📖 Available Commands:

/start - Start the bot
/help - Show this help message
/status - Check bot status
/send [message] - Send message to channel (admin only)

📌 Features:
• Real-time political updates
• Financial market insights
• AI-powered analysis
    `;

        await botService.sendMessage(chatId, helpMessage);
    }

    async handleStatus(msg) {
        const chatId = msg.chat.id;
        const statusMessage = `
✅ Bot Status: Online
⏰ Uptime: ${moment().format('YYYY-MM-DD HH:mm:ss')}
🔗 Channel ID: ${botService.channelId}
🤖 Bot Ready: Yes
    `;

        await botService.sendMessage(chatId, statusMessage);
    }

    async handleSend(msg, match) {
        const chatId = msg.chat.id;
        const messageToSend = match[1];

        const success = await botService.sendToChannel(messageToSend);
        const response = success
            ? '✅ Message sent to channel successfully!'
            : '❌ Failed to send message to channel.';

        await botService.sendMessage(chatId, response);
    }

    async handleTestChannel(msg) {
        const chatId = msg.chat.id;
        const testMessage = `<b>Test message to channel</b>\nChannel ID: ${botService.channelId}`;

        try {
            const success = await botService.sendToChannel(testMessage);
            const response = success
                ? '✅ Test message sent to channel successfully!'
                : '❌ Failed to send test message to channel.';

            await botService.sendMessage(chatId, response);
        } catch (error) {
            console.error('Error in test channel:', error);
            await botService.sendMessage(chatId, `❌ Error: ${error.message}`);
        }
    }

    async handleMessage(msg) {
        const messageText = msg.text;

        // Skip if it's a command
        if (messageText && messageText.startsWith('/')) {
            return;
        }

        // Log incoming messages
        console.log(`📩 Message from ${msg.from.first_name}: ${messageText}`);
    }
}

module.exports = new BotController(); 