"use client";

import * as React from "react";

export function PwaRegister() {
  React.useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("Service Worker terdaftar dengan scope:", reg.scope);
        })
        .catch((err) => {
          console.error("Gagal mendaftarkan Service Worker:", err);
        });
    } else if ("serviceWorker" in navigator) {
      // In development mode, also register to test PWA readiness
      navigator.serviceWorker
        .register("/sw.js")
        .catch(() => {});
    }
  }, []);

  return null;
}
