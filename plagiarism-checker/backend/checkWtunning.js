const express = require('express');
const axios = require('axios');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const sbd = require('sbd'); // Pastikan paket ini sudah terinstall (npm install sbd)
const multer = require('multer');
const pdfParse = require('pdf-parse'); // Untuk ekstraksi PDF
const fs = require('fs'); // Untuk evaluasi dengan dataset
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

// --- Utilitas Tokenisasi dan n-gram ---
const tokenizeText = text =>
  text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);

const getNGrams = (tokens, n = 3) => {
  const ngrams = [];
  if (tokens.length < n) return tokens; // fallback jika token kurang dari n
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.push(tokens.slice(i, i + n).join(' '));
  }
  return ngrams;
};

const computeTF = tokens =>
  tokens.reduce((acc, token) => {
    acc[token] = (acc[token] || 0) + 1;
    return acc;
  }, {});

const computeTFForSentence = (sentence, n = 3) => {
  const tokens = tokenizeText(sentence);
  const ngramTokens = tokens.length >= n ? getNGrams(tokens, n) : tokens;
  return computeTF(ngramTokens);
};

// --- Fungsi Cosine Similarity ---
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

// --- Fungsi Fetch Konten dengan Dukungan URL dan PDF ---
// Modifikasi: Menghapus elemen header dan footer, dan mengambil isi utama dari <main> jika tersedia.
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
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      
      const content = await page.evaluate(() => {
        // Hapus header dan footer
        document.querySelectorAll('header, footer').forEach(el => el.remove());
        // Ambil isi utama jika ada, misalnya dari elemen <main>
        const mainContent = document.querySelector('main');
        return mainContent ? mainContent.innerText.trim() : document.body.innerText.trim();
      });
      
      return (content && content.length > 10) ? content : null;
    } catch (error) {
      return null;
    } finally {
      if (page) await page.close();
    }
  }
}

// --- Fungsi untuk Pemisahan Kalimat menggunakan sbd ---
const splitIntoSentences = text =>
  sbd.sentences(text, {
    newline_boundaries: true,
    sanitize: true,
    allowed_tags: false,
  }).filter(s => s.trim().length > 0);

// --- Fungsi Pengecekan Plagiasi per URL ---
// Fungsi ini sudah dimodifikasi agar menerima parameter customThreshold (default 0.5)
const THRESHOLD_DEFAULT = 0.5;
async function checkPlagiarismPerURL(queryText, customThreshold = THRESHOLD_DEFAULT) {
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

    // Pisahkan kalimat dari teks input dan hitung TF masing-masing kalimat
    const inputSentences = splitIntoSentences(queryText);
    const inputTFs = inputSentences.map(sentence => computeTFForSentence(sentence));

    // Proses setiap URL secara paralel untuk menghitung skor plagiasi per URL
    const resultsPerURL = await Promise.all(urls.map(async (url) => {
      const content = await fetchPageContent(url);
      if (!content) return null;

      const targetSentences = splitIntoSentences(content);
      const targetTFs = targetSentences.map(sentence => computeTFForSentence(sentence));

      // Untuk setiap kalimat input, cari nilai similarity maksimum di URL ini
      const maxSims = inputTFs.map(inputTF => {
        let maxSim = 0;
        targetTFs.forEach(targetTF => {
          const sim = cosineSimilarityTF(inputTF, targetTF);
          if (sim > maxSim) maxSim = sim;
        });
        return maxSim;
      });

      // Hitung metrik plagiasi per URL
      const plagiarizedCount = maxSims.filter(sim => sim > customThreshold).length;
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

    const validResults = resultsPerURL.filter(result => result !== null);
    return { results: validResults };

  } catch (error) {
    return { results: [], error: error.message };
  }
}

// --- Endpoint untuk cek teks biasa ---
app.post('/check-text', async (req, res) => {
  const text = req.body?.text?.trim();
  if (!text || text.length < 10)
    return res.status(400).json({ error: "Teks harus lebih dari 10 karakter" });
  const result = await checkPlagiarismPerURL(text);
  res.json(result);
});

// --- Endpoint untuk cek file unggahan (teks atau PDF) ---
app.post('/check-file', upload.single('file'), async (req, res) => {
  if (!req.file)
    return res.status(400).json({ error: "File tidak ditemukan" });
  
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

  if (!fileContent || fileContent.trim().length < 10)
    return res.status(400).json({ error: "Konten file tidak valid" });
  const result = await checkPlagiarismPerURL(fileContent);
  res.json(result);
});

// --- Endpoint untuk cek URL ---
app.post('/check-url', async (req, res) => {
  let url = req.body?.url?.trim();
  if (!url)
    return res.status(400).json({ error: "URL tidak valid" });
  if (!/^https?:\/\//i.test(url)) {
    url = 'http://' + url;
  }
  const content = await fetchPageContent(url);
  if (!content)
    return res.status(500).json({ error: "Tidak dapat mengambil konten dari URL" });
  const result = await checkPlagiarismPerURL(content);
  res.json(result);
});

// Penutupan browser dengan baik saat SIGINT
process.on('SIGINT', async () => {
  if (browser) await browser.close();
  process.exit(0);
});

app.listen(port, () => console.log(`Server berjalan di http://localhost:${port}`));

/*
---------------------------------------------------------
Bagian Evaluasi: Tuning Threshold dan Validasi Performa
---------------------------------------------------------
Pastikan Anda telah menyiapkan dataset validasi (misalnya "validationDataset.json")
dengan format:
[
  {"inputText": "Contoh teks 1...", "label": true},
  {"inputText": "Contoh teks 2...", "label": false},
  ...
]
Uncomment bagian di bawah untuk menjalankan evaluasi.
*/

async function evaluateThresholds(dataset) {
  const thresholds = [0.5, 0.6, 0.7];
  for (const threshold of thresholds) {
    let TP = 0, FP = 0, FN = 0, TN = 0;
    for (const sample of dataset) {
      // Dapatkan hasil pengecekan dengan threshold yang diinginkan
      const result = await checkPlagiarismPerURL(sample.inputText, threshold);
      // Hitung skor rata-rata dari semua URL (jika ada)
      const avgScore = result.results.length > 0
        ? result.results.map(r => r.plagiarismScore).reduce((a, b) => a + b, 0) / result.results.length
        : 0;
      // Ambil keputusan: jika avgScore > threshold*100, anggap teks tersebut plagiasi
      const predictedPlagiarism = avgScore > threshold * 100;
      if (predictedPlagiarism && sample.label === true) {
        TP++;
      } else if (predictedPlagiarism && sample.label === false) {
        FP++;
      } else if (!predictedPlagiarism && sample.label === true) {
        FN++;
      } else if (!predictedPlagiarism && sample.label === false) {
        TN++;
      }
    }
    const precision = (TP + FP) > 0 ? TP / (TP + FP) : 0;
    const recall = (TP + FN) > 0 ? TP / (TP + FN) : 0;
    const f1 = (precision + recall) > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
    
    console.log(`Threshold: ${threshold}`);
    console.log(`Precision: ${precision.toFixed(2)}`);
    console.log(`Recall: ${recall.toFixed(2)}`);
    console.log(`F1 Score: ${f1.toFixed(2)}\n`);
  }
}

// Uncomment baris di bawah untuk menjalankan evaluasi (pastikan file validasi tersedia)
// const validationDataset = JSON.parse(fs.readFileSync('validationDataset.json', 'utf-8'));
// evaluateThresholds(validationDataset);
