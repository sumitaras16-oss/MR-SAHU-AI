import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);
const apiKey = process.env.OPENAI_API_KEY;
const client = apiKey ? new OpenAI({ apiKey }) : null;
app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "32kb" }));
app.use("/api/", rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false }));
app.use(express.static(__dirname));

app.get("/api/health", (_req, res) => res.json({ ok: true, aiConfigured: Boolean(client) }));
app.post("/api/chat", async (req, res) => {
  if (!client) return res.status(503).json({ error: "AI API key is not configured on the server yet. Ask a trusted adult to help set up the API billing and secret key." });
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!message) return res.status(400).json({ error: "Please enter a message." });
  if (message.length > 6000) return res.status(413).json({ error: "Message is too long. Please keep it under 6,000 characters." });
  const history = Array.isArray(req.body?.history) ? req.body.history.slice(-12) : [];
  const safeHistory = history.filter(x => x && ["user", "assistant"].includes(x.role) && typeof x.content === "string")
    .map(x => ({ role: x.role, content: x.content.slice(0, 6000) }));
  const instructions = "You are MR SAHU AI, a helpful, safe, friendly assistant. Reply in the language used by the user (Odia, Hindi, or English). Explain school topics clearly and age-appropriately. Do not claim to be ChatGPT; you are MR SAHU AI, created by Smruti Ranjan Sahu.";
  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.5",
      instructions,
      input: [...safeHistory, { role: "user", content: message }],
      max_output_tokens: 1200,
      store: false
    });
    res.json({ reply: response.output_text || "I couldn't create a text response. Please try again." });
  } catch (error) {
    console.error("AI request failed:", error?.status || error?.message || "unknown error");
    res.status(502).json({ error: "The AI service could not complete that request. Please try again later." });
  }
});
app.listen(port, () => console.log(`MR SAHU AI server running on http://localhost:${port}`));
