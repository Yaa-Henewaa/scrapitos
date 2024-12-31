"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const scrapper_1 = require("./scrapper");
const link_1 = require("./link");
const PORT = 3000;
const setCorsHeaders = (res) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
};
const sendJsonResponse = (res, statusCode, data) => {
    setCorsHeaders(res);
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
};
const requestHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.method === 'OPTIONS') {
        setCorsHeaders(res);
        res.writeHead(204);
        res.end();
        return;
    }
    let body = [];
    if (req.method === "POST" && req.url === "/scrape") {
        req
            .on("data", (chunk) => {
            body.push(chunk);
        })
            .on("end", () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                body = Buffer.concat(body).toString();
                if (!body) {
                    return sendJsonResponse(res, 400, {
                        error: "Request body cannot be empty.",
                    });
                }
                const parsedData = JSON.parse(body);
                console.log(parsedData);
                const category = link_1.LINKS.find((link) => link.name === parsedData.category);
                if (!category || !category.href) {
                    return sendJsonResponse(res, 400, {
                        error: "No url exists with the provided category.",
                    });
                }
                const products = yield (0, scrapper_1.scrapeAmazonCategory)(category.href);
                sendJsonResponse(res, 200, { products });
            }
            catch (error) {
                console.log("Error occurred:", error);
                sendJsonResponse(res, 500, {
                    error: "Failed to scrape category",
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }));
    }
    else {
        sendJsonResponse(res, 404, { error: "Route not found" });
    }
});
const server = (0, http_1.createServer)(requestHandler);
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
