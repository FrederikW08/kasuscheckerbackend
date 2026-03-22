import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post("/analyze", async (req, res) => {
  const text = req.body.text;
  if (!text) return res.status(400).json({ error: "Ingen tekst sendt" });

  const prompt = `Angiv kasus for hvert ord i denne sætning (tysk, latin eller dansk) på dansk. Giv output som JSON: [{"word": "ORD", "case": "KASUS"}].\nSætning: ${text}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0
      })
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    res.json({ analysis: JSON.parse(content) });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Fejl fra OpenAI API" });
  }
});

app.get("/", (req, res) => res.send("Kasus API kører!"));

app.listen(process.env.PORT || 10000, () => console.log("Server kører"));
