import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";

export function render(component: React.ReactNode): void {
  const root = document.getElementById("root");
  if (root) {
    createRoot(root).render(
      <StrictMode>{component}</StrictMode>,
    );
  }
}
