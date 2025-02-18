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
import io
import PyPDF2
import docx
import time

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

# DataForSEO configuration
DATAFORSEO_API_KEY = "am9obkBleGFtcGxl"
DATAFORSEO_BASE_URL = "https://api.dataforseo.com/v3"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fetch_serp_dataforseo(keyword):
    """
    Mengirim permintaan ke API DataForSEO sebagai bridge menggunakan endpoint live/regular.
    Pastikan payload dan struktur respons sudah sesuai.
    """
    url = f"{DATAFORSEO_BASE_URL}/serp/google/organic/live/regular"
    headers = {"Content-Type": "application/json"}
    payload = {
        "secretCode": DATAFORSEO_API_KEY,
        "payload": {
            "data": [{
                "keyword": keyword,
                "language_code": "en",
                "location_code": 2840
            }]
        }
    }
    try:
        response = requests.post(url, json=payload, headers=headers)
        logger.info("DataForSEO response status: %s", response.status_code)
        logger.info("DataForSEO response text: %s", response.text)
        if response.status_code != 200:
            logger.error("Response status bukan 200, isi response: %s", response.text)
            return {"error": "Gagal mengirim permintaan ke DataForSEO"}
        return response.json()  # Mengembalikan object payload dari DataForSEO
    except Exception as e:
        logger.error(f"Error fetching SERP data: {e}")
        return {"error": str(e)}

def extract_text_from_file(file):
    """
    Mengekstrak teks dari file yang diunggah (PDF, DOCX, atau DOC).
    """
    try:
        if file.filename.endswith('.pdf'):
            reader = PyPDF2.PdfReader(file)
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        elif file.filename.endswith('.docx'):
            doc = docx.Document(file)
            return "\n".join(para.text for para in doc.paragraphs)
        elif file.filename.endswith('.doc') and textract:
            return textract.process(file, extension='doc').decode('utf-8')
    except Exception as e:
        logger.error(f"Error extracting text from {file.filename}: {e}")
        return None
    return None

def extract_text_from_url(url):
    """
    Mengekstrak teks dari URL menggunakan BeautifulSoup.
    """
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "html.parser")
        return soup.get_text(separator=' ', strip=True)
    except requests.RequestException as e:
        logger.error(f"Error fetching URL {url}: {e}")
        return None

def calculate_readability_score(text):
    """
    Menghitung skor keterbacaan menggunakan formula Flesch Reading Ease.
    """
    try:
        return max(0, min(flesch_reading_ease(text), 100)) if text.strip() else 0
    except Exception as e:
        logger.error(f"Error calculating readability score: {e}")
        return 0

def calculate_top_keywords(text, language='english'):
    """
    Menghitung top 5 kata kunci dengan mengabaikan stopwords sesuai bahasa.
    """
    words = re.findall(r'\b\w+\b', text.lower())
    stopwords_set = STOPWORDS_LANGUAGES.get(language, STOPWORDS_LANGUAGES['english'])
    filtered_words = [word for word in words if word not in stopwords_set and len(word) > 3]
    if not filtered_words:
        return {}
    total_words = len(filtered_words)
    freq_dist = Counter(filtered_words)
    return {word: (count / total_words) * 100 for word, count in freq_dist.most_common(5)}

def calculate_uniqueness_score(text, similar_sites):
    """
    Menghitung skor keunikan berdasarkan kesamaan antara teks dengan snippet situs serupa.
    """
    if not similar_sites:
        return 100
    similarities = [
        SequenceMatcher(None, text, site.get("snippet", "")).ratio()
        for site in similar_sites if site.get("snippet")
    ]
    average_similarity = (sum(similarities) / len(similarities)) * 100 if similarities else 0
    return max(0, min(100 - average_similarity, 100))

def detect_plagiarism(text, similar_sites):
    """
    Mendeteksi kalimat yang mungkin ter-plagiasi dengan membandingkan setiap kalimat
    dengan snippet dari situs. Jika similarity > 80%, dianggap plagiasi.
    """
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
    """
    Endpoint untuk menganalisis teks/URL/file.
    Proses analisis meliputi:
      - Ekstraksi teks
      - Perhitungan readability dan top keywords
      - Pemanggilan API DataForSEO sebagai bridge untuk mendapatkan situs-situs serupa
      - Perhitungan uniqueness dan deteksi plagiasi
    """
    # Jika ada file, proses file; jika tidak, proses input JSON
    if 'file' in request.files:
        file = request.files['file']
        text = extract_text_from_file(file)
        # Mengambil parameter bahasa dari form data jika tersedia, default 'english'
        language = request.form.get('language', 'english').lower()
    else:
        data = request.get_json()
        language = data.get('language', 'english').lower()
        if data.get('input_type') == 'text':
            text = data.get('text', '')
        else:  # diasumsikan input_type 'url'
            text = extract_text_from_url(data.get('url', ''))
    
    if not text or not text.strip():
        return jsonify({"error": "Konten kosong"}), 400
    
    readability_score = calculate_readability_score(text)
    top_keywords = calculate_top_keywords(text, language)
    
    # Panggil API DataForSEO dengan 100 karakter pertama sebagai keyword
    serp_result = fetch_serp_dataforseo(text[:100])
    logger.info("SERP API result: %s", serp_result)
    
    # Jika terjadi error pada respons, gunakan daftar kosong untuk similar_sites
    if 'error' in serp_result:
        similar_sites = []
    else:
        # Pastikan struktur respons sesuai; sesuaikan jika berbeda
        similar_sites = serp_result.get("payload", {}).get("data", [{}])[0].get("result", [])
        if similar_sites is None:
            similar_sites = []
    
    uniqueness_score = calculate_uniqueness_score(text, similar_sites)
    duplication_score = 100 - uniqueness_score
    plagiarized_sites = detect_plagiarism(text, similar_sites)
    
    return jsonify({
        "processed_text": text,
        "readability_score": readability_score,
        "uniqueness_score": uniqueness_score,
        "duplication_score": duplication_score,
        "top_keywords": top_keywords,
        "similar_sites": similar_sites,
        "plagiarized_sites": plagiarized_sites
    })

if __name__ == '__main__':
    app.run(debug=True, port=5001)
