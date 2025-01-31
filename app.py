from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
from textstat import flesch_reading_ease
from nltk.corpus import stopwords
import nltk
from collections import Counter
import re
from docx import Document
import PyPDF2

app = Flask(__name__)
CORS(app)  # Mengizinkan akses dari frontend Vue.js

# Inisialisasi stopwords
nltk.download('stopwords')
STOPWORDS = set(stopwords.words('english'))

def extract_text_from_url(url):
    try:
        response = requests.get(url)
        soup = BeautifulSoup(response.content, "html.parser")
        return soup.get_text(separator=' ', strip=True)
    except Exception as e:
        return f"Error extracting text: {e}"

def extract_text_from_docx(file):
    try:
        document = Document(file)
        return "\n".join([paragraph.text for paragraph in document.paragraphs])
    except Exception as e:
        return f"Error reading Word file: {e}"

def extract_text_from_pdf(file):
    try:
        pdf_reader = PyPDF2.PdfReader(file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        return f"Error reading PDF file: {e}"

def calculate_top_keywords(text):
    words = re.findall(r'\b\w+\b', text.lower())
    filtered_words = [word for word in words if word not in STOPWORDS]

    if not filtered_words:
        return {}

    total_words = len(filtered_words)
    freq_dist = Counter(filtered_words)

    top_words = freq_dist.most_common(5)

    top_keywords = {word: (count / total_words) * 100 for word, count in top_words}
    return top_keywords

def calculate_readability_score(text):
    try:
        if not text.strip():
            return 0
        score = flesch_reading_ease(text)
        return max(0, min((score / 100) * 100, 100))
    except Exception:
        return 0

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    input_type = data.get('input_type')
    
    if input_type == 'text':
        text = data.get('text', '')
    elif input_type == 'url':
        text = extract_text_from_url(data.get('url', ''))
    else:
        return jsonify({"error": "Invalid input type"}), 400

    if not text.strip():
        return jsonify({"error": "Empty content"}), 400

    readability_score = calculate_readability_score(text)
    top_keywords = calculate_top_keywords(text)

    return jsonify({
        "readability_score": readability_score,
        "top_keywords": top_keywords
    })

if __name__ == '__main__':
    app.run(debug=True)
