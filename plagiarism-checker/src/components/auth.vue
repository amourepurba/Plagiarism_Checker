<template>
  <div class="auth-container">
    <div class="body">
      <!-- Tombol Close-->
      <button
        type="button"
        class="btn-close"
        aria-label="Close"
        @click="goToPlagiarismChecker"
      ></button>
      <!-- Container Utama -->
      <div class="container" :class="{ active: isActive }">
        <!-- Form Login -->
        <div class="form-box login" v-if="!isActive">
          <form @submit.prevent="login">
            <h1>Login</h1>
            <div class="input-box">
              <input
                type="text"
                placeholder="Email"
                required
                v-model="loginForm.email"
              />
              <i class="bx bxs-user"></i>
            </div>
            <div class="input-box">
              <input
                type="password"
                placeholder="Password"
                required
                v-model="loginForm.password"
              />
              <i class="bx bxs-lock-alt"></i>
            </div>
            <div class="forgot-link">
              <a href="#">Forgot Password?</a>
            </div>
            <button type="submit" class="btn" :disabled="loading">
              {{ loading ? "Processing..." : "Login" }}
            </button>
            <button type="button" class="btn-login" @click="loginWithGoogle">
              <span>Login with Google</span>
              <i class="bx bxl-google"></i>
            </button>
            <!-- Tombol Navigasi untuk Layar Kecil -->
            <button type="button" class="btn-switch" @click="toggleForm">
              Don't have an account? Register
            </button>
          </form>
        </div>

        <!-- Form Register -->
        <div class="form-box register" v-if="isActive">
          <form @submit.prevent="register">
            <h1>Registration</h1>
            <div class="input-box">
              <input
                type="text"
                placeholder="Username"
                required
                v-model="registerForm.username"
              />
              <i class="bx bxs-user"></i>
            </div>
            <div class="input-box">
              <input
                type="email"
                placeholder="Email"
                required
                v-model="registerForm.email"
              />
              <i class="bx bxs-envelope"></i>
            </div>
            <div class="input-box">
              <input
                type="password"
                placeholder="Password"
                required
                v-model="registerForm.password"
              />
              <i class="bx bxs-lock-alt"></i>
            </div>
            <button type="submit" class="btn" :disabled="loading">
              {{ loading ? "Processing..." : "Register" }}
            </button>
            <button type="button" class="btn-login" @click="loginWithGoogle">
              <span>Login with Google</span>
              <i class="bx bxl-google"></i>
            </button>
            <!-- Tombol Navigasi untuk Layar Kecil -->
            <button type="button" class="btn-switch" @click="toggleForm">
              Already have an account? Login
            </button>
          </form>
        </div>

        <!-- Toggle Panel Animasi -->
        <div class="toggle-box">
          <div class="toggle-panel toggle-left">
            <h1><strong>Hello, Welcome!</strong></h1>
            <p>Don't have an account?</p>
            <button class="btn register-btn" @click="toggleForm">
              Register
            </button>
          </div>
          <div class="toggle-panel toggle-right">
            <h1><strong>Welcome Back!</strong></h1>
            <p>Already have an account?</p>
            <button class="btn login-btn" @click="toggleForm">Login</button>
          </div>
        </div>
      </div>
      <!-- Notifikasi -->
      <div
        v-if="showNotification"
        class="notification"
        :class="{ success: successMessage, error: errorMessage }"
      >
        {{ successMessage || errorMessage }}
      </div>
    </div>
  </div>
</template>

<script>
import axios from "../axios.js";
import { auth, googleProvider } from "../firebase.js";
import { signInWithPopup } from "firebase/auth";

export default {
  data() {
    return {
      // State management
      isAuthenticated: !!localStorage.getItem("token"),
      user: JSON.parse(localStorage.getItem("user")) || {
        username: "",
        avatar: "",
      },
      isActive: false,
      loading: false,
      // Notifikasi
      successMessage: "",
      errorMessage: "",
      showNotification: false,
      // Form data
      loginForm: {
        email: "",
        password: "",
      },
      registerForm: {
        username: "",
        email: "",
        password: "",
      },
    };
  },
  methods: {
    // Navigation
    goToPlagiarismChecker() {
      this.$router.push("/plagiarism-checker");
    },

    showNotificationMessage(message, isSuccess) {
      if (isSuccess) {
        this.successMessage = message;
        this.errorMessage = ""; // Hapus pesan error
      } else {
        this.errorMessage = message;
        this.successMessage = ""; // Hapus pesan sukses
      }
      this.showNotification = true;

      setTimeout(() => {
        this.showNotification = false;
      }, 3000);

      // Otomatis sembunyikan setelah 3 detik
      setTimeout(() => {
        this.showNotification = false;
      }, 3000);
    },

    toggleForm() {
      this.isActive = !this.isActive;
      this.errorMessage = "";
    },

    // Authentication
    // LOGIN
    async login() {
      if (!this.loginForm.email || !this.loginForm.password) {
        this.showNotificationMessage("Please fill in all fields", false);
        return;
      }
      try {
        this.loading = true;
        const response = await axios.post("/login", this.loginForm);
        this.$store.commit("setAuth", {
          token: response.data.token,
          user: response.data.user,
        });
        this.showNotificationMessage("Login berhasil!", true);
        this.$router.push("/");
      } catch (error) {
        this.showNotificationMessage(
          "Login gagal! Periksa email dan password Anda.",
          false
        );
      } finally {
        this.loading = false;
      }
    },

    async loginWithGoogle() {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        const userData = {
          username: user.displayName,
          email: user.email,
          avatar: user.photoURL,
          password: "google_auth",
        };

        try {
          await axios.post("/register", userData);
          this.showNotificationMessage("Registrasi berhasil!", true);
        } catch (registerError) {
          if (
            (registerError.response && registerError.response.status === 409) ||
            registerError.response.data?.error?.code === "ER_DUP_ENTRY"
          ) {
            this.showNotificationMessage(
              "Pengguna sudah terdaftar, lanjut login!",
              true
            );
          } else {
            this.showNotificationMessage("Gagal memproses data.", false);
            return;
          }
        }

        const loginResponse = await axios.post("/login", {
          email: user.email,
          password: "google_auth",
        });

        localStorage.setItem("token", loginResponse.data.token);
        localStorage.setItem(
          "user",
          JSON.stringify({
            username: user.displayName,
            avatar: user.photoURL,
          })
        );
        this.showNotificationMessage("Login dengan Google berhasil!", true);
        this.$router.push("/");
      } catch (error) {
        console.error(error);
        this.showNotificationMessage("Login dengan Google gagal.", false);
      }
    },

    // REGISTER
    async register() {
      if (
        !this.registerForm.username ||
        !this.registerForm.email ||
        !this.registerForm.password
      ) {
        this.showNotificationMessage("Please fill in all fields", false);
        return;
      }
      try {
        this.loading = true;
        const response = await axios.post("/register", this.registerForm);
        this.showNotificationMessage(response.data.message, true);
        this.toggleForm();
      } catch (error) {
        this.showNotificationMessage(
          error.response?.data?.message || "Registrasi gagal.",
          false
        );
      } finally {
        this.loading = false;
      }
    },

    // Menangani error autentikasi
    handleAuthError(error) {
      if (error.response?.data?.message) {
        this.errorMessage = error.response.data.message;
      } else {
        this.errorMessage = "Authentication failed. Please try again.";
      }
    },
  },
};
</script>
