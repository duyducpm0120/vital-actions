const axios = require('axios');
const { config } = require('../config/config');

class AIService {
    constructor() {
        this.providers = {
            grok: {
                apiKey: process.env.GROK_API_KEY,
                apiUrl: 'https://api.x.ai/v1/chat/completions',
                model: 'grok-3-latest',
                getHeaders: () => ({
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.GROK_API_KEY}`
                })
            },
            openai: {
                apiKey: process.env.OPENAI_API_KEY,
                apiUrl: 'https://api.openai.com/v1/chat/completions',
                model: 'gpt-3.5-turbo',
                getHeaders: () => ({
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.GPT_API_KEY}`
                })
            },
            gemini: {
                apiKey: process.env.GEMINI_API_KEY,
                apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
                model: 'gemini-2.0-flash',
                getHeaders: () => ({
                    'Content-Type': 'application/json'
                }),
                getUrl: () => `${this.providers.gemini.apiUrl}?key=${process.env.GEMINI_API_KEY}`
            }
        };
    }

    async chat(messages, options = {}) {
        const provider = options.provider || 'gemini';
        const providerConfig = this.providers[provider];

        if (!providerConfig) {
            throw new Error(`Provider ${provider} not supported`);
        }

        try {
            if (provider === 'gemini') {
                // Format messages for Gemini
                const prompt = messages.map(msg => msg.content).join('\n');
                const response = await axios.post(
                    providerConfig.getUrl(),
                    {
                        contents: [{
                            parts: [{
                                text: prompt
                            }]
                        }]
                    },
                    {
                        headers: providerConfig.getHeaders()
                    }
                );

                return {
                    choices: [{
                        message: {
                            content: response.data.candidates[0].content.parts[0].text
                        }
                    }]
                };
            } else {
                // Format for other providers
                const optimizedMessages = messages.map(msg => ({
                    role: msg.role,
                    content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
                }));

                const response = await axios.post(
                    providerConfig.apiUrl,
                    {
                        messages: optimizedMessages,
                        model: options.model || providerConfig.model,
                        stream: false,
                        temperature: options.temperature || 0,
                        max_tokens: options.max_tokens || 1000
                    },
                    {
                        headers: providerConfig.getHeaders()
                    }
                );

                return response.data;
            }
        } catch (error) {
            console.error(`Error calling ${provider} API:`, error.response?.data || error.message);
            throw error;
        }
    }

    async getSimpleResponse(prompt, options = {}) {
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
            const response = await this.chat(messages, options);
            return response.choices[0].message.content;
        } catch (error) {
            console.error(`Error getting response from ${options.provider || 'openai'}:`, error);
            throw error;
        }
    }
}

module.exports = new AIService(); 