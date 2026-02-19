import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n";

function hideSplash() {
  const splash = document.getElementById("splash-screen");
  if (splash) {
    splash.style.opacity = "0";
    splash.style.pointerEvents = "none";
    setTimeout(() => splash.remove(), 400);
  }
}

createRoot(document.getElementById("root")!).render(<App />);
requestAnimationFrame(() => {
  setTimeout(hideSplash, 300);
});
