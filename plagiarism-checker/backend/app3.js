const express = require('express');
const axios = require('axios');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const sbd = require('sbd'); // Pastikan paket ini sudah terinstall (npm install sbd)
const multer = require('multer');
const pdfParse = require('pdf-parse'); // Untuk ekstraksi PDF
const natural = require('natural'); // Untuk stemming; jika diperlukan, sesuaikan dengan library stemming Bahasa Indonesia
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

if (!process.env.API_URL || !process.env.SECRET_CODE) {
  console.error("API_URL atau SECRET_CODE tidak ditemukan dalam environment variables.");
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

// Gunakan memory storage untuk file upload
const upload = multer({ storage: multer.memoryStorage() });
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================== 1. Preprocessing Teks ==================
// Definisikan daftar stopword (tambahkan sesuai kebutuhan)
const stopwords = new Set(["dan", "atau", "ke", "di", "dari", "yang", "dengan", "untuk", "dalam"]);

// Fungsi tokenisasi: lowercasing, hapus tanda baca, hapus stopword, dan stemming
const tokenizeText = text => {
  const tokens = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(token => token && !stopwords.has(token));
  // Gunakan PorterStemmer bawaan natural (untuk Bahasa Inggris). Untuk Bahasa Indonesia, bisa gunakan library khusus.
  return tokens.map(token => natural.PorterStemmer.stem(token));
};

// ================== 2. N-Gram Fleksibel ==================
// Fungsi untuk membuat n-gram dengan ukuran dari bigram (2) hingga 5-gram
const getNGrams = (tokens, minN = 2, maxN = 5) => {
  const ngrams = [];
  for (let n = minN; n <= maxN; n++) {
    if (tokens.length >= n) {
      for (let i = 0; i <= tokens.length - n; i++) {
        ngrams.push(tokens.slice(i, i + n).join(' '));
      }
    }
  }
  return ngrams;
};

// Helper: Gabungkan token dan n-gram untuk representasi fitur yang lebih kaya
const getTokensAndNGrams = text => {
  const tokens = tokenizeText(text);
  const ngrams = getNGrams(tokens);
  return tokens.concat(ngrams);
};

// ================== 3. Fungsi TF, TF-IDF, dan Normalisasi ==================
// Hitung Term Frequency (TF)
const computeTF = tokens =>
  tokens.reduce((acc, token) => {
    acc[token] = (acc[token] || 0) + 1;
    return acc;
  }, {});

// Normalisasi TF dengan membagi tiap nilai dengan frekuensi maksimum
const normalizeTF = tf => {
  const maxFreq = Math.max(...Object.values(tf));
  if (maxFreq === 0) return tf;
  Object.keys(tf).forEach(word => {
    tf[word] /= maxFreq;
  });
  return tf;
};

// Hitung TF-IDF untuk pasangan dokumen (misalnya, dua kalimat)
// Menggunakan 2 dokumen untuk perhitungan IDF
const computeTFIDFForPair = (tokens1, tokens2) => {
  let tf1 = computeTF(tokens1);
  let tf2 = computeTF(tokens2);
  const allTokens = new Set([...Object.keys(tf1), ...Object.keys(tf2)]);
  const idf = {};
  allTokens.forEach(token => {
    let count = 0;
    if (tokens1.includes(token)) count++;
    if (tokens2.includes(token)) count++;
    // Smoothing: total dokumen = 2
    idf[token] = Math.log((2 + 1) / (count + 1)) + 1;
  });
  // Kalikan TF dengan IDF
  for (let token in tf1) {
    tf1[token] *= idf[token];
  }
  for (let token in tf2) {
    tf2[token] *= idf[token];
  }
  tf1 = normalizeTF(tf1);
  tf2 = normalizeTF(tf2);
  return [tf1, tf2];
};

// ================== 4. Cosine Similarity ==================
const cosineSimilarityTF = (tf1, tf2) => {
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  const allTokens = new Set([...Object.keys(tf1), ...Object.keys(tf2)]);
  allTokens.forEach(token => {
    const a = tf1[token] || 0;
    const b = tf2[token] || 0;
    dotProduct += a * b;
    mag1 += a * a;
    mag2 += b * b;
  });
  return (mag1 === 0 || mag2 === 0) ? 0 : dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
};

// ================== 5. Adaptive Threshold ==================
const determineThreshold = (similarities) => {
  if (similarities.length === 0) return 0.5;
  const avgSim = similarities.reduce((sum, val) => sum + val, 0) / similarities.length;
  return Math.max(0.3, Math.min(avgSim, 0.7)); // Batas bawah 0.3, atas 0.7
};

// ================== 6. Pengambilan Konten Web (dengan scraping lebih robust) ==================
async function fetchPageContent(url) {
  if (url.toLowerCase().endsWith('.pdf')) {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000 });
      const pdfData = await pdfParse(response.data);
      const text = pdfData.text;
      return (text && text.length > 10) ? text : null;
    } catch (error) {
      return null;
    }
  } else {
    let page;
    try {
      page = await browser.newPage();
      await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0");
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      
      // Tunggu hingga elemen <p> muncul (jika ada)
      await page.waitForSelector('p', { timeout: 5000 }).catch(() => {});
      
      const content = await page.evaluate(() => {
        const paragraphs = Array.from(document.querySelectorAll('p')).map(el => el.innerText);
        return paragraphs.join(' ').trim();
      });
      
      return (content && content.length > 10) ? content : null;
    } catch (error) {
      return null;
    } finally {
      if (page) await page.close();
    }
  }
}

// ================== 7. Pemisahan Kalimat ==================
const splitIntoSentences = text =>
  sbd.sentences(text, {
    newline_boundaries: true,
    sanitize: true,
    allowed_tags: false,
  }).filter(s => s.trim().length > 0);

// ================== 8. Fungsi Pengecekan Plagiasi per URL ==================
async function checkPlagiarismPerURL(queryText) {
  if (!queryText || typeof queryText !== 'string' || queryText.trim().length < 10) {
    return { results: [], error: "Teks tidak valid" };
  }

  try {
    // Panggil API eksternal untuk mendapatkan URL sumber
    const apiResponse = await axios.post(process.env.API_URL, {
      secretCode: process.env.SECRET_CODE,
      payload: [{
        language_name: "Indonesian",
        location_code: 1002353,
        keyword: queryText.substring(0, 255)
      }]
    });

    const tasks = apiResponse.data?.tasks;
    if (!tasks || tasks.length === 0) return { results: [] };
    const resultsApi = tasks[0]?.result;
    if (!resultsApi || resultsApi.length === 0) return { results: [] };

    const urls = resultsApi
      .flatMap(result => result.items.map(item => item.url))
      .filter(url => url);
    if (urls.length === 0) return { results: [] };

    // Pisahkan kalimat dari teks input
    const inputSentences = splitIntoSentences(queryText);
    // Representasikan tiap kalimat sebagai token + n-gram
    const inputVectors = inputSentences.map(sentence => getTokensAndNGrams(sentence));

    // Proses tiap URL secara paralel untuk menghitung skor plagiasi per URL
    const resultsPerURL = await Promise.all(urls.map(async (url) => {
      const content = await fetchPageContent(url);
      if (!content) return null;

      const targetSentences = splitIntoSentences(content);
      const targetVectors = targetSentences.map(sentence => getTokensAndNGrams(sentence));

      // Untuk tiap kalimat input, cari nilai similarity maksimum di URL ini
      const maxSims = inputVectors.map(inputTokens => {
        let maxSim = 0;
        targetVectors.forEach(targetTokens => {
          const [tfInput, tfTarget] = computeTFIDFForPair(inputTokens, targetTokens);
          const sim = cosineSimilarityTF(tfInput, tfTarget);
          if (sim > maxSim) maxSim = sim;
        });
        return maxSim;
      });

      // Hitung metrik plagiasi per URL
      const plagiarizedCount = maxSims.filter(sim => sim >= determineThreshold(maxSims)).length;
      const sumSimilarity = maxSims.reduce((sum, sim) => sum + sim, 0);
      const avgSimilarity = maxSims.length > 0 ? sumSimilarity / maxSims.length : 0;
      const plagiarizedFraction = inputSentences.length > 0 ? plagiarizedCount / inputSentences.length : 0;
      const compositeScore = Math.min(Math.round(((plagiarizedFraction + avgSimilarity) / 2) * 100), 100);

      return {
        url,
        plagiarismScore: compositeScore,
        details: {
          totalInputSentences: inputSentences.length,
          plagiarizedCount,
          avgSimilarity: avgSimilarity.toFixed(2),
          plagiarizedFraction: (plagiarizedFraction * 100).toFixed(2) + '%'
        }
      };
    }));

    // Filter hasil URL yang valid (tidak null)
    const validResults = resultsPerURL.filter(result => result !== null);
    return { results: validResults };

  } catch (error) {
    return { results: [], error: error.message };
  }
}

// ================== Endpoint ==================
// Endpoint untuk cek teks biasa
app.post('/check-text', async (req, res) => {
  const text = req.body?.text?.trim();
  if (!text || text.length < 10) return res.status(400).json({ error: "Teks harus lebih dari 10 karakter" });
  const result = await checkPlagiarismPerURL(text);
  res.json(result);
});

// Endpoint untuk cek file unggahan (teks atau PDF)
app.post('/check-file', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "File tidak ditemukan" });
  
  let fileContent = '';
  if (req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf')) {
    try {
      const pdfData = await pdfParse(req.file.buffer);
      fileContent = pdfData.text;
    } catch (error) {
      return res.status(500).json({ error: "Gagal memproses file PDF" });
    }
  } else {
    fileContent = req.file.buffer.toString('utf-8');
  }

  if (!fileContent || fileContent.trim().length < 10) return res.status(400).json({ error: "Konten file tidak valid" });
  const result = await checkPlagiarismPerURL(fileContent);
  res.json(result);
});

// Endpoint untuk cek URL
app.post('/check-url', async (req, res) => {
  let url = req.body?.url?.trim();
  if (!url) return res.status(400).json({ error: "URL tidak valid" });
  if (!/^https?:\/\//i.test(url)) {
    url = 'http://' + url;
  }
  const content = await fetchPageContent(url);
  if (!content) return res.status(500).json({ error: "Tidak dapat mengambil konten dari URL" });
  const result = await checkPlagiarismPerURL(content);
  res.json(result);
});

// Penutupan browser dengan baik saat SIGINT
process.on('SIGINT', async () => {
  if (browser) await browser.close();
  process.exit(0);
});

app.listen(port, () => console.log(`Server berjalan di http://localhost:${port}`));
