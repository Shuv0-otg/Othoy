import { createRoot } from "react-dom/client";
import { AthoiApp } from "@/components/athoi-app";

const el = document.getElementById("root");
if (el) createRoot(el).render(<AthoiApp />);
