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
CORS(app)  # Mengizinkan akses dari frontend Vue.js

# Inisialisasi stopwords
nltk.download('stopwords')
STOPWORDS = set(stopwords.words('english'))

# SerpApi Key
SERP_API_KEY = "e8be2856a25722731c10666511a3eec312051216cdcc7ed063877503aa09283a"

def search_google(query):
    """
    Perform a search on Google using SerpApi
    """
    url = "https://serpapi.com/search"
    params = {
        "q": query,
        "hl": "en",
        "gl": "us",
        "api_key": SERP_API_KEY
    }
    response = requests.get(url, params=params)
    if response.status_code == 200:
        return response.json().get("organic_results", [])
    else:
        return []

def extract_text_from_url(url):
    """
    Extract plain text from a given URL using BeautifulSoup
    """
    try:
        response = requests.get(url)
        response.raise_for_status()  # Pastikan permintaan berhasil
        soup = BeautifulSoup(response.content, "html.parser")
        return soup.get_text(separator=' ', strip=True)
    except requests.RequestException as e:
        return f"Error extracting text: {e}"

def calculate_readability_score(text):
    """
    Calculate readability score using Flesch Reading Ease
    """
    try:
        if not text.strip():
            return 0
        score = flesch_reading_ease(text)
        return max(0, min((score / 100) * 100, 100))
    except Exception:
        return 0

def calculate_top_keywords(text):
    """
    Calculate top 5 keywords from the text
    """
    words = re.findall(r'\b\w+\b', text.lower())
    filtered_words = [word for word in words if word not in STOPWORDS and len(word) > 3]

    if not filtered_words:
        return {}

    total_words = len(filtered_words)
    freq_dist = Counter(filtered_words)
    top_words = freq_dist.most_common(5)
    top_keywords = {word: (count / total_words) * 100 for word, count in top_words}
    return top_keywords

def calculate_uniqueness_score(text, similar_sites):
    """
    Calculate uniqueness score based on similarity with other websites
    """
    if not similar_sites:
        return 100  # Jika tidak ada situs serupa, teks dianggap 100% unik

    total_similarity = 0
    for site in similar_sites:
        similarity = SequenceMatcher(None, text, site.get("snippet", "")).ratio()
        total_similarity += similarity

    avg_similarity = (total_similarity / len(similar_sites)) * 100
    uniqueness_score = 100 - avg_similarity
    return max(0, min(uniqueness_score, 100))

@app.route('/analyze', methods=['POST'])
def analyze():
    """
    Analyze the input (text, URL, or file) and return results
    """
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

    # Calculate readability score
    readability_score = calculate_readability_score(text)

    # Calculate top keywords
    top_keywords = calculate_top_keywords(text)

    # Find similar websites using SerpApi
    similar_sites = []
    queries = text.split(".")  # Split text into sentences
    for query in queries:
        if query.strip():
            similar_sites.extend(search_google(query.strip()))

    # Calculate uniqueness and duplication scores
    uniqueness_score = calculate_uniqueness_score(text, similar_sites)
    duplication_score = 100 - uniqueness_score

    return jsonify({
        "readability_score": readability_score,
        "uniqueness_score": uniqueness_score,
        "duplication_score": duplication_score,
        "top_keywords": top_keywords,
        "similar_sites": similar_sites
    })

if __name__ == '__main__':
    app.run(debug=True, port=5001)
