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
import base64

try:
    import textract
except ImportError:
    textract = None

app = Flask(__name__)
CORS(app)

nltk.download('stopwords')
STOPWORDS = set(stopwords.words('english'))

# DataForSEO Credentials
DATAFORSEO_EMAIL = "email_anda@example.com"
DATAFORSEO_PASSWORD = "password_api_anda"
DATAFORSEO_BASE_URL = "https://api.dataforseo.com/v3"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Autentikasi Basic Authentication
def get_dataforseo_headers():
    credentials = f"{DATAFORSEO_EMAIL}:{DATAFORSEO_PASSWORD}"
    encoded_credentials = base64.b64encode(credentials.encode()).decode()
    return {"Authorization": f"Basic {encoded_credentials}", "Content-Type": "application/json"}

# Fungsi untuk mengambil data SERP dari DataForSEO
def fetch_serp_dataforseo_async(keyword):
    url_post = f"{DATAFORSEO_BASE_URL}/serp/google/organic/task_post"
    headers = get_dataforseo_headers()
    
    payload = {
        "data": [{
            "keyword": keyword,
            "language_code": "en",
            "location_code": 2840  # Kode untuk USA
        }]
    }
    
    try:
        response = requests.post(url_post, json=payload, headers=headers)
        if response.status_code != 200:
            return {"error": f"Error posting task: {response.text}"}
        
        task_data = response.json()
        task_id = task_data.get("tasks", [{}])[0].get("id")
        if not task_id:
            return {"error": "Gagal mendapatkan task ID"}
        
        # Tunggu beberapa detik sebelum mengambil hasil
        url_get = f"{DATAFORSEO_BASE_URL}/serp/google/organic/task_get/{task_id}"
        for _ in range(10):  
            response = requests.get(url_get, headers=headers)
            result = response.json()
            if result.get("status_code") == 20000:
                return result
            time.sleep(5)  # Tunggu sebelum mencoba lagi

        return {"error": "Gagal mendapatkan hasil dari DataForSEO"}
    except requests.RequestException as e:
        logger.error(f"Error fetching SERP data: {e}")
        return {"error": str(e)}

# Fungsi untuk ekstraksi teks dari file
def extract_text_from_file(file):
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

# Fungsi untuk ekstraksi teks dari URL
def extract_text_from_url(url):
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "html.parser")
        return soup.get_text(separator=' ', strip=True)
    except requests.RequestException:
        return None

# Fungsi untuk menghitung skor keterbacaan
def calculate_readability_score(text):
    try:
        return max(0, min(flesch_reading_ease(text), 100)) if text.strip() else 0
    except Exception:
        return 0

# Fungsi untuk menghitung kata kunci utama
def calculate_top_keywords(text):
    words = re.findall(r'\b\w+\b', text.lower())
    filtered_words = [word for word in words if word not in STOPWORDS and len(word) > 3]
    if not filtered_words:
        return {}
    total_words = len(filtered_words)
    freq_dist = Counter(filtered_words)
    return {word: (count / total_words) * 100 for word, count in freq_dist.most_common(5)}

# Fungsi untuk menghitung skor keunikan
def calculate_uniqueness_score(text, similar_sites):
    if not similar_sites:
        return 100
    similarities = [SequenceMatcher(None, text, site.get("snippet", "")).ratio() for site in similar_sites if site.get("snippet")]
    return max(0, min(100 - (sum(similarities) / len(similarities) * 100 if similarities else 0), 100))

# Fungsi untuk mendeteksi plagiarisme
def detect_plagiarism(text, similar_sites):
    plagiarized_sites = []
    sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s', text)
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

# Endpoint utama untuk analisis teks
@app.route('/analyze', methods=['POST'])
def analyze():
    if 'file' in request.files:
        file = request.files['file']
        text = extract_text_from_file(file)
    else:
        data = request.get_json()
        text = data.get('text', '') if data.get('input_type') == 'text' else extract_text_from_url(data.get('url', ''))
    
    if not text or not text.strip():
        return jsonify({"error": "Konten kosong"}), 400
    
    readability_score = calculate_readability_score(text)
    top_keywords = calculate_top_keywords(text)
    serp_result = fetch_serp_dataforseo_async(text[:100])
    similar_sites = serp_result.get("tasks", [{}])[0].get("result", []) if "tasks" in serp_result else []
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
