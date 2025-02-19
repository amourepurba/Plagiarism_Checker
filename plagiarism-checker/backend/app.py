from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
from textstat import flesch_reading_ease
from nltk.corpus import stopwords
import nltk
from collections import Counter
import re
from difflib import SequenceMatcher
import logging
import PyPDF2
import docx
import os

try:
    import textract
except ImportError:
    textract = None

app = Flask(__name__)
CORS(app)

# Inisialisasi NLTK
nltk.download('stopwords')
nltk.download('punkt')

# Konfigurasi Bahasa
STOPWORDS_LANGUAGES = {
    'english': set(stopwords.words('english')),
    'indonesian': set(stopwords.words('indonesian')),
    'turkish': set(stopwords.words('turkish')),
    'spanish': set(stopwords.words('spanish')),
    'french': set(stopwords.words('french')),
    'german': set(stopwords.words('german'))
}

SERP_LANGUAGE_MAPPING = {
    "english": "en",
    "indonesian": "id",
    "turkish": "tr",
    "spanish": "es",
    "french": "fr",
    "german": "de"
}

# Konfigurasi API
DATAFORSEO_API_KEY = "am9obkBleGFtcGxl"
BRIDGE_BASE_URL = "https://external-dfseo-redirect-1054425646954.asia-southeast1.run.app"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def extract_text_from_file(file):
    """Ekstrak teks dari file PDF, DOC, atau DOCX"""
    try:
        if file.filename.endswith('.pdf'):
            reader = PyPDF2.PdfReader(file)
            return " ".join([page.extract_text() for page in reader.pages]), None
        
        elif file.filename.endswith('.docx'):
            doc = docx.Document(file)
            return " ".join([p.text for p in doc.paragraphs]), None
        
        elif file.filename.endswith('.doc'):
            if textract:
                return textract.process(file).decode('utf-8'), None
            return None, "File .doc membutuhkan textract (pip install textract)"
        
        return None, "Format file tidak didukung"
    
    except Exception as e:
        logger.error(f"Error extracting text: {str(e)}")
        return None, f"Error processing file: {str(e)}"

def extract_text_from_url(url):
    """Ekstrak teks dari URL"""
    try:
        response = requests.get(url, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        return ' '.join([p.get_text() for p in soup.find_all('p')])
    except Exception as e:
        logger.error(f"Error extracting URL content: {str(e)}")
        return None

def calculate_readability(text):
    """Hitung skor keterbacaan"""
    try:
        return max(0, min(flesch_reading_ease(text), 100))
    except:
        return 0

def analyze_keywords(text, language):
    """Analisis kata kunci"""
    words = re.findall(r'\b\w+\b', text.lower())
    filtered = [w for w in words if w not in STOPWORDS_LANGUAGES.get(language, 'english')]
    counter = Counter(filtered)
    total = sum(counter.values())
    return {word: (count/total)*100 for word, count in counter.most_common(5)}

def check_plagiarism(text, language):
    """Cek plagiarisme menggunakan API eksternal"""
    try:
        headers = {"Content-Type": "application/json"}
        payload = {
            "secretCode": DATAFORSEO_API_KEY,
            "payload": {
                "data": [{
                    "keyword": text[:300],
                    "language_code": "id",
                    "location_code": 2360
                }]
            }
        }
        
        response = requests.post(
            f"{BRIDGE_BASE_URL}/serp/google/organic/live/regular",
            json=payload,
            headers=headers
        )
        
        results = response.json().get('payload', {}).get('data', [{}])[0].get('result', [])
        return [{"url": r.get('url'), "similarity": SequenceMatcher(None, text, r.get('snippet', '')).ratio()*100} for r in results]
    
    except Exception as e:
        logger.error(f"Plagiarism check error: {str(e)}")
        return []

@app.route('/analyze', methods=['POST'])
def analyze():
    # Handle file upload
    if 'file' in request.files:
        file = request.files['file']
        text, error = extract_text_from_file(file)
        language = request.form.get('language', 'english').lower()
        
        if error:
            return jsonify({"error": error}), 400
    
    # Handle text/url
    else:
        data = request.get_json()
        language = data.get('language', 'english').lower()
        
        if data.get('input_type') == 'text':
            text = data.get('text', '')
        else:
            text = extract_text_from_url(data.get('url', ''))
    
    # Validasi teks
    if not text or len(text.strip()) < 50:
        return jsonify({"error": "Konten terlalu pendek (minimal 50 karakter)"}), 400
    
    # Proses analisis
    try:
        readability = calculate_readability(text)
        keywords = analyze_keywords(text, language)
        plagiarism_results = check_plagiarism(text, language)
        
        # Hitung skor unik
        similarity_score = sum([r['similarity'] for r in plagiarism_results]) / len(plagiarism_results) if plagiarism_results else 0
        uniqueness = max(0, 100 - similarity_score)
        
        return jsonify({
            "processed_text": text[:5000] + "..." if len(text) > 5000 else text,
            "readability_score": round(readability, 2),
            "uniqueness_score": round(uniqueness, 2),
            "top_keywords": keywords,
            "plagiarized_sites": [r['url'] for r in plagiarism_results if r['similarity'] > 70][:5]
        })
    
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        return jsonify({"error": "Terjadi kesalahan dalam pemrosesan"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)