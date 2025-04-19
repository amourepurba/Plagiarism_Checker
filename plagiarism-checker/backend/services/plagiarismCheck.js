const { Stemmer } = require("sastrawijs");
const axios = require("axios");
const sbd = require("sbd");
const pdfParse = require("pdf-parse");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());
const stemmer = new Stemmer();

class plagiarismCheck{
	constructor() {
		this.stopwords = new Set([
			"dan",
			"atau",
			"ke",
			"di",
			"dari",
			"yang",
			"dengan",
			"untuk",
			"dalam",
			"itu",
			"ini",
			"saya",
			"kamu",
			"dia",
			"mereka",
			"kita",
			"adalah",
			"tidak",
			"juga",
			"bisa",
			"pada",
			"sebagai",
			"agar",
			"supaya",
			"jika",
			"karena",
			"sehingga",
			"oleh",
			"bahwa",
			"dll",
			"tsb",
			"dalam",
			"telah",
			"sudah",
			"lagi",
			"hanya",
			"saja",
			"apakah",
			"mengapa",
			"bagaimana",
			"kemudian",
			"saat",
			"sejak",
			"sebelum",
			"sesudah",
			"antara",
			"dapat",
			"ini",
			"itu",
		]);
		this.browser = null;
    	this.initializeBrowser();
	}

	async initializeBrowser() {
		try {
		  this.browser = await puppeteer.launch({
			headless: true,
			args: ['--no-sandbox', '--disable-setuid-sandbox']
		  });
		} catch (error) {
		  console.error("Gagal inisialisasi browser:", error);
		}
	  }

	// ================== 1. Preprocessing Teks ==================
	tokenizeText(text) {
		const tokens = (text || "")
			.toLowerCase()
			.replace(/[^\w\s]/g, "")
			.split(/\s+/)
			.filter((token) => token && !this.stopwords.has(token));

		// Ganti Porter Stemmer dengan Sastrawi
		return tokens.map((token) => stemmer.stem(token)); // MODIFIKASI BARIS INI
	}

	// ================== 2. N-Gram Fleksibel ==================
	getNGrams(tokens, minN = 2, maxN = 5) {
		const ngrams = [];
		for (let n = minN; n <= maxN; n++) {
			if (tokens.length >= n) {
				for (let i = 0; i <= tokens.length - n; i++) {
					ngrams.push(tokens.slice(i, i + n).join(" "));
				}
			}
		}
		return ngrams;
	}

	getTokensAndNGrams = (text) => {
		const tokens = this.tokenizeText(text);
		const ngrams = this.getNGrams(tokens);
		return tokens.concat(ngrams);
	};

	// ================== 3. Fungsi TF, TF-IDF, dan Normalisasi ==================
	computeTF(tokens) {
		return tokens.reduce((acc, token) => {
			acc[token] = (acc[token] || 0) + 1;
			return acc;
		}, {});
	}

	normalizeTF(tf) {
		const maxFreq = Math.max(...Object.values(tf));
		if (maxFreq === 0) return tf;
		Object.keys(tf).forEach((word) => {
			tf[word] /= maxFreq;
		});
		return tf;
	}

	computeTFIDFForPair(tokens1, tokens2) {
		let tf1 = this.computeTF(tokens1);
		let tf2 = this.computeTF(tokens2);
		const allTokens = new Set([...Object.keys(tf1), ...Object.keys(tf2)]);
		const idf = {};
		allTokens.forEach((token) => {
			let count = 0;
			if (tokens1.includes(token)) count++;
			if (tokens2.includes(token)) count++;
			idf[token] = Math.log((2 + 1) / (count + 1)) + 1;
		});
		for (let token in tf1) {
			tf1[token] *= idf[token];
		}
		for (let token in tf2) {
			tf2[token] *= idf[token];
		}
		tf1 = this.normalizeTF(tf1);
		tf2 = this.normalizeTF(tf2);
		return [tf1, tf2];
	}

	// ================== 4. Cosine Similarity ==================
	cosineSimilarityTF(tf1, tf2) {
		let dotProduct = 0;
		let mag1 = 0;
		let mag2 = 0;
		const allTokens = new Set([...Object.keys(tf1), ...Object.keys(tf2)]);
		allTokens.forEach((token) => {
			const a = tf1[token] || 0;
			const b = tf2[token] || 0;
			dotProduct += a * b;
			mag1 += a * a;
			mag2 += b * b;
		});
		return mag1 === 0 || mag2 === 0 ? 0 : dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
	}

	// ================== 5. Adaptive Threshold ==================
	determineThreshold(similarities) {
		if (similarities.length === 0) return 0.5;
		const avgSim = similarities.reduce((sum, val) => sum + val, 0) / similarities.length;
		return Math.max(0.3, Math.min(avgSim, 0.7));
	}

	// ================== 6. Pengambilan Konten Web ==================
	async fetchPageContent(url) {
		if (url.toLowerCase().endsWith('.pdf')) {
		  try {
			const response = await axios.get(url, { 
			  responseType: 'arraybuffer', 
			  timeout: 60000 
			});
			const pdfData = await pdfParse(response.data);
			return pdfData.text?.length > 10 ? pdfData.text : null;
		  } catch (error) {
			return null;
		  }
		}
	
		let page;
		try {
		  if (!this.browser) await this.initializeBrowser();
		  page = await this.browser.newPage();
		  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0");
		  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
		  
		  const content = await page.evaluate(() => {
			const paragraphs = Array.from(document.querySelectorAll('p')).map(el => el.innerText);
			return paragraphs.join(' ').trim();
		  });
		  
		  return content?.length > 10 ? content : null;
		} catch (error) {
		  return null;
		} finally {
		  if (page) await page.close();
		}
	  }

	// ================== 7. Pemisahan Kalimat ==================
	splitIntoSentences(text) {
		return sbd
			.sentences(text, {
				newline_boundaries: true,
				sanitize: true,
				allowed_tags: false,
			})
			.filter((s) => s.trim().length > 0);
	}

	async checkPlagiarismPerURL(queryText) {
		const originalText = queryText || "";
		const processedTokens = this.tokenizeText(originalText); // Sudah include stemming
		const tf = this.computeTF(processedTokens);
		const totalTerms = processedTokens.length;
		const sortedTerms = Object.entries(tf).sort((a, b) => b[1] - a[1]);
		const topKeywords = sortedTerms.slice(0, 5).map(([term, count]) => ({
			keyword: term,
			percentage: totalTerms > 0 ? ((count / totalTerms) * 100).toFixed(2) : "0",
		}));

		if (!queryText || typeof queryText !== "string" || queryText.trim().length < 10) {
			return {
				results: [],
				error: "Teks harus lebih dari 10 karakter",
				originalText: originalText,
				topKeywords,
			};
		}

		try {
			const apiResponse = await axios.post(process.env.API_URL, {
				secretCode: process.env.SECRET_CODE,
				payload: [
					{
						language_name: "Indonesian",
						location_code: 1002353,
						keyword: originalText.substring(0, 255),
					},
				],
			});

			const tasks = apiResponse.data?.tasks;
			if (!tasks || tasks.length === 0)
				return { results: [], originalText: originalText, topKeywords };
			const resultsApi = tasks[0]?.result;
			if (!resultsApi || resultsApi.length === 0)
				return { results: [], originalText: originalText, topKeywords };

			const urls = resultsApi
				.flatMap((result) => result.items.map((item) => item.url))
				.filter((url) => url);
			if (urls.length === 0) return { results: [], originalText: originalText, topKeywords };

			const inputSentences = this.splitIntoSentences(originalText);
			const inputVectors = inputSentences.map((sentence) => this.getTokensAndNGrams(sentence));

			const resultsPerURL = await Promise.all(
				urls.map(async (url) => {
					const content = await this.fetchPageContent(url);
					if (!content) return null;

					const targetSentences = this.splitIntoSentences(content);
					const targetVectors = targetSentences.map((sentence) => this.getTokensAndNGrams(sentence));

					const maxSims = inputVectors.map((inputTokens) => {
						let maxSim = 0;
						targetVectors.forEach((targetTokens) => {
							const [tfInput, tfTarget] = this.computeTFIDFForPair(inputTokens, targetTokens);
							const sim = this.cosineSimilarityTF(tfInput, tfTarget);
							if (sim > maxSim) maxSim = sim;
						});
						return maxSim;
					});

					const plagiarizedCount = maxSims.filter((sim) => sim >= this.determineThreshold(maxSims)).length;
					const sumSimilarity = maxSims.reduce((sum, sim) => sum + sim, 0);
					const avgSimilarity = maxSims.length > 0 ? sumSimilarity / maxSims.length : 0;
					const plagiarizedFraction =
						inputSentences.length > 0 ? plagiarizedCount / inputSentences.length : 0;
					const compositeScore = Math.min(
						Math.round(((plagiarizedFraction + avgSimilarity) / 2) * 100),
						100
					);

					return {
						url,
						plagiarismScore: compositeScore,
						details: {
							totalInputSentences: inputSentences.length,
							plagiarizedCount,
							avgSimilarity: avgSimilarity.toFixed(2),
							plagiarizedFraction: (plagiarizedFraction * 100).toFixed(2) + "%",
						},
					};
				})
			);

			const validResults = resultsPerURL.filter((result) => result !== null);
			// sorting output
			validResults.sort((a, b) => b.plagiarismScore - a.plagiarismScore);

			return {
				results: validResults,
				originalText: originalText,
				topKeywords,
				error: null,
			};
		} catch (error) {
			return {
				results: [],
				error: error.message,
				originalText: originalText,
				topKeywords,
			};
		}
	}
}
process.on('SIGINT', async () => {
	const instance = new PlagiarismCheck();
	if (instance.browser) {
	  await instance.browser.close();
	}
	process.exit(0);
  });
	
module.exports = new plagiarismCheck();
