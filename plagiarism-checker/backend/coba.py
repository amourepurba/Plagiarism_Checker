import os
import re
import json
import dotenv
import requests
import docx2txt
import PyPDF2
from flask import Flask, request, jsonify
from textstat import flesch_reading_ease
from difflib import SequenceMatcher
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

dotenv.load_dotenv()

app = Flask(__name__)
DATAFORSEO_API_KEY = os.getenv("DATAFORSEO_API_KEY")

def extract_text_from_file(file):
    try:
        if file.filename.endswith('.pdf'):
            pdf_reader = PyPDF2.PdfReader(file)
            text = " ".join([page.extract_text() for page in pdf_reader.pages if page.extract_text()])
        elif file.filename.endswith(('.docx', '.doc')):
            text = docx2txt.process(file)
        else:
            return None
        return text.strip()
    except Exception as e:
        return None

def analyze_readability(text):
    return flesch_reading_ease(text)

def jaccard_similarity(text1, text2):
    words1, words2 = set(text1.split()), set(text2.split())
    intersection = words1 & words2
    union = words1 | words2
    return len(intersection) / len(union) if union else 0

def cosine_text_similarity(text1, text2):
    vectorizer = CountVectorizer().fit_transform([text1, text2])
    vectors = vectorizer.toarray()
    return cosine_similarity([vectors[0]], [vectors[1]])[0][0]

def detect_plagiarism(text):
    try:
        url = "https://api.dataforseo.com/v3/serp/google/organic/live"
        headers = {"Authorization": f"Basic {DATAFORSEO_API_KEY}"}
        payload = json.dumps({"data": [{"keyword": text[:100], "language": "en", "location_code": 2840}]})
        response = requests.post(url, headers=headers, data=payload)
        result = response.json()

        snippets = [item.get("title", "") + " " + item.get("description", "") for item in result.get("tasks", [{}])[0].get("result", [])]
        if not snippets:
            return 0

        similarities = [jaccard_similarity(text, snippet) for snippet in snippets]
        max_similarity = max(similarities, default=0)

        uniqueness_score = (1 - max_similarity) * 100
        return uniqueness_score
    except Exception as e:
        return None

@app.route('/check', methods=['POST'])
def check_text():
    input_text = None
    if "text" in request.form:
        input_text = request.form["text"]
    elif "file" in request.files:
        file = request.files["file"]
        input_text = extract_text_from_file(file)
    if not input_text:
        return jsonify({"error": "No valid text provided."}), 400

    readability = analyze_readability(input_text)
    uniqueness = detect_plagiarism(input_text)

    return jsonify({
        "readability_score": readability,
        "uniqueness_score": uniqueness
    })

if __name__ == '__main__':
    app.run(debug=True)
