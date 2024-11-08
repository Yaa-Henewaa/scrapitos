import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";

interface Product {
  name: string;
  price: string;
  rating?: string;
  imageUrl?: string;
  stars?: string;
}
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // Delay in milliseconds

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const scrapeAmazonCategory = async (
  categoryUrl: string
): Promise<Product[] | undefined> => {
  let attempt = 0;
  const products: Product[] = [];
  while (attempt < MAX_RETRIES) {
    try {
      const response = await axios.get(`https://www.amazon.com${categoryUrl}`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
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

      fs.writeFileSync(
        "scrapedProducts.json",
        JSON.stringify(products, null, 2),
        "utf-8"
      );
      return products;
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(`Error on attempt ${attempt + 1}:`, errorMessage);
      attempt++;

      if (attempt >= MAX_RETRIES) {
        await delay(RETRY_DELAY);
        throw new Error("Max retries reached. Unable to scrape the category.");
      }

      
    }
  }
  return undefined;
};
