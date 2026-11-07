import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const MODEL = process.env.CLOUDFLARE_AI_MODEL || "@cf/meta/llama-3.1-8b-instruct";

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "32kb" }));

app.use("/api/", rateLimit({
  windowMs: 60000,
  limit: 10
}));

app.use(express.static(__dirname));

app.get("/api/health", (_req, res) => {
  const configured = Boolean(ACCOUNT_ID && API_TOKEN);

  res.json({
    ok: true,
    aiConfigured: configured,
    mode: configured ? "ai" : "setup-required"
  });
});
