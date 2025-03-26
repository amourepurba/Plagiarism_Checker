const express = require('express');
const axios = require('axios');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const sbd = require('sbd');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { Stemmer } = require('sastrawijs');
const { URL } = require('url');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const stemmer = new Stemmer();
const upload = multer({ storage: multer.memoryStorage() });

// ================== VALIDASI URL ==================
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
};

// ================== KONFIGURASI AWAL ==================
if (!process.env.API_URL || !process.env.SECRET_CODE) {
  console.error("Environment variables tidak lengkap!");
  process.exit(1);
}

puppeteer.use(StealthPlugin());
let browser;
(async () => {
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
})();

// ================== TEXT PROCESSING ==================
const stopwords = new Set([
  "dan", "atau", "ke", "di", "dari", "yang", "dengan", "untuk", "dalam", "itu",
  "ini", "saya", "kamu", "dia", "mereka", "kita", "adalah", "tidak", "juga", "bisa",
  "pada", "sebagai", "agar", "supaya", "jika", "karena", "sehingga", "oleh", "bahwa",
  "dll", "tsb", "bukan", "ada", "akan", "sebuah", "tak", "sudah", "telah", "lagi",
  "hanya", "saja", "apakah", "mengapa", "bagaimana", "kemudian", "saat", "sejak",
  "sebelum", "sesudah", "antara", "dapat", "hal", "wah", "sih", "nih", "mah", "deh"
]);

const tokenizeText = text => {
  const tokens = (text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\b(\w{1,3})\b/g, '')
    .split(/\s+/)
    .filter(token => token && !stopwords.has(token));
    
  return tokens.map(token => stemmer.stem(token));
};

// ================== N-GRAM OPTIMIZATION ==================
const getNGrams = (tokens, minN = 2, maxN = 4) => {
  const ngrams = new Set();
  for (let n = minN; n <= maxN; n++) {
    for (let i = 0; i <= tokens.length - n; i++) {
      ngrams.add(tokens.slice(i, i + n).join(' '));
    }
  }
  return Array.from(ngrams);
};

const getTokensAndNGrams = text => {
  const tokens = tokenizeText(text);
  const ngrams = getNGrams(tokens);
  return tokens.concat(ngrams);
};

// ================== TF-IDF & SIMILARITY CALCULATION ==================
const computeTF = tokens => tokens.reduce((acc, token) => {
  acc[token] = (acc[token] || 0) + 1;
  return acc;
}, {});

const normalizeTF = tf => {
  const maxFreq = Math.max(...Object.values(tf));
  return maxFreq === 0 ? tf : Object.keys(tf).reduce((acc, key) => {
    acc[key] = tf[key] / maxFreq;
    return acc;
  }, {});
};

const computeTFIDFForPair = (tokens1, tokens2) => {
  let tf1 = computeTF(tokens1);
  let tf2 = computeTF(tokens2);
  const allTokens = new Set([...Object.keys(tf1), ...Object.keys(tf2)]);
  
  const idf = {};
  allTokens.forEach(token => {
    const count = [tokens1, tokens2].filter(arr => arr.includes(token)).length;
    idf[token] = Math.log((2 + 1) / (count + 1)) + 1;
  });

  tf1 = normalizeTF(Object.keys(tf1).reduce((acc, key) => {
    acc[key] = tf1[key] * idf[key];
    return acc;
  }, {}));

  tf2 = normalizeTF(Object.keys(tf2).reduce((acc, key) => {
    acc[key] = tf2[key] * idf[key];
    return acc;
  }, {}));

  return [tf1, tf2];
};

const cosineSimilarityTF = (tf1, tf2) => {
  let dotProduct = 0, mag1 = 0, mag2 = 0;
  const allTokens = new Set([...Object.keys(tf1), ...Object.keys(tf2)]);
  
  allTokens.forEach(token => {
    const a = tf1[token] || 0;
    const b = tf2[token] || 0;
    dotProduct += a * b;
    mag1 += a ** 2;
    mag2 += b ** 2;
  });

  return mag1 && mag2 ? dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2)) : 0;
};

const determineThreshold = (similarities) => {
  if (!similarities.length) return 0.5;
  const avgSim = similarities.reduce((a, b) => a + b, 0) / similarities.length;
  return Math.max(0.3, Math.min(avgSim, 0.7));
};

// ================== FETCH CONTENT IMPROVED ==================
async function fetchPageContent(url) {
  try {
    if (url.toLowerCase().endsWith('.pdf')) {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 15000,
        validateStatus: (status) => status >= 200 && status < 500
      });

      if (response.status !== 200 || !response.data) return null;
      
      const pdfData = await pdfParse(response.data);
      return pdfData.text?.length > 50 ? pdfData.text : null;
    }

    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
    
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    } catch (err) {
      await page.close();
      return null;
    }

    const content = await page.evaluate(() => {
      const selectors = ['article', 'main', '.content', 'body'];
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element?.innerText?.length > 100) return element.innerText;
      }
      return document.body.innerText;
    });

    await page.close();
    return content?.length > 100 ? content : null;

  } catch (error) {
    console.error(`Error fetching content: ${error.message}`);
    return null;
  }
}

// ================== PLAGIARISM CORE LOGIC ==================
async function checkPlagiarismPerURL(queryText) {
  if (!queryText?.trim() || queryText.trim().length < 10) {
    return { results: [], error: "Input teks tidak valid", processedText: "", topKeywords: [] };
  }

  const processedTokens = tokenizeText(queryText);
  const processedText = processedTokens.join(' ');
  const allInputTerms = [...processedTokens, ...getNGrams(processedTokens)];
  
  const keywordScores = computeKeywordScores(allInputTerms);
  const sortedKeywords = processKeywords(keywordScores);

  try {
    const apiResponse = await axios.post(process.env.API_URL, {
      secretCode: process.env.SECRET_CODE,
      payload: [{ language_name: "Indonesian", location_code: 1002353, keyword: queryText.substring(0, 255) }]
    });

    const urls = extractUrlsFromResponse(apiResponse);
    const results = await processUrls(urls, queryText);
    
    return {
      results: results.filter(r => r).sort((a, b) => b.plagiarismScore - a.plagiarismScore),
      processedText,
      topKeywords: sortedKeywords,
      error: null
    };

  } catch (error) {
    return {
      results: [],
      error: error.message,
      processedText,
      topKeywords: sortedKeywords
    };
  }
}

// ================== HELPER FUNCTIONS ==================
const computeKeywordScores = (tokens) => {
  const tf = computeTF(tokens);
  return Object.entries(tf).map(([term, freq]) => ({
    term,
    score: freq * Math.log(1 / 1) // Simple IDF calculation
  }));
};

const processKeywords = (keywordScores) => 
  keywordScores
    .sort((a, b) => b.score - a.score)
    .filter(({term}) => term.length > 3 && !/\d/.test(term) && !/^(dll|tsb|yg|dg|sdh)$/i.test(term))
    .slice(0, 5)
    .map(({term, score}) => ({
      keyword: term,
      percentage: ((score / keywordScores.length) * 100).toFixed(2)
    }));

const extractUrlsFromResponse = (apiResponse) => 
  apiResponse.data?.tasks?.[0]?.result?.[0]?.items
    ?.map(item => item.url)
    ?.filter(url => url) || [];

const processUrls = async (urls, queryText) => 
  Promise.all(urls.map(async url => {
    const content = await fetchPageContent(url);
    if (!content) return null;

    const inputVectors = splitIntoSentences(queryText).map(getTokensAndNGrams);
    const targetVectors = splitIntoSentences(content).map(getTokensAndNGrams);

    const maxSims = inputVectors.map(input => 
      Math.max(...targetVectors.map(target => 
        cosineSimilarityTF(...computeTFIDFForPair(input, target))
      ))
    );

    const threshold = determineThreshold(maxSims);
    const plagiarizedCount = maxSims.filter(s => s >= threshold).length;
    const avgSim = maxSims.reduce((a, b) => a + b, 0) / maxSims.length || 0;

    return {
      url,
      plagiarismScore: Math.min(Math.round(((plagiarizedCount / inputVectors.length) + avgSim) * 50), 100),
      details: {
        totalSentences: inputVectors.length,
        matchedSentences: plagiarizedCount,
        averageSimilarity: avgSim.toFixed(2)
      }
    };
  }));

// ================== ENDPOINTS IMPROVED ==================
app.post('/check-url', async (req, res) => {
  try {
    let url = req.body?.url?.trim();
    
    if (!url || !isValidUrl(url)) {
      return res.status(400).json({
        error: "Format URL tidak valid",
        example: "https://example.com",
        received: url
      });
    }

    if (!url.startsWith('http')) url = `http://${url}`;

    const content = await Promise.race([
      fetchPageContent(url),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout setelah 35 detik')), 35000)
      )
    ]);

    if (!content) {
      return res.status(404).json({
        error: "Konten tidak dapat diakses",
        solutions: [
          "Periksa koneksi internet",
          "Pastikan URL benar dan aktif",
          "Coba lagi beberapa saat"
        ]
      });
    }

    const result = await checkPlagiarismPerURL(content);
    res.json(result);

  } catch (error) {
    res.status(500).json({
      error: "Terjadi kesalahan saat memproses URL",
      detail: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// ================== ERROR HANDLER ==================
app.use((err, req, res, next) => {
  console.error('Global Error:', err);
  res.status(500).json({
    error: "Terjadi kesalahan sistem",
    requestId: req.headers['x-request-id'],
    timestamp: new Date().toISOString()
  });
});

process.on('SIGINT', async () => {
  if (browser) await browser.close();
  process.exit(0);
});

app.listen(port, () => console.log(`Server berjalan di http://localhost:${port}`));