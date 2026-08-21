import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import { AdminApp } from "./admin/AdminApp.jsx";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "./styles.css";
import "./selected.css";

function Root() {
  return /^\/admin\/?$/.test(window.location.pathname) ? <AdminApp /> : <App />;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
