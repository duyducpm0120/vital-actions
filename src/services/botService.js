const TelegramBot = require('node-telegram-bot-api');
const moment = require('moment');
const { config } = require('../config/config');

class BotService {
    constructor() {
        this.initializeBot();
        this.channelId = config.telegram.channelId;
    }

    // Hàm escape các ký tự đặc biệt cho MarkdownV2
    escapeMarkdown(text) {
        if (!text) return '';
        // Escape các ký tự đặc biệt của MarkdownV2
        return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
    }

    // Hàm format tin nhắn với MarkdownV2
    formatMessage(message) {
        if (!message) return '';

        // Tách message thành các dòng
        const lines = message.split('\n');
        const formattedLines = lines.map(line => {
            // Giữ nguyên các emoji
            let formatted = line;

            // Xử lý các tiêu đề (dòng bắt đầu bằng #)
            if (line.trim().startsWith('#')) {
                const level = line.match(/^#+/)[0].length;
                const content = line.replace(/^#+\s*/, '');
                formatted = '*'.repeat(level) + ' ' + this.escapeMarkdown(content);
            }
            // Xử lý các dòng có bullet points
            else if (line.trim().startsWith('•')) {
                const content = line.replace(/^•\s*/, '');
                formatted = '• ' + this.escapeMarkdown(content);
            }
            // Xử lý các dòng có số thứ tự
            else if (line.trim().match(/^\d+\./)) {
                const [number, content] = line.split('.');
                formatted = number + '\\. ' + this.escapeMarkdown(content.trim());
            }
            // Xử lý các dòng có emoji
            else if (line.trim().match(/^[a-zA-Z0-9]/)) {
                const emoji = line.match(/^[a-zA-Z0-9]+/)[0];
                const content = line.replace(/^[a-zA-Z0-9]+\s*/, '');
                formatted = emoji + ' ' + this.escapeMarkdown(content);
            }
            // Xử lý các dòng có dấu * (in đậm)
            else if (line.includes('*')) {
                formatted = line.replace(/\*([^*]+)\*/g, (match, content) => {
                    // Escape dấu chấm trong nội dung trước
                    const escapedContent = content.replace(/\./g, '\\.');
                    return '*' + this.escapeMarkdown(escapedContent) + '*';
                });
            }
            // Xử lý các dòng có dấu _ (in nghiêng)
            else if (line.includes('_')) {
                formatted = line.replace(/_([^_]+)_/g, (match, content) => {
                    // Escape dấu chấm trong nội dung trước
                    const escapedContent = content.replace(/\./g, '\\.');
                    return '_' + this.escapeMarkdown(escapedContent) + '_';
                });
            }
            // Các dòng khác
            else {
                // Escape tất cả dấu chấm trong nội dung
                formatted = line.replace(/\./g, '\\.');
                // Escape các ký tự đặc biệt khác
                formatted = this.escapeMarkdown(formatted);
            }

            return formatted;
        });

        return formattedLines.join('\n');
    }

    // Hàm chia nhỏ tin nhắn dài
    splitMessage(message, maxLength = 4000) {
        if (!message || message.length <= maxLength) return [message];

        const messages = [];
        let currentMessage = '';
        const lines = message.split('\n');

        for (const line of lines) {
            // Nếu thêm dòng này vượt quá giới hạn
            if (currentMessage.length + line.length + 1 > maxLength) {
                // Nếu dòng hiện tại không rỗng, thêm vào mảng
                if (currentMessage) {
                    messages.push(currentMessage);
                    currentMessage = '';
                }
                // Nếu dòng quá dài, chia nhỏ nó
                if (line.length > maxLength) {
                    let remainingLine = line;
                    while (remainingLine.length > 0) {
                        messages.push(remainingLine.substring(0, maxLength));
                        remainingLine = remainingLine.substring(maxLength);
                    }
                } else {
                    currentMessage = line;
                }
            } else {
                // Thêm dòng vào tin nhắn hiện tại
                currentMessage += (currentMessage ? '\n' : '') + line;
            }
        }

        // Thêm phần còn lại
        if (currentMessage) {
            messages.push(currentMessage);
        }

        return messages;
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

    // Hàm xử lý HTML để chỉ giữ lại các tags được hỗ trợ
    sanitizeHtml(html) {
        if (!html) return '';

        // Escape các ký tự đặc biệt
        const escapeHtml = (text) => {
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        };

        // Xử lý các thẻ HTML được hỗ trợ
        let sanitized = html
            // Chuyển đổi các heading tags thành bold
            .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '<b>$1</b>\n')
            // Xử lý các thẻ được hỗ trợ
            .replace(/<b>(.*?)<\/b>/gi, (match, content) => `<b>${escapeHtml(content)}</b>`)
            .replace(/<i>(.*?)<\/i>/gi, (match, content) => `<i>${escapeHtml(content)}</i>`)
            .replace(/<u>(.*?)<\/u>/gi, (match, content) => `<u>${escapeHtml(content)}</u>`)
            .replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi, (match, url, content) =>
                `<a href="${escapeHtml(url)}">${escapeHtml(content)}</a>`)
            .replace(/<code>(.*?)<\/code>/gi, (match, content) => `<code>${escapeHtml(content)}</code>`)
            .replace(/<pre>(.*?)<\/pre>/gi, (match, content) => `<pre>${escapeHtml(content)}</pre>`)
            // Loại bỏ các thẻ không được hỗ trợ
            .replace(/<[^>]+>/g, '')
            // Xử lý khoảng trắng
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        return sanitized;
    }

    async sendMessage(chatId, message) {
        try {
            const messages = this.splitMessage(message);
            for (const msg of messages) {
                const sanitizedMessage = this.sanitizeHtml(msg);
                await this.bot.sendMessage(chatId, sanitizedMessage, {
                    parse_mode: 'HTML',
                    disable_web_page_preview: true
                });
            }
            return true;
        } catch (error) {
            console.error('Error sending message:', error.message);
            return false;
        }
    }

    async sendToChannel(message) {
        try {
            const messages = this.splitMessage(message);
            for (const msg of messages) {
                const sanitizedMessage = this.sanitizeHtml(msg);
                await this.bot.sendMessage(this.channelId, sanitizedMessage, {
                    parse_mode: 'HTML',
                    disable_web_page_preview: true
                });
            }
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