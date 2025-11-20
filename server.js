import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch";
import Groq from "groq-sdk";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Initialize Groq client if API key provided
let groq = null;
if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== "") {
  try {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    console.log("Groq client initialized");
  } catch (err) {
    console.warn("Groq init error:", err);
    groq = null;
  }
} else {
  console.log("No GROQ_API_KEY provided; AI endpoint will return fallback message.");
}

// Config endpoint
app.get("/api/config", (req, res) => {
  res.json({
    appName: process.env.APP_NAME || "KisahSuksesPro",
    youtubeVideoId: process.env.YOUTUBE_VIDEO_ID || "",
    social: {
      twitter: process.env.SOCIAL_TWITTER || "",
      instagram: process.env.SOCIAL_INSTAGRAM || "",
      facebook: process.env.SOCIAL_FACEBOOK || "",
      youtubeChannel: process.env.SOCIAL_YOUTUBE || ""
    },
    features: {
      ai: !!process.env.GROQ_API_KEY,
      weather: !!process.env.OPENWEATHER_API_KEY
    }
  });
});

// Chat endpoint using Groq
app.post("/api/chat", async (req, res) => {
  const message = req.body.message || "";
  if (!groq) {
    return res.json({ reply: "AI belum aktif. GROQ_API_KEY belum diset oleh administrator." });
  }
  try {
    const chat = await groq.chat.completions.create({
      model: process.env.MODEL || "llama3-70b-8192",
      messages: [{ role: "user", content: message }]
    });
    const reply = chat?.choices?.[0]?.message?.content || "Tidak ada balasan.";
    res.json({ reply });
  } catch (err) {
    console.error("Groq chat error:", err);
    res.status(500).json({ error: String(err) });
  }
});

// Weather endpoint (OpenWeatherMap)
app.get("/api/weather", async (req, res) => {
  const city = req.query.city || "Jakarta";
  const key = process.env.OPENWEATHER_API_KEY || "";
  if (!key) return res.status(400).json({ error: "OPENWEATHER_API_KEY not set" });
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${key}`;
    const r = await fetch(url);
    const j = await r.json();
    res.json(j);
  } catch (err) {
    console.error("Weather fetch error:", err);
    res.status(500).json({ error: String(err) });
  }
});

// Quotes endpoint
const quotes = [
  "Sukses bukan kunci kebahagiaan — kebahagiaan adalah kunci sukses.",
  "Kerja keras hari ini, cerita sukses esok hari.",
  "Jangan takut gagal; takutlah jika tidak pernah mencoba.",
  "Mulailah dari yang kecil, konsistenlah, dan lihat perubahan."
];
app.get("/api/quote", (req, res) => {
  const q = quotes[Math.floor(Math.random() * quotes.length)];
  res.json({ quote: q });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server RUNNING on port ${PORT}`));
