import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: './' 讓 GitHub Pages 子路徑（/repo-name/）與本機都能正確載入資源
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    // 允許透過 tunnel（ngrok / cloudflared）給其他玩家測試
    host: true,
    cors: {
      origin: "https://www.owlbear.rodeo",
    },
  },
});
