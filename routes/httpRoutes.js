
const fs = require("fs");
const path = require("path");

const publicDirectory = path.resolve(__dirname, "../public");

const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon"
};

function sendText(res, statusCode, message) {
    res.writeHead(statusCode, {
        "Content-Type": "text/plain; charset=utf-8"
    });
    res.end(message);
}

function handleHttpRequest(req, res) {
    let pathname;

    try {
        pathname = new URL(
            req.url,
            "http://localhost"
        ).pathname;

        pathname = decodeURIComponent(pathname);
    } catch {
        sendText(res, 400, "Bad Request");
        return;
    }

    if (pathname === "/health") {
        sendText(res, 200, "OK");
        return;
    }

    const relativePath =
        pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");

    const filePath = path.resolve(
        publicDirectory,
        relativePath
    );

    if (
        filePath !== publicDirectory &&
        !filePath.startsWith(publicDirectory + path.sep)
    ) {
        sendText(res, 403, "Forbidden");
        return;
    }

    fs.readFile(filePath, (error, data) => {
        if (error) {
            if (!res.headersSent) {
                sendText(res, 404, "Not Found");
            }
            return;
        }

        res.writeHead(200, {
            "Content-Type":
                contentTypes[path.extname(filePath).toLowerCase()] ||
                "application/octet-stream",
            "Cache-Control": "no-cache",
            "X-Content-Type-Options": "nosniff"
        });

        res.end(data);
    });
}

module.exports = {
    handleHttpRequest
};
