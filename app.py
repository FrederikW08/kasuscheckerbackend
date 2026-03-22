from flask import Flask, request, jsonify
from flask_cors import CORS
from langdetect import detect
import stanza

app = Flask(__name__)
CORS(app)

# Download models (only first time)
stanza.download('de')
stanza.download('da')

nlp_de = stanza.Pipeline('de')
nlp_da = stanza.Pipeline('da')

def extract_cases(doc):
    results = []
    for sent in doc.sentences:
        for word in sent.words:
            results.append({
                "word": word.text,
                "features": word.feats
            })
    return results

@app.route("/analyze", methods=["POST"])
def analyze():
    text = request.json.get("text")
    lang = detect(text)

    if lang == "de":
        doc = nlp_de(text)
        result = extract_cases(doc)
    elif lang == "da":
        doc = nlp_da(text)
        result = extract_cases(doc)
    else:
        result = [{"word": text, "features": "Latin (begrænset support)"}]

    return jsonify({
        "language": lang,
        "analysis": result
    })

@app.route("/")
def home():
    return "Kasus API kører!"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
