const express = require("express");
const { execFile } = require("child_process");
const net = require("net");
const rateLimit = require("express-rate-limit");

const app = express();

const helmet = require("helmet");

const pingLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

app.disable("x-powered-by");

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: true,
  })
);

app.use((req, res, next) => {
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  res.setHeader(
    "Cache-Control",
    "no-store"
  );

  next();
});

app.get("/", (req, res) => {
  res.send(`
    <!doctype html>
    <html>
      <head>
        <title>AI Security Lab</title>
      </head>
      <body>
        <h1>AI Security Lab</h1>

        <form action="/ping" method="GET">
          <label for="host">Host:</label>
          <input id="host" name="host" value="127.0.0.1">
          <button type="submit">Ping</button>
        </form>
      </body>
    </html>
  `);
});


app.get("/ping", pingLimiter, (req, res) => {
  const host = req.query.host;

  if (!host || net.isIP(host) === 0) {
    return res.status(400).send("A valid IPv4 or IPv6 address is required.");
  }

  execFile(
    "ping",
    ["-c", "1", host],
    { timeout: 3000 },
    (error, stdout, stderr) => {
      if (error) {
        return res.status(500).type("text/plain").send(stderr);
      }

      res.type("text/plain").send(stdout);
    }
  );
});

app.listen(3000, "0.0.0.0", () => {
console.log("App running on port 3000");
});
