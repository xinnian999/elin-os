import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "./styles.css";
import "./selected.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
