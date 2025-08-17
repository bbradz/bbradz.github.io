// src/index.jsx

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./css/styles.css";
import "./css/landing-style.css";
import "./css/index.css";
import { BrowserRouter } from "react-router-dom";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter basename="/bbradz.github.io/">
      {" "}
      {/* Add the basename prop here */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
