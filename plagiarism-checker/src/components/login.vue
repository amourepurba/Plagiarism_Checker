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
import axios from "../axios.js";

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
      if (!this.loginForm.email || !this.loginForm.password) {
        this.$emit("notify", {
          message: "Please fill in all fields",
          type: "error",
        });
        return;
      }

      try {
        this.loading = true;
        const response = await axios.post("/auth/login", this.loginForm);
        this.$store.commit("setAuth", {
          token: response.data.token,
          user: response.data.user,
        });
        this.$emit("notify", {
          message: "Login berhasil!",
          type: "success",
        });
        this.$router.push("/");
      } catch (error) {
        this.$emit("notify", {
          message: "Login gagal! Periksa email dan password Anda.",
          type: "error",
        });
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
