const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Import our Countertop model
const Countertop = require('../models/Countertop');

class CosentinoScraper {
    constructor() {
        this.baseUrl = 'https://www.cosentino.com/usa/colors/';
        this.browser = null;
        this.page = null;
        this.scrapedData = [];
    }

    async init() {
        console.log('🚀 Starting Cosentino scraper...');
        
        this.browser = await puppeteer.launch({
            headless: false, // Set to true in production
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });
        
        this.page = await this.browser.newPage();
        
        // Set user agent to avoid blocking
        await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Set viewport
        await this.page.setViewport({ width: 1920, height: 1080 });
        
        console.log('✅ Browser initialized');
    }

    async scrapeMainPage() {
        try {
            console.log('📄 Loading main colors page...');
            await this.page.goto(this.baseUrl, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });

            // Wait for content to load
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Look for material categories or product links
            const materialLinks = await this.page.evaluate(() => {
                const links = [];
                
                // Try different selectors for Cosentino's structure
                const possibleSelectors = [
                    'a[href*="silestone"]',
                    'a[href*="dekton"]', 
                    'a[href*="sensa"]',
                    '.product-card a',
                    '.material-link',
                    '[data-material]',
                    '.color-item a',
                    '.product-item a'
                ];
                
                possibleSelectors.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => {
                        const href = el.getAttribute('href');
                        const text = el.textContent?.trim();
                        if (href && text) {
                            links.push({
                                url: href.startsWith('http') ? href : `https://www.cosentino.com${href}`,
                                title: text,
                                selector: selector
                            });
                        }
                    });
                });
                
                return links;
            });

            console.log(`🔗 Found ${materialLinks.length} potential product links`);

            // Also try to get any product cards or color swatches directly from main page
            const mainPageProducts = await this.extractProductsFromPage();
            
            return { materialLinks, mainPageProducts };
            
        } catch (error) {
            console.error('❌ Error scraping main page:', error.message);
            return { materialLinks: [], mainPageProducts: [] };
        }
    }

    async extractProductsFromPage() {
        try {
            const products = await this.page.evaluate(() => {
                const items = [];
                
                // Multiple selectors to try for different page layouts
                const cardSelectors = [
                    '.color-card',
                    '.product-card', 
                    '.material-card',
                    '.collection-item',
                    '[data-color]',
                    '.slab-item'
                ];
                
                cardSelectors.forEach(selector => {
                    const cards = document.querySelectorAll(selector);
                    
                    cards.forEach(card => {
                        try {
                            const name = card.querySelector('h3, h4, .title, .name, .color-name')?.textContent?.trim();
                            const material = card.querySelector('.material, .collection')?.textContent?.trim();
                            const description = card.querySelector('.description, p')?.textContent?.trim();
                            
                            // Try to find images
                            const imgElement = card.querySelector('img');
                            const imageUrl = imgElement ? 
                                (imgElement.src || imgElement.getAttribute('data-src') || imgElement.getAttribute('data-lazy')) 
                                : null;
                            
                            // Try to find detail page link
                            const linkElement = card.querySelector('a') || card.closest('a');
                            const detailUrl = linkElement?.href;
                            
                            if (name && name.length > 2) {
                                items.push({
                                    name,
                                    material: material || 'Unknown',
                                    description: description || '',
                                    imageUrl: imageUrl || null,
                                    detailUrl: detailUrl || null,
                                    source: 'cosentino',
                                    scrapedAt: new Date().toISOString()
                                });
                            }
                        } catch (err) {
                            // Skip individual card errors
                        }
                    });
                });
                
                return items;
            });
            
            console.log(`📦 Extracted ${products.length} products from current page`);
            return products;
            
        } catch (error) {
            console.error('❌ Error extracting products:', error.message);
            return [];
        }
    }

    async scrapeDetailPages(links, maxPages = 5) {
        const allProducts = [];
        const limitedLinks = links.slice(0, maxPages);
        
        for (const link of limitedLinks) {
            try {
                console.log(`🔍 Scraping: ${link.title} - ${link.url}`);
                
                await this.page.goto(link.url, { 
                    waitUntil: 'networkidle2',
                    timeout: 30000 
                });
                
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const pageProducts = await this.extractProductsFromPage();
                
                // Add material type from URL/title
                const materialType = this.determineMaterialType(link.url, link.title);
                pageProducts.forEach(product => {
                    product.material = materialType || product.material;
                    product.sourceUrl = link.url;
                });
                
                allProducts.push(...pageProducts);
                
                // Small delay between requests
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`❌ Error scraping ${link.url}:`, error.message);
                continue;
            }
        }
        
        return allProducts;
    }

    determineMaterialType(url, title) {
        const urlLower = url.toLowerCase();
        const titleLower = title.toLowerCase();
        
        if (urlLower.includes('silestone') || titleLower.includes('silestone')) {
            return 'quartz';
        } else if (urlLower.includes('dekton') || titleLower.includes('dekton')) {
            return 'dekton';
        } else if (urlLower.includes('sensa') || titleLower.includes('sensa')) {
            return 'granite';
        } else if (urlLower.includes('marble') || titleLower.includes('marble')) {
            return 'marble';
        } else if (urlLower.includes('granite') || titleLower.includes('granite')) {
            return 'granite';
        } else if (urlLower.includes('quartz') || titleLower.includes('quartz')) {
            return 'quartz';
        }
        
        return null;
    }

    async saveToMongoDB(products) {
        console.log('💾 Saving products to MongoDB...');
        
        let savedCount = 0;
        let skippedCount = 0;
        
        for (const productData of products) {
            try {
                // Check if product already exists
                const existingProduct = await Countertop.findOne({ 
                    name: productData.name,
                    'brand.name': 'Cosentino'
                });
                
                if (existingProduct) {
                    skippedCount++;
                    continue;
                }
                
                // Create new countertop entry
                const countertopData = {
                    name: productData.name,
                    slug: this.createSlug(productData.name),
                    description: productData.description || `Beautiful ${productData.material} from Cosentino's collection`,
                    material: this.normalizeMaterial(productData.material),
                    brand: {
                        name: 'Cosentino',
                        website: 'https://www.cosentino.com'
                    },
                    images: productData.imageUrl ? [{
                        url: productData.imageUrl,
                        alt: `${productData.name} countertop`,
                        type: 'hero',
                        isPrimary: true,
                        uploadedAt: new Date()
                    }] : [],
                    status: 'published',
                    featured: false,
                    tags: ['cosentino', productData.material.toLowerCase()],
                    pricing: {
                        priceRange: {
                            min: this.getEstimatedPrice(productData.material).min,
                            max: this.getEstimatedPrice(productData.material).max,
                            unit: 'sq_ft'
                        },
                        lastUpdated: new Date()
                    },
                    specifications: {
                        thickness: ['2cm', '3cm'],
                        finish: ['polished'],
                        edgeProfiles: ['straight', 'beveled', 'bullnose']
                    },
                    seo: {
                        keywords: [productData.name, productData.material, 'cosentino', 'countertop']
                    }
                };
                
                const newCountertop = new Countertop(countertopData);
                await newCountertop.save();
                
                savedCount++;
                console.log(`✅ Saved: ${productData.name}`);
                
            } catch (error) {
                console.error(`❌ Error saving ${productData.name}:`, error.message);
                skippedCount++;
            }
        }
        
        console.log(`💾 Save complete: ${savedCount} saved, ${skippedCount} skipped`);
        return { saved: savedCount, skipped: skippedCount };
    }

    createSlug(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    normalizeMaterial(material) {
        const materialLower = material.toLowerCase();
        
        if (materialLower.includes('quartz') || materialLower.includes('silestone')) {
            return 'quartz';
        } else if (materialLower.includes('granite') || materialLower.includes('sensa')) {
            return 'granite';
        } else if (materialLower.includes('marble')) {
            return 'marble';
        } else if (materialLower.includes('dekton')) {
            return 'dekton';
        } else if (materialLower.includes('quartzite')) {
            return 'quartzite';
        }
        
        return 'quartz'; // Default fallback
    }

    getEstimatedPrice(material) {
        const prices = {
            'quartz': { min: 60, max: 120 },
            'granite': { min: 40, max: 80 },
            'marble': { min: 70, max: 150 },
            'dekton': { min: 80, max: 140 },
            'quartzite': { min: 60, max: 100 }
        };
        
        return prices[this.normalizeMaterial(material)] || { min: 50, max: 100 };
    }

    async saveToJSON(products, filename = 'cosentino-products.json') {
        const outputPath = path.join(__dirname, '..', 'data', filename);
        
        // Ensure data directory exists
        const dataDir = path.dirname(outputPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        const output = {
            scrapedAt: new Date().toISOString(),
            source: 'cosentino.com',
            totalProducts: products.length,
            products: products
        };
        
        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
        console.log(`💾 Saved ${products.length} products to ${outputPath}`);
    }

    async run() {
        try {
            await this.init();
            
            // Step 1: Scrape main page
            const { materialLinks, mainPageProducts } = await this.scrapeMainPage();
            this.scrapedData.push(...mainPageProducts);
            
            // Step 2: Scrape detail pages if we found links
            if (materialLinks.length > 0) {
                console.log(`🔗 Found ${materialLinks.length} material links, scraping details...`);
                const detailProducts = await this.scrapeDetailPages(materialLinks, 10);
                this.scrapedData.push(...detailProducts);
            }
            
            // Remove duplicates
            const uniqueProducts = this.removeDuplicates(this.scrapedData);
            
            console.log(`📊 Scraping complete! Found ${uniqueProducts.length} unique products`);
            
            // Save results
            await this.saveToJSON(uniqueProducts);
            
            // Save to MongoDB if connected
            if (mongoose.connection.readyState === 1) {
                await this.saveToMongoDB(uniqueProducts);
            } else {
                console.log('⚠️  MongoDB not connected, skipping database save');
            }
            
            return uniqueProducts;
            
        } catch (error) {
            console.error('❌ Scraping failed:', error);
            throw error;
        } finally {
            if (this.browser) {
                await this.browser.close();
                console.log('🔒 Browser closed');
            }
        }
    }

    removeDuplicates(products) {
        const seen = new Set();
        return products.filter(product => {
            const key = `${product.name}-${product.material}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }
}

// CLI usage
if (require.main === module) {
    const scraper = new CosentinoScraper();
    
    // Connect to MongoDB
    require('dotenv').config();
    mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/newcountertops')
        .then(() => {
            console.log('📊 Connected to MongoDB');
            return scraper.run();
        })
        .then(products => {
            console.log(`🎉 Successfully scraped ${products.length} products`);
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Scraper failed:', error);
            process.exit(1);
        });
}

module.exports = CosentinoScraper;
