<template>
  <div class="home-container">
    <div class="container">
      <!-- Header -->
      <header class="header">
        <nav class="navbar navbar-expand-lg bg-body-tertiary">
          <div class="container-fluid">
            <!-- Navbar Toggler -->
            <button
              class="navbar-toggler"
              type="button"
              @click="toggleNavbar"
              aria-controls="navbarSupportedContent"
              :aria-expanded="isNavbarOpen"
              aria-label="Toggle navigation"
            >
              <span class="navbar-toggler-icon"></span>
            </button>

            <!-- Logo -->
            <router-link to="/" @click="closeNavbar" class="navbar-brand">
              <img
                src="../assets/logo-blue.png"
                alt="cmlabs logo"
                class="logo"
              />
            </router-link>

            <!-- User Profile / Login -->
            <div class="user d-flex align-items-center ms-auto">
              <div
                v-if="isAuthenticated"
                class="user-profile d-flex align-items-center"
                :class="{ active: showDropdown }"
                @click="toggleDropdown"
              >
                <img
                  :src="user.avatar"
                  alt="User Avatar"
                  class="rounded-circle me-2"
                  style="width: 40px; height: 40px"
                />
                <span class="me-2">{{ user.username }}</span>
                <!-- Dropdown Logout -->
                <div v-if="showDropdown" class="dropdown-menu">
                  <button class="btn btn-outline-danger" @click.stop="logout">
                    Logout
                  </button>
                </div>
              </div>
              <router-link
                v-else
                to="/auth"
                class="btn btn-outline-success ms-2"
                @click="closeNavbar"
              >
                Login
                <i
                  class="fa-solid fa-arrow-right-to-bracket"
                  style="padding-left: 5px"
                ></i>
              </router-link>
            </div>

            <!-- Menu Collapse -->
            <div
              :class="['collapse navbar-collapse', { show: isNavbarOpen }]"
              id="navbarSupportedContent"
            >
              <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                <li class="nav-item">
                  <a
                    class="nav-link"
                    href="#plagiarism-checker"
                    @click="closeNavbar"
                  >
                    Plagiarism Checker
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" href="#how-to-use" @click="closeNavbar">
                    How To Use
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" href="#contact-us" @click="closeNavbar">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </header>

      <!-- Main Content -->
      <div class="main-content" id="plagiarism-checker">
        <h1>Plagiarism Checker</h1>
        <!-- Input Section -->
        <div class="container-option mt-4 text-center">
          <!-- Tabs Navigation -->
          <ul
            class="nav nav-pills d-inline-flex align-items-center justify-content-center mb-3 gap-2"
          >
            <li class="nav-item">
              <button
                class="nav-link tab-button"
                :class="{ active: activeTab === 'text' }"
                @click="activeTab = 'text'"
              >
                Text
              </button>
            </li>
            <li class="nav-item">
              <button
                class="nav-link tab-button"
                :class="{ active: activeTab === 'file' }"
                @click="activeTab = 'file'"
              >
                File
              </button>
            </li>
            <li class="nav-item">
              <button
                class="nav-link tab-button"
                :class="{ active: activeTab === 'url' }"
                @click="activeTab = 'url'"
              >
                URL
              </button>
            </li>
          </ul>

          <!-- Dynamic Input -->
          <div class="input-container d-flex flex-column align-items-center">
            <!-- Text Input -->
            <div v-if="activeTab === 'text'" class="input-box input-text">
              <textarea
                v-model="textInput"
                class="form-control input-field"
                rows="6"
                placeholder="Enter your text here..."
              ></textarea>
              <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
              <button
                class="btn btn-check mt-2"
                @click="submitPlagiarismCheck"
                :disabled="isLoading"
              >
                <span
                  v-if="isLoading"
                  class="spinner-border spinner-border-sm"
                  role="status"
                  aria-hidden="true"
                ></span>
                <span v-else>Check Plagiarism</span>
              </button>
            </div>

            <!-- File Input -->
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
                  accept=".pdf"
                />
              </template>
              <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
              <button
                class="btn btn-check mt-2"
                @click="submitPlagiarismCheck"
                :disabled="isLoading"
              >
                <span
                  v-if="isLoading"
                  class="spinner-border spinner-border-sm"
                  role="status"
                  aria-hidden="true"
                ></span>
                <span v-else>Check Plagiarism</span>
              </button>
            </div>

            <!-- URL Input -->
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
                  style="text-align: center"
                  placeholder="Enter your URL here..."
                />
              </template>
              <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
              <button
                class="btn btn-check mt-2"
                @click="submitPlagiarismCheck"
                :disabled="isLoading"
              >
                <span
                  v-if="isLoading"
                  class="spinner-border spinner-border-sm"
                  role="status"
                  aria-hidden="true"
                ></span>
                <span v-else>Check Plagiarism</span>
              </button>
            </div>
          </div>

          <!-- Animasi Loading -->
          <div v-if="isLoading" class="loading-container">
            <div class="spinner"></div>
            <p>Checking for plagiarism...</p>
          </div>

          <!-- Result Section -->
          <div v-if="showOutput" class="output-container">
            <h2>Result</h2>
            <!-- 1. Tampilkan Teks Input -->
          <div class="original-text-section mb-4">
            <h4>Teks yang Diinputkan</h4>
            <div class="original-text-content">
              <!-- Untuk semua jenis input -->
              <template v-if="processedText">
                <pre>{{ processedText }}</pre>
              </template>
              
              <!-- Fallback jika processedText kosong -->
              <template v-else>
                <div v-if="activeTab === 'text'" class="text-muted">
                  {{ textInput || "Tidak ada teks yang diinputkan" }}
                </div>
                <div v-else-if="activeTab === 'file'" class="text-muted">
                  {{ fileOutput || "Konten file tidak tersedia" }}
                </div>
                <div v-else class="text-muted">
                  {{ urlOutput || "Konten URL tidak tersedia" }}
                </div>
              </template>
            </div>
          </div>

            <!-- 2. Daftar URL dengan Detail -->
            <div class="sources-section mb-4">
              <h4>Hasil Deteksi Plagiasi</h4>
              <div class="sources-list">
                <div v-for="(source, index) in sources" :key="index" class="source-item card mb-3">
                  <div class="card-body">
                    <div class="source-header d-flex align-items-center mb-2">
                      <span class="source-index badge bg-light me-2">{{ index + 1 }}</span>
                      <a :href="source.url" target="_blank" class="source-url flex-grow-1">{{ source.url }}</a>
                      <span class="source-percentage badge" 
                              :class="{
                                'bg': source.plagiarismScore >= 70,
                                'bg': source.plagiarismScore >= 30 && source.plagiarismScore < 70,
                                'bg': source.plagiarismScore < 30
                              }">
                          Similarity: {{ (source.details.avgSimilarity * 100).toFixed(1) }}%<br>
                          Plagiarized: {{ source.details.plagiarizedFraction }}
                        </span>
                       
                    </div>
                    
                    <!-- Detail Kalimat -->
                    <div class="sentences-detail">
                      <div class="row">
                        <div class="col-md-6">
                          <div class="detail-item">
                            <span class="detail-label">Kalimat Input:</span>
                            <div class="detail-value">{{ source.details.totalInputSentences }}</div>
                          </div>
                        </div>
                        <div class="col-md-6">
                          <div class="detail-item">
                            <span class="detail-label">Kalimat Terdeteksi:</span>
                            <div class="detail-value text-danger">{{ source.details.plagiarizedCount }}</div>
                          </div>
                        </div>
                      </div>
                      <div class="similarity-progress mt-2">
                        <div class="progress">
                          <div class="progress-bar" 
                              role="progressbar" 
                              :style="{ width: source.plagiarismScore + '%' }"
                              :aria-valuenow="source.plagiarismScore"
                              aria-valuemin="0" 
                              aria-valuemax="100">
                            {{ source.plagiarismScore }}% Skor Plagiasi
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 3. 3 Keyword Terbesar -->
            <div class="keywords-section card">
              <div class="card-body">
                <h4 class="card-title">5 Keyword Utama</h4>
                <div class="keywords-list d-flex justify-content-around">
                  <div v-for="(keyword, index) in topKeywords" :key="index" 
                      class="keyword-item text-center p-2">
                    <div class="keyword-badge fs-5 badge bg-primary rounded-pill">
                      {{ keyword.keyword }}
                    </div>
                    <div class="keyword-percentage small text-muted mt-1">
                      {{ keyword.percentage }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

      <!-- How To Use Section -->
      <div
        class="container-use text-center"
        id="how-to-use"
        ref="howToUseSection"
        :class="{ visible: isVisible, hidden: !isVisible }"
      >
        <h1 class="title">How to Use Plagiarism Checker</h1>
        <div class="row-use align-items-start">
          <div class="col">
            <h3>1</h3>
            <p>
              <strong>Get a subscription</strong><br />
              Choose any premium plan to enjoy all of JustDone's tools and
              features, including our Plagiarism Checker.
            </p>
          </div>
          <div class="col">
            <h3>2</h3>
            <p>
              <strong>Provide details</strong><br />
              Paste your text, URL, or upload a file in PDF, DOC, or DOCX
              format.
            </p>
          </div>
          <div class="col">
            <h3>3</h3>
            <p>
              <strong>View the report</strong><br />
              Receive an extensive report in just minutes to view any potential
              plagiarism and relevant source links.
            </p>
          </div>
        </div>
      </div>

      <!-- Contact Form -->
      <div
        class="contact-us-container"
        id="contact-us"
        ref="contactSection"
        :class="{ visible: isVisible }"
      >
        <div class="contact-text">
          <h1 class="contact-title">Contact Us</h1>
          <p class="contact-description">
            Have questions or need help? Reach out to us!
          </p>
        </div>
        <!-- Notifikasi -->
        <div
          v-if="notification.message"
          :class="['notification', notification.type]"
        >
          {{ notification.message }}
        </div>
        <form class="contact-form" @submit.prevent="validateForm">
          <input
            type="text"
            class="contact-input"
            v-model="name"
            placeholder="Your Name"
            :class="{ 'error-border': showError.name }"
          />
          <input
            type="email"
            class="contact-input"
            v-model="email"
            placeholder="Your Email"
            :class="{ 'error-border': showError.email }"
          />
          <textarea
            class="contact-textarea"
            v-model="message"
            placeholder="Your Message"
            :class="{ 'error-border': showError.message }"
          ></textarea>
          <div class="button-container">
            <button type="submit" class="contact-button">Send Message</button>
          </div>
        </form>
      </div>

      <!-- Footer -->
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
                <p>
                  cmlabs Jakarta Jl. Pluit Kencana Raya No.63, Pluit,
                  Penjaringan, Jakarta Utara, DKI Jakarta, 14450, Indonesia
                </p>
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
              <h4 class="footer-subtitle">
                WE ARE OPEN TO PARTNERSHIP WITH VARIOUS NICHES
              </h4>
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
  </div>
  </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "Home",
  data() {
    return {
      isNavbarOpen: false,
      isLoading: false,
      activeTab: "text",
      
      // Inputs
      textInput: "",
      fileInput: null,
      urlInput: "",
      
      // Results
      showOutput: false,
      errorMessage: "",
      processedText: "",
      sources: [],
      topKeywords: [],
      similarityScore: 0,
      sentenceCount: 0,
      detectedCount: 0,
      
      // Lainnya
      selectedLanguage: "english",
      showDropdown: false,
      isVisible: true,
      name: "",
      email: "",
      message: "",
      notification: { message: "", type: "" },
      showError: { name: false, email: false, message: false }
    };
  },

  computed: {
    isAuthenticated() {
      return !!localStorage.getItem("token");
    },
    user() {
      try {
        return (
          JSON.parse(localStorage.getItem("user")) || {
            username: "",
            avatar: "",
          }
        );
      } catch (e) {
        return { username: "", avatar: "" };
      }
    },
    formattedKeywords() {
      return this.topKeywords.slice(0, 3).map(k => ({
        keyword: k.keyword,
        percentage: k.percentage
      }));
    }
  },

  methods: {
    checkAction() {
      this.showOutput = true;
    },

    toggleNavbar() {
      this.isNavbarOpen = !this.isNavbarOpen;
    },

    closeNavbar() {
      this.isNavbarOpen = false;
    },

    toggleDropdown() {
      this.showDropdown = !this.showDropdown;
    },

    logout() {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      this.$router.push("/auth");
    },

    validateInput() {
      if (this.activeTab === "text" && this.textInput.trim().length < 50) {
        this.errorMessage = "Konten harus lebih dari 50 karakter!";
        return false;
      }
      if (
        this.activeTab === "url" &&
        !this.urlInput.match(/^https?:\/\/[^\s$.?#].[^\s]*$/)
      ) {
        this.errorMessage = "URL tidak valid!";
        return false;
      }
      if (this.activeTab === "file" && !this.fileInput) {
        this.errorMessage = "Silakan unggah file!";
        return false;
      }
      this.errorMessage = "";
      return true;
    },

    async submitPlagiarismCheck() {
      if (!this.validateInput()) return;
      this.isLoading = true;
      
      let endpoint = "";
      let payload;
      try {
        if (this.activeTab === "text") {
          endpoint = "/check-text";
          payload = { text: this.textInput };
        } else if (this.activeTab === "url") {
          endpoint = "/check-url";
          payload = { url: this.urlInput };
        } else if (this.activeTab === "file") {
          endpoint = "/check-file";
          const formData = new FormData();
          formData.append("file", this.fileInput);
          payload = formData;
        }

        const config = this.activeTab === "file"
          ? { headers: { "Content-Type": "multipart/form-data" } }
          : { headers: { "Content-Type": "application/json" } };

        const response = await axios.post(endpoint, payload, config);
        const data = response.data;
        
        // Update data hasil
        this.processedText = data.processedText;
        this.topKeywords = data.topKeywords;
        this.sources = data.results.map(result => ({
          url: result.url,
          plagiarismScore: result.plagiarismScore,
          details: {
            totalInputSentences: result.details.totalInputSentences,
            plagiarizedCount: result.details.plagiarizedCount,
            avgSimilarity: parseFloat(result.details.avgSimilarity),
            plagiarizedFraction: result.details.plagiarizedFraction
          }
        }));
        
        // Hitung skor tertinggi
        this.similarityScore = this.sources.length > 0 
          ? Math.max(...this.sources.map(s => s.plagiarismScore))
          : 0;
          
        // Update statistik
        this.sentenceCount = this.sources.length > 0
          ? this.sources[0].details.totalInputSentences
          : 0;
        this.detectedCount = this.sources.length > 0
          ? this.sources[0].details.plagiarizedCount
          : 0;

        this.showOutput = true;
      } catch (error) {
        this.errorMessage =
          error.response?.data?.error ||
          "Terjadi kesalahan saat memproses permintaan.";
      } finally {
        this.isLoading = false;
      }
    },

    handleFileUpload(event) {
      this.fileInput = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.fileOutput = e.target.result;
      };
      reader.readAsText(event.target.files[0]);
    },


    // Contact Form
    validateForm() {
      let hasError = false;

      // Reset error state
      this.showError = { name: false, email: false, message: false };
      if (!this.name.trim()) {
        this.showError.name = true;
        hasError = true;
      }
      if (!this.email.trim()) {
        this.showError.email = true;
        hasError = true;
      }
      if (!this.message.trim()) {
        this.showError.message = true;
        hasError = true;
      }

      if (hasError) {
        // Tampilkan error
        this.notification = {
          message: "Please fill out all fields correctly.",
          type: "error",
        };
        this.shakeForm();
        setTimeout(() => {
          this.notification = { message: "", type: "" };
        }, 3000);
        return;
      }
      this.notification = {
        message: "Message sent successfully!",
        type: "success",
      };
      setTimeout(() => {
        this.notification = { message: "", type: "" };
      }, 3000);
      this.name = "";
      this.email = "";
      this.message = "";
    },

    shakeForm() {
      const form = document.querySelector(".contact-form");
      if (form) {
        form.classList.add("shake");
        setTimeout(() => {
          form.classList.remove("shake");
        }, 500);
      }
    },

    sendMessage() {
      setTimeout(() => {
        const isSuccess = Math.random() > 0.3;
        if (isSuccess) {
          this.showNotification("Message sent successfully!", "success");
          this.resetForm();
        } else {
          this.showNotification(
            "Failed to send message. Please try again.",
            "error"
          );
        }
      }, 1000);
    },

    showNotification(message, type) {
      this.notification = { message, type };
      setTimeout(() => {
        this.notification = { message: "", type: "" };
      }, 3000);
    },

    resetForm() {
      this.name = "";
      this.email = "";
      this.message = "";
    },
  },
};
</script>
