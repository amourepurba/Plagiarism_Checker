// vite.config.js
import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd());

	const TARGET_URL = `${env.VITE_TARGET_URL ?? "http://localhost:3000"}`;

	return {
		plugins: [vue()],

		server: {
			proxy: {
				"/check-text": {
					target: TARGET_URL,
					changeOrigin: true,
				},
				"/check-file": {
					target: TARGET_URL,
					changeOrigin: true,
				},
				"/check-url": {
					target: TARGET_URL,
					changeOrigin: true,
				},
				"/api": {
					target: TARGET_URL,
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/api/, ""),
				},
			},
		},
	};
});
