import { useEffect } from "react";

export function useButtonSheen() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest("button, [role='button']") as HTMLElement | null;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left - 30; // center the 60px sheen
      button.style.setProperty("--mouse-x", `${x}px`);
    };

    document.addEventListener("mousemove", handler);
    return () => document.removeEventListener("mousemove", handler);
  }, []);
}
