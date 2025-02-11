<template>
  <div class="container">
    <!-- Header Section -->
    <header class="header">
      <nav class="navbar navbar-expand-lg bg-body-tertiary">
        <div class="container-fluid">
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarTogglerDemo03" aria-controls="navbarTogglerDemo03" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>
          <img src="../assets/logo-blue.png" alt="cmlabs logo" class="logo" />
          <div class="collapse navbar-collapse" id="navbarTogglerDemo03">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
              <li class="nav-item">
                <a class="nav-link active" href="#">Plagiarism Checker</a>
              </li>
              <li class="nav-item">
                <a class="nav-link active" aria-current="page" href="#">How To Use</a>
              </li>
              <li class="nav-item">
                <a class="nav-link active" aria-disabled="true">Contact Us</a>
              </li>
            </ul>
            <form class="d-flex" role="login">
              <button class="btn btn-outline-success d-flex align-items-center" type="submit">
                Login
                <i class="fa-solid fa-arrow-right-to-bracket" style="color: #000000; margin: 5px;"></i>              </button>
            </form>
          </div>
        </div>
      </nav>
    </header>

    <!-- Input Section -->
    <div class="main-content">
      <div class="container-option mt-4 text-center">
        <ul class="nav nav-pills d-inline-flex align-items-center justify-content-center mb-3 gap-2">
          <li class="nav-item">
            <button class="nav-link tab-button" :class="{ active: activeTab === 'text' }" @click="activeTab = 'text'">
              Text
            </button>
          </li>
          <li class="nav-item">
            <button class="nav-link tab-button" :class="{ active: activeTab === 'file' }" @click="activeTab = 'file'">
              File
            </button>
          </li>
          <li class="nav-item">
            <button class="nav-link tab-button" :class="{ active: activeTab === 'url' }" @click="activeTab = 'url'">
              URL
            </button>
          </li>
          <!-- Language Dropdown -->
          <li class="nav-item">
            <div class="dropdown-container">
              <select class="form-control dropdown" @change="changeLanguage($event)">
                <option value="id">Indonesia</option>
                <option value="en">English</option>
                <option value="tr">Turkish</option>
                <option value="th">Thailand</option>
                <option value="es">Español</option>
                <option value="sg">Singapore</option>
              </select>
            </div>
          </li>
        </ul>

        <!-- Dynamic Input Section -->
        <div class="input-container d-flex flex-column align-items-center">
          <div v-if="activeTab === 'text'" class="input-box input-text">
            <textarea v-model="inputValue" class="form-control input-field" rows="6" placeholder="Enter your text here..."></textarea>
            <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
            <button class="btn btn-check mt-2" @click="checkAction">Check Plagiarism</button>
          </div>

          <div v-else-if="activeTab === 'file'" class="input-box input-file">
            <input type="file" @change="handleFileUpload" class="form-control input-field" accept=".pdf, .doc, .docx" />
            <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
            <button class="btn btn-check mt-2" @click="checkAction">Check Plagiarism</button>
          </div>

          <div v-else-if="activeTab === 'url'" class="input-box input-url">
            <input v-model="inputValue" type="url" class="form-control input-field" style="text-align: center;" placeholder="Enter your URL here..." />
            <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
            <button class="btn btn-check mt-2" @click="checkAction">Check Plagiarism</button>
          </div>
        </div>


        <!-- Output Section -->
        <div v-if="showOutput" class="output-container">
          <h2>Result</h2>
          <div class="row">
              <!-- Left Column: Scores -->
              <div class="col left-section">
                <div class="score-item">
                  <p class="text-center text-xl text-red-600">{{ similarityScore }}%</p>
                  <p class="text-center text-gray-700">Skor Plagiasi</p>
                </div>
                <div class="score-item">
                  <p class="text-center text-xl text-green-600">{{ uniqueScore }}%</p>
                  <p class="text-gray-700">Skor Uniq</p>
                </div>
                <div class="score-item">
                  <p class="text-center text-xl text-blue-600">{{ readabilityScore }}%</p>
                  <p class="text-gray-700">Skor Readability</p>
                </div>
              </div>
            
              
              <!-- Right Column: Keywords & Plagiarized Sites -->
              <div class="col right-section">
                  <div>
                      <h5 class="text-center text-gray-700">Top 5 Keywords</h5>
                      <ul class="list-disc list-inside text-gray-700 text-center">
                          <li v-for="(keyword, index) in topKeywords" :key="index">{{ keyword }}</li>
                      </ul>
                  </div>
                  <div class="mt-4">
                      <h5 class="text-center text-gray-700">Plagiarized Sites</h5>
                      <ul class="list-disc list-inside text-red-500 text-center">
                          <li v-for="(site, index) in sources" :key="index">{{ site }}</li>
                      </ul>
                  </div>
              </div>
          </div>
      </div>
    </div>
  </div>
  

  <!-- How To Use Section -->
  <!-- <div class="container-use"> -->
    <div class="container-use text-center">
      <h1 class="title">How to Use Plagiarism Checker</h1>
      <div class="row-use align-items-start">
        <div class="col">
          <h3>1</h3>
          <p><strong>Get a subscription</strong><br> Choose any premium plan to enjoy all of JustDone's tools and features, including our Plagiarism Checker.</p>
        </div>
        <div class="col">
          <h3>2</h3>
          <p><strong>Provide details</strong><br> Paste your text, url, or upload a file in PDF, DOC, or DOCX format.</p>
        </div>
        <div class="col">
          <h3>3</h3>
          <p><strong>View the report</strong><br> Receive an extensive report in just minutes to view any potential plagiarism and relevant source links.</p>
        </div>
      </div>
    </div>
  <!-- </div> -->

      <!-- footer section -->
      <footer class="footer">
        <div class="footer-content">
          <!-- Column 1: Languages & Supervene -->
          <div class="footer-column">
            <div class="language-section">
              <div class="language-list">
                <button class="language-btn">English</button>
                <button class="language-btn">Indonesian</button>
                <button class="language-btn">Turkish</button>
                <button class="language-btn">Singapore</button>
                <button class="language-btn">Thailand</button>
                <button class="language-btn">Español</button>
              </div>
            </div>

            <div class="supervene-section">
              <h4 class="footer-title">SUPERVENE SEARCH ODYSSEY</h4>
              <div class="contact-address">
                <p>cmlabs Jakarta</p>
                <p>Jl. Pluit Kencana Raya No.63, Pluit,</p>
                <p>Penjaringan, Jakarta Utara,</p>
                <p>DKI Jakarta, 14450, Indonesia</p>
                <p class="phone-number">(+62) 21-666-04470</p>
              </div>
            </div>
          </div>

          <!-- Column 2: Solutions & Information -->
          <div class="footer-column">
            <div class="solutions-section">
              <h4 class="footer-title">Solutions</h4>
              <div class="footer-links">
                <a href="#">SEO Services</a>
                <a href="#">SEO Writing</a>
                <a href="#">Media Buying</a>
              </div>
            </div>

            <div class="information-section">
              <h4 class="footer-title">Information</h4>
              <div class="footer-links">
                <a href="#">Notification Center</a>
                <a href="#">Client's Testimony</a>
                <a href="#">FAQ of cmlabs Services</a>
              </div>
            </div>
          </div>

          <!-- Column 3: Company -->
          <div class="footer-column">
            <div class="company-section">
              <h4 class="footer-title">Company</h4>
              <div class="footer-links">
                <a href="#">About cmlabs</a>
                <a href="#">Contact Us</a>
                <a href="#">Career</a>
                <a href="#">Press Release</a>
                <a href="#">Whistleblower Protection</a>
              </div>
            </div>
          </div>

          <!-- Column 4: Cost-Effective Fees -->
          <div class="footer-column">
            <div class="partnership-section">
              <h4 class="footer-title">COST-EFECTIVE FEES, UP TO 5%</h4>
              <h4 class="footer-subtitle">WE ARE OPEN TO PARTNERSHIP WITH VARIOUS NICHES</h4>
              <div class="partnership-list">
                <a href="#">Franchise Organizations</a>
                <a href="#">Educational Institutions</a>
                <a href="#">Professional Services Firms</a>
                <a href="#">Startup Incubators / Accelerators</a>
                <a href="#">...and 34 more</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
  </div>
</template>



<script>
export default {
  data() {
    return {
      activeTab: 'text',
      inputValue: '',
      showOutput: false,
      errorMessage: '',
      similarityScore: 0,
      uniqueScore: 0,
      readabilityScore: 0,
      topKeywords: [],
      sources: [],
    };
  },
  watch: {
    activeTab() {
      this.errorMessage = '';
      this.inputValue = '';
      this.showOutput = false; // Pastikan output disembunyikan saat tab berubah
    }
  },
  methods: {
    validateInput() {
      if (this.activeTab === 'text' && this.inputValue.trim() === '') {
        this.errorMessage = 'Input tidak boleh kosong!';
        return false;
      }
      if (this.activeTab === 'url' && !this.inputValue.match(/^https?:\/\/[^\s$.?#].[^\s]*$/)) {
        this.errorMessage = 'URL tidak valid!';
        return false;
      }
      if (this.activeTab === 'file' && !this.inputValue) {
        this.errorMessage = 'Silakan unggah file!';
        return false;
      }
      this.errorMessage = '';
      return true;
    },
    checkAction() {
      if (!this.validateInput()) {
        return;
      }
      console.log("Tombol Check diklik!");
      this.similarityScore = Math.floor(Math.random() * 100);
      this.uniqueScore = Math.floor(Math.random() * 100);
      this.readabilityScore = Math.floor(Math.random() * 100);
      this.topKeywords = ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"];
      this.sources = [
        "https://example.com/article1",
        "https://example.com/article2",
        "https://example.com/article3",
      ];
      this.showOutput = true;
      console.log("Output ditampilkan:", this.showOutput);
    },
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (file) {
        const allowedExtensions = ['pdf', 'doc', 'docx'];
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (!allowedExtensions.includes(fileExtension)) {
          this.errorMessage = 'Format file tidak valid!';
          this.inputValue = '';
          return;
        }
        this.inputValue = file.name;
        this.errorMessage = '';
      }
    }
  }
};
</script>



<style scoped>

* {
  box-sizing: border-box;
}

.container {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0;
  min-height: 100vh; /* Memastikan container mengambil seluruh tinggi layar */
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #ffffff;
  gap: 9px;
}

.header {
  width: 100%;
  position: sticky; /* Membuat header sticky */
  top: 0; /* Menempel di bagian atas */
  z-index: 1000; /* Memastikan header selalu di atas elemen lain */
  background-color: #ffffff; /* Warna background header */
}

.navbar {
  background-color: #ffffff !important;
  padding: 20px;
}

.navbar .nav-link {
  color: #000000 !important;
  font-weight: 500;
  /* transition: 0.3s; */
  margin-left: 9px;
  font-size: 16px;
}

.navbar .nav-link:hover {
  text-decoration: underline;
  cursor: pointer;
}

.navbar .btn-outline-success {
  color: #000000;
  background-color: transparent;
  border: none;
  padding: 0;
  font-weight: 700;
}

.navbar .btn-outline-success:hover {
  cursor: pointer;
  text-decoration: underline;
}

.navbar img {
  width: 15%;
  margin-right: 25px;
}


/* Input Section */
.main-content {
  flex: 1;
  width: 100%;
  padding-bottom: 25px;
  /* height: 20vh; */
  /* display: flex; */
  /* flex-direction: column; */
  /* grid-template-columns: 1fr 1fr;
  align-items: center;
  justify-content: center; */
}

.container-option {
  min-height: 60vh; /*  Memberikan ruang default saat output belum tampil */
  display: flex;
  /* height: 63vh; */
  flex-direction: column;
  align-items: center;
}

/* Tab Button Styles */
.tab-button {
  font-size: 16px;
  padding: 5px 20px;
  border-radius: 5px;
  margin: 0 5px;
  color: #353535;
  background-color: #eaeaea;
  border: none;
}

.tab-button.active {
  background-color: #18A0FB;
  color: white;
}

.tab-button:hover {
  transition: background-color 0.3s, color 0.3s;
  background-color: #1167c2;
  color: white;
}

/* Dropdown Styles */
.dropdown-container {
  margin: 0;
}

.dropdown {
  font-size: 14px;
  padding: 5px 25px;
  border: 2px solid #ccc;
  border-radius: 5px;
  background-color: white;
  appearance: none;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="%23007bff" d="M7 10l5 5 5-5z"/></svg>');
  background-repeat: no-repeat;
  background-position: right 5px center;
  background-size: 16px;
}

.dropdown:focus {
  border-color: #007bff;
  outline: none;
}

/* Input Box Style */
.input-container {
  width: 100%;
  max-width: 700px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center; /* Memastikan tombol tidak tertumpuk */
  min-height: 200px; /* Berikan cukup ruang untuk tombol */
}

.input-box {
  width: 100%;
  /* max-width: 700px; */
  display: flex;
  flex-direction: column;
  align-items: center;
}

.input-text {
  width: 150%;
  height: 500px; 
}

.input-file {
  width: 70%;
  height: auto; 
}

.input-url {
  width: 80%;
  height: 70px; 
}

/* Input Field Styling */
.input-field {
  width: 100%;
  padding: 15px;
  margin-bottom: 10px;
  border: 2px solid #ccc;
  border-radius: 25px;
  transition: border-color 0.3s;
  font-size: 16px;
  height: 100%; 
}

.input-field:focus {
  border-color: #007bff;
  outline: none;
  box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
}

textarea.input-field {
  resize: vertical;
  min-height: 150px;
  max-height: 400px;
}

.error-text {
  color: red;
  font-size: 14px;
  margin-top: 5px;
}



/* Button Styles */
.text-center.mt-4 {
  width: 100%;
  margin: 30px 0;
  cursor: pointer;
}

.btn-check {
  background-color: #18A0FB;
  color: white;
  padding: 10px 30px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
  position: relative; /* Memastikan tombol berada di atas elemen lain */
  z-index: 10; /* Menjadikan tombol di atas elemen lain jika ada overlap */
  pointer-events: auto; /* Memastikan tombol bisa diklik */
  /* margin-top: 10px; */
  /* width: 100%; */
  /* max-width: 200px;
  text-align: center; */
}

.btn-check:hover {
  background-color: #1167c2;
  transition: background-color 0.3s, color 0.3s;
}


/* Output */
.output-container {
  width: 100%;
  background-color: #f8fafc;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  font-family: 'Arial', sans-serif;
  min-height: 200px; /* Beri ruang minimum untuk output */
  margin-top: 10px;
  clear: both;
}

.output-container.show {
  display: block; /* Tampilkan saat output ada */
  flex-grow: 1; /* Output akan mengisi ruang yang tersedia */
}

h2 {
    text-align: center;
    font-size: 1.7rem;
    font-weight: 700;
    color: #333;
    margin-bottom: 20px;
}

.row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5px;
    border-top: 2px solid #d1d5db;
    padding-top: 16px;
}

.left-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
}

.right-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
}

.text-xl {
    font-size: 1.4rem;
    font-weight: 600;
}  
  
.text-red-600 {  
  color: #dc2626;
}

.text-green-600 {
    color: #16a34a;
}

.text-blue-600 {
    color: #2563eb;
}

.list-disc {
    list-style-type: disc;
    padding-left: 10px;
}

.list-inside {
    list-style-position: inside;
}

.text-red-500 {
    color: #ef4444;
}


/* Hot To Use Style */
.container-use {
  width: 100%;
  text-align: center;
  padding: 40px;
  background-color: #f9f9f9;
}

.title {
  font-size: 34px;
  font-weight: bold;
  margin-bottom: 20px;
}

.row-use {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 20px;
  flex-wrap: wrap;
}

.row-use .col {
  flex: 1 1 calc(33.333% - 20px); 
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 300px;
  text-align: center;
  /* max-width: 30%; */
  min-width: 250px;
}

h3 {
  font-size: 28px;
  color: #007bff;
  margin-bottom: 10px;
}

p {
  font-size: 16px;
  color: #333;
}



.footer {
  background-color: #f8f9fa;
  padding: 50px 20px;
  margin-top: auto;
  text-align: center;
  width: 100%;
  position: relative;
}


.footer-content {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 2fr;
  gap: 50px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Column 1: Languages & Supervene */
.footer-column:first-child {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-right: 40px;
}

.language-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.language-btn {
  background: #ffffff;
  color: #2d2d2d;
  border: 1px solid #ddd;
  padding: 8px 8px;
  border-radius: 10px;
  font-size: 12px;
  text-align: center;
  transition: all 0.3s;
}

.language-btn:hover {
  background: #18A0FB;
  color: white;
}

.supervene-section {
  margin-top: 20px;
  margin-right: 10px;
}

/* Column 2: Solutions & Information */
.footer-column:nth-child(2) {
  display: flex;
  flex-direction: column;
  gap: 30px;
  padding-left: 40px;
}

/* Column 3: Company */
.footer-column:nth-child(3) {
  padding-left: 30px;
}

/* Column 4: Partnerships */
.footer-column:last-child {
  background-color: #f0f4f7;
  padding: 30px;
  border-radius: 10px;
  margin: 10px 70px;
}

/* Align footer titles and content to the left */
.footer-title {
  color: #2d2d2d;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 15px;
  text-transform: uppercase;
  text-align: left; /* Align to left */
}

.footer-subtitle {
  color: #5f5f5f;
  font-size: 14px;
  margin: 15px 0;
  line-height: 1.4;
  text-align: left; /* Align to left */
}

.footer-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-weight: 500;
  text-align: left; /* Align to left */
}

.footer-links a {
  color: #5f5f5f;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s;
  text-align: left; /* Align to left */
}

.contact-address {
  color: #5f5f5f;
  font-size: 14px;
  line-height: 1;
  font-weight: 500;
  text-align: left; /* Align to left */
}

.phone-number {
  color: #18A0FB;
  font-weight: 600;
  margin-top: 10px;
  text-align: left; /* Align to left */
}

.partnership-list {
  display: grid;
  gap: 10px;
}

.partnership-list a {
  color: #5f5f5f;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s;
  text-align: left; /* Align to left */
}


</style>
