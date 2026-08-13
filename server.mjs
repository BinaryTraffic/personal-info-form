#!/usr/bin/env node
/**
 * Personal Info Form — 静的配信サーバー
 * Usage: npm start
 * Env: PORT=3080 npm start
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = __dirname;
const port = Number(process.env.PORT || 3080);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".map": "application/json",
};

function send(res, status, body, type) {
  res.writeHead(status, {
    "Content-Type": type || "text/plain; charset=utf-8",
    "Cache-Control": "no-cache",
  });
  res.end(body);
}

function safeJoin(base, reqPath) {
  const decoded = decodeURIComponent(reqPath.split("?")[0]);
  const cleaned = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const full = path.join(base, cleaned);
  if (!full.startsWith(base)) return null;
  return full;
}

const server = http.createServer((req, res) => {
  let urlPath = req.url || "/";
  if (urlPath === "/") urlPath = "/public/index.html";

  const filePath = safeJoin(root, urlPath);
  if (!filePath) return send(res, 403, "Forbidden");

  fs.stat(filePath, (err, stat) => {
    if (err) return send(res, 404, "Not Found");
    const finalPath = stat.isDirectory()
      ? path.join(filePath, "index.html")
      : filePath;
    fs.readFile(finalPath, (readErr, data) => {
      if (readErr) return send(res, 404, "Not Found");
      const ext = path.extname(finalPath).toLowerCase();
      send(res, 200, data, MIME[ext] || "application/octet-stream");
    });
  });
});

server.listen(port, () => {
  console.log(`Personal Info Form running at http://localhost:${port}/`);
  console.log(`Web root: ${root}`);
});
