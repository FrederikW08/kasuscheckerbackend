import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Stop deployment if API key missing
if (!OPENAI_API_KEY) {
  console.error("ERROR: OPENAI_API_KEY not set in environment variables!");
  process.exit(1);
}

// POST /analyze
app.post("/analyze", async (req, res) => {
  const text = req.body.text;
  if (!text) return res.status(400).json({ error: "Ingen tekst sendt" });

  const prompt = `Giv kun JSON uden forklaringer. Format:
[{"word": "ORD", "case": "KASUS"}]

Angiv kasus for hvert ord i sætningen (tysk, latin eller dansk) på dansk.
Sætning: ${text}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0
      })
    });

    const data = await response.json();

    // Debug: log OpenAI full response
    console.log("OpenAI full response:", data);

    // Handle missing or invalid output
    if (!data.choices || !data.choices[0].message || !data.choices[0].message.content) {
      return res.status(500).json({ error: "Fejl fra OpenAI API" });
    }

    let analysis;
    try {
      analysis = JSON.parse(data.choices[0].message.content);
    } catch (err) {
      console.log("JSON parse error:", err);
      console.log("Raw GPT output:", data.choices[0].message.content);
      return res.status(500).json({ error: "Kunne ikke parse OpenAI output" });
    }

    res.json({ analysis });

  } catch (err) {
    console.log("Fetch error:", err);
    res.status(500).json({ error: "Fejl fra OpenAI API" });
  }
});

// Test route
app.get("/", (req, res) => res.send("Kasus API kører!"));

app.listen(process.env.PORT || 10000, () => console.log("Server kører"));
