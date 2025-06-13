const axios = require('axios');

class GrokService {
    constructor() {
        this.apiKey = process.env.GROK_API_KEY;
        this.apiUrl = 'https://api.x.ai/v1/chat/completions';
        this.model = 'grok-3-latest';
    }

    async chat(messages, temperature = 0) {
        try {
            const response = await axios.post(
                this.apiUrl,
                {
                    messages,
                    model: this.model,
                    stream: false,
                    temperature
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error calling Grok API:', error.response?.data || error.message);
            throw error;
        }
    }

    async getSimpleResponse(prompt) {
        const messages = [
            {
                role: 'system',
                content: 'You are a helpful assistant.'
            },
            {
                role: 'user',
                content: prompt
            }
        ];

        try {
            const response = await this.chat(messages);
            return response.choices[0].message.content;
        } catch (error) {
            console.error('Error getting response from Grok:', error);
            throw error;
        }
    }
}

module.exports = new GrokService(); 