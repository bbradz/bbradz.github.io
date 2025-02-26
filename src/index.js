// index.js
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./css/styles.css";
import "./css/landing-style.css";
import "./css/index.css";
import { BrowserRouter } from "react-router-dom"; // Import BrowserRouter

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      {" "}
      {/* Wrap App with BrowserRouter */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
