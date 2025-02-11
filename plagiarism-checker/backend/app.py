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

# Untuk ekstraksi PDF
import PyPDF2
# Untuk ekstraksi DOCX
import docx

# Untuk ekstraksi DOC (opsional)
try:
    import textract
except ImportError:
    textract = None

app = Flask(__name__)
CORS(app)

# Inisialisasi stopwords NLTK
nltk.download('stopwords')
STOPWORDS = set(stopwords.words('english'))

# Konfigurasi API DataForSEO
DATAFORSEO_API_KEY = "am9obkBleGFtcGxl"  # Ganti dengan API Key yang benar
DATAFORSEO_BASE_URL = "https://api.dataforseo.com/v3"

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fetch_serp_dataforseo(payload):
    url = f"{DATAFORSEO_BASE_URL}/serp/google/organic/live"
    headers = {
        "Authorization": f"Bearer {DATAFORSEO_API_KEY}",
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(url, json=payload, headers=headers)
        response_data = response.json() if response.status_code == 200 else {"error": response.text}
        return response_data
    except Exception as e:
        logger.error(f"Error fetching SERP data: {e}")
        return {"error": str(e)}

def extract_text_from_url(url):
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "html.parser")
        return soup.get_text(separator=' ', strip=True)
    except requests.RequestException:
        return None

def extract_text_from_pdf(file_stream):
    try:
        reader = PyPDF2.PdfReader(file_stream)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text
    except Exception as e:
        logger.error(f"Error extracting PDF: {e}")
        return None

def extract_text_from_docx(file_stream):
    try:
        doc = docx.Document(file_stream)
        text = "\n".join([para.text for para in doc.paragraphs])
        return text
    except Exception as e:
        logger.error(f"Error extracting DOCX: {e}")
        return None

def extract_text_from_doc(file_stream):
    if textract:
        try:
            file_stream.seek(0)
            text = textract.process(file_stream, extension='doc').decode('utf-8')
            return text
        except Exception as e:
            logger.error(f"Error extracting DOC: {e}")
            return None
    else:
        logger.error("Library textract tidak terinstal; tidak dapat mengekstrak file DOC")
        return None

def calculate_readability_score(text):
    try:
        return max(0, min(flesch_reading_ease(text), 100)) if text.strip() else 0
    except Exception:
        return 0

def calculate_top_keywords(text):
    words = re.findall(r'\b\w+\b', text.lower())
    filtered_words = [word for word in words if word not in STOPWORDS and len(word) > 3]
    if not filtered_words:
        return {}
    total_words = len(filtered_words)
    freq_dist = Counter(filtered_words)
    top_words = freq_dist.most_common(5)
    return {word: (count / total_words) * 100 for word, count in top_words}

def calculate_uniqueness_score(text, similar_sites):
    if not similar_sites:
        return 100
    similarities = [
        SequenceMatcher(None, text, site.get("snippet", "")).ratio()
        for site in similar_sites if site.get("snippet")
    ]
    if not similarities:
        return 100
    avg_similarity = sum(similarities) / len(similarities) * 100
    return max(0, min(100 - avg_similarity, 100))

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

@app.route('/analyze', methods=['POST'])
def analyze():
    # Jika request berupa multipart, berarti ada file yang diunggah
    if request.content_type.startswith('multipart/form-data'):
        if 'file' not in request.files:
            return jsonify({"error": "Tidak ada file yang diunggah"}), 400
        file = request.files['file']
        input_type = request.form.get('input_type')
        if input_type != 'file':
            return jsonify({"error": "Tipe input tidak valid untuk unggahan file"}), 400
        filename = file.filename
        if not filename:
            return jsonify({"error": "Nama file kosong"}), 400
        allowed_extensions = ['pdf', 'doc', 'docx']
        file_extension = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
        if file_extension not in allowed_extensions:
            return jsonify({"error": "Format file tidak valid!"}), 400
        
        text = None
        file_stream = io.BytesIO(file.read())
        file_stream.seek(0)
        if file_extension == 'pdf':
            text = extract_text_from_pdf(file_stream)
        elif file_extension == 'docx':
            text = extract_text_from_docx(file_stream)
        elif file_extension == 'doc':
            text = extract_text_from_doc(file_stream)
        if text is None or not text.strip():
            return jsonify({"error": "Gagal mengekstrak teks dari file"}), 400
    else:
        # Menangani input JSON untuk teks atau URL
        data = request.get_json()
        if not data:
            return jsonify({"error": "Data JSON tidak valid"}), 400
        input_type = data.get('input_type')
        if input_type == 'text':
            text = data.get('text', '')
        elif input_type == 'url':
            extracted_text = extract_text_from_url(data.get('url', ''))
            if extracted_text is None:
                return jsonify({"error": "Gagal mengekstrak teks dari URL"}), 400
            text = extracted_text
        else:
            return jsonify({"error": "Tipe input tidak valid"}), 400

    if not text.strip():
        return jsonify({"error": "Konten kosong"}), 400

    readability_score = calculate_readability_score(text)
    top_keywords = calculate_top_keywords(text)
    serp_payload = {"keyword": text, "language_code": "en", "location_code": 2840}
    serp_result = fetch_serp_dataforseo(serp_payload)
    tasks = serp_result.get("tasks", [])
    similar_sites = tasks[0].get("result", []) if tasks else []

    uniqueness_score = calculate_uniqueness_score(text, similar_sites)
    duplication_score = 100 - uniqueness_score
    plagiarized_sites = detect_plagiarism(text, similar_sites)

    return jsonify({
        "readability_score": readability_score,
        "uniqueness_score": uniqueness_score,
        "duplication_score": duplication_score,
        "top_keywords": top_keywords,
        "similar_sites": similar_sites,
        "plagiarized_sites": plagiarized_sites
    })

if __name__ == '__main__':
    app.run(debug=True, port=5001)
