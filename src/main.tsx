import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// expose API base from Vite env to runtime
(window as any).__API_BASE__ = (import.meta as any).env?.VITE_API_BASE || '';

createRoot(document.getElementById("root")!).render(<App />);
