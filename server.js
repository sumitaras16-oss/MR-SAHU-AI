import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "32kb" }));

app.use("/api/", rateLimit({
  windowMs: 60000,
  limit: 10
}));

app.use(express.static(__dirname));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, aiConfigured: false, mode: "demo" });
});

app.post("/api/chat", (req, res) => {
  const message = typeof req.body?.message === "string"
    ? req.body.message.trim()
    : "";

  if (!message) {
    return res.status(400).json({ error: "Please enter a message." });
  }

  if (message.length > 6000) {
    return res.status(413).json({ error: "Message is too long." });
  }

  const text = message.toLowerCase();
  let reply;

  if (/^(hi|hello|hey|ନମସ୍କାର)/i.test(text)) {
    reply = "ନମସ୍କାର! Welcome to MR SAHU AI. 😊";
  } else if (text.includes("who are you")) {
    reply = "I am MR SAHU AI, a demo assistant created by Smruti Ranjan Sahu.";
  } else if (text.includes("odia") || text.includes("ଓଡ଼ିଆ")) {
    reply = "ନମସ୍କାର! ମୁଁ MR SAHU AI Demo Assistant।";
  } else if (text.includes("help")) {
    reply = "I am in Free Demo Mode. Real AI features are not connected yet.";
  } else if (text.includes("thank")) {
    reply = "You're welcome! Thank you for using MR SAHU AI. ❤️";
  } else {
    reply = "Thanks for your message! 😊 MR SAHU AI is currently running in Free Demo Mode. Real AI connection is not available yet.";
  }

  res.json({ reply });
});

app.listen(port, () => {
  console.log("MR SAHU AI Demo server running on port " + port);
});
