import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"
import { BrowserRouter } from "react-router";
import { AuthProvider } from "./Context/AuthContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
