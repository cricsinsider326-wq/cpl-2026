const http = require("http");
const fs = require("fs");
const path = require("path");

const workspaceRoot = process.cwd();
const distRoot = path.join(workspaceRoot, "dist");
const root = fs.existsSync(distRoot) ? distRoot : workspaceRoot;
const port = Number(process.env.PORT || 8080);
const host = "127.0.0.1";
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ics": "text/calendar; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

http
  .createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, `http://${host}`).pathname);
    const requested = pathname === "/" ? "index.html" : pathname.slice(1);
    let file = path.resolve(root, requested);

    if (!file.startsWith(root)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      file = path.join(file, "index.html");
    }

    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      res.writeHead(200, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream"
      });
      res.end(data);
    });
  })
  .listen(port, host, () => {
    console.log(`CPL 2026 preview running at http://${host}:${port}/`);
  });
