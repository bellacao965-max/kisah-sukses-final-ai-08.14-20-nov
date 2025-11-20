import express from "express";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files correctly
app.use(express.static(__dirname));

// ---- AI API ----
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const MODEL = process.env.MODEL || "llama3-70b-8192";

let groq = null;
if (GROQ_API_KEY) {
  groq = new Groq({ apiKey: GROQ_API_KEY });
}

app.post("/api/ai", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    if (groq) {
      const completion = await groq.chat.completions.create({
        model: MODEL,
        messages: [{ role: "user", content: prompt }]
      });

      const reply =
        completion?.choices?.[0]?.message?.content ||
        completion?.choices?.[0]?.text ||
        "AI response error";

      return res.json({ reply });
    }

    return res.json({
      reply: "(fallback) Groq API KEY is missing"
    });
  } catch (e) {
    res.json({ reply: "(fallback) AI error: " + e.message });
  }
});

// ---- CONFIG API ----
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

// ---- FALLBACK: return index.html ALWAYS ----
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
