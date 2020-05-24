import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import Login from "./Componets/Login";
import * as serviceWorker from "./serviceWorker";
import MainPage from "./Componets/mainPage";

ReactDOM.render(
  <React.StrictMode>
    <Login />
  </React.StrictMode>,
  document.getElementById("root")
);

serviceWorker.unregister();
