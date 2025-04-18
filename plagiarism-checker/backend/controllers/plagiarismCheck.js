const plagiarismCheckService = require("../services/plagiarismCheck");
const pdfParse = require("pdf-parse");

exports.checkText = async (req, res) => {
	const text = req.body?.text?.trim();
	const result = await plagiarismCheckService.checkPlagiarismPerURL(text);
	res.json(result);
};

exports.checkFile = async (req, res) => {
	if (!req.file) return res.status(400).json({ error: "File tidak ditemukan" });

	let fileContent = "";
	if (req.file.mimetype === "application/pdf") {
		try {
			const pdfData = await pdfParse(req.file.buffer);
			fileContent = pdfData.text;
		} catch (error) {
			return res.status(500).json({ error: "Gagal memproses file PDF" });
		}
	} else {
		fileContent = req.file.buffer.toString("utf-8");
	}

	const result = await plagiarismCheckService.checkPlagiarismPerURL(fileContent);
	res.json(result);
};

exports.checkUrl = async (req, res) => {
	let url = req.body?.url?.trim();
	if (!url) return res.status(400).json({ error: "URL tidak valid" });
	if (!/^https?:\/\//i.test(url)) {
		url = "http://" + url;
	}
	const content = await plagiarismCheckService.fetchPageContent(url);
	if (!content) return res.status(500).json({ error: "Tidak dapat mengambil konten dari URL" });
	const result = await plagiarismCheckService.checkPlagiarismPerURL(content);
	res.json(result);
};
