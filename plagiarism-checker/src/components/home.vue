<template>
  <div class="home-container">
    <div class="container">
      <!-- Header Section -->
      <header class="header">
        <nav class="navbar navbar-expand-lg bg-body-tertiary">
          <div class="container-fluid">
            <!-- Tombol Navbar Toggler -->
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
            <router-link
              to="/"
              @click.native="closeNavbar"
              class="navbar-brand"
            >
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
                @click.native="closeNavbar"
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

      <!-- Input Section -->
      <div class="main-content" id="plagiarism-checker">
        <h1>Plagiarism Checker</h1>
        <div class="container-option mt-4 text-center">
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
            <!-- Dropdown untuk Bahasa -->
            <li class="nav-item">
              <div class="dropdown-container">
                <select
                  class="form-control dropdown"
                  v-model="selectedLanguage"
                >
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
              <button
                class="btn btn-check mt-2"
                @click="checkAction"
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
                  accept=".pdf"
                />
              </template>
              <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
              <button
                class="btn btn-check mt-2"
                @click="checkAction"
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
                  style="text-align: center"
                  placeholder="Enter your URL here..."
                />
              </template>
              <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
              <button
                class="btn btn-check mt-2"
                @click="checkAction"
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

          <!-- Output Section -->
          <div v-if="showOutput" class="output-container" ref="resultSection">
            <h2>Result</h2>
            <div class="row">
              <!-- Left Column: Scores -->
              <div class="col left-section">
                <div class="score-item">
                  <p class="text-center text-xl text-red-600">
                    {{ similarityScore }}%
                  </p>
                  <p class="text-center text-gray-700">Skor Plagiasi</p>
                </div>
                <div class="score-item">
                  <p class="text-center text-xl text-green-600">
                    {{ uniqueScore }}%
                  </p>
                  <p class="text-gray-700">Skor Uniq</p>
                </div>
                <div class="score-item">
                  <p class="text-center text-xl text-blue-600">
                    {{ readabilityScore }}%
                  </p>
                  <p class="text-gray-700">Skor Readability</p>
                </div>
              </div>

              <!-- Right Column: Keywords & Plagiarized Sites -->
              <div class="col right-section">
                <div>
                  <h5 class="text-center text-gray-700">Top 5 Keywords</h5>
                  <ul class="list-disc list-inside text-gray-700 text-center">
                    <li v-for="(keyword, index) in topKeywords" :key="index">
                      {{ keyword }}
                    </li>
                  </ul>
                </div>
                <div class="mt-4">
                  <h5 class="text-center text-gray-700">Plagiarized Sites</h5>
                  <ul class="list-disc list-inside text-red-500 text-center">
                    <li v-for="(site, index) in sources" :key="index">
                      {{ site }}
                    </li>
                  </ul>
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

      <!-- Contact Us Section -->
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
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from "vue";

export default {
  name: "Tes1",

  data() {
    return {
      isNavbarOpen: false,
      isLoading: false,
      activeTab: "text",
      textInput: "",
      fileInput: null,
      urlInput: "",
      showOutput: false,
      errorMessage: "",
      similarityScore: 0,
      uniqueScore: 0,
      readabilityScore: 0,
      topKeywords: [],
      sources: [],
      textOutput: "",
      fileOutput: "",
      urlOutput: "",
      selectedLanguage: "english",
      showDropdown: false,
      name: "",
      email: "",
      message: "",
      notification: { message: "", type: "" },
      showError: { name: false, email: false, message: false },
    };
  },

  computed: {
    isAuthenticated() {
      return !!localStorage.getItem("token");
    },
    user() {
      return (
        JSON.parse(localStorage.getItem("user")) || { username: "", avatar: "" }
      );
    },
  },

  methods: {
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

    validateForm() {
      let hasError = false;
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
        // Tampilkan notifikasi error
        this.notification = {
          message: "Please fill out all fields correctly.",
          type: "error",
        };
        // Efek getaran
        this.shakeForm();
        // Hilangkan notifikasi error setelah 3 detik
        setTimeout(() => {
          this.notification = { message: "", type: "" };
        }, 3000);
        return;
      }

      // Jika tidak ada error, tampilkan notifikasi sukses
      this.notification = {
        message: "Message sent successfully!",
        type: "success",
      };
      setTimeout(() => {
        this.notification = { message: "", type: "" };
      }, 3000);

      // Reset form setelah sukses
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
        }, 500); // Animasi getar selama 0.5 detik
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
