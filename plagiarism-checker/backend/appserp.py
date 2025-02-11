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

app = Flask(__name__)
CORS(app)

# Inisialisasi stopwords NLTK
nltk.download('stopwords')
STOPWORDS = set(stopwords.words('english'))

# Konstanta API DataForSEO
DATAFORSEO_URL = "https://external-dfseo-redirect-1054425646954.asia-southeast1.run.app"
SECRET_CODE = "am9obkBleGFtcGxl"  # Gantilah dengan kode rahasia yang benar

# ------------------------------
# 📌 UTILITAS
# ------------------------------
def fetch_serp_dataforseo(payload):
    url = f"{DATAFORSEO_URL}/v3/serp/google/organic/live/regular"
    headers = {"Content-Type": "application/json"}
    data = {"secretCode": SECRET_CODE, "payload": payload}
    try:
        response = requests.post(url, json=data, headers=headers)
        response_data = response.json() if response.status_code == 200 else {"error": response.text}
        return response_data
    except Exception as e:
        return {"error": str(e)}

def fetch_backlinks_dataforseo(payload):
    url = f"{DATAFORSEO_URL}/v3/backlinks/backlinks/live"
    headers = {"Content-Type": "application/json"}
    data = {"secretCode": SECRET_CODE, "payload": payload}
    try:
        response = requests.post(url, json=data, headers=headers)
        response_data = response.json() if response.status_code == 200 else {"error": response.text}
        return response_data
    except Exception as e:
        return {"error": str(e)}

def extract_text_from_url(url):
    try:
        response = requests.get(url)
        response.raise_for_status()  # Pastikan permintaan berhasil
        soup = BeautifulSoup(response.content, "html.parser")
        return soup.get_text(separator=' ', strip=True)
    except requests.RequestException as e:
        return f"Error extracting text: {e}"

def calculate_readability_score(text):
    try:
        return max(0, min(flesch_reading_ease(text), 100)) if text.strip() else 0
    except Exception as e:
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
    total_similarity = sum(SequenceMatcher(None, text, site.get("snippet", "")).ratio() for site in similar_sites)
    avg_similarity = (total_similarity / len(similar_sites)) * 100
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

# ------------------------------
# 📌 API ENDPOINT
# ------------------------------
@app.route('/analyze', methods=['POST'])
def analyze():
    if 'file' in request.files:
        data = {'input_type': 'file', 'file': request.files['file']}
    else:
        data = request.get_json()

    input_type = data.get('input_type')
    text = ""

    if input_type == 'text':
        text = data.get('text', '')
    elif input_type == 'url':
        text = extract_text_from_url(data.get('url', ''))
    elif input_type == 'file':
        uploaded_file = data['file']
        text = uploaded_file.read().decode('utf-8')
    else:
        return jsonify({"error": "Invalid input type"}), 400

    if not text.strip():
        return jsonify({"error": "Empty content"}), 400

    readability_score = calculate_readability_score(text)
    top_keywords = calculate_top_keywords(text)
    serp_payload = {"keyword": text, "language_code": "en", "location_code": 2840}
    serp_result = fetch_serp_dataforseo(serp_payload)

    # Pengecekan apakah serp_result dan tasks ada dan valid
    if isinstance(serp_result, dict) and "tasks" in serp_result and isinstance(serp_result["tasks"], list) and len(serp_result["tasks"]) > 0:
        similar_sites = serp_result["tasks"][0].get("result", [])
    else:
        similar_sites = []

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

@app.route('/backlinks', methods=['POST'])
def get_backlinks():
    data = request.get_json()
    target_url = data.get("url")
    if not target_url:
        return jsonify({"error": "URL is required"}), 400
    backlinks_payload = {"target": target_url, "mode": "as_is"}
    backlinks_result = fetch_backlinks_dataforseo(backlinks_payload)
    return jsonify(backlinks_result)

# ------------------------------
# 📌 MENJALANKAN SERVER FLASK
# ------------------------------
if __name__ == '__main__':
    app.run(debug=True, port=5001)
