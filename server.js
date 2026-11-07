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
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [], instructions = "" } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ reply: "ଦୟାକରି ଏକ ମେସେଜ୍ ଲେଖନ୍ତୁ।" });
    }

    if (!ACCOUNT_ID || !API_TOKEN) {
      return res.status(503).json({
        reply: "Real AI ଏପର୍ଯ୍ୟନ୍ତ configure ହୋଇନାହିଁ। Admin setup ଆବଶ୍ୟକ।"
      });
    }

    const messages = [
      {
        role: "system",
        content: instructions || "You are MR SAHU AI, a helpful assistant. Reply in the user's language."
      }
    ];

    if (Array.isArray(history)) {
      for (const item of history.slice(-12)) {
        if (
          item &&
          ["user", "assistant"].includes(item.role) &&
          typeof item.content === "string"
        ) {
          messages.push({
            role: item.role,
            content: item.content.slice(0, 4000)
          });
        }
      }
    }

    messages.push({
      role: "user",
      content: message.slice(0, 4000)
    });

    const endpoint =
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${MODEL}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ messages })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error("Cloudflare AI error:", data);
      return res.status(502).json({
        reply: "AI ସହିତ connection ହୋଇପାରିଲା ନାହିଁ। ପରେ ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।"
      });
    }

    const reply = data.result?.response;

    if (!reply) {
      return res.status(502).json({
        reply: "AI ଠାରୁ ଠିକ୍ ଉତ୍ତର ମିଳିଲା ନାହିଁ।"
      });
    }

    return res.json({ reply });

  } catch (error) {
    console.error("Chat error:", error);
    return res.status(500).json({
      reply: "Serverରେ ଏକ ତ୍ରୁଟି ହୋଇଛି। ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।"
    });
  }
});app.listen(port, () => {
  console.log(`MR SAHU AI server running on port ${port}`);
});
