import { createRouter, createWebHistory } from "vue-router/dist/vue-router.esm-bundler.js";
import Home from '../components/tes1.vue';
import Auth from '../components/auth.vue';
import tes from '../components/SEOChecker.vue';

const routes = [
    { path: '/', component: Home },
    { path: '/auth', component: Auth },
    { path: '/tes', component: tes },
    { path: '/plagiarism-checker', name: 'PlagiarismChecker', component: Home }, // Tambahan route baru
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
