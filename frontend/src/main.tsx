import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import ReactDOM from 'react-dom/client';

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
