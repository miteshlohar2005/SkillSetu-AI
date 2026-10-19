import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./redux/store.js";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { NavigationProvider } from "./context/NavigationContext.jsx";
import { DiagnosticProvider } from "./context/DiagnosticContext.jsx";
import "./i18n.js";

if (typeof Node === "function" && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child.parentNode !== this) {
      return child;
    }
    return originalRemoveChild.apply(this, arguments);
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      return newNode;
    }
    return originalInsertBefore.apply(this, arguments);
  };
}

if (typeof window !== "undefined") {
  const suppressTranslateOverlays = () => {
    const elements = document.querySelectorAll(
      '[class*="VIpgJd"], .goog-te-spinner-pos, .goog-te-spinner, #goog-gt-tt, .goog-te-balloon-frame, body > div.skiptranslate'
    );
    elements.forEach((el) => {
      if (el.id !== "google_translate_element") {
        el.style.setProperty("display", "none", "important");
        el.style.setProperty("visibility", "hidden", "important");
        el.style.setProperty("opacity", "0", "important");
        el.style.setProperty("pointer-events", "none", "important");
        el.style.setProperty("left", "-99999px", "important");
        el.style.setProperty("top", "-99999px", "important");
      }
    });
  };

  const observer = new MutationObserver(() => suppressTranslateOverlays());
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      if (document.body) observer.observe(document.body, { childList: true, subtree: true });
    });
  }
}

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Provider store={store}>
      <ThemeProvider>
        <NavigationProvider>
          <DiagnosticProvider>
            <App />
          </DiagnosticProvider>
        </NavigationProvider>
      </ThemeProvider>
    </Provider>
  </BrowserRouter>,
);
