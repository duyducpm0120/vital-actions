const moment = require('moment');
const { validateConfig } = require('./config/config');
const botController = require('./controllers/botController');

// Validate configuration
validateConfig();

console.log('🤖 Telegram bot started successfully!');
console.log('📅 Started at:', moment().format('YYYY-MM-DD HH:mm:ss'));
console.log('🚀 Bot is running and listening for messages...'); 