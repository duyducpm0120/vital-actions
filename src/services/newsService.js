const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment');
const puppeteer = require('puppeteer');
const aiService = require('./aiService');

class NewsService {
    constructor() {
        this.sources = [
            // {
            //     name: 'BBC',
            //     url: 'https://www.bbc.com/news/world',
            //     selector: '.gs-c-promo-heading',
            //     getContent: async (url, browser) => {
            //         const page = await browser.newPage();
            //         await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            //         await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

            //         const today = moment().format('YYYY-MM-DD');
            //         const content = await page.evaluate((today) => {
            //             return {
            //                 title: document.querySelector('h1')?.textContent?.trim() || '',
            //                 content: document.querySelector('[data-gu-name="body"]')?.textContent?.trim() || '',
            //                 date: document.querySelector('time')?.getAttribute('datetime') || today
            //             };
            //         }, today);

            //         await page.close();
            //         return content;
            //     }
            // },
            // {
            //     name: 'Reuters',
            //     url: 'https://www.reuters.com/world',
            //     selector: '.article-card__title',
            //     getContent: async (url) => {
            //         // const response = await axios.get(url);
            //         // const $ = cheerio.load(response.data);
            //         // return {
            //         //     title: $('h1').first().text().trim(),
            //         //     content: $('.article-body__content__17Yit').text().trim(),
            //         //     date: $('time').first().attr('datetime') || moment().format('YYYY-MM-DD')
            //         // };
            //         const page = await browser.newPage();
            //         await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            //         await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

            //         const today = moment().format('YYYY-MM-DD');
            //         const content = await page.evaluate((today) => {
            //             return {
            //                 title: document.querySelector('h1')?.textContent?.trim() || '',
            //                 content: document.querySelector('.article-body__content__17Yit')?.textContent?.trim() || '',
            //                 date: document.querySelector('time')?.getAttribute('datetime') || today
            //             };
            //         }, today);

            //         await page.close();
            //     }
            // },
            {
                name: 'The Guardian',
                url: 'https://www.theguardian.com/world',
                selector: 'a[data-link-name="article"]',
                getContent: async (url, browser) => {
                    const page = await browser.newPage();
                    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
                    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

                    const today = moment().format('YYYY-MM-DD');
                    const content = await page.evaluate((today) => {
                        return {
                            title: document.querySelector('h1')?.textContent?.trim() || '',
                            content: document.querySelector('[data-gu-name="body"]')?.textContent?.trim() || '',
                            date: document.querySelector('time')?.getAttribute('datetime') || today
                        };
                    }, today);

                    await page.close();
                    return content;
                }
            }
        ];
    }

    async crawlNews() {
        const news = [];
        const seenUrls = new Set(); // Để tránh trùng lặp

        // Khởi tạo browser với các options
        const browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920,1080'
            ]
        });

        try {
            for (const source of this.sources) {
                try {
                    console.log(`🔄 Crawling ${source.name}...`);
                    console.log(`📡 Requesting URL: ${source.url}`);

                    const page = await browser.newPage();
                    await page.setViewport({ width: 1920, height: 1080 });
                    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

                    // Enable request interception
                    await page.setRequestInterception(true);
                    page.on('request', (request) => {
                        if (['image', 'stylesheet', 'font'].includes(request.resourceType())) {
                            request.abort();
                        } else {
                            request.continue();
                        }
                    });

                    // Navigate to page
                    await page.goto(source.url, {
                        waitUntil: 'networkidle0',
                        timeout: 30000
                    });

                    console.log(`✅ Got response from ${source.name}`);

                    // Wait for content to load
                    await page.waitForSelector(source.selector, { timeout: 5000 })
                        .catch(() => console.log(`⚠️ Selector ${source.selector} not found`));

                    // Lấy danh sách bài viết
                    const articles = await page.evaluate((selector) => {
                        const elements = document.querySelectorAll(selector);
                        return Array.from(elements).slice(0, 20).map(el => ({
                            title: el.textContent.trim(),
                            url: el.href
                        }));
                    }, source.selector);

                    console.log(`📰 Found ${articles.length} articles from ${source.name}`);

                    for (const article of articles) {
                        if (article.url && !seenUrls.has(article.url)) {
                            seenUrls.add(article.url);
                            news.push({
                                source: source.name,
                                title: article.title,
                                url: article.url
                            });
                            console.log(`✅ Added article from ${source.name} to news list`);
                        }
                    }

                    await page.close();
                    console.log(`✅ Finished crawling ${source.name}`);
                } catch (error) {
                    console.error(`❌ Error crawling ${source.name}:`, error.message);
                    if (error.stack) {
                        console.error('Stack trace:', error.stack);
                    }
                }
            }
        } finally {
            await browser.close();
        }

        console.log(`📊 Total unique news articles found: ${news.length}`);
        return news;
    }

    async analyzeNews(articles, options = {}) {
        try {
            // Nhóm tin theo nguồn
            const groupedArticles = articles.reduce((acc, article) => {
                if (!acc[article.source]) {
                    acc[article.source] = [];
                }
                acc[article.source].push(article);
                return acc;
            }, {});

            // Tạo prompt với format đơn giản
            const prompt = `Bạn là chuyên gia phân tích tin tức quốc tế. Hãy phân tích các tin tức sau và tạo báo cáo chi tiết. Chỉ sử dụng các HTML tags sau: <b> cho in đậm, <i> cho in nghiêng, <a> cho link.

${Object.entries(groupedArticles).map(([source, articles]) => `
<b>${source}</b>
${articles.map(article => `• ${article.title}`).join('\n')}`).join('\n\n')}

Hãy tạo báo cáo theo format sau:

<b>BÁO CÁO PHÂN TÍCH TIN TỨC QUỐC TẾ</b>

<b>1. PHÂN TÍCH CHÍNH TRỊ</b>
• Tóm tắt các sự kiện chính
• Tác động và xu hướng
• Mức độ ảnh hưởng

<b>2. PHÂN TÍCH KINH TẾ</b>
• Diễn biến kinh tế
• Tác động đến thị trường
• Dự báo xu hướng

<b>3. TÁC ĐỘNG VÀ GỢI Ý CHO VIỆT NAM</b>
• Tác động trực tiếp và gián tiếp
• Giải pháp và chiến lược
• Gợi ý hành động cụ thể cho người trẻ Việt Nam

Lưu ý:
• Chỉ sử dụng các HTML tags: <b>, <i>, <a>
• Không sử dụng các HTML tags khác
• Sử dụng emoji để tăng tính trực quan
• Định dạng văn bản rõ ràng với các tiêu đề và danh sách
• Sử dụng ngôn ngữ chuyên nghiệp nhưng dễ hiểu
• Tập trung vào các tác động thực tế
• Đưa ra các gợi ý thiết thực và khả thi

#VitalActions #DailyReport`;

            const response = await aiService.getSimpleResponse(prompt, options);
            return response;
        } catch (error) {
            console.error('Error analyzing news:', error);
            throw error;
        }
    }
}

module.exports = new NewsService(); 