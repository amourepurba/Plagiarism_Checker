<template>
  <div class="form-box register">
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
      <button type="button" class="btn-login" @click="$emit('google-login')">
        <span>Register with Google</span>
        <i class="bx bxl-google"></i>
      </button>
      <button type="button" class="btn-switch" @click="$emit('toggle-form')">
        Already have an account? Login
      </button>
    </form>
  </div>
</template>

<script>
import axios from "./lib/axios.js";

export default {
  data() {
    return {
      loading: false,
      registerForm: {
        username: "",
        email: "",
        password: "",
      },
    };
  },

  methods: {
    async register() {
      if (
        !this.registerForm.username ||
        !this.registerForm.email ||
        !this.registerForm.password
      ) {
        this.$emit("notify", {
          message: "Please fill in all fields",
          type: "error",
        });
        return;
      }

      try {
        this.loading = true;
        const response = await axios.post("/auth/register", this.registerForm);
        this.$emit("notify", {
          message: response.data.message,
          type: "success",
        });
        this.$emit("toggle-form");
      } catch (error) {
        this.$emit("notify", {
          message: error.response?.data?.message || "Registrasi gagal.",
          type: "error",
        });
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
