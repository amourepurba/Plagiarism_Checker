import { defineStore } from "pinia";
import axios from "../axios";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    token: localStorage.getItem("token") || "",
  }),
  actions: {
    async login(email, password) {
      try {
        const { data } = await axios.post("/auth/login", { email, password });

        console.log("Login response:", data);
        
        // Pastikan struktur response benar
        if (!data.token || !data.user) {
          throw new Error("Invalid response structure");
        }
        
        this.user = data.user;
        this.token = data.token;
        localStorage.setItem("token", data.token);
        
        return true;
      } catch (error) {
        console.error("Login error details:", {
          message: error.message,
          response: error.response?.data
        });
        
        throw error;
      }
    },

    async register(name, email, password) {
      await axios.post("/auth/register", { name, email, password });
    },

    async loginWithGoogle() {
      const user = await signInWithGoogle();
      if (user) {
        this.user = { name: user.displayName, email: user.email };
      }
    },

    logout() {
      this.user = null;
      this.token = "";
      localStorage.removeItem("token");
    }
  },
});
