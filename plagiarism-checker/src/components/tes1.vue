<template>
  <div class="container">
    <!-- Header Section -->
    <header class="header">
      <nav class="navbar navbar-expand-lg bg-body-tertiary">
        <div class="container-fluid">
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse"
                  data-bs-target="#navbarTogglerDemo03" aria-controls="navbarTogglerDemo03"
                  aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>

          <!-- Logo -->
          <router-link to="/">
            <img src="../assets/logo-blue.png" alt="cmlabs logo" class="logo"/>
          </router-link>

          <!-- Menu -->
          <div class="collapse navbar-collapse" id="navbarTogglerDemo03">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
              <li class="nav-item">
                <a class="nav-link active" href="#plagiarism-checker">Plagiarism Checker</a>
              </li>
              <li class="nav-item">
                <a class="nav-link active" aria-current="page" href="#how-to-use">How To Use</a>
              </li>
              <li class="nav-item">
                <a class="nav-link active" aria-disabled="true" href="#contact-us">Contact Us</a>
              </li>
            </ul>

            <!-- Foto Profil dan Username atau Tombol Login -->
            <div v-if="isAuthenticated" class="user-profile" :class="{ active: showDropdown }" @click="toggleDropdown">
              <img :src="user.avatar" alt="User Avatar" class="rounded-circle me-2" />
              <span class="me-2">{{ user.username }}</span>
              <!-- Dropdown Logout -->
              <div v-if="showDropdown" class="dropdown-menu">
                <button class="btn btn-outline-danger" @click.stop="logout">Logout</button>
              </div>
            </div>
            <router-link v-else to="/auth" class="btn btn-outline-success">
              Login
              <i class="fa-solid fa-arrow-right-to-bracket" style="color: #18a0fb; padding-left: 5px;"></i>
            </router-link>
          </div>
        </div>
      </nav>
    </header>
    
    <!-- Input Section -->
    <div class="main-content" id="plagiarism-checker">
      <h1>Plagiarism Checker</h1>
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
          <!-- Dropdown untuk Bahasa -->
          <li class="nav-item">
            <div class="dropdown-container">
              <select class="form-control dropdown" v-model="selectedLanguage">
                <option value="indonesian">Indonesia</option>
                <option value="english">English</option>
                <option value="turkish">Turkish</option>
                <option value="spanish">Spanish</option>
                <option value="french">French</option>
                <option value="german">German</option>
              </select>
            </div>
          </li>
        </ul>

        <!-- Dynamic Input Section -->
    <div class="input-container d-flex flex-column align-items-center">
      <!-- Tab Text -->
      <div v-if="activeTab === 'text'" class="input-box input-text">
        <textarea
          v-model="textInput"
          class="form-control input-field"
          rows="6"
          placeholder="Enter your text here..."
        ></textarea>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        <button class="btn btn-check mt-2" @click="checkAction" :disabled="isLoading">
          <span v-if="isLoading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          <span v-else>Check Plagiarism</span>
        </button>
      </div>

      <!-- Tab File -->
      <div v-else-if="activeTab === 'file'" class="input-box input-file">
        <template v-if="showOutput && activeTab === 'file'">
          <textarea
            v-model="fileOutput"
            class="form-control input-field output-textarea"
            rows="6"
            readonly
          ></textarea>
        </template>
        <template v-else>
          <input
            type="file"
            @change="handleFileUpload"
            class="form-control input-field"
            accept=".pdf, .doc, .docx"
          />
        </template>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        <button class="btn btn-check mt-2" @click="checkAction" :disabled="isLoading">
          <span v-if="isLoading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          <span v-else>Check Plagiarism</span>
        </button>
      </div>

      <!-- Tab URL -->
      <div v-else-if="activeTab === 'url'" class="input-box input-url">
        <template v-if="showOutput && activeTab === 'url'">
          <textarea
            v-model="urlOutput"
            class="form-control input-field output-textarea"
            rows="6"
            readonly
          ></textarea>
        </template>
        <template v-else>
          <input
            v-model="urlInput"
            type="url"
            class="form-control input-field"
            style="text-align: center;"
            placeholder="Enter your URL here..."
          />
        </template>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        <button class="btn btn-check mt-2" @click="checkAction" :disabled="isLoading">
          <span v-if="isLoading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          <span v-else>Check Plagiarism</span>
        </button>
      </div>
    </div>

        <!-- Animasi Loading -->
        <div v-if="isLoading" class="loading-container">
          <div class="spinner"></div>
          <p>Checking for plagiarism...</p>
        </div>

        <!-- Output Section -->
        <div v-if="showOutput" class="output-container" ref="resultSection">
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
    <div class="container-use text-center" id="how-to-use" ref="howToUseSection" :class="{ 'visible': isVisible, 'hidden': !isVisible }">
      <h1 class="title">How to Use Plagiarism Checker</h1>
      <div class="row-use align-items-start">
        <div class="col">
          <h3>1</h3>
          <p><strong>Get a subscription</strong><br> Choose any premium plan to enjoy all of JustDone's tools and features, including our Plagiarism Checker.</p>
        </div>
        <div class="col">
          <h3>2</h3>
          <p><strong>Provide details</strong><br> Paste your text, URL, or upload a file in PDF, DOC, or DOCX format.</p>
        </div>
        <div class="col">
          <h3>3</h3>
          <p><strong>View the report</strong><br> Receive an extensive report in just minutes to view any potential plagiarism and relevant source links.</p>
        </div>
      </div>
    </div>

    <!-- Contact Us Section -->
    <div class="contact-us-container" id="contact-us" ref="contactSection" :class="{ 'visible': isVisible }">
      <div class="contact-text">
        <h1 class="contact-title">Contact Us</h1>
        <p class="contact-description">Have questions or need help? Reach out to us!</p>
      </div>

      <!-- Notifikasi -->
      <div v-if="notification.message" :class="['notification', notification.type]">
        {{ notification.message }}
      </div>

      <form class="contact-form" :class="{ 'shake': isShaking }" @submit.prevent="validateForm">
        <input type="text" class="contact-input" v-model="name" placeholder="Your Name" :class="{'error-border': showError.name}">
        <input type="email" class="contact-input" v-model="email" placeholder="Your Email" :class="{'error-border': showError.email}">
        <textarea class="contact-textarea" v-model="message" placeholder="Your Message" :class="{'error-border': showError.message}"></textarea>
        <div class="button-container">
          <button type="submit" class="contact-button">Send Message</button>
        </div>
      </form>
    </div>

    <!-- Footer Section -->
    <footer class="footer">
      <div class="footer-content">
        <!-- Column 1: Languages & Supervene -->
        <div class="footer-column">
          <div class="language-section">
            <div class="language-list">
              <button class="language-btn">Indonesian</button>
              <button class="language-btn">English</button>
              <button class="language-btn">Turkish</button>
              <button class="language-btn">Spanish</button>
              <button class="language-btn">French</button>
              <button class="language-btn">German</button>
            </div>
          </div>

          <div class="supervene-section">
            <h4 class="footer-title">SUPERVENE SEARCH ODYSSEY</h4>
            <div class="contact-address">
              <p>cmlabs Jakarta Jl. Pluit Kencana Raya No.63, Pluit, Penjaringan, Jakarta Utara, DKI Jakarta, 14450, Indonesia</p>
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
import { ref, onMounted, onUnmounted, watch } from 'vue';

export default {
  data() {
    return {
      isLoading: false,
      activeTab: 'text',
      textInput: '',
      fileInput: null,
      urlInput: '',
      showOutput: false,
      errorMessage: '',
      similarityScore: 0,
      uniqueScore: 0,
      readabilityScore: 0,
      topKeywords: [],
      sources: [],
      textOutput: '',
      fileOutput: '',
      urlOutput: '',
      selectedLanguage: 'english',
      showDropdown: false
    };
  },


  computed: {
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },
  user() {
    return JSON.parse(localStorage.getItem('user')) || { username: '', avatar: '' };
  }
},


  methods: {
    toggleDropdown() {
      this.showDropdown = !this.showDropdown;
    },

    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.$router.push('/auth');
    },

    validateInput() {
    if (this.activeTab === 'text' && this.textInput.trim().length < 50) {
      this.errorMessage = 'Konten harus lebih dari 50 karakter!';
      return false;
    }
    if (this.activeTab === 'url' && !this.urlInput.match(/^https?:\/\/[^\s$.?#].[^\s]*$/)) {
      this.errorMessage = 'URL tidak valid!';
      return false;
    }
    if (this.activeTab === 'file' && !this.fileInput) {
      this.errorMessage = 'Silakan unggah file!';
      return false;
    }
    this.errorMessage = '';
    return true;
  },

    checkAction() {
      if (!this.validateInput()) return;

      this.isLoading = true;
      this.showOutput = false;
      this.errorMessage = "";

      const apiUrl = "http://localhost:5001/analyze";
      let requestOptions = {};

      if (this.activeTab === 'text') {
        requestOptions = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            input_type: 'text', 
            text: this.textInput,
            language: this.selectedLanguage 
          })
        };
      } else if (this.activeTab === 'url') {
        requestOptions = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            input_type: 'url', 
            url: this.urlInput,
            language: this.selectedLanguage 
          })
        };
      } else if (this.activeTab === 'file') {
        const formData = new FormData();
        formData.append("file", this.fileInput);
        formData.append("input_type", "file");
        formData.append("language", this.selectedLanguage);
        requestOptions = { method: 'POST', body: formData };
      }

      fetch(apiUrl, requestOptions)
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            this.errorMessage = data.error;
          } else {
            this.uniqueScore = data.uniqueness_score;
            this.similarityScore = 100 - data.uniqueness_score;
            this.readabilityScore = data.readability_score;
            this.topKeywords = Object.entries(data.top_keywords).map(
              ([word, percentage]) => `${word} (${percentage.toFixed(2)}%)`
            );
            this.sources = data.plagiarized_sites.map(item => item.url);
            if (this.activeTab === 'text') {
              this.textOutput = data.processed_text || '';
            } else if (this.activeTab === 'file') {
              this.fileOutput = data.processed_text || '';
            } else if (this.activeTab === 'url') {
              this.urlOutput = data.processed_text || '';
            }
            this.showOutput = true;
            this.$nextTick(() => {
              if (this.$refs.resultSection) {
                this.$refs.resultSection.scrollIntoView({ behavior: "smooth" });
              }
            });
          }
        })
        .catch(error => {
          console.error("Error:", error);
          this.errorMessage = "Terjadi kesalahan saat melakukan analisis.";
        })
        .finally(() => {
          this.isLoading = false;
        });
    },

    handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      const allowedExtensions = ['pdf', 'doc', 'docx'];
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        this.errorMessage = 'Format file tidak valid!';
        this.fileInput = null;
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'Ukuran file terlalu besar! Maksimal 5MB.';
        this.fileInput = null;
        return;
      }

      this.fileInput = file;
      this.errorMessage = '';
    },

    resetOutput() {
      this.showOutput = false;
      this.textOutput = '';
      this.fileOutput = '';
      this.urlOutput = '';
      this.similarityScore = 0;
      this.uniqueScore = 0;
      this.readabilityScore = 0;
      this.topKeywords = [];
      this.sources = [];
      this.errorMessage = ''; // Tambahkan ini untuk reset error message
    },

    changeLanguage(event) {
      console.log('Bahasa diubah ke:', this.selectedLanguage);
    }
  },

    watch: {
    activeTab() {
      this.resetOutput();
      this.errorMessage = ''; // Tambahkan ini untuk memastikan error di-reset
    }
  },

  setup() {
    const selectedLanguage = ref('english');
    const isVisible = ref(true);
    const isShaking = ref(false);
    const howToUseSection = ref(null);
    const contactSection = ref(null);
    const name = ref('');
    const email = ref('');
    const message = ref('');
    const notification = ref({ message: "", type: "" });
    const showError = ref({ name: false, email: false, message: false });
    let observer;

    const validateForm = () => {
      let hasError = false;
      showError.value = { name: false, email: false, message: false };

      if (!name.value.trim()) {
        showError.value.name = true;
        hasError = true;
      }
      if (!email.value.trim()) {
        showError.value.email = true;
        hasError = true;
      }
      if (!message.value.trim()) {
        showError.value.message = true;
        hasError = true;
      }

      if (hasError) {
        isShaking.value = true;
        notification.value = { message: "Please fill out all fields!", type: "error" };
        setTimeout(() => { isShaking.value = false; }, 500);
      } else {
        notification.value = { message: "Message sent successfully!", type: "success" };
        name.value = "";
        email.value = "";
        message.value = "";
        setTimeout(() => {
          notification.value = { message: "", type: "" };
        }, 3000);
      }
    };

    // onMounted(() => {
    //   isVisible.value = true;
    //   observer = new IntersectionObserver(entries => {
    //     entries.forEach(entry => {
    //       if (entry.target === contactSection.value || entry.target === howToUseSection.value) {
    //         isVisible.value = entry.isIntersecting;
    //       }
    //     });
    //   }, { threshold: 0.2 });
    //   if (contactSection.value) {
    //     observer.observe(contactSection.value);
    //   }
    //   if (howToUseSection.value) {
    //     observer.observe(howToUseSection.value);
    //   }
    // });

    // onUnmounted(() => {
    //   if (observer) {
    //     if (contactSection.value) observer.unobserve(contactSection.value);
    //     if (howToUseSection.value) observer.unobserve(howToUseSection.value);
    //   }
    // });

    return {
      selectedLanguage,
      isVisible,
      isShaking,
      contactSection,
      howToUseSection,
      name,
      email,
      message,
      notification,
      showError,
      validateForm
    };
  }
};
</script>




<style scoped>



.loading-container {
  text-align: center;
  margin-top: 20px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(0, 0, 0, 0.1);
  border-top: 5px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

* {
  box-sizing: border-box;
}

.container {
  font-family: "Poppins", serif;
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
  animation: fadeIn 1s ease-out;
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

.navbar .navbar-nav {
  padding-left: 20px; 
  margin-right: auto; 
  display: flex; 
  gap: 20px; 
}

.navbar .collapse.navbar-collapse {
  display: flex !important;
  justify-content: space-between; /* Logo di kiri, menu di tengah (jika mau), user profile di kanan */
  align-items: center;
}

.navbar .nav-link {
  color: #000000 !important;
  font-weight: 700;
  margin-left: 9px;
  font-size: 20px;
  transition: transform 0.3s ease, color 0.3s ease;
}

.navbar .nav-link:hover {
  text-decoration: underline;
  cursor: pointer;
  transform: translateY(-3px);
  color: #18A0FB !important;
}

.navbar .d-flex {
  transition: transform 0.3s ease, color 0.3s ease;
}

.navbar .d-flex:hover {
  transform: translateX(3px);
}

.navbar .btn-outline-success {
  color: #18A0FB;
  background-color: transparent;
  border: none;
  padding: 0;
  font-weight: 700;
  font-size: 20px;
}

.navbar .btn-outline-success:hover {
  cursor: pointer;
  background-color: #ffffff;
}

/* .navbar img {
  width: 30%;
  margin-left: 15px;
} */

.navbar img.logo {
  width: 160px; /* Ubah sesuai kebutuhan */
  margin-left: 15px;
  height: auto;
}


/* profil style */
.rounded-circle {
  border: 1px solid #000000;
  width: 40px;
  height: 40px;
  cursor: pointer;
  border-radius: 50%;
}

.user-profile {
  font-weight: 500;
  display: flex;
  align-items: center;
  position: relative;
  cursor: pointer;
  padding: 5px;
  z-index: 1020; /* Konten profile berada di atas pseudo-element */
}

/* Pseudo-element untuk animasi lingkaran, muncul di belakang konten profile */
.user-profile.active::before {
  content: "";
  position: absolute;
  bottom: 5%;
  left: 110%;
  width: 170px;
  height: 170px;
  background-color: #18a0fba8; /* Warna biru */
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0);
  animation: circleWrap 0.5s forwards;
  z-index: -1; /* Pastikan pseudo-element berada di belakang konten profile */
}

/* Animasi lingkaran yang membesar */
@keyframes circleWrap {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(3);
    opacity: 1;
  }
}

.dropdown-menu {
  font-size: 16px;
  position: absolute;
  top: 50px; /* Dropdown muncul di bawah profile */
  right: 0;
  background-color: transparent; /* Hilangkan background putih */
  border: none;
  padding: 0; /* Hapus padding */
  display: flex;
  flex-direction: column;
  min-width: 120px;
  transform-origin: top center;
  animation: openDown 0.5s ease-out;
  z-index: 1025; /* Dropdown muncul di atas profile dan lingkaran */
}

.dropdown-menu button {
  background-color: #18a0fb00; /* Background tombol sama dengan lingkaran */
  border: none;
  color: #ffffff; /* Teks putih */
  width: 100%;
  text-align: center;
  padding: 5px 10px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.dropdown-menu button:hover {
  background-color: #18a0fb00; /* Tetap sama saat hover */
  color: #ff0000;
}

/* Animasi poster terbuka ke bawah */
@keyframes openDown {
  0% {
    transform: perspective(400px) rotateX(-90deg);
    opacity: 0;
  }
  100% {
    transform: perspective(400px) rotateX(0deg);
    opacity: 1;
  }
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

h1 {
  text-align: center;
  padding: 10px;
  font-weight: bold;
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
  transition: background-color 0.3s ease, transform 0.3s ease;
}

.tab-button.active {
  background-color: #18A0FB;
  color: white;
  transform: scale(1.05);
}

.tab-button:hover {
  transition: background-color 0.3s, color 0.3s;
  background-color: #1167c2;
  color: white;
  transform: scale(1.05);
}

/* Dropdown Styles */
.dropdown-container {
  margin: 10px;
}

.form-control {
  padding: 5px;
  font-size: 16px;
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

.input-box.input-file {
  margin-bottom: 100px;
}

.input-box.input-url {
  /* margin-bottom: 130px; */
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 700px;
  margin: 10px auto;
  box-sizing: border-box;
}

.input-box.input-url .input-field {
  width: 100%;
  margin-bottom: 10px;
}

/* Tombol Check Plagiarism */
.input-box.input-url .btn-check {
  width: auto;
  font-weight: 500; 
  min-width: 150px; 
  padding: 10px 30px; 
  font-size: 16px; 
  white-space: nowrap; 
  margin-top: 10px;
}

.input-text {
  width: 150%;
  height: 500px; 
}

.input-file {
  width: 70%;
  height: auto;
}

/* .input-url {
  width: 80%;
  height: 70px; 
} */




/* Input Field Styling */
.input-field {
  width: 100%;
  padding: 15px;
  margin-bottom: 10px;
  border: 2px solid #ccc;
  border-radius: 25px;
  font-size: 16px;
  height: 100%; 
  transition: border-color 0.3s ease, box-shadow 0.3s ease; 
}

.input-field:focus {
  border-color: #007bff;
  outline: none;
  /* box-shadow: 0 0 5px rgba(0, 123, 255, 0.5); */
  transform: scale(1.02);
  box-shadow: 0 0 10px rgba(24, 160, 251, 0.5);
}

textarea.input-field {
  resize: vertical;
  min-height: 150px;
  max-height: 400px;
  padding-right: 15px;
}

textarea::-webkit-scrollbar {
  width: 10px; /* Lebar scrollbar */
}

textarea::-webkit-scrollbar-track {
  /* background: #f1f1f1;  */
  /* border-radius: 10px; Border radius track scrollbar */
  margin: 14px 4px;
}

textarea::-webkit-scrollbar-thumb {
  background: #888; /* Warna thumb scrollbar */
  border-radius: 10px; /* Border radius thumb scrollbar */
  border: 2px solid transparent; /* Tambahkan border transparan */
  background-clip: content-box;
}

textarea::-webkit-scrollbar-thumb:hover {
  background: #007bff; /* Warna thumb scrollbar saat dihover */
  border: 1px solid #f1f1f1;
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
  transition: background-color 0.3s ease, transform 0.3s ease;
}

.btn-check:hover {
  background-color: #1167c2;
  transform: scale(1.05);
}


/* Output Section */
.output-container {
  width: 100%;
  max-width: 700px;
  margin: 20px auto;
  padding: 20px;
  background-color: #f8fafc;
  border-radius: 12px;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
  clear: both;
}

.output-textarea {
  width: 100%;
  height: auto;
  min-height: 150px;
  resize: vertical;
  box-sizing: border-box;
  margin-bottom: 20px;
  padding: 15px;
  border: 2px solid #007bff;
  border-radius: 25px;
  font-size: 15px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.output-textarea:focus {
  border-color: #007bff;
  outline: none;
  transform: scale(1.02);
  box-shadow: 0 0 10px rgba(24, 160, 251, 0.5);
}



.input-url.show-output {
  height: auto !important;
  width: 70% !important;
}


/* Output */
.output-container {
  width: 100%;
  background-color: #f8fafc;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
  max-width: 700px;
  min-height: 200px; /* ruang minimum untuk output */
  margin-top: 5 px;
  clear: both;
  /* opacity: 0; */
  /* transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease; */
}

.output-container.show {
  display: block; /* Tampilkan saat output ada */
  flex-grow: 1; /* Output akan mengisi ruang yang tersedia */
  /* opacity: 1;
  transform: translateY(0); */
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
  padding: 120px;
  background-color: #f9f9f9;

}



.title {
  font-size: 40px;
  font-weight: bold;
  margin-bottom: 40px;
  
}





.row-use {
  display: grid;
  grid-template-columns: auto auto auto;
  gap: 100px;
  justify-content: center;
  /* flex-direction: column; */
}

.row-use .col {
  /* flex: 1 1 calc(33.333% - 20px);  */
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 300px;
  text-align: center;
  /* max-width: 30%; */
  min-width: 250px;
  transition: background-color 0.3s ease, transform 0.3s ease;
}

.row-use .col:hover {
  transform: translateY(-10px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  /* transform: scale(1.05); */
}

h3 {
  font-size: 28px;
  color: #007bff;
  margin-bottom: 10px;
}

p {
  font-size: 16px;
  color: #333333;
}


/* Notifikasi */
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 20px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  z-index: 1000;
  transition: opacity 0.5s ease-in-out;
}

.notification.success {
  background-color: #4CAF50;
  color: white;
}

.notification.error {
  background-color: #E74C3C;
  color: white;
}




/* Contact Us Style */
.contact-us-container {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 50vh;
  min-width: 100%;
  margin: 50px auto;
  padding: 20px;
  background-color: #ffffff;
  /* opacity: 1;
  transform: none;
  transition: none; */
}

/* .contact-us-container.appear {
  opacity: 1;
  transform: translateY(0);
}

.contact-us-container.visible {
  opacity: 1;
  transform: translateY(0);
} */

/* .contact-us-container.hidden {
  opacity: 0;
  transform: translateY(50px);
} */

.shake {
  animation: shake 0.3s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  50% { transform: translateX(10px); }
  75% { transform: translateX(-10px); }
}

.error-border {
  border: 2px solid red !important;
  transition: border 0.3s ease-in-out;
}

.contact-text {
  text-align: center;
  margin-bottom: 70px;
  /* animation: slide-top 0.7s ease-in-out alternate-reverse backwards; */
}

.contact-title {
  font-size: 50px;
  font-weight: bold;
  margin-bottom: 1px;
  padding: 1px;
  overflow: hidden;
  white-space: nowrap;
  text-align: center;
  display: inline-block; /* Supaya tetap di tengah */
  max-width: 0; /* Awalnya tidak terlihat */
  animation: typing 7s steps(20) infinite alternate-reverse;
}

@keyframes typing {
  from {
    max-width: 0;
  }
  to {
    max-width: 100%;
  }
}

.contact-description {
  font-size: 16px;
  color: #555;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
  /* animation: slide-bottom 0.7s ease-out alternate-reverse both; */
}

.contact-input, .contact-textarea {
  width: 80%;
  padding: 7px;
  border: 2px solid #ccc;
  border-radius: 8px;
  font-size: 16px;
}

.contact-textarea {
  height: 120px;
  resize: none;
}

.button-container {
  display: flex;
  justify-content: flex-end;
  padding-right: 175px;
}

.contact-button {
  background-color: #18A0FB;
  color: white;
  width: 20%;
  padding: 10px;
  font-size: 15px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.3s ease;
}

.contact-button:hover {
  background-color: #1167c2;
  transform: scale(1.05);
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
  gap: 10px;
  margin-right: 20px;
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
  transition: background-color 0.3s ease, transform 0.3s ease;
}

.language-btn:hover {
  background: #18A0FB;
  color: white;
  transform: scale(1.05);
}

.supervene-section {
  margin-top: 20px;
  margin-right: 5px;
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
  font-size: 10px;
  margin: 10px 0;
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
  transition: color 0.3s ease, transform 0.3s ease;
}

.footer-links a:hover {
  color: #18A0FB;
  transform: translateX(5px);
}

.contact-address {
  color: #5f5f5f;
  font-size: 123px;
  line-height: 1;
  font-weight: 500;
  text-align: left;
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


/* Animasi Fade-In pada Halaman */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes slide-top {
  0% {
    -webkit-transform: translateY(0);
            transform: translateY(0);
  }
  100% {
    -webkit-transform: translateY(-100px);
            transform: translateY(-100px);
  }
}

@keyframes slide-bottom {
  0% {
    -webkit-transform: translateY(0);
    transform: translateY(0);
  }
  100% {
    -webkit-transform: translateY(100px);
    transform: translateY(100px);
  }
}


/* @-webkit-keyframes slide-bottom {
  0% {
    -webkit-transform: translateY(0);
            transform: translateY(0);
  }
  100% {
    -webkit-transform: translateY(100px);
            transform: translateY(100px);
  }
}  */



/* RESPONSIVE STYLES */
/* Mobile Devices (max-width: 767px) */
@media (max-width: 767px) {
  /* Navbar */
  .navbar .container-fluid {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
  }

  /* Logo */
  .navbar img.logo {
    order: 2;
    margin-left: auto;
    width: auto;
    max-width: 150px; 
  }

   /* Bagian collapse (nav links) berada di sebelah kiri */
   .navbar .collapse {
    order: 0;
    width: 100%;
    padding: 0;
    margin: 0;
  }
  
  /* Ketika collapse aktif (memiliki kelas .show), tampilkan sebagai flex dan agar menu muncul secara vertikal di sebelah kiri */
  .navbar .collapse.show {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .navbar .navbar-nav {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    padding: 0;
    margin: 0;
    margin-top: 10px;
  }
  
  .navbar .nav-item {
    margin: 5px 0; 
  }
  
  .navbar .nav-link {
    padding: 0;
    margin: 0;
    text-align: left;
    font-size: 16px; 
  }


  /* Main Content & Input Section */
  .main-content {
    padding: 10px;
  }
  
  .container-option {
    padding: 0 10px;
  }
  
  .input-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .container-option ul.nav {
    flex-wrap: wrap;
    justify-content: center;
    margin-bottom: 10px;
  }
  
  .input-box {
    width: 100%;
    max-width: 500px;
    margin: 10px auto;
  }

  .input-box.input-url {
    margin-bottom: 20px;
  }

  .output-container {
    margin-top: 20px;
  }

  .output-textarea {
    min-height: 200px;
  }



   /* Pastikan container input URL menggunakan layout kolom */
   /*.input-box.input-url {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 500px;
    margin: 10px auto 130px; /* margin-bottom ditetapkan untuk memberi jarak dengan konten di bawahnya */
    /*box-sizing: border-box;
  }*/


  .input-field {
    width: 100%;
    font-size: 14px;
    padding: 12px;
  }
  
  .btn-check {
    width: 100%;
    max-width: 200px;
    padding: 10px;
    font-size: 14px;
    margin-top: 10px;
  }
  
  /* .output-container {
    clear: both;
    margin-top: 50px;
    position: relative;
    bottom: 1;
    z-index: 1;
    width: 100%;
    max-width: 550px;
    padding: 25px;
  } */
  
  /* .output-textarea {
    width: 100%;
    height: auto;
    min-height: 400px !important;
  } */

  .container-use {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 20px; /* sesuaikan padding jika perlu */
  }

  /* Atur grid row-use agar hanya satu kolom, sehingga semua kolom tertata secara vertikal */
  .row-use {
    display: grid;
    grid-template-columns: 1fr;
    justify-items: center; /* pastikan setiap kolom terpusat secara horizontal */
    gap: 20px;
    width: 100%;
  }

  /* Setiap kolom akan mengisi sebagian besar lebar layar, misalnya 90% */
  .row-use .col {
    width: 90%;
    max-width: 400px; /* atau sesuaikan sesuai desain */
    margin: 0 auto;
  }

  /* Sesuaikan ukuran heading dan paragraf jika perlu */
  .row-use .col h3 {
    font-size: 24px;
    margin-bottom: 8px;
    text-align: center;
  }
  .row-use .col p {
    font-size: 16px;
    line-height: 1.5;
    text-align: center;
  }

  .contact-us-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    margin-bottom: 80px;
    height: auto;
  }

  /* Contact Us */
  .contact-text {
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .contact-form {
    position: relative;
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
    padding-bottom: 60px; 
    box-sizing: border-box;
    border: 1px solid transparent; 
  }

  .contact-form input,
  .contact-form textarea {
    width: 100%;
  }

  .button-container {
    position: absolute;
    bottom: 5px;
    /* right: 1; */
    left: 0;
    /* z-index: 10; */
  }

  .contact-button {
    padding: 10px 30px !important; 
    font-size: 16px;
    white-space: wrap;   
    min-width: 180px;
    box-sizing: border-box;
  }

  /* Ubah container footer utama menjadi grid dengan 3 kolom untuk bagian yang diinginkan */
  .footer-content {
    display: grid;
    /* Misalnya, kita inginkan 3 kolom dengan lebar sama untuk Solutions, Information, dan Company */
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }

  /* Biarkan kolom pertama (bahasa & supervene) dan kolom keempat (cost-effective fees) tetap di tempatnya, 
    misalnya dengan mengatur posisi grid atau mengeset ulang jika diperlukan.
    Contoh: */
  .footer-column:first-child,
  .footer-column:last-child {
    grid-column: 1 / -1; /* Membuatnya memenuhi baris sendiri */
  }

  /* Flatten struktur HTML untuk kolom kedua dan ketiga,
    sehingga anak-anaknya (solutions, information, company) menjadi langsung anak dari .footer-content */
  .footer-column:nth-child(2),
  .footer-column:nth-child(3) {
    display: contents;
  }

  /* Atur posisi masing-masing bagian dalam grid */
  .solutions-section {
    grid-column: 1; /* Kolom pertama dalam baris khusus ini */
  }
  .information-section {
    grid-column: 2; /* Kolom kedua */
  }
  .company-section {
    grid-column: 3; /* Kolom ketiga */
  }


  /* Sembunyikan kolom paling bawah (misalnya, kolom partnership) pada tampilan mobile */
  .footer-content .footer-column:last-child {
    display: none;
  }
}






/* Tablet Devices (min-width: 768px and max-width: 991px) */
@media (min-width: 768px) and (max-width: 991px) {
    /* Navbar */
    .navbar .container-fluid {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
  }

  /* Logo */
  .navbar img.logo {
    order: 2;
    margin-left: auto;
    width: auto;
    max-width: 150px; 
  }

   /* Bagian collapse (nav links) berada di sebelah kiri */
   .navbar .collapse {
    order: 0;
    width: 100%;
    padding: 0;
    margin: 0;
  }
  
  /* Ketika collapse aktif (memiliki kelas .show), tampilkan sebagai flex dan agar menu muncul secara vertikal di sebelah kiri */
  .navbar .collapse.show {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .navbar .navbar-nav {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    padding: 0;
    margin: 0;
    margin-top: 10px;
  }
  
  .navbar .nav-item {
    margin: 5px 0; 
  }
  
  .navbar .nav-link {
    padding: 0;
    margin: 0;
    text-align: left;
    font-size: 16px; 
  }


  /* Main Content & Input Section */
  .main-content {
    padding: 10px;
  }
  
  .container-option {
    padding: 0 10px;
  }
  
  .input-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .container-option ul.nav {
    flex-wrap: wrap;
    justify-content: center;
    margin-bottom: 10px;
  }
  
  .input-box {
    width: 100%;
    max-width: 500px;
    margin: 10px auto;
  }

  .input-box.input-url {
    margin-bottom: 20px;
  }

  .output-container {
    margin-top: 20px;
  }

  .output-textarea {
    min-height: 200px;
  }



   /* Pastikan container input URL menggunakan layout kolom */
   /*.input-box.input-url {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 500px;
    margin: 10px auto 130px; /* margin-bottom ditetapkan untuk memberi jarak dengan konten di bawahnya */
    /*box-sizing: border-box;
  }*/


  .input-field {
    width: 100%;
    font-size: 14px;
    padding: 12px;
  }
  
  .btn-check {
    width: 100%;
    max-width: 200px;
    padding: 10px;
    font-size: 14px;
    margin-top: 10px;
  }
  
  /* .output-container {
    clear: both;
    margin-top: 50px;
    position: relative;
    bottom: 1;
    z-index: 1;
    width: 100%;
    max-width: 550px;
    padding: 25px;
  } */
  
  /* .output-textarea {
    width: 100%;
    height: auto;
    min-height: 400px !important;
  } */

  .container-use {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 20px; /* sesuaikan padding jika perlu */
  }

  /* Atur grid row-use agar hanya satu kolom, sehingga semua kolom tertata secara vertikal */
  .row-use {
    display: grid;
    grid-template-columns: 1fr;
    justify-items: center; /* pastikan setiap kolom terpusat secara horizontal */
    gap: 20px;
    width: 100%;
  }

  /* Setiap kolom akan mengisi sebagian besar lebar layar, misalnya 90% */
  .row-use .col {
    width: 90%;
    max-width: 400px; /* atau sesuaikan sesuai desain */
    margin: 0 auto;
  }

  /* Sesuaikan ukuran heading dan paragraf jika perlu */
  .row-use .col h3 {
    font-size: 24px;
    margin-bottom: 8px;
    text-align: center;
  }
  .row-use .col p {
    font-size: 16px;
    line-height: 1.5;
    text-align: center;
  }

  .contact-us-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    margin-bottom: 80px;
    height: auto;
  }

  /* Contact Us */
  .contact-text {
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .contact-form {
    position: relative;
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
    padding-bottom: 60px; 
    box-sizing: border-box;
    border: 1px solid transparent; 
  }

  .contact-form input,
  .contact-form textarea {
    width: 100%;
  }

  .button-container {
    position: absolute;
    bottom: 5px;
    /* right: 1; */
    left: 0;
    /* z-index: 10; */
  }

  .contact-button {
    padding: 10px 30px !important; 
    font-size: 16px;
    white-space: wrap;   
    min-width: 180px;
    box-sizing: border-box;
  }

  /* Ubah container footer utama menjadi grid dengan 3 kolom untuk bagian yang diinginkan */
  .footer-content {
    display: grid;
    /* Misalnya, kita inginkan 3 kolom dengan lebar sama untuk Solutions, Information, dan Company */
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }

  /* Biarkan kolom pertama (bahasa & supervene) dan kolom keempat (cost-effective fees) tetap di tempatnya, 
    misalnya dengan mengatur posisi grid atau mengeset ulang jika diperlukan.
    Contoh: */
  .footer-column:first-child,
  .footer-column:last-child {
    grid-column: 1 / -1; /* Membuatnya memenuhi baris sendiri */
  }

  /* Flatten struktur HTML untuk kolom kedua dan ketiga,
    sehingga anak-anaknya (solutions, information, company) menjadi langsung anak dari .footer-content */
  .footer-column:nth-child(2),
  .footer-column:nth-child(3) {
    display: contents;
  }

  /* Atur posisi masing-masing bagian dalam grid */
  .solutions-section {
    grid-column: 1; /* Kolom pertama dalam baris khusus ini */
  }
  .information-section {
    grid-column: 2; /* Kolom kedua */
  }
  .company-section {
    grid-column: 3; /* Kolom ketiga */
  }


  /* Sembunyikan kolom paling bawah (misalnya, kolom partnership) pada tampilan mobile */
  .footer-content .footer-column:last-child {
    display: none;
  }
}



/* Small Desktop (min-width: 992px and max-width: 1199px) */
@media (min-width: 992px) and (max-width: 1200px) {
   /* Navbar */
   .navbar .container-fluid {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
  }

  /* Logo */
  .navbar img.logo {
    order: 2;
    margin-left: auto;
    width: auto;
    max-width: 150px; 
  }

   /* Bagian collapse (nav links) berada di sebelah kiri */
   .navbar .collapse {
    order: 0;
    width: 100%;
    padding: 0;
    margin: 0;
  }
  
  /* Ketika collapse aktif (memiliki kelas .show), tampilkan sebagai flex dan agar menu muncul secara vertikal di sebelah kiri */
  .navbar .collapse.show {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .navbar .navbar-nav {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    padding: 0;
    margin: 0;
    margin-top: 10px;
  }
  
  .navbar .nav-item {
    margin: 5px 0; 
  }
  
  .navbar .nav-link {
    padding: 0;
    margin: 0;
    text-align: left;
    font-size: 16px; 
  }


  /* Main Content & Input Section */
  .main-content {
    padding: 10px;
  }
  
  .container-option {
    padding: 0 10px;
  }
  
  .input-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .container-option ul.nav {
    flex-wrap: wrap;
    justify-content: center;
    margin-bottom: 10px;
  }
  
  .input-box {
    width: 100%;
    max-width: 500px;
    margin: 10px auto;
  }

  .input-box.input-url {
    margin-bottom: 20px;
  }

  .output-container {
    margin-top: 20px;
  }

  .output-textarea {
    min-height: 200px;
  }



   /* Pastikan container input URL menggunakan layout kolom */
   /*.input-box.input-url {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 500px;
    margin: 10px auto 130px; /* margin-bottom ditetapkan untuk memberi jarak dengan konten di bawahnya */
    /*box-sizing: border-box;
  }*/


  .input-field {
    width: 100%;
    font-size: 14px;
    padding: 12px;
  }
  
  .btn-check {
    width: 100%;
    max-width: 200px;
    padding: 10px;
    font-size: 14px;
    margin-top: 10px;
  }
  
  /* .output-container {
    clear: both;
    margin-top: 50px;
    position: relative;
    bottom: 1;
    z-index: 1;
    width: 100%;
    max-width: 550px;
    padding: 25px;
  } */
  
  /* .output-textarea {
    width: 100%;
    height: auto;
    min-height: 400px !important;
  } */

  .container-use {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 20px; /* sesuaikan padding jika perlu */
  }

  /* Atur grid row-use agar hanya satu kolom, sehingga semua kolom tertata secara vertikal */
  .row-use {
    display: grid;
    grid-template-columns: 1fr;
    justify-items: center; /* pastikan setiap kolom terpusat secara horizontal */
    gap: 20px;
    width: 100%;
  }

  /* Setiap kolom akan mengisi sebagian besar lebar layar, misalnya 90% */
  .row-use .col {
    width: 90%;
    max-width: 400px; /* atau sesuaikan sesuai desain */
    margin: 0 auto;
  }

  /* Sesuaikan ukuran heading dan paragraf jika perlu */
  .row-use .col h3 {
    font-size: 24px;
    margin-bottom: 8px;
    text-align: center;
  }
  .row-use .col p {
    font-size: 16px;
    line-height: 1.5;
    text-align: center;
  }

  .contact-us-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    margin-bottom: 80px;
    height: auto;
  }

  /* Contact Us */
  .contact-text {
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .contact-form {
    position: relative;
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
    padding-bottom: 60px; 
    box-sizing: border-box;
    border: 1px solid transparent; 
  }

  .contact-form input,
  .contact-form textarea {
    width: 100%;
  }

  .button-container {
    position: absolute;
    bottom: 5px;
    /* right: 1; */
    left: 0;
    /* z-index: 10; */
  }

  .contact-button {
    padding: 10px 30px !important; 
    font-size: 16px;
    white-space: wrap;   
    min-width: 180px;
    box-sizing: border-box;
  }

  /* Ubah container footer utama menjadi grid dengan 3 kolom untuk bagian yang diinginkan */
  .footer-content {
    display: grid;
    /* Misalnya, kita inginkan 3 kolom dengan lebar sama untuk Solutions, Information, dan Company */
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }

  /* Biarkan kolom pertama (bahasa & supervene) dan kolom keempat (cost-effective fees) tetap di tempatnya, 
    misalnya dengan mengatur posisi grid atau mengeset ulang jika diperlukan.
    Contoh: */
  .footer-column:first-child,
  .footer-column:last-child {
    grid-column: 1 / -1; /* Membuatnya memenuhi baris sendiri */
  }

  /* Flatten struktur HTML untuk kolom kedua dan ketiga,
    sehingga anak-anaknya (solutions, information, company) menjadi langsung anak dari .footer-content */
  .footer-column:nth-child(2),
  .footer-column:nth-child(3) {
    display: contents;
  }

  /* Atur posisi masing-masing bagian dalam grid */
  .solutions-section {
    grid-column: 1; /* Kolom pertama dalam baris khusus ini */
  }
  .information-section {
    grid-column: 2; /* Kolom kedua */
  }
  .company-section {
    grid-column: 3; /* Kolom ketiga */
  }


  /* Sembunyikan kolom paling bawah (misalnya, kolom partnership) pada tampilan mobile */
  .footer-content .footer-column:last-child {
    display: none;
  }
}


@media (max-width: 1920px) {

}




</style>