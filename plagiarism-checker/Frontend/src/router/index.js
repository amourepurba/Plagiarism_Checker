import {
  createRouter,
  createWebHistory,
} from "vue-router/dist/vue-router.esm-bundler.js";
import Home from "../components/home.vue";
import Auth from "../components/auth.vue";

const routes = [
  { path: "/auth", component: Auth },
  { path: "/", component: Home },
  { path: "/plagiarism-checker", name: "PlagiarismChecker", component: Home },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
