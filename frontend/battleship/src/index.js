import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { EthProvider } from "./contexts/EthContext";
import { PopProvider } from "./contexts/PopupContext";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <PopProvider>
    <EthProvider>
      <App />
    </EthProvider>
  </PopProvider>
);
