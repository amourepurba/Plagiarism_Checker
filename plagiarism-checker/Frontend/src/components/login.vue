<template>
  <div class="form-box login">
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
      <button type="button" class="btn-login" @click="$emit('google-login')">
        <span>Login with Google</span>
        <i class="bx bxl-google"></i>
      </button>
      <button type="button" class="btn-switch" @click="$emit('toggle-form')">
        Don't have an account? Register
      </button>
    </form>
  </div>
</template>

<script>
import { useAuthStore } from "../store/authStore";

export default {
  data() {
    return {
      loading: false,
      loginForm: {
        email: "",
        password: "",
      },
    };
  },

  methods: {
    async login() {
      try {
        this.loading = true;
        const authStore = useAuthStore();

        await authStore.login(this.loginForm.email, this.loginForm.password);

        const user = authStore.user; // Pastikan store menyimpan user info
        localStorage.setItem("user", JSON.stringify(user));

        // Jika berhasil
        this.$emit("notify", {
          message: "Login berhasil!",
          type: "success",
        });
        this.$router.push("/");
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message;

        // Handle error spesifik
        if (error.response?.status === 401) {
          this.$emit("notify", {
            message: "Email atau password salah!",
            type: "error",
          });
        } else {
          this.$emit("notify", {
            message: `Login gagal: ${errorMessage}`,
            type: "error",
          });
        }
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
