"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeAmazonCategory = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const fs = __importStar(require("fs"));
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // Delay in milliseconds
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const scrapeAmazonCategory = (categoryUrl) => __awaiter(void 0, void 0, void 0, function* () {
    let attempt = 0;
    const products = [];
    while (attempt < MAX_RETRIES) {
        try {
            const response = yield axios_1.default.get(`https://www.amazon.com${categoryUrl}`, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                    "Accept-Language": "en-US,en;q=0.9",
                    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                    Connection: "keep-alive",
                    "Upgrade-Insecure-Requests": "1",
                },
            });
            const html = response.data;
            const $ = cheerio.load(html);
            // const products: Product[] = [];
            $(".s-main-slot .s-result-item").each((_, element) => {
                const name = $(element).find("h2 .a-link-normal").text().trim();
                const priceWhole = $(element).find(".a-price-whole").text().trim();
                const priceFraction = $(element)
                    .find(".a-price-fraction")
                    .text()
                    .trim();
                const price = priceWhole ? `$${priceWhole}.${priceFraction}` : "N/A";
                const rating = $(element).find(".a-icon-alt").text().trim();
                const imageUrl = $(element).find(".s-image").attr("src");
                //   const url = "https://www.amazon.com" + $(element).find('h2 a').attr('href');
                if (name) {
                    products.push({
                        name,
                        price,
                        rating,
                        imageUrl,
                    });
                }
            });
            fs.writeFileSync("scrapedProducts.json", JSON.stringify(products, null, 2), "utf-8");
            return products;
        }
        catch (error) {
            const errorMessage = error.message;
            console.error(`Error on attempt ${attempt + 1}:`, errorMessage);
            attempt++;
            if (attempt >= MAX_RETRIES) {
                yield delay(RETRY_DELAY);
                throw new Error("Max retries reached. Unable to scrape the category.");
            }
        }
    }
    return undefined;
});
exports.scrapeAmazonCategory = scrapeAmazonCategory;
