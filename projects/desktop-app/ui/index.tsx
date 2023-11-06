import App from "./App";
import React from "react";
import ReactDOM from "react-dom/client";
import "./samples/node-api";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

postMessage({ payload: "removeLoading" }, "*");
