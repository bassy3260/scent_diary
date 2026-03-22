
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/index.css";
import { enableMocks } from "./api/mock";

enableMocks();

createRoot(document.getElementById("root")!).render(<App />);
  