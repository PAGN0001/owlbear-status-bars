import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/main.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("找不到 #root 元素，無法啟動 Extension。");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
