import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages 專案站網址為 /owlbear-status-bars/
// Owlbear 會把 manifest 裡以 / 開頭的路徑接到網域根目錄，必須帶上 repo 名稱。
const BASE = "/owlbear-status-bars/";

export default defineConfig({
  base: BASE,
  plugins: [react()],
  server: {
    // 允許透過 tunnel（ngrok / cloudflared）給其他玩家測試
    host: true,
    cors: {
      origin: "https://www.owlbear.rodeo",
    },
  },
});
