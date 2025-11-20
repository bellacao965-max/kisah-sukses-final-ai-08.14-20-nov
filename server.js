import express from "express";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

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

    // If Groq SDK is available try calling it; otherwise return a safe fallback response.
    if (groq && groq.chat && groq.chat.completions && typeof groq.chat.completions.create === "function") {
      try {
        const completion = await groq.chat.completions.create({
          model: MODEL,
          messages: [{ role: "user", content: prompt }]
        });

        // Some SDKs return different shapes; attempt to read common paths safely
        const reply =
          (completion && completion.choices && completion.choices[0] && (completion.choices[0].message?.content || completion.choices[0].text)) ||
          completion?.output?.[0]?.content?.[0]?.text ||
          JSON.stringify(completion);

        return res.json({ reply });
      } catch (aiErr) {
        console.error("AI provider error:", aiErr && aiErr.message ? aiErr.message : aiErr);
        // continue to fallback
      }
    }

    // Fallback simple deterministic reply so app remains functional
    const fallbackReply = `(fallback) Received your prompt: "${String(prompt).slice(0,200)}".\n\nThis server is running without a working Groq AI connection — to enable full AI responses, set GROQ_API_KEY and MODEL in .env and restart.`;
    return res.json({ reply: fallbackReply });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error", detail: String(err) });
  }
});

// Expose runtime config (safe values) to the frontend
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

app.use(express.static("./"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server RUNNING on port " + PORT));
