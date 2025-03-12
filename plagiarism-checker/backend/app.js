const express = require('express');
const axios = require('axios');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const sbd = require('sbd'); // Pastikan paket ini sudah terinstall (npm install sbd)
const multer = require('multer');
const pdfParse = require('pdf-parse'); // Untuk ekstraksi PDF
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
async function fetchPageContent(url) {
  // Jika URL mengarah ke file PDF, lakukan download dan parsing PDF
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
    // Jika URL bukan PDF, gunakan Puppeteer untuk mengambil konten halaman
    let page;
    try {
      page = await browser.newPage();
      await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0");
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      const content = await page.evaluate(() => document.body.innerText.trim());
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

// --- Fungsi Pengecekan Plagiasi yang Ditingkatkan ---
const THRESHOLD = 0.5;
async function checkPlagiarismImproved(queryText) {
  if (!queryText || typeof queryText !== 'string' || queryText.trim().length < 10) {
    return { sources: [], plagiarismScore: 0, error: "Teks tidak valid" };
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
    if (!tasks || tasks.length === 0) return { sources: [], plagiarismScore: 0 };
    const results = tasks[0]?.result;
    if (!results || results.length === 0) return { sources: [], plagiarismScore: 0 };

    const urls = results
      .flatMap(result => result.items.map(item => item.url))
      .filter(url => url);
    if (urls.length === 0) return { sources: [], plagiarismScore: 0 };

    // Pisahkan kalimat dari teks input dan precompute TF untuk setiap kalimat
    const inputSentences = splitIntoSentences(queryText);
    const inputTFs = inputSentences.map(sentence => computeTFForSentence(sentence));

    // Simpan nilai similarity maksimum per kalimat input
    const overallMaxSim = Array(inputSentences.length).fill(0);

    // Proses setiap URL secara paralel
    const pageContents = await Promise.all(urls.map(async (url) => {
      const content = await fetchPageContent(url);
      if (!content) return null;
      const targetSentences = splitIntoSentences(content);
      const targetTFs = targetSentences.map(sentence => computeTFForSentence(sentence));
      const matchingSentences = [];

      // Bandingkan setiap kalimat input dengan setiap kalimat target
      inputTFs.forEach((inputTF, index) => {
        let maxSimForSentence = 0;
        let matchingTarget = null;
        targetTFs.forEach((targetTF, j) => {
          const sim = cosineSimilarityTF(inputTF, targetTF);
          if (sim > maxSimForSentence) {
            maxSimForSentence = sim;
            matchingTarget = targetSentences[j];
          }
        });
        overallMaxSim[index] = Math.max(overallMaxSim[index], maxSimForSentence);
        if (maxSimForSentence > THRESHOLD) {
          matchingSentences.push({
            inputSentence: inputSentences[index],
            matchingSentence: matchingTarget,
            similarity: maxSimForSentence
          });
        }
      });
      return { url, snippet: content.substring(0, 100) + '...', matchingSentences };
    }));

    const validPageContents = pageContents.filter(result => result !== null);

    // Hitung metrik plagiasi
    const plagiarizedCount = overallMaxSim.filter(sim => sim > THRESHOLD).length;
    const sumSimilarity = overallMaxSim.reduce((sum, sim) => sum + sim, 0);
    const avgSimilarity = overallMaxSim.length > 0 ? sumSimilarity / overallMaxSim.length : 0;
    const plagiarizedFraction = inputSentences.length > 0 ? plagiarizedCount / inputSentences.length : 0;
    const compositeScore = Math.min(Math.round(((plagiarizedFraction + avgSimilarity) / 2) * 100), 100);

    return {
      sources: validPageContents,
      plagiarismScore: compositeScore,
      details: {
        totalInputSentences: inputSentences.length,
        plagiarizedCount,
        avgSimilarity: avgSimilarity.toFixed(2),
        plagiarizedFraction: (plagiarizedFraction * 100).toFixed(2) + '%'
      }
    };

  } catch (error) {
    return { sources: [], plagiarismScore: 0, error: error.message };
  }
}

// --- Endpoint untuk cek teks biasa ---
app.post('/check-text', async (req, res) => {
  const text = req.body?.text?.trim();
  if (!text || text.length < 10) return res.status(400).json({ error: "Teks harus lebih dari 10 karakter" });
  const result = await checkPlagiarismImproved(text);
  res.json(result);
});

// --- Endpoint untuk cek file unggahan (teks atau PDF) ---
app.post('/check-file', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "File tidak ditemukan" });
  
  let fileContent = '';
  // Cek apakah file merupakan PDF berdasarkan mimetype atau ekstensi
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
  const result = await checkPlagiarismImproved(fileContent);
  res.json(result);
});

// --- Endpoint untuk cek URL ---
app.post('/check-url', async (req, res) => {
  const url = req.body?.url?.trim();
  if (!url) return res.status(400).json({ error: "URL tidak valid" });
  const content = await fetchPageContent(url);
  if (!content) return res.status(500).json({ error: "Tidak dapat mengambil konten dari URL" });
  const result = await checkPlagiarismImproved(content);
  res.json(result);
});

// Penutupan browser dengan baik saat SIGINT
process.on('SIGINT', async () => {
  if (browser) await browser.close();
  process.exit(0);
});

app.listen(port, () => console.log(`Server berjalan di http://localhost:${port}`));
