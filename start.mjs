/**
 * POLIS — AI Governance on the 0G Ecosystem
 * Production Node.js server entry point.
 * Wraps the TanStack Start fetch handler in a native http server.
 */
import http from "node:http";
import handler from "./dist/server/server.js";

const PORT = parseInt(process.env.PORT ?? "3000", 10);
const HOST = "0.0.0.0";

const server = http.createServer(async (req, res) => {
  try {
    const host = req.headers.host ?? "localhost";
    const url = new URL(req.url, `http://${host}`);

    const headers = new Headers();
    for (const [key, val] of Object.entries(req.headers)) {
      if (val == null) continue;
      if (Array.isArray(val)) val.forEach((v) => headers.append(key, v));
      else headers.set(key, val);
    }

    let body;
    if (req.method !== "GET" && req.method !== "HEAD") {
      body = await new Promise((resolve, reject) => {
        const chunks = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", () => resolve(Buffer.concat(chunks)));
        req.on("error", reject);
      });
    }

    const request = new Request(url.toString(), {
      method: req.method,
      headers,
      body: body?.length ? body : undefined,
      duplex: "half",
    });

    const response = await handler.fetch(request, {}, {});

    res.statusCode = response.status;
    for (const [key, val] of response.headers.entries()) {
      res.setHeader(key, val);
    }

    const buffer = await response.arrayBuffer();
    res.end(Buffer.from(buffer));
  } catch (err) {
    console.error("Server error:", err);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
});

server.listen(PORT, HOST, () => {
  console.log(`POLIS | AI Governance on 0G | http://${HOST}:${PORT}`);
});
