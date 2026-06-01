import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

const rootElement = document.getElementById("root");

// Support for react-snap pre-rendering
if (rootElement.hasChildNodes()) {
  // Hydrate for pre-rendered content (from react-snap)
  ReactDOM.hydrateRoot(rootElement, <React.StrictMode><App /></React.StrictMode>);
} else {
  // Normal render for development
  const root = ReactDOM.createRoot(rootElement);
  root.render(<React.StrictMode><App /></React.StrictMode>);
}

// PWA Service Worker Registration
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
      
      // Only register in production, unregister in development
      if (process.env.NODE_ENV === "production") {
        navigator.serviceWorker
          .register(swUrl)
          .then((registration) => {
            console.log("Service Worker registered successfully:", registration);
            
            // Check for updates
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === "installed") {
                    if (navigator.serviceWorker.controller) {
                      console.log("New content is available; please refresh.");
                      // You can show an update notification here
                    } else {
                      console.log("Content is cached for offline use.");
                    }
                  }
                };
              }
            };
          })
          .catch((error) => {
            console.error("Error during service worker registration:", error);
          });
      } else {
        // Unregister any existing service workers in development
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister();
          console.log("Service Worker unregistered in development mode");
        }).catch(() => {
          console.log("No Service Worker to unregister");
        });
      }
    });
  }
}

// Register service worker
registerServiceWorker();
