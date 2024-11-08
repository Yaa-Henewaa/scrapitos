import { createServer, IncomingMessage, ServerResponse } from "http";
import { scrapeAmazonCategory } from "./scrapper";
import { LINKS } from "./link";

const PORT = 3000;


const setCorsHeaders = (res: ServerResponse) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
};

const sendJsonResponse = (
    res: ServerResponse,
    statusCode: number,
    data: any
) => {
    setCorsHeaders(res); 
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
};

const requestHandler = async (req: IncomingMessage, res: ServerResponse) => {
    
    if (req.method === 'OPTIONS') {
        setCorsHeaders(res);
        res.writeHead(200);
        res.end();
        return;
    }

    let body: any = [];
    if (req.method === "POST" && req.url === "/scrape") {
        req
            .on("data", (chunk: Buffer) => {
                body.push(chunk);
            })
            .on("end", async () => {
                try {
                    body = Buffer.concat(body).toString();
                    if (!body) {
                        return sendJsonResponse(res, 400, {
                            error: "Request body cannot be empty.",
                        });
                    }
                    const parsedData = JSON.parse(body);
                    console.log(parsedData)

                    const category = LINKS.find(
                        (link) => link.name === parsedData.category
                    );
                    if (!category || !category.href) {
                        return sendJsonResponse(res, 400, {
                            error: "No url exists with the provided category.",
                        });
                    }

                    const products = await scrapeAmazonCategory(category.href);
                    sendJsonResponse(res, 200, { products });
                } catch (error) {
                    console.log("Error occurred:", error);
                    sendJsonResponse(res, 500, { 
                        error: "Failed to scrape category",
                        message: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            });
    } else {
        sendJsonResponse(res, 404, { error: "Route not found" });
    }
};

const server = createServer(requestHandler);

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});