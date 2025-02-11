import { defineStore } from "pinia";
import axios from "axios";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    token: localStorage.getItem("token") || "",
  }),
  actions: {
    async login(email, password) {
      const { data } = await axios.post("http://localhost:5000/api/auth/login", { email, password });
      this.user = data.user;
      this.token = data.token;
      localStorage.setItem("token", data.token);
    },

    async register(name, email, password) {
      await axios.post("http://localhost:5000/api/auth/register", { name, email, password });
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
  }
});
