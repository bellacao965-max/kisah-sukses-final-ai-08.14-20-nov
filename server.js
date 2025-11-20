import express from "express";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend from root
app.use(express.static(process.cwd()));

app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/index.html");
});

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const MODEL = process.env.MODEL || "llama3-70b-8192";

let groq = null;
if (GROQ_API_KEY) {
  try {
    groq = new Groq({ apiKey: GROQ_API_KEY });
  } catch (e) {
    console.warn("Could not initialize Groq SDK:", e.message);
    groq = null;
  }
}

app.post("/api/ai", async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "missing prompt" });

    if (groq && groq.chat?.completions?.create) {
      try {
        const completion = await groq.chat.completions.create({
          model: MODEL,
          messages: [{ role: "user", content: prompt }]
        });

        const reply =
          completion?.choices?.[0]?.message?.content ||
          completion?.choices?.[0]?.text ||
          "(no reply from model)";

        return res.json({ reply });
      } catch (aiErr) {
        console.error("AI provider error:", aiErr);
      }
    }

    const fallbackReply = `(fallback) Prompt diterima: "${String(prompt).slice(0,200)}". Set GROQ_API_KEY untuk mengaktifkan AI.`;
    return res.json({ reply: fallbackReply });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error", detail: String(err) });
  }
});

// CONFIG
app.get("/config", (req, res) => {
  res.json({
    youtubeVideoId: process.env.YOUTUBE_VIDEO_ID || "",
    social: {
      twitter: process.env.SOCIAL_TWITTER || "",
      instagram: process.env.SOCIAL_INSTAGRAM || "",
      facebook: process.env.SOCIAL_FACEBOOK || "",
      youtubeChannel: process.env.SOCIAL_YOUTUBE || ""
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server RUNNING on port " + PORT));
