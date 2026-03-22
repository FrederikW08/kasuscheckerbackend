import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());         // allow requests from any domain
app.use(express.json());  // parse JSON body

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY not set in environment variables!");
    process.exit(1);
}

app.post("/analyze", async (req, res) => {
    const text = req.body.text;
    if (!text) return res.status(400).json({ error: "Ingen tekst sendt" });

    // Strict prompt to force JSON output
    const prompt = `Giv kun JSON som output uden ekstra tekst. Format:
[{"word": "ORD", "case": "KASUS"}]

Angiv kasus for hvert ord i denne sætning (tysk, latin eller dansk) på dansk.
Sætning: ${text}`;

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

        if (!data.choices || !data.choices[0].message || !data.choices[0].message.content) {
            console.log("OpenAI response invalid:", data);
            return res.status(500).json({ error: "Fejl fra OpenAI API" });
        }

        const content = data.choices[0].message.content;

        // Log raw output for debugging
        console.log("OpenAI raw response:", content);

        let analysis;
        try {
            analysis = JSON.parse(content);
        } catch (err) {
            console.log("JSON parse error:", err);
            console.log("Raw content:", content);
            return res.status(500).json({ error: "Kunne ikke parse OpenAI output" });
        }

        res.json({ analysis });

    } catch (err) {
        console.log("OpenAI fetch error:", err);
        res.status(500).json({ error: "Fejl fra OpenAI API" });
    }
});

// simple test route
app.get("/", (req, res) => res.send("Kasus API kører!"));

app.listen(process.env.PORT || 10000, () => console.log("Server kører"));
