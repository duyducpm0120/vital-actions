# Vital Actions Bot

A Telegram bot that provides vital information and insights about political developments, financial market updates, and actionable insights.

## Features

- 🤖 Real-time political updates
- 💰 Financial market insights
- 🎯 AI-powered analysis
- 📊 Channel broadcasting capabilities
- 🔒 Secure SOCKS5 proxy integration

## Prerequisites

- Node.js v20 or higher
- Docker and Docker Compose
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))

## Environment Variables

Create a `.env` file in the root directory with the .env.example template:

```env
# Telegram Configuration
TELEGRAM_BOT_TOKEN=your-bot-token
CHANNEL_ID=your-channel

# AI API Configuration
GROK_API_KEY=your-grok-api-key
GPT_API_KEY=your-gpt-api-key
GEMINI_API_KEY=your-gemini-api-key

# Application Configuration
PORT=3000
NODE_ENV=development
```

## Project Structure

```
.
├── src/
│   ├── controllers/     # Bot command handlers
│   ├── services/        # Core business logic
│   ├── config/         # Configuration files
│   └── server.js       # Application entry point
├── logs/               # Application logs
├── Dockerfile         # Docker configuration
├── docker-compose.yml # Docker services configuration
└── package.json       # Project dependencies
```

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/vital-actions.git
cd vital-actions
```

2. Install dependencies:

```bash
npm install
```

3. Create and configure your `.env` file:

```bash
cp .env.example .env
# Edit .env with your configuration
```

## Running with Docker

1. Build and start the containers:

```bash
docker-compose up --build -d
```

2. View logs:

```bash
docker-compose logs -f
```

3. Stop the containers:

```bash
docker-compose down
```

## Available Commands

- `/start` - Start the bot
- `/help` - Show help message
- `/status` - Check bot status
- `/send [message]` - Send message to channel (admin only)
- `/testchannel` - Test channel connection

## Proxy Configuration

The bot uses a SOCKS5 proxy for secure communication with Telegram's API. The proxy is configured using Docker Compose:

- Proxy Service: `serjs/go-socks5-proxy`
- Port: 1080
- Username: admin
- Password: admin

## Health Checks

The bot service includes health checks that run every 30 seconds to ensure the application is running properly.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.
