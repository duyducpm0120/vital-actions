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

                    try {
                        await page.goto(url, {
                            waitUntil: 'domcontentloaded',
                            timeout: 60000
                        });

                        // Đợi selector xuất hiện
                        await page.waitForSelector('a[data-link-name="article"]', { timeout: 10000 });

                        const articles = await page.evaluate(() => {
                            const elements = document.querySelectorAll('a[data-link-name="article"]');
                            return Array.from(elements).slice(0, 10).map(el => ({
                                title: el.textContent.trim(),
                                url: el.href
                            }));
                        });

                        return articles;
                    } catch (error) {
                        console.error(`Error loading The Guardian: ${error.message}`);
                        return [];
                    } finally {
                        await page.close();
                    }
                }
            },
            {
                name: 'VnExpress',
                url: 'https://vnexpress.net/thoi-su',
                selector: 'h2.title-news a, h3.title-news a',
                getContent: async (url, browser) => {
                    const page = await browser.newPage();

                    // Cấu hình page
                    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
                    await page.setViewport({ width: 1920, height: 1080 });
                    await page.setDefaultNavigationTimeout(60000);
                    await page.setDefaultTimeout(60000);

                    // Enable request interception
                    await page.setRequestInterception(true);
                    page.on('request', (request) => {
                        if (['image', 'stylesheet', 'font', 'media'].includes(request.resourceType())) {
                            request.abort();
                        } else {
                            request.continue();
                        }
                    });

                    try {
                        // Thử load trang với timeout dài hơn
                        await page.goto(url, {
                            waitUntil: 'domcontentloaded',
                            timeout: 60000
                        });

                        // Đợi selector xuất hiện
                        await page.waitForSelector('h2.title-news a, h3.title-news a', { timeout: 10000 });

                        const articles = await page.evaluate(() => {
                            const elements = document.querySelectorAll('h2.title-news a, h3.title-news a');
                            return Array.from(elements).slice(0, 10).map(el => ({
                                title: el.textContent.trim(),
                                url: el.href
                            }));
                        });

                        return articles;
                    } catch (error) {
                        console.error(`Error loading VnExpress: ${error.message}`);
                        return [];
                    } finally {
                        await page.close();
                    }
                }
            },
        ];
    }

    async crawlNews() {
        const news = {
            international: [],
            vietnam: []
        };
        const seenUrls = new Set();

        const browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920,1080',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process'
            ]
        });

        try {
            for (const source of this.sources) {
                try {
                    console.log(`🔄 Crawling ${source.name}...`);
                    console.log(`📡 Requesting URL: ${source.url}`);

                    const articles = await source.getContent(source.url, browser);
                    console.log(`📰 Found ${articles.length} articles from ${source.name}`);

                    for (const article of articles) {
                        if (article.url && !seenUrls.has(article.url)) {
                            seenUrls.add(article.url);

                            // Phân loại tin tức
                            const newsItem = {
                                source: source.name,
                                title: article.title,
                                url: article.url,
                                category: this.categorizeNews(article.title),
                                sentiment: await this.analyzeSentiment(article.title),
                                keywords: await this.extractKeywords(article.title)
                            };

                            if (source.name === 'The Guardian') {
                                news.international.push(newsItem);
                            } else {
                                news.vietnam.push(newsItem);
                            }

                            console.log(`✅ Added article from ${source.name} to news list`);
                        }
                    }

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

        console.log(`📊 Total unique news articles found: ${news.international.length + news.vietnam.length}`);
        return news;
    }

    // Phân loại tin tức
    categorizeNews(title) {
        const categories = {
            politics: ['chính trị', 'chính phủ', 'quốc hội', 'bầu cử', 'đảng', 'lãnh đạo', 'thủ tướng', 'tổng thống'],
            economy: ['kinh tế', 'thị trường', 'chứng khoán', 'lạm phát', 'lãi suất', 'doanh nghiệp', 'đầu tư'],
            society: ['xã hội', 'giáo dục', 'y tế', 'môi trường', 'giao thông', 'an toàn', 'trật tự'],
            international: ['quốc tế', 'đối ngoại', 'hội nhập', 'hợp tác', 'quan hệ'],
            security: ['an ninh', 'quốc phòng', 'biển đảo', 'biên giới', 'chủ quyền']
        };

        const titleLower = title.toLowerCase();
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => titleLower.includes(keyword))) {
                return category;
            }
        }
        return 'other';
    }

    // Phân tích cảm xúc
    async analyzeSentiment(text) {
        const positiveWords = ['tích cực', 'thành công', 'tăng trưởng', 'phát triển', 'cải thiện', 'đột phá'];
        const negativeWords = ['tiêu cực', 'thất bại', 'suy thoái', 'khủng hoảng', 'rủi ro', 'thách thức'];

        const textLower = text.toLowerCase();
        let score = 0;

        positiveWords.forEach(word => {
            if (textLower.includes(word)) score++;
        });

        negativeWords.forEach(word => {
            if (textLower.includes(word)) score--;
        });

        if (score > 0) return 'positive';
        if (score < 0) return 'negative';
        return 'neutral';
    }

    // Trích xuất từ khóa
    async extractKeywords(text) {
        const stopWords = ['và', 'của', 'trong', 'với', 'cho', 'từ', 'đến', 'này', 'đó', 'đây'];
        const words = text.toLowerCase().split(/\s+/);
        return words.filter(word => !stopWords.includes(word) && word.length > 2).slice(0, 5);
    }

    async analyzeNews(articles, options = {}) {
        const { international, vietnam } = articles;

        const prompt = `
Bạn là một chuyên gia tài chính và địa chính trị, với nhiều năm kinh nghiệm trong việc phân tích tác động của các sự kiện chính trị thế giới đến thị trường tài chính và cơ hội đầu tư. Hãy phân tích các tin tức sau và tạo báo cáo tập trung vào tác động thực tế đến thị trường và cơ hội đầu tư cho người trẻ Việt Nam.

QUAN TRỌNG: Báo cáo phải được định dạng bằng HTML. CHỈ sử dụng các thẻ HTML sau (đây là những thẻ duy nhất được Telegram hỗ trợ):
- <b> cho in đậm
- <i> cho in nghiêng
- <u> cho gạch chân
- <a href="URL"> cho liên kết
- <code> cho code
- <pre> cho block code

KHÔNG sử dụng bất kỳ thẻ HTML nào khác như <body>, <div>, <p>, <span>, <h1>, <h2>, v.v.
KHÔNG sử dụng markdown hoặc bất kỳ định dạng nào khác.

<b>TIN TỨC THẾ GIỚI</b>
${international.map(article => `
• <b>${article.title}</b>
  - Nguồn: ${article.source}
  - Phân loại: ${article.category}
  - Cảm xúc: ${article.sentiment}
  - Từ khóa: ${article.keywords.join(', ')}`).join('\n')}

<b>TIN TỨC VIỆT NAM</b>
${vietnam.map(article => `
• <b>${article.title}</b>
  - Nguồn: ${article.source}
  - Phân loại: ${article.category}
  - Cảm xúc: ${article.sentiment}
  - Từ khóa: ${article.keywords.join(', ')}`).join('\n')}

Hãy tạo báo cáo theo format sau (NHỚ chỉ sử dụng các thẻ HTML được Telegram hỗ trợ):

<b>BÁO CÁO PHÂN TÍCH TIN TỨC VÀ CƠ HỘI ĐẦU TƯ</b>

<b>1. PHÂN TÍCH CHÍNH TRỊ THẾ GIỚI</b>
• Các sự kiện chính và tác động:
  - Liệt kê 3-5 sự kiện quan trọng nhất ảnh hưởng đến thị trường
  - Phân tích tác động trực tiếp đến các thị trường tài chính
  - Dự đoán xu hướng trong 3-6 tháng tới

• Rủi ro địa chính trị:
  - Các điểm nóng có thể ảnh hưởng đến thị trường
  - Tác động đến chuỗi cung ứng toàn cầu
  - Ảnh hưởng đến các ngành công nghiệp chính

<b>2. PHÂN TÍCH THỊ TRƯỜNG TÀI CHÍNH</b>
• Diễn biến thị trường:
  - Xu hướng chính của các thị trường (chứng khoán, tiền tệ, hàng hóa)
  - Tác động đến các ngành kinh tế chính
  - Biến động giá cả và lãi suất

• Cơ hội đầu tư:
  - Các ngành/lĩnh vực tiềm năng
  - Chiến lược phân bổ tài sản
  - Các công cụ đầu tư phù hợp

<b>3. TÁC ĐỘNG VÀ CƠ HỘI CHO NGƯỜI TRẺ VIỆT NAM</b>
• Tác động đến thị trường Việt Nam:
  - Ảnh hưởng đến các ngành kinh tế chủ chốt
  - Tác động đến thị trường chứng khoán và bất động sản
  - Xu hướng việc làm và thu nhập

• Chiến lược đầu tư và bảo vệ tài sản:

<b>1. Đầu tư ngắn hạn (3-6 tháng):</b>
- Các kênh đầu tư an toàn
- Cách bảo vệ dòng tiền
- Chiến lược quản lý rủi ro

<b>2. Đầu tư dài hạn (1-3 năm):</b>
- Các ngành/lĩnh vực tiềm năng
- Chiến lược tích lũy tài sản
- Kế hoạch tài chính cá nhân

<b>3. Phát triển bản thân:</b>
- Kỹ năng cần trang bị
- Cơ hội nghề nghiệp mới
- Hướng phát triển sự nghiệp

Lưu ý quan trọng:
- BẮT BUỘC chỉ sử dụng các thẻ HTML được Telegram hỗ trợ (<b>, <i>, <u>, <a>, <code>, <pre>)
- KHÔNG sử dụng bất kỳ thẻ HTML nào khác
- KHÔNG sử dụng markdown hoặc định dạng khác
- Thêm emoji phù hợp để tăng tính trực quan
- Tập trung vào các cơ hội đầu tư thực tế và khả thi
- Đưa ra các con số và dữ liệu cụ thể khi có thể
- Sử dụng ngôn ngữ dễ hiểu, tránh thuật ngữ phức tạp
- Kết nối các sự kiện quốc tế với cơ hội đầu tư tại Việt Nam

#VitalActions #InvestmentInsights #MarketAnalysis`;

        try {
            const response = await aiService.getSimpleResponse(prompt, options);
            return response;
        } catch (error) {
            console.error('Error analyzing news:', error);
            throw error;
        }
    }
}

module.exports = new NewsService(); 