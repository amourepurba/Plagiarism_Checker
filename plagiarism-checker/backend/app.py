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

try:
    import textract
except ImportError:
    textract = None

app = Flask(__name__)
CORS(app)

# Pastikan stopwords sudah diunduh
nltk.download('stopwords')
STOPWORDS_LANGUAGES = {
    'english': set(stopwords.words('english')),
    'indonesian': set(stopwords.words('indonesian')),
    'turkish': set(stopwords.words('turkish')),
    'spanish': set(stopwords.words('spanish')),
    'french': set(stopwords.words('french')),
    'german': set(stopwords.words('german'))
}

# Pemetaan bahasa ke kode untuk SERP API
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

def fetch_serp_dataforseo(keyword, language="english"):
    """
    Mengirim permintaan ke API DataForSEO melalui bridge dengan penyesuaian language_code.
    """
    language_code = SERP_LANGUAGE_MAPPING.get(language, "en")
    url = f"{BRIDGE_BASE_URL}/serp/google/organic/live/regular"
    headers = {"Content-Type": "application/json"}
    payload = {
        "secretCode": DATAFORSEO_API_KEY,
        "payload": {
            "data": [{
                "keyword": keyword,
                "language_code": language_code,
                "location_code": 2840
            }]
        }
    }
    try:
        response = requests.post(url, json=payload, headers=headers)
        logger.info("Bridge API response status: %s", response.status_code)
        logger.info("Bridge API response text: %s", response.text)
        if response.status_code != 200:
            logger.error("Response status bukan 200, isi response: %s", response.text)
            return {"error": "Gagal mengirim permintaan ke DataForSEO"}
        return response.json()
    except Exception as e:
        logger.error(f"Error fetching SERP data via bridge: {e}")
        return {"error": str(e)}

def extract_text_from_url(url):
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "html.parser")
        return soup.get_text(separator=' ', strip=True)
    except requests.RequestException:
        return None

def calculate_readability_score(text):
    try:
        return max(0, min(flesch_reading_ease(text), 100)) if text.strip() else 0
    except Exception:
        return 0

def calculate_top_keywords(text, language='english'):
    words = re.findall(r'\b\w+\b', text.lower())
    stopwords_set = STOPWORDS_LANGUAGES.get(language, STOPWORDS_LANGUAGES['english'])
    filtered_words = [word for word in words if word not in stopwords_set and len(word) > 3]
    if not filtered_words:
        return {}
    total_words = len(filtered_words)
    freq_dist = Counter(filtered_words)
    return {word: (count / total_words) * 100 for word, count in freq_dist.most_common(5)}

def detect_plagiarism(text, similar_sites):
    plagiarized_sites = []
    sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)\s', text)
    for sentence in sentences:
        for site in similar_sites:
            similarity = SequenceMatcher(None, sentence, site.get("snippet", "")).ratio()
            if similarity > 0.8:
                plagiarized_sites.append({
                    "url": site.get("url"),
                    "snippet": site.get("snippet"),
                    "similarity": similarity * 100,
                    "plagiarized_sentence": sentence
                })
    return plagiarized_sites

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'file' in request.files:
        return jsonify({"error": "Fitur analisis file belum diimplementasikan"}), 400
    
    data = request.get_json()
    language = data.get('language', 'english').lower()
    if data.get('input_type') == 'text':
        text = data.get('text', '')
    else:
        text = extract_text_from_url(data.get('url', ''))
    
    if not text or not text.strip():
        return jsonify({"error": "Konten kosong"}), 400
    
    readability_score = calculate_readability_score(text)
    top_keywords = calculate_top_keywords(text, language)
    serp_result = fetch_serp_dataforseo(text[:100], language)
    similar_sites = serp_result.get("payload", {}).get("data", [{}])[0].get("result", [])
    plagiarized_sites = detect_plagiarism(text, similar_sites)
    uniqueness_score = 100 - (sum(site['similarity'] for site in plagiarized_sites) / len(plagiarized_sites) if plagiarized_sites else 0)
    
    return jsonify({
        "processed_text": text,
        "readability_score": readability_score,
        "uniqueness_score": uniqueness_score,
        "top_keywords": top_keywords,
        "similar_sites": similar_sites,
        "plagiarized_sites": plagiarized_sites
    })

if __name__ == '__main__':
    app.run(debug=True, port=5001)
